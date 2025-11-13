import { invoke } from '@tauri-apps/api/core'

const API_URL = 'https://apis.kyfudao.com/apis.php'

const DEFAULT_HEADERS = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'X-Requested-With': 'XMLHttpRequest',
  Referer: 'https://01022.hk/zh/tempemail.html',
  Origin: 'https://01022.hk'
}

const buildFormBody = (data) =>
  Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value ?? '')}`)
    .join('&')

const request = async (payload) => {
  const response = await invoke('fetch_api', {
    url: API_URL,
    method: 'POST',
    token: null,
    headers: DEFAULT_HEADERS,
    body: buildFormBody(payload)
  })

  if (response.status >= 400) {
    throw new Error(`HTTP ${response.status}`)
  }

  try {
    return JSON.parse(response.body)
  } catch (err) {
    throw new Error('无效的服务器响应')
  }
}

export async function fetchDomains() {
  const data = await request({ ajax: 'get_domains' })
  if (!data?.success) {
    throw new Error(data?.message || '获取域名列表失败')
  }
  return Array.isArray(data.domains) ? data.domains : []
}

export async function createEmail({ prefix = '', domain = '' } = {}) {
  const data = await request({
    ajax: 'create_email',
    prefix,
    domain
  })

  if (!data?.success || !data.email) {
    throw new Error(data?.message || '创建邮箱失败')
  }

  return {
    email: data.email,
    storageEmail: data.storage_email || data.email,
    expires: data.expires ?? null
  }
}

export async function fetchEmails(email) {
  if (!email) {
    throw new Error('邮箱地址为空')
  }

  const data = await request({
    ajax: 'check_mail',
    email
  })

  if (!data?.success) {
    throw new Error(data?.message || '获取邮件失败')
  }

  return {
    count: data.count ?? 0,
    mails: Array.isArray(data.mails) ? data.mails : []
  }
}

export async function fetchEmailDetail(id, email) {
  if (!id || !email) {
    throw new Error('缺少必要参数')
  }

  const data = await request({
    ajax: 'get_email',
    id,
    email
  })

  if (!data?.success) {
    throw new Error(data?.message || '获取邮件内容失败')
  }

  return data
}

export async function deleteMailbox(email, storageEmail) {
  if (!email) {
    throw new Error('邮箱地址为空')
  }

  const data = await request({
    ajax: 'delete_email',
    email,
    storage_email: storageEmail || email
  })

  if (!data?.success) {
    throw new Error(data?.message || '删除邮箱失败')
  }

  return true
}

export default {
  fetchDomains,
  createEmail,
  fetchEmails,
  fetchEmailDetail,
  deleteMailbox
}
