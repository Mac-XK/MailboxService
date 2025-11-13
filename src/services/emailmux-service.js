import { invoke } from '@tauri-apps/api/core'

const API_BASE_URL = 'https://emailmux.com'

export const EMAILMUX_DOMAINS = ['outlook', 'hotmail', 'gmail_plus', 'googlemail']

const DEFAULT_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Referer: 'https://emailmux.com/',
  Origin: 'https://emailmux.com',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-Ch-Ua': '"Chromium";v="122", "Not A(Brand";v="24", "Google Chrome";v="122"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin'
}

let sessionReady = false
let sessionPromise = null

async function ensureSession() {
  if (sessionReady) return
  if (sessionPromise) return sessionPromise

  sessionPromise = (async () => {
    try {
      await invoke('fetch_api', {
        url: `${API_BASE_URL}/`,
        method: 'GET',
        token: null,
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': DEFAULT_HEADERS['User-Agent'],
          Referer: 'https://emailmux.com/',
          'Sec-Ch-Ua': DEFAULT_HEADERS['Sec-Ch-Ua'],
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': DEFAULT_HEADERS['Sec-Ch-Ua-Platform'],
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
        },
        body: null
      })
      sessionReady = true
    } catch (err) {
      sessionReady = false
      throw err
    } finally {
      sessionPromise = null
    }
  })()

  return sessionPromise
}

async function request(path, { method = 'GET', body = null, headers = {}, contentType = 'application/json', skipSession = false } = {}) {
  if (!skipSession) {
    await ensureSession()
  }

  const mergedHeaders = { ...DEFAULT_HEADERS, ...headers }
  const hasBody = body !== null && body !== undefined

  if (contentType) {
    mergedHeaders['Content-Type'] = contentType
  } else {
    delete mergedHeaders['Content-Type']
  }
  const payload = {
    url: `${API_BASE_URL}${path}`,
    method,
    token: null,
    headers: mergedHeaders,
    body: hasBody ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
  }

  const response = await invoke('fetch_api', payload)

  if (response.status >= 400) {
    let message = `HTTP ${response.status}`
    try {
      const parsed = JSON.parse(response.body)
      if (parsed?.error) {
        message = parsed.error
      }
    } catch (_) {
      if (response.body) {
        message = response.body
      }
    }
    throw new Error(message)
  }

  if (!response.body) {
    return null
  }

  try {
    return JSON.parse(response.body)
  } catch (_) {
    return response.body
  }
}

const sanitizeTimestamp = (timestamp) => {
  if (!timestamp) return Date.now()
  try {
    const normalized = `${timestamp.slice(0, 19)}Z`
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) {
      return Date.now()
    }
    return date.getTime()
  } catch {
    return Date.now()
  }
}

const createAddressObject = (value) => {
  if (!value) {
    return { name: '', address: '' }
  }

  if (value.includes('<') && value.includes('>')) {
    const match = value.match(/^(.*?)<(.+?)>$/)
    if (match) {
      return {
        name: match[1].trim(),
        address: match[2].trim()
      }
    }
  }

  return {
    name: '',
    address: value.trim()
  }
}

export function normalizeEmail(email, mailboxAddress) {
  if (!email || typeof email !== 'object') {
    return null
  }

  const createdAtMs = sanitizeTimestamp(email.timestamp)

  return {
    id: email.uuid || email.id || `${email.timestamp || Date.now()}`,
    from: createAddressObject(email.sender),
    to: [createAddressObject(mailboxAddress)],
    subject: email.subject || '(无主题)',
    text: '',
    html: '',
    created_at: Math.floor(createdAtMs / 1000),
    seen: false,
    raw: email
  }
}

export async function generateEmail(domains = EMAILMUX_DOMAINS) {
  const payload = {
    method: 'POST',
    body: { domains }
  }

  const data = await request('/generate-email', payload)
  if (!data?.email) {
    throw new Error('生成邮箱失败')
  }

  return data.email
}

export async function activateEmail(email) {
  if (!email) {
    throw new Error('邮箱地址为空')
  }

  await request(`/use-email?email=${encodeURIComponent(email)}`)
}

export async function fetchEmails(email) {
  if (!email) {
    throw new Error('邮箱地址为空')
  }

  const data = await request(`/emails?email=${encodeURIComponent(email)}`)
  return Array.isArray(data) ? data : []
}

export async function fetchEmailDetail(uuid) {
  if (!uuid) {
    throw new Error('缺少邮件 ID')
  }

  return request(`/email/${encodeURIComponent(uuid)}`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    contentType: null
  })
}

export default {
  EMAILMUX_DOMAINS,
  generateEmail,
  activateEmail,
  fetchEmails,
  fetchEmailDetail,
  normalizeEmail
}
