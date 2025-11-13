import { invoke } from '@tauri-apps/api/core'

const API_BASE_URL = 'https://api.tempmail.lol/v2'

function generateRandomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function buildHeaders(base = {}) {
  return Object.keys(base).length > 0 ? base : null
}

async function request(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const payload = {
    url: `${API_BASE_URL}${endpoint}`,
    method,
    token: null,
    headers: buildHeaders(headers),
    body: body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
  }

  const response = await invoke('fetch_api', payload)

  if (response.status >= 400) {
    let message = `HTTP ${response.status}`
    try {
      const parsed = JSON.parse(response.body)
      if (parsed && parsed.error) {
        message = parsed.error
      }
    } catch (_) {
      if (response.body) {
        message = response.body
      }
    }
    throw new Error(message)
  }

  try {
    return JSON.parse(response.body)
  } catch (_) {
    return response.body
  }
}

export function normalizeEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'object') {
    return null
  }

  const id =
    rawEmail.id ||
    rawEmail.message_id ||
    rawEmail.mail_id ||
    (rawEmail.date ? `${rawEmail.subject ?? '邮件'}-${rawEmail.date}` : undefined) ||
    generateRandomId()

  const timestamp = typeof rawEmail.date === 'number' ? rawEmail.date : rawEmail.timestamp
  const createdAt =
    typeof timestamp === 'number'
      ? timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000
      : Date.now()

  const from =
    typeof rawEmail.from === 'object' && rawEmail.from !== null
      ? rawEmail.from.address || rawEmail.from.email || rawEmail.from.name || JSON.stringify(rawEmail.from)
      : rawEmail.from || '未知发件人'

  const toValue = rawEmail.to
  let to = []
  if (Array.isArray(toValue)) {
    to = toValue.map((item) => {
      if (typeof item === 'string') {
        return item
      }
      if (item && typeof item === 'object') {
        return item.address || item.email || JSON.stringify(item)
      }
      return ''
    }).filter(Boolean)
  } else if (typeof toValue === 'string') {
    to = [toValue]
  } else if (toValue && typeof toValue === 'object') {
    to = [toValue.address || toValue.email || JSON.stringify(toValue)]
  }

  return {
    id,
    from,
    to,
    subject: rawEmail.subject || '(无主题)',
    text: rawEmail.body || rawEmail.text || '',
    html: rawEmail.html || '',
    date: createdAt,
    raw: rawEmail
  }
}

export async function createInbox({ prefix, domain, captchaToken } = {}) {
  const body = {}
  if (prefix && prefix.trim()) {
    body.prefix = prefix.trim()
  }
  if (domain && domain.trim()) {
    body.domain = domain.trim()
  }
  if (captchaToken) {
    body.captcha = captchaToken
  }

  const data = await request('/inbox/create', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' }
  })

  if (data?.captcha_required) {
    throw new Error('需要完成验证码验证后才能创建邮箱')
  }

  if (!data?.address || !data?.token) {
    throw new Error('创建临时邮箱失败，返回数据不完整')
  }

  return {
    address: data.address,
    token: data.token,
    expiresAt: data.expires_at || null
  }
}

export async function fetchInbox(token) {
  if (!token) {
    throw new Error('缺少邮箱令牌，无法获取邮件')
  }

  const data = await request(`/inbox?token=${encodeURIComponent(token)}`)

  if (data?.error) {
    throw new Error(data.error)
  }

  return {
    expired: Boolean(data?.expired),
    emails: Array.isArray(data?.emails) ? data.emails : []
  }
}

export default {
  createInbox,
  fetchInbox,
  normalizeEmail
}
