/**
 * Mail.td 临时邮箱服务
 * API 文档: https://api.mail.cx
 */

import { invoke } from '@tauri-apps/api/core'

const API_BASE_URL = 'https://mail.td/api/api/v1'

/**
 * 使用 Tauri 命令发送 HTTP 请求（避免 CORS 问题）
 */
async function fetchApi(url, method = 'GET', token = null) {
  try {
    const response = await invoke('fetch_api', {
      url,
      method,
      token
    })

    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.body}`)
    }

    // 尝试解析 JSON
    try {
      return JSON.parse(response.body)
    } catch {
      // 如果不是 JSON，返回原始文本
      return response.body
    }
  } catch (error) {
    throw error
  }
}

// 可用的长期域名（与 mail.td 网站保持一致）
export const AVAILABLE_DOMAINS = [
  'nqmo.com',
  'qabq.com',
  'end.tw',
  'uuf.me',
  '6n9.net'
]

/**
 * 生成随机邮箱用户名
 * @param {number} length - 用户名长度
 * @returns {string} 随机用户名
 */
export function generateRandomUsername(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let username = ''
  for (let i = 0; i < length; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return username
}

/**
 * 生成随机邮箱地址
 * @returns {string} 完整的邮箱地址
 */
export function generateRandomEmail() {
  const username = generateRandomUsername()
  const domain = AVAILABLE_DOMAINS[Math.floor(Math.random() * AVAILABLE_DOMAINS.length)]
  return `${username}@${domain}`
}

/**
 * 邮箱服务类
 */
class EmailService {
  constructor() {
    this.token = null
    this.tokenExpiry = null
  }

  /**
   * 获取认证 Token
   * @returns {Promise<string>} JWT Token
   */
  async getToken() {
    // 如果 token 还有效，直接返回
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token
    }

    try {
      const token = await fetchApi(`${API_BASE_URL}/auth/authorize_token`, 'POST')

      // 去除可能的引号
      this.token = typeof token === 'string' ? token.replace(/^"|"$/g, '') : token
      // Token 有效期 5 分钟，提前 30 秒刷新
      this.tokenExpiry = Date.now() + (5 * 60 - 30) * 1000

      return this.token
    } catch (error) {
      console.error('获取 Token 失败:', error)
      throw error
    }
  }

  /**
   * 获取邮箱的邮件列表
   * @param {string} email - 邮箱地址
   * @returns {Promise<Array>} 邮件列表
   */
  async getMailList(email) {
    try {
      const token = await this.getToken()
      const mails = await fetchApi(`${API_BASE_URL}/mailbox/${encodeURIComponent(email)}`, 'GET', token)
      return Array.isArray(mails) ? mails : []
    } catch (error) {
      throw error
    }
  }

  /**
   * 获取单封邮件的详细内容
   * @param {string} email - 邮箱地址
   * @param {string} mailId - 邮件 ID
   * @returns {Promise<Object>} 邮件详情
   */
  async getMailDetail(email, mailId) {
    try {
      const token = await this.getToken()
      return await fetchApi(`${API_BASE_URL}/mailbox/${encodeURIComponent(email)}/${mailId}`, 'GET', token)
    } catch (error) {
      throw error
    }
  }

  /**
   * 获取邮件原始内容
   * @param {string} email - 邮箱地址
   * @param {string} mailId - 邮件 ID
   * @returns {Promise<string>} 邮件原始内容
   */
  async getMailSource(email, mailId) {
    try {
      const token = await this.getToken()
      return await fetchApi(`${API_BASE_URL}/mailbox/${encodeURIComponent(email)}/${mailId}/source`, 'GET', token)
    } catch (error) {
      throw error
    }
  }

  /**
   * 删除邮件
   * @param {string} email - 邮箱地址
   * @param {string} mailId - 邮件 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteMail(email, mailId) {
    try {
      const token = await this.getToken()
      await fetchApi(`${API_BASE_URL}/mailbox/${encodeURIComponent(email)}/${mailId}`, 'DELETE', token)
      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * 删除邮箱所有邮件
   * @param {string} email - 邮箱地址
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteAllMails(email) {
    try {
      const token = await this.getToken()
      await fetchApi(`${API_BASE_URL}/mailbox/${encodeURIComponent(email)}`, 'DELETE', token)
      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * 标记邮件为已读
   * @param {string} email - 邮箱地址
   * @param {string} mailId - 邮件 ID
   * @returns {Promise<boolean>} 是否标记成功
   */
  async markAsRead(email, mailId) {
    try {
      const token = await this.getToken()
      await fetchApi(`${API_BASE_URL}/mailbox/${encodeURIComponent(email)}/${mailId}`, 'PATCH', token)
      return true
    } catch (error) {
      throw error
    }
  }
}

// 导出单例
export default new EmailService()

