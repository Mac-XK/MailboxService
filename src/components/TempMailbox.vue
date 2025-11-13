<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import emailService, { generateRandomEmail, AVAILABLE_DOMAINS } from '../services/email-service.js'
import tempmailService, { normalizeEmail as normalizeTempMail } from '../services/tempmail-service.js'
import emailmuxService, { EMAILMUX_DOMAINS, normalizeEmail as normalizeEmailMux } from '../services/emailmux-service.js'
import gptmailService, { GPTMAIL_DOMAINS, normalizeEmail as normalizeGptMail } from '../services/gptmail-service.js'
import kyfudaoService from '../services/kyfudao-service.js'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps({
  mailboxId: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    default: 'mailtd'
  }
})

const providerType = computed(() => props.provider || 'mailtd')
const isTempMail = computed(() => providerType.value === 'tempmail')
const isEmailMux = computed(() => providerType.value === 'emailmux')
const isGptMail = computed(() => providerType.value === 'gptmail')
const isKyfudao = computed(() => providerType.value === 'kyfudao')
const supportsDeletion = computed(() => !isTempMail.value && !isEmailMux.value && !isKyfudao.value)
const supportsCustomEmail = computed(() => !isTempMail.value && !isEmailMux.value)
const supportsDomainSelection = computed(() => !isTempMail.value && !isEmailMux.value && !isGptMail.value)
const getStorageKey = (key) => `mailbox_${props.mailboxId}_${key}`
const kyfudaoDomains = ref([])
const domainOptions = computed(() => {
  if (isTempMail.value) return AVAILABLE_DOMAINS
  if (isEmailMux.value || isGptMail.value) return []
  if (isKyfudao.value) return kyfudaoDomains.value
  return AVAILABLE_DOMAINS
})

const EMAILMUX_PRESET_DOMAINS = {
  '4': ['outlook', 'hotmail'],
  '5': ['gmail_plus', 'googlemail']
}

const emailMuxDomainOptions = computed(() => (isEmailMux.value ? EMAILMUX_DOMAINS : []))

const emailMuxDefaultDomains = computed(() => {
  if (!isEmailMux.value) return EMAILMUX_DOMAINS
  const preset = EMAILMUX_PRESET_DOMAINS[props.mailboxId]
  if (preset && preset.length > 0) {
    const filtered = preset.filter((item) => EMAILMUX_DOMAINS.includes(item))
    if (filtered.length > 0) {
      return filtered
    }
  }
  return EMAILMUX_DOMAINS
})

const createEmailMuxDomainSet = (domains) => {
  const list = Array.isArray(domains) && domains.length > 0 ? domains : EMAILMUX_DOMAINS
  return new Set(list)
}

const emailMuxFormats = ref(createEmailMuxDomainSet(emailMuxDefaultDomains.value))
const emailMuxDomainList = computed(() =>
  Array.from(emailMuxFormats.value).filter((domain) => emailMuxDomainOptions.value.includes(domain))
)

const EMAILMUX_INLINE_REGEX =
  /<script[^>]*id=["']email-html-data["'][^>]*>([\s\S]*?)<\/script>/i

const extractInlineEmailHtml = (htmlString) => {
  if (typeof htmlString !== 'string' || !htmlString) return null
  const match = htmlString.match(EMAILMUX_INLINE_REGEX)
  if (!match) return null
  const jsonPayload = match[1]?.trim()
  if (!jsonPayload) return null
  try {
    const parsed = JSON.parse(jsonPayload)
    return typeof parsed === 'string' ? parsed : null
  } catch (err) {
    console.warn('解析 EmailMux JSON 邮件失败:', err)
    return null
  }
}

const isEmailMuxShell = (htmlString) => {
  if (typeof htmlString !== 'string' || !htmlString) return false
  const lower = htmlString.toLowerCase()
  return lower.includes('id="emailframe"') || lower.includes('data-ts=') || lower.includes('delemail')
}

// 邮箱地址
const emailAddress = ref('')
const emailPrefix = ref('')
const emailDomain = ref(domainOptions.value[0] || '')
const emailToken = ref('')
const kyfudaoStorageEmail = ref('')
const kyfudaoExpires = ref(null)

// 邮件列表
const mails = ref([])
const selectedMail = ref(null)
const detailLoading = ref(false)
const loading = ref(false)
const error = ref(null)

// 自动刷新
const autoRefresh = ref(true)
const refreshInterval = ref(null)
const countdown = ref(30)
const currentDetailMailId = ref(null)

// 复制成功提示
const copySuccess = ref(false)

// 确认对话框
const showDeleteDialog = ref(false)
const showDeleteAllDialog = ref(false)
const pendingDeleteMail = ref(null)

// 解析邮件地址字符串 "Name <email@example.com>" 或 "<email@example.com>"
const parseEmailAddress = (emailStr) => {
  if (!emailStr) return { name: '', address: '' }

  if (Array.isArray(emailStr)) {
    if (emailStr.length === 0) return { name: '', address: '' }
    return parseEmailAddress(emailStr[0])
  }

  if (typeof emailStr === 'object') {
    const address = emailStr.address || emailStr.email || emailStr.value || ''
    const name = emailStr.name || emailStr.displayName || ''
    if (!address) {
      return { name: name || '', address: '' }
    }
    return {
      name: name || '',
      address: String(address).trim()
    }
  }

  // 移除首尾空格
  emailStr = String(emailStr).trim()

  // 匹配 "Name <email@example.com>" 格式
  const match = emailStr.match(/^(.+?)\s*<(.+?)>$/)
  if (match) {
    return {
      name: match[1].trim(),
      address: match[2].trim()
    }
  }

  // 匹配 "<email@example.com>" 格式
  const match2 = emailStr.match(/^<(.+?)>$/)
  if (match2) {
    return {
      name: '',
      address: match2[1].trim()
    }
  }

  // 纯邮箱地址
  return {
    name: '',
    address: emailStr
  }
}

// 规范化邮件数据（将不同服务的字段转换为统一结构）
const normalizeMailData = (mail) => {
  if (!mail) return null

  if (isTempMail.value) {
    const normalized = normalizeTempMail(mail)
    if (!normalized) return null

    const toList = (normalized.to && normalized.to.length > 0
      ? normalized.to
      : [emailAddress.value]
    ).map(parseEmailAddress)

    return {
      id: normalized.id,
      from: parseEmailAddress(normalized.from),
      to: toList,
      subject: normalized.subject,
      text: normalized.text,
      html: normalized.html,
      created_at: Math.floor((normalized.date || Date.now()) / 1000),
      seen: mail.seen ?? false,
      raw: normalized.raw || mail
    }
  }

  // 如果 from 是字符串，解析它
  if (typeof mail.from === 'string') {
    mail.from = parseEmailAddress(mail.from)
  }

  // 如果 to 是字符串数组，解析每一项
  if (Array.isArray(mail.to) && mail.to.length > 0 && typeof mail.to[0] === 'string') {
    mail.to = mail.to.map(parseEmailAddress)
  }

  // 统一时间字段：将 posix-millis 转换为 created_at（秒时间戳）
  if (mail['posix-millis'] && !mail.created_at) {
    mail.created_at = Math.floor(mail['posix-millis'] / 1000)
  }

  // 如果有 body 对象，提取 text 和 html
  if (mail.body) {
    if (mail.body.text && !mail.text) {
      mail.text = mail.body.text
    }
    if (mail.body.html && !mail.html) {
      mail.html = mail.body.html
    }
  }

  return mail
}

const parseKyfudaoTimestamp = (value) => {
  if (!value) return Math.floor(Date.now() / 1000)
  if (typeof value === 'number') return Math.floor(value)
  const numeric = Number(value)
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric > 1_000_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric)
  }
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return Math.floor(date.getTime() / 1000)
  }
  return Math.floor(Date.now() / 1000)
}

const normalizeKyfudaoMail = (mail, mailboxAddress) => {
  if (!mail) return null
  return {
    id: String(mail.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    from: parseEmailAddress(mail.from || ''),
    to: [parseEmailAddress(mailboxAddress)],
    subject: mail.subject || '(无主题)',
    text: '',
    html: '',
    created_at: parseKyfudaoTimestamp(mail.timestamp),
    seen: mail.unread ? false : true,
    raw: mail,
    size: mail.size_human || ''
  }
}

const sanitizeKyfudaoHtml = (content) => {
  if (!content) return ''
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\?php\b[^<]*(?:(?!<\/\?>)<[^<]*)*<\/\?>/gi, '')
}

const decodeQuotedPrintable = (value) => {
  if (!value || typeof value !== 'string') return value || ''

  const cleaned = value.replace(/=\r?\n/g, '')
  const bytes = []

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    if (char === '=' && i + 2 < cleaned.length) {
      const hex = cleaned.slice(i + 1, i + 3)
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16))
        i += 2
        continue
      }
    }
    bytes.push(char.charCodeAt(0))
  }

  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes))
  } catch (_) {
    try {
      return new TextDecoder('latin1', { fatal: false }).decode(new Uint8Array(bytes))
    } catch (_) {
      return String.fromCharCode(...bytes)
    }
  }
}

const stripEmailHeaders = (value) => {
  if (!value || typeof value !== 'string') return value || ''
  return value.replace(/^[\s\S]*?\r?\n\r?\n/, '')
}

const applyTempMailInbox = ({ address, token, expiresAt = null }) => {
  if (!address || !token) return
  emailAddress.value = address
  emailToken.value = token
  const [prefix, domain] = address.split('@')
  emailPrefix.value = prefix || ''
  emailDomain.value = domain || ''
  localStorage.setItem(getStorageKey('address'), address)
  localStorage.setItem(getStorageKey('token'), token)
  if (expiresAt) {
    localStorage.setItem(getStorageKey('expires'), String(expiresAt))
  } else {
    localStorage.removeItem(getStorageKey('expires'))
  }
}

const cacheTempMailEmails = (items) => {
  if (!isTempMail.value) return
  try {
    localStorage.setItem(getStorageKey('emails'), JSON.stringify(items))
  } catch (err) {
    console.warn('缓存临时邮箱邮件失败:', err)
  }
}

const loadCachedTempMailEmails = () => {
  if (!isTempMail.value) return []
  try {
    const cached = localStorage.getItem(getStorageKey('emails'))
    if (!cached) return []
    const parsed = JSON.parse(cached)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('读取临时邮箱缓存失败:', err)
    return []
  }
}

const applyEmailMuxInbox = (email) => {
  if (!isEmailMux.value || !email) return
  emailAddress.value = email
  const [prefix, domain] = email.split('@')
  emailPrefix.value = prefix || ''
  emailDomain.value = domain || ''
  localStorage.setItem(getStorageKey('email'), email)
}

const applyGptMailInbox = (email) => {
  if (!isGptMail.value || !email) return
  emailAddress.value = email
  const [prefix, domain] = email.split('@')
  emailPrefix.value = prefix || ''
  emailDomain.value = domain || ''
  localStorage.setItem(getStorageKey('email'), email)
  localStorage.setItem(getStorageKey('address'), email)
  localStorage.setItem(getStorageKey('gpt_domain'), domain || '')
}

const applyKyfudaoInbox = ({ email, storageEmail, expires }) => {
  if (!isKyfudao.value || !email) return
  emailAddress.value = email
  const [prefix, domain] = email.split('@')
  emailPrefix.value = prefix || ''
  emailDomain.value = domain || ''
  kyfudaoStorageEmail.value = storageEmail || email
  kyfudaoExpires.value = expires ? Number(expires) : null
  localStorage.setItem(getStorageKey('email'), email)
  localStorage.setItem(getStorageKey('address'), email)
  localStorage.setItem(getStorageKey('storage'), kyfudaoStorageEmail.value)
  if (kyfudaoExpires.value) {
    localStorage.setItem(getStorageKey('expires'), String(kyfudaoExpires.value))
  } else {
    localStorage.removeItem(getStorageKey('expires'))
  }
  if (domain) {
    localStorage.setItem(getStorageKey('domain'), domain)
  }
}

const cacheEmailMuxEmails = (items) => {
  if (!isEmailMux.value) return
  try {
    localStorage.setItem(getStorageKey('emails'), JSON.stringify(items))
  } catch (err) {
    console.warn('缓存精品邮箱邮件失败:', err)
  }
}

const loadCachedEmailMuxEmails = () => {
  if (!isEmailMux.value) return []
  try {
    const cached = localStorage.getItem(getStorageKey('emails'))
    if (!cached) return []
    const parsed = JSON.parse(cached)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('读取精品邮箱缓存失败:', err)
    return []
  }
}

const cacheGptMailEmails = (items) => {
  if (!isGptMail.value) return
  try {
    localStorage.setItem(getStorageKey('emails'), JSON.stringify(items))
  } catch (err) {
    console.warn('缓存普通邮箱邮件失败:', err)
  }
}

const loadCachedGptMailEmails = () => {
  if (!isGptMail.value) return []
  try {
    const cached = localStorage.getItem(getStorageKey('emails'))
    if (!cached) return []
    const parsed = JSON.parse(cached)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('读取普通邮箱缓存失败:', err)
    return []
  }
}

const cacheKyfudaoEmails = (items) => {
  if (!isKyfudao.value) return
  try {
    localStorage.setItem(getStorageKey('emails'), JSON.stringify(items))
  } catch (err) {
    console.warn('缓存精品邮箱邮件失败:', err)
  }
}

const loadCachedKyfudaoEmails = () => {
  if (!isKyfudao.value) return []
  try {
    const cached = localStorage.getItem(getStorageKey('emails'))
    if (!cached) return []
    const parsed = JSON.parse(cached)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('读取精品邮箱缓存失败:', err)
    return []
  }
}

const loadKyfudaoDomain = () => {
  if (!isKyfudao.value) return ''
  return localStorage.getItem(getStorageKey('domain')) || ''
}

const loadKyfudaoStorageEmail = () => {
  if (!isKyfudao.value) return ''
  return localStorage.getItem(getStorageKey('storage')) || ''
}

const loadGptMailDomain = () => {
  if (!isGptMail.value) return null
  return localStorage.getItem(getStorageKey('gpt_domain'))
}

const persistEmailMuxDomains = () => {
  if (!isEmailMux.value) return
  try {
    const validDomains = Array.from(emailMuxFormats.value).filter((domain) =>
      emailMuxDomainOptions.value.includes(domain)
    )
    localStorage.setItem(getStorageKey('mux_domains'), JSON.stringify(validDomains))
  } catch (err) {
    console.warn('保存精品邮箱域名偏好失败:', err)
  }
}

const loadEmailMuxDomains = () => {
  if (!isEmailMux.value) return
  try {
    const options = emailMuxDomainOptions.value
    const defaults = emailMuxDefaultDomains.value
    const stored = localStorage.getItem(getStorageKey('mux_domains'))
    if (!stored) {
      emailMuxFormats.value = createEmailMuxDomainSet(defaults)
      persistEmailMuxDomains()
      return
    }
    const list = JSON.parse(stored)
    if (Array.isArray(list) && list.length > 0) {
      const filtered = list.filter((item) => options.includes(item))
      if (filtered.length > 0) {
        emailMuxFormats.value = new Set(filtered)
        persistEmailMuxDomains()
        return
      }
    }
    emailMuxFormats.value = createEmailMuxDomainSet(defaults)
    persistEmailMuxDomains()
  } catch (err) {
    console.warn('读取精品邮箱域名偏好失败:', err)
    emailMuxFormats.value = createEmailMuxDomainSet(emailMuxDefaultDomains.value)
    persistEmailMuxDomains()
  }
}

const toggleEmailMuxDomain = (domain) => {
  if (!isEmailMux.value || !emailMuxDomainOptions.value.includes(domain)) return

  const next = new Set(emailMuxFormats.value)
  if (next.has(domain)) {
    if (next.size === 1) {
      error.value = '至少保留一个邮箱后缀'
      return
    }
    next.delete(domain)
  } else {
    next.add(domain)
  }
  emailMuxFormats.value = next
  persistEmailMuxDomains()
  if (error.value === '至少保留一个邮箱后缀') {
    error.value = null
  }
}

watch(
  emailMuxDomainOptions,
  (options) => {
    if (!isEmailMux.value) return
    const filtered = Array.from(emailMuxFormats.value).filter((domain) => options.includes(domain))
    if (filtered.length === 0) {
      emailMuxFormats.value = createEmailMuxDomainSet(emailMuxDefaultDomains.value)
    } else if (filtered.length !== emailMuxFormats.value.size) {
      emailMuxFormats.value = new Set(filtered)
    }
    persistEmailMuxDomains()
  },
  { immediate: false }
)

watch(
  kyfudaoDomains,
  (domains) => {
    if (!isKyfudao.value) return
    if (domains.length === 0) return
    if (!domains.includes(emailDomain.value)) {
      emailDomain.value = domains[0]
    }
  }
)

watch(
  () => emailDomain.value,
  (domain) => {
    if (isKyfudao.value && domain) {
      localStorage.setItem(getStorageKey('domain'), domain)
    }
  }
)

const emailMuxDomainLabel = (domain) => {
  switch (domain) {
    case 'gmail_plus':
      return 'Gmail+'
    case 'googlemail':
      return 'GoogleMail'
    case 'hotmail':
      return 'Hotmail'
    case 'outlook':
      return 'Outlook'
    default:
      return domain
  }
}

const createTempMailInbox = async (prefix = '') => {
  if (!isTempMail.value) return
  loading.value = true
  error.value = null
  let success = false
  try {
    const inbox = await tempmailService.createInbox({ prefix })
    applyTempMailInbox(inbox)
    mails.value = []
    selectedMail.value = null
    cacheTempMailEmails([])
    success = true
  } catch (err) {
    error.value = '创建临时邮箱失败: ' + err.message
  } finally {
    loading.value = false
  }

  if (success) {
    setupAutoRefresh()
    countdown.value = 30
    await fetchMails()
  }
}

const createEmailMuxInbox = async () => {
  if (!isEmailMux.value) return
  loading.value = true
  error.value = null

  try {
    const domains = emailMuxDomainList.value
    if (domains.length === 0) {
      throw new Error('请至少选择一个邮箱后缀')
    }
    const email = await emailmuxService.generateEmail(domains)
    applyEmailMuxInbox(email)
    await emailmuxService.activateEmail(email)
    mails.value = []
    selectedMail.value = null
    cacheEmailMuxEmails([])
    setupAutoRefresh()
    countdown.value = 30
    await fetchMails()
  } catch (err) {
    error.value = '创建精品邮箱失败: ' + err.message
  } finally {
    loading.value = false
  }
}

const createGptMailInbox = async ({ prefix = '', domain = null } = {}) => {
  if (!isGptMail.value) return
  loading.value = true
  error.value = null

  try {
    const storedDomain = loadGptMailDomain()
    const preferredDomain = domain ?? (prefix ? storedDomain || null : null)
    const email = await gptmailService.generateEmail({
      prefix: prefix || undefined,
      domain: preferredDomain || undefined
    })
    applyGptMailInbox(email)
    mails.value = []
    selectedMail.value = null
    cacheGptMailEmails([])
    setupAutoRefresh()
    countdown.value = 30
    await fetchMails()
  } catch (err) {
    error.value = '创建普通邮箱失败: ' + err.message
  } finally {
    loading.value = false
  }
}

const createKyfudaoInbox = async ({ prefix = '', domain = '' } = {}) => {
  if (!isKyfudao.value) return
  loading.value = true
  error.value = null

  try {
    const response = await kyfudaoService.createEmail({
      prefix: prefix || '',
      domain: domain || kyfudaoDomains.value[0] || '01022.hk'
    })
    applyKyfudaoInbox(response)
    mails.value = []
    selectedMail.value = null
    cacheKyfudaoEmails([])
    setupAutoRefresh()
    countdown.value = 30
    await fetchMails()
  } catch (err) {
    error.value = '创建精品邮箱失败: ' + err.message
  } finally {
    loading.value = false
  }
}

const loadMailDetail = async (mailId, shouldMarkRead) => {
  if (isEmailMux.value) {
    const targetMail = mails.value.find((item) => item.id === mailId)
    if (!targetMail) {
      error.value = '未找到邮件内容'
      return
    }

    currentDetailMailId.value = mailId
    detailLoading.value = true
    await loadEmailMuxDetail({ ...targetMail })
    return
  }

  try {
    const detail = await emailService.getMailDetail(emailAddress.value, mailId)
    const normalizedDetail = normalizeMailData(detail)
    if (normalizedDetail && currentDetailMailId.value === mailId) {
      selectedMail.value = normalizedDetail
    }
  } catch (err) {
    if (currentDetailMailId.value === mailId) {
      error.value = '获取邮件详情失败: ' + err.message
    }
  } finally {
    if (currentDetailMailId.value === mailId) {
      detailLoading.value = false
    }
  }

  if (shouldMarkRead) {
    emailService.markAsRead(emailAddress.value, mailId).catch((markError) => {
      console.warn('标记为已读 API 失败（已在前端标记）：', markError)
    })
  }
}


const loadEmailMuxDetail = async (mail) => {
  if (!isEmailMux.value || !mail) return
  try {
    const detail = await emailmuxService.fetchEmailDetail(mail.id)
    if (currentDetailMailId.value !== mail.id) return

    let htmlContent = ''
    let textContent = ''

    const extractContent = (doc) => {
      const selectors = [
        '#email-html',
        '#email-content',
        '.email-html',
        '.email-body',
        '.email-content',
        'article',
        'main',
        'table'
      ]
      let container = null
      for (const selector of selectors) {
        const el = doc.querySelector(selector)
        if (el && el.innerHTML.trim()) {
          container = el
          break
        }
      }
      if (!container) {
        container = doc.body
      }
      if (!container) {
        return { html: '', text: '' }
      }
      const clone = container.cloneNode(true)
      clone
        .querySelectorAll('script,style,header,nav,footer,link,meta,title,iframe')
        .forEach((el) => el.remove())
      return {
        html: clone.innerHTML.trim(),
        text: clone.textContent ? clone.textContent.trim() : ''
      }
    }

    if (typeof detail === 'string') {
      const parser = new DOMParser()
      const doc = parser.parseFromString(detail, 'text/html')

      let inlineHtml = null
      const inlineScript = doc.querySelector('#email-html-data')
      if (inlineScript && inlineScript.textContent) {
        try {
          const parsedInline = JSON.parse(inlineScript.textContent)
          if (typeof parsedInline === 'string' && parsedInline.trim()) {
            inlineHtml = parsedInline
          }
        } catch (parseErr) {
          console.warn('解析 EmailMux 内联邮件数据失败:', parseErr)
        }
      }
      if (!inlineHtml) {
        inlineHtml = extractInlineEmailHtml(detail)
      }

      const iframe = doc.querySelector('iframe')
      if (iframe) {
        const srcdoc = iframe.getAttribute('srcdoc')
        if (srcdoc && srcdoc.trim()) {
          const innerDoc = parser.parseFromString(srcdoc, 'text/html')
          const extracted = extractContent(innerDoc)
          htmlContent = extracted.html || srcdoc
          textContent = extracted.text
        } else if (iframe.src && iframe.src.startsWith('data:text/html')) {
          const data = decodeURIComponent(iframe.src.split(',', 2)[1] || '')
          const innerDoc = parser.parseFromString(data, 'text/html')
          const extracted = extractContent(innerDoc)
          htmlContent = extracted.html || data
          textContent = extracted.text
        } else if (inlineHtml) {
          const innerDoc = parser.parseFromString(inlineHtml, 'text/html')
          const extracted = extractContent(innerDoc)
          htmlContent = extracted.html || inlineHtml
          textContent = extracted.text
        } else {
          const extracted = extractContent(doc)
          htmlContent = extracted.html
          textContent = extracted.text
        }
      } else if (inlineHtml) {
        const innerDoc = parser.parseFromString(inlineHtml, 'text/html')
        const extracted = extractContent(innerDoc)
        htmlContent = extracted.html || inlineHtml
        textContent = extracted.text
      } else {
        const extracted = extractContent(doc)
        htmlContent = extracted.html
        textContent = extracted.text
      }

      if (isEmailMuxShell(htmlContent) && inlineHtml) {
        const innerDoc = parser.parseFromString(inlineHtml, 'text/html')
        const extracted = extractContent(innerDoc)
        htmlContent = extracted.html || inlineHtml
        textContent = extracted.text
      }
    } else if (detail && typeof detail === 'object') {
      htmlContent = detail.html || ''
      textContent = detail.text || ''
    }

    if (!htmlContent) {
      htmlContent = `<p>请在浏览器中查看：<a href="https://emailmux.com/email/${mail.id}" target="_blank" rel="noreferrer">打开邮件</a></p>`
    }

    console.debug('[EmailMux] detail parsed', {
      mailId: mail.id,
      hasIframe: typeof detail === 'string' && !!(detail.includes('<iframe')),
      htmlLength: htmlContent?.length || 0,
      textSample: textContent?.slice(0, 80) || ''
    })

    selectedMail.value = {
      ...mail,
      html: htmlContent,
      text: textContent
    }
  } catch (err) {
    if (currentDetailMailId.value === mail.id) {
      error.value = '获取邮件内容失败: ' + err.message
      selectedMail.value = {
        ...mail,
        html: `<p>获取邮件内容失败，请 <a href="https://emailmux.com/email/${mail.id}" target="_blank" rel="noreferrer">前往网页查看</a></p>`
      }
    }
  } finally {
    if (currentDetailMailId.value === mail.id) {
      detailLoading.value = false
    }
  }
}

const loadKyfudaoDetail = async (mail) => {
  if (!isKyfudao.value || !mail) return
  try {
    const detail = await kyfudaoService.fetchEmailDetail(mail.id, emailAddress.value)
    if (currentDetailMailId.value !== mail.id) return

    let htmlContent = ''
    let textContent = ''
    let attachments = []

    const contentType = detail.content_type ? detail.content_type.toLowerCase() : ''

    if (detail.html_content) {
      let decodedHtml = decodeQuotedPrintable(detail.html_content)
      const htmlIndex = decodedHtml.toLowerCase().indexOf('<html')
      if (htmlIndex >= 0) {
        decodedHtml = decodedHtml.slice(htmlIndex)
      }
      htmlContent = sanitizeKyfudaoHtml(decodedHtml)
    }

    if (!htmlContent && detail.text_content) {
      const decodedText = decodeQuotedPrintable(detail.text_content)
      textContent = stripEmailHeaders(decodedText)
    } else if (detail.text_content) {
      textContent = decodeQuotedPrintable(detail.text_content)
    }

    attachments = Array.isArray(detail.attachments) ? detail.attachments : []

    if (!htmlContent && textContent) {
      if (contentType.includes('text/html') || /<[a-z][\s\S]*>/i.test(textContent)) {
        htmlContent = sanitizeKyfudaoHtml(textContent)
        textContent = ''
      }
    }

    if (textContent) {
      textContent = textContent.replace(/--[\w-]+(?=\s|$)/g, '')
      textContent = textContent.replace(/Content-Transfer-Encoding:[^\n]*\n/gi, '')
      textContent = textContent.replace(/Content-Type:[^\n]*\n/gi, '')
    } else if (detail.text_content) {
      const decodedText = decodeQuotedPrintable(detail.text_content)
      textContent = stripEmailHeaders(decodedText)
      textContent = textContent.replace(/--[\w-]+(?=\s|$)/g, '')
      textContent = textContent.replace(/Content-Transfer-Encoding:[^\n]*\n/gi, '')
      textContent = textContent.replace(/Content-Type:[^\n]*\n/gi, '')
    }

    selectedMail.value = {
      ...mail,
      html:
        htmlContent ||
        (textContent
          ? textContent
              .split(/\r?\n/)
              .filter((line, index, arr) => !(line.trim() === '' && arr[index - 1]?.trim() === ''))
              .map((line) => line.trim())
              .join('<br>')
          : ''),
      text: textContent,
      attachments
    }
  } catch (err) {
    if (currentDetailMailId.value === mail.id) {
      error.value = '获取邮件内容失败: ' + err.message
      selectedMail.value = {
        ...mail,
        html: `<p>获取邮件内容失败，请稍后重试。</p>`
      }
    }
  } finally {
    if (currentDetailMailId.value === mail.id) {
      detailLoading.value = false
    }
  }
}

// 生成随机邮箱
const generateEmail = async () => {
  if (isTempMail.value) {
    await createTempMailInbox()
    return
  }

  if (isEmailMux.value) {
    await createEmailMuxInbox()
    return
  }

  if (isGptMail.value) {
    await createGptMailInbox()
    return
  }

  if (isKyfudao.value) {
    const domain = emailDomain.value || kyfudaoDomains.value[0] || ''
    await createKyfudaoInbox({ domain })
    return
  }

  const email = generateRandomEmail()
  const [prefix, domain] = email.split('@')
  emailPrefix.value = prefix
  emailDomain.value = domain
  emailAddress.value = email
  
  // 保存到本地存储
  localStorage.setItem(getStorageKey('address'), email)
  
  // 清空邮件列表
  mails.value = []
  selectedMail.value = null
  
  // 立即刷新
  fetchMails()
}

// 自定义邮箱
const customEmail = async () => {
  if (isEmailMux.value) {
    error.value = '精品邮箱暂不支持自定义地址'
    return
  }

  if (!emailPrefix.value.trim()) {
    error.value = '请输入邮箱前缀'
    return
  }

  if (isTempMail.value) {
    await createTempMailInbox(emailPrefix.value.trim())
    return
  }

  if (isGptMail.value) {
    const selectedDomain = (emailDomain.value || '').trim()
    if (selectedDomain && !GPTMAIL_DOMAINS.includes(selectedDomain)) {
      error.value = '请选择有效的邮箱域名'
      return
    }
    await createGptMailInbox({
      prefix: emailPrefix.value.trim(),
      domain: selectedDomain || null
    })
    return
  }

  if (isKyfudao.value) {
    const selectedDomain = (emailDomain.value || '').trim() || kyfudaoDomains.value[0] || ''
    if (!selectedDomain) {
      error.value = '请选择邮箱域名'
      return
    }
    await createKyfudaoInbox({
      prefix: emailPrefix.value.trim(),
      domain: selectedDomain
    })
    return
  }
  
  emailAddress.value = `${emailPrefix.value}@${emailDomain.value}`
  localStorage.setItem(getStorageKey('address'), emailAddress.value)
  
  // 清空邮件列表
  mails.value = []
  selectedMail.value = null
  
  // 立即刷新
  fetchMails()
}

// 获取邮件列表
const fetchMails = async () => {
  if (!emailAddress.value && !isTempMail.value) return
  if (isTempMail.value && !emailToken.value) {
    await createTempMailInbox(emailPrefix.value.trim())
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    if (isTempMail.value) {
      const inbox = await tempmailService.fetchInbox(emailToken.value)
      if (inbox.expired) {
        await createTempMailInbox(emailPrefix.value.trim())
        return
      }

      const normalizedList = inbox.emails
        .map(normalizeMailData)
        .filter((item) => item !== null)
      if (normalizedList.length > 0) {
        const mailMap = new Map(mails.value.map((item) => [item.id, item]))
        normalizedList.forEach((item) => {
          mailMap.set(item.id, item)
        })
        mails.value = Array.from(mailMap.values()).sort((a, b) => b.created_at - a.created_at)
      } else {
        mails.value = []
      }
      cacheTempMailEmails(mails.value)
    } else if (isEmailMux.value) {
      const emailList = await emailmuxService.fetchEmails(emailAddress.value)
      const normalized = emailList
        .map((item) => normalizeEmailMux(item, emailAddress.value))
        .filter((item) => item !== null)
        .sort((a, b) => b.created_at - a.created_at)
      mails.value = normalized
      cacheEmailMuxEmails(normalized)
    } else if (isGptMail.value) {
      const { emails } = await gptmailService.fetchEmails(emailAddress.value)
      const normalized = emails
        .map((item) => normalizeGptMail(item, emailAddress.value))
        .filter((item) => item !== null)
        .sort((a, b) => b.created_at - a.created_at)
      mails.value = normalized
      cacheGptMailEmails(normalized)
    } else if (isKyfudao.value) {
      const { mails: kyfudaoList } = await kyfudaoService.fetchEmails(emailAddress.value)
      const normalized = kyfudaoList
        .map((item) => normalizeKyfudaoMail(item, emailAddress.value))
        .filter((item) => item !== null)
        .sort((a, b) => b.created_at - a.created_at)
      mails.value = normalized
      cacheKyfudaoEmails(normalized)
    } else {
      const mailList = await emailService.getMailList(emailAddress.value)
      // 规范化每封邮件的数据
      mails.value = mailList.map(normalizeMailData)
    }
  } catch (err) {
    error.value = '获取邮件失败: ' + err.message
  } finally {
    loading.value = false
  }
}

// 查看邮件详情
const viewMail = (mail) => {
  if (isTempMail.value) {
    detailLoading.value = false
    selectedMail.value = mail
    mail.seen = true
    return
  }

  if (isEmailMux.value) {
    currentDetailMailId.value = mail.id
    detailLoading.value = true
    mail.seen = true
    selectedMail.value = { ...mail }
    loadEmailMuxDetail(mail)
    return
  }

  if (isGptMail.value) {
    detailLoading.value = false
    mail.seen = true
    selectedMail.value = { ...mail }
    return
  }

  if (isKyfudao.value) {
    currentDetailMailId.value = mail.id
    detailLoading.value = true
    mail.seen = true
    selectedMail.value = normalizeKyfudaoMail(mail, emailAddress.value) || { ...mail }
    loadKyfudaoDetail(mail)
    return
  }

  const shouldMarkRead = !mail.seen
  if (shouldMarkRead) {
    mail.seen = true
  }

  currentDetailMailId.value = mail.id
  detailLoading.value = true

  let previewSource
  try {
    previewSource = JSON.parse(JSON.stringify(mail))
  } catch (e) {
    previewSource = { ...mail }
  }

  const previewMail = normalizeMailData(previewSource)
  if (previewMail) {
    selectedMail.value = previewMail
  } else {
    selectedMail.value = null
  }

  loadMailDetail(mail.id, shouldMarkRead)
}

// 关闭邮件详情
const closeMail = () => {
  selectedMail.value = null
  currentDetailMailId.value = null
  detailLoading.value = false
}

// 删除邮件
const deleteMail = (mail) => {
  if (!supportsDeletion.value) {
    error.value = '当前邮箱服务暂不支持删除邮件'
    return
  }

  pendingDeleteMail.value = mail
  showDeleteDialog.value = true
}

const confirmDeleteMail = async () => {
  if (!supportsDeletion.value || !pendingDeleteMail.value) {
    showDeleteDialog.value = false
    pendingDeleteMail.value = null
    return
  }

  try {
    if (isGptMail.value) {
      await gptmailService.deleteEmail(pendingDeleteMail.value.id)
    } else {
      await emailService.deleteMail(emailAddress.value, pendingDeleteMail.value.id)
    }
    mails.value = mails.value.filter(m => m.id !== pendingDeleteMail.value.id)

    if (selectedMail.value && selectedMail.value.id === pendingDeleteMail.value.id) {
      selectedMail.value = null
    }

    if (isGptMail.value) {
      cacheGptMailEmails(mails.value)
    }

    pendingDeleteMail.value = null
    showDeleteDialog.value = false
  } catch (err) {
    error.value = '删除邮件失败: ' + (err.message || err)
  }
}

// 删除所有邮件
const deleteAllMails = () => {
  if (!supportsDeletion.value) {
    error.value = '当前邮箱服务暂不支持清空操作'
    return
  }

  showDeleteAllDialog.value = true
}

const confirmDeleteAllMails = async () => {
  if (!supportsDeletion.value) {
    showDeleteAllDialog.value = false
    return
  }

  try {
    if (isGptMail.value) {
      await gptmailService.clearEmails(emailAddress.value)
    } else {
      await emailService.deleteAllMails(emailAddress.value)
    }
    mails.value = []
    selectedMail.value = null
    showDeleteAllDialog.value = false

    if (isGptMail.value) {
      cacheGptMailEmails([])
    }
  } catch (err) {
    error.value = '删除所有邮件失败: ' + (err.message || err)
  }
}

// 复制邮箱地址
const copyEmail = async () => {
  try {
    if (!emailAddress.value) {
      error.value = '暂无可复制的邮箱地址'
      return
    }
    await navigator.clipboard.writeText(emailAddress.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    error.value = '复制失败'
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 自动刷新倒计时
const startCountdown = () => {
  countdown.value = 30
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      countdown.value = 30
    }
  }, 1000)
  return timer
}

// 设置自动刷新
const setupAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  
  const canAutoRefresh = isTempMail.value ? !!emailToken.value : !!emailAddress.value

  if (autoRefresh.value && canAutoRefresh) {
    refreshInterval.value = setInterval(() => {
      fetchMails()
    }, 30000) // 每30秒刷新一次
  }
}

// 切换自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  setupAutoRefresh()
}

// 组件挂载
onMounted(async () => {
  if (isTempMail.value) {
    const savedAddress = localStorage.getItem(getStorageKey('address'))
    const savedToken = localStorage.getItem(getStorageKey('token'))
    const savedExpires = localStorage.getItem(getStorageKey('expires'))

    if (savedAddress && savedToken) {
      applyTempMailInbox({
        address: savedAddress,
        token: savedToken,
        expiresAt: savedExpires ? Number(savedExpires) : null
      })

      const cachedEmails = loadCachedTempMailEmails()
      if (cachedEmails.length > 0) {
        mails.value = cachedEmails
      }

      fetchMails()
  } else {
      await createTempMailInbox(emailPrefix.value.trim())
  }
} else if (isEmailMux.value) {
    loadEmailMuxDomains()
    const savedEmail = localStorage.getItem(getStorageKey('email'))
    if (savedEmail) {
      applyEmailMuxInbox(savedEmail)
      const cachedEmails = loadCachedEmailMuxEmails()
      if (cachedEmails.length > 0) {
        mails.value = cachedEmails
      }
      try {
        await emailmuxService.activateEmail(savedEmail)
      } catch (err) {
        console.warn('激活精品邮箱失败:', err)
      }
      await fetchMails()
    } else {
      await createEmailMuxInbox()
    }
  } else if (isGptMail.value) {
    const savedEmail = localStorage.getItem(getStorageKey('email'))
    const savedDomain = loadGptMailDomain()
    if (savedDomain && GPTMAIL_DOMAINS.includes(savedDomain)) {
      emailDomain.value = savedDomain
    }
    if (savedEmail) {
      applyGptMailInbox(savedEmail)
      const cachedEmails = loadCachedGptMailEmails()
      if (cachedEmails.length > 0) {
        mails.value = cachedEmails
      }
      await fetchMails()
    } else {
      await createGptMailInbox()
    }
  } else if (isKyfudao.value) {
    try {
      kyfudaoDomains.value = (await kyfudaoService.fetchDomains()).filter(
        (domain) =>
          !['01022.hk', 'yours.tools', '01130.hk', 'gbpxw.net'].includes(domain)
      )
    } catch (err) {
      console.warn('获取精品邮箱域名失败:', err)
    }

    const savedEmail = localStorage.getItem(getStorageKey('email'))
    const savedDomain = loadKyfudaoDomain()
    const savedStorage = loadKyfudaoStorageEmail()
    const savedExpires = localStorage.getItem(getStorageKey('expires'))

    if (savedDomain && kyfudaoDomains.value.includes(savedDomain)) {
      emailDomain.value = savedDomain
    }

    if (savedEmail) {
      applyKyfudaoInbox({
        email: savedEmail,
        storageEmail: savedStorage || savedEmail,
        expires: savedExpires ? Number(savedExpires) : null
      })
      const cachedEmails = loadCachedKyfudaoEmails()
      if (cachedEmails.length > 0) {
        mails.value = cachedEmails
      }
      await fetchMails()
    } else {
      const domain = emailDomain.value || kyfudaoDomains.value[0] || ''
      await createKyfudaoInbox({ domain })
    }
  } else {
    // 从本地存储恢复邮箱地址
    const savedEmail = localStorage.getItem(getStorageKey('address'))
    if (savedEmail) {
      const [prefix, domain] = savedEmail.split('@')
      emailPrefix.value = prefix
      emailDomain.value = domain
      emailAddress.value = savedEmail
      await fetchMails()
    } else {
      // 自动生成一个随机邮箱
      await generateEmail()
    }
  }
  
  // 启动自动刷新
  setupAutoRefresh()
  startCountdown()
})

// 组件卸载
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <div class="temp-mailbox">
    <!-- 邮箱地址设置 -->
    <div class="mailbox-header">
      <div class="email-input-group">
        <input 
          v-model="emailPrefix" 
          type="text" 
          class="email-prefix"
          :placeholder="supportsCustomEmail ? '输入前缀' : ''"
          :disabled="!supportsCustomEmail"
          @keyup.enter="customEmail"
        />
        <span class="email-at">@</span>
        <template v-if="supportsDomainSelection">
          <select v-model="emailDomain" class="email-domain">
            <option v-for="domain in domainOptions" :key="domain" :value="domain">
              {{ domain }}
            </option>
          </select>
        </template>
        <template v-else>
          <span class="email-domain email-domain--readonly">
            {{ emailDomain || '系统分配' }}
          </span>
        </template>
        <button v-if="supportsCustomEmail" @click="customEmail" class="btn-save">{{ isTempMail ? '设置' : '保存' }}</button>
        <button @click="generateEmail" class="btn-random">🎲 随机</button>
        <button @click="copyEmail" class="btn-copy" :class="{ 'copied': copySuccess }">
          {{ copySuccess ? '✓ 已复制' : '📋 复制' }}
        </button>
      </div>
      
      <div v-if="isEmailMux" class="emailmux-domain-group">
        <span class="domain-group-title">选择邮箱后缀：</span>
        <div class="emailmux-domain-options">
          <button
            v-for="domain in emailMuxDomainOptions"
            :key="domain"
            type="button"
            class="emailmux-domain-option"
            :class="{ active: emailMuxFormats.has(domain) }"
            @click="toggleEmailMuxDomain(domain)"
          >
            {{ emailMuxDomainLabel(domain) }}
          </button>
        </div>
      </div>

      <div class="mailbox-actions">
        <button @click="fetchMails" class="btn-refresh" :disabled="loading">
          <span class="refresh-icon" :class="{ 'spinning': loading }">🔄</span>
          刷新 {{ autoRefresh ? `(${countdown}s)` : '' }}
        </button>
        <button @click="toggleAutoRefresh" class="btn-auto-refresh" :class="{ 'active': autoRefresh }">
          {{ autoRefresh ? '⏸ 停止自动刷新' : '▶ 开启自动刷新' }}
        </button>
        <button
          v-if="supportsDeletion"
          @click="deleteAllMails"
          class="btn-delete-all"
          :disabled="mails.length === 0"
        >
          🗑️ 清空
        </button>
      </div>
    </div>

    <!-- 当前邮箱地址显示 -->
    <div class="current-email">
      <span class="label">当前邮箱:</span>
      <span class="email">{{ emailAddress }}</span>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = null" class="btn-close">×</button>
    </div>

    <!-- 邮件列表 -->
    <div class="mail-list-container">
      <div v-if="loading && mails.length === 0" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="mails.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>收件箱是空的</p>
        <p class="empty-hint">等待新邮件到达...</p>
      </div>
      
      <div v-else class="mail-list">
        <div
          v-for="mail in mails"
          :key="mail.id"
          class="mail-item"
          :class="{ 'selected': selectedMail && selectedMail.id === mail.id }"
          @click="viewMail(mail)"
        >
          <div class="mail-header">
            <span class="mail-from">{{ mail.from.name || mail.from.address }}</span>
            <span class="mail-time">{{ formatTime(mail.created_at) }}</span>
          </div>
          <div class="mail-subject">{{ mail.subject || '(无主题)' }}</div>
          <div class="mail-actions" v-if="supportsDeletion">
            <button @click.stop="deleteMail(mail)" class="btn-delete-mail">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 邮件详情弹窗 -->
    <div v-if="selectedMail" class="mail-detail-overlay" @click="closeMail">
        <div class="mail-detail" @click.stop>
          <div class="mail-detail-header">
            <h3>{{ selectedMail.subject || '(无主题)' }}</h3>
            <button @click="closeMail" class="btn-close-detail">×</button>
          </div>
        <div class="mail-detail-info">
          <div class="info-row">
            <span class="label">发件人:</span>
            <span class="value">{{ selectedMail.from.name || selectedMail.from.address }}</span>
          </div>
          <div class="info-row">
            <span class="label">收件人:</span>
            <span class="value">{{ selectedMail.to?.[0]?.address || emailAddress }}</span>
          </div>
          <div class="info-row">
            <span class="label">时间:</span>
            <span class="value">{{ new Date(selectedMail.created_at * 1000).toLocaleString('zh-CN') }}</span>
          </div>
        </div>
        <div class="mail-detail-body">
          <div v-if="detailLoading" class="detail-loading">
            <div class="spinner"></div>
            <p>邮件内容加载中...</p>
          </div>
          <template v-else>
            <div v-if="selectedMail?.html" v-html="selectedMail.html"></div>
            <pre v-else-if="selectedMail?.text">{{ selectedMail.text }}</pre>
            <p v-else class="no-content">无邮件内容</p>
          </template>
        </div>
      </div>
    </div>
  </div>

  <!-- 确认对话框 -->
  <ConfirmDialog
    v-if="supportsDeletion"
    v-model="showDeleteDialog"
    title="删除邮件"
    message="确定要删除这封邮件吗？此操作无法撤销。"
    type="danger"
    confirm-text="删除"
    cancel-text="取消"
    @confirm="confirmDeleteMail"
  />

  <ConfirmDialog
    v-if="supportsDeletion"
    v-model="showDeleteAllDialog"
    title="清空邮箱"
    message="确定要删除所有邮件吗？此操作无法撤销。"
    type="danger"
    confirm-text="全部删除"
    cancel-text="取消"
    @confirm="confirmDeleteAllMails"
  />
</template>

<style scoped>
.temp-mailbox {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.95);
  border-radius: 12px;
  padding: 20px;
  color: #e2e8f0;
}

/* 邮箱头部 */
.mailbox-header {
  margin-bottom: 15px;
}

.email-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.email-prefix {
  flex: 1;
  min-width: 120px;
  padding: 10px 15px;
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.3s;
}

.email-prefix:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(51, 65, 85, 1);
}

.email-prefix:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background: rgba(51, 65, 85, 0.5);
}

.emailmux-domain-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.domain-group-title {
  font-size: 13px;
  color: #94a3b8;
}

.emailmux-domain-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emailmux-domain-option {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(51, 65, 85, 0.6);
  color: #cbd5e1;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.emailmux-domain-option:hover {
  border-color: rgba(59, 130, 246, 0.6);
  color: #e2e8f0;
}

.emailmux-domain-option.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.8);
  color: #e2e8f0;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.25);
}

.email-at {
  display: flex;
  align-items: center;
  color: #94a3b8;
  font-size: 16px;
  font-weight: 500;
}

.email-domain {
  padding: 10px 15px;
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.email-domain:focus {
  outline: none;
  border-color: #3b82f6;
}

.email-domain--readonly {
  min-width: 160px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  background: rgba(51, 65, 85, 0.6);
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 14px;
}

.btn-save, .btn-random, .btn-copy {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save {
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
  color: white;
}

.btn-save:disabled {
  cursor: not-allowed;
  background: rgba(71, 85, 105, 0.8);
  color: #cbd5e1;
  opacity: 0.7;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-random {
  background: rgba(139, 92, 246, 0.8);
  color: white;
}

.btn-random:hover {
  background: rgba(139, 92, 246, 1);
  transform: translateY(-2px);
}

.btn-copy {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-copy:hover {
  background: rgba(51, 65, 85, 1);
  border-color: #3b82f6;
}

.btn-copy.copied {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.mailbox-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-refresh, .btn-auto-refresh, .btn-delete-all {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-refresh:hover, .btn-auto-refresh:hover, .btn-delete-all:hover {
  background: rgba(51, 65, 85, 1);
  border-color: #3b82f6;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-auto-refresh.active {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border-color: transparent;
}

.btn-delete-all:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.refresh-icon {
  display: inline-block;
  transition: transform 0.3s;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 当前邮箱显示 */
.current-email {
  padding: 12px 16px;
  background: rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.current-email .label {
  color: #94a3b8;
  font-size: 13px;
}

.current-email .email {
  color: #60a5fa;
  font-weight: 500;
  font-size: 14px;
  font-family: monospace;
}

/* 错误提示 */
.error-message {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 8px;
  color: #fca5a5;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.btn-close {
  background: none;
  border: none;
  color: #fca5a5;
  font-size: 20px;
  cursor: pointer;
  padding: 0 5px;
}

/* 邮件列表容器 */
.mail-list-container {
  flex: 1;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  padding: 15px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #94a3b8;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: #94a3b8;
  text-align: center;
  gap: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-hint {
  font-size: 13px;
  color: #64748b;
  margin-top: 5px;
}

/* 邮件列表 */
.mail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mail-item {
  padding: 15px;
  background: rgba(51, 65, 85, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.mail-item:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: #3b82f6;
  transform: translateX(4px);
}

.mail-item.selected {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}

.mail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mail-from {
  font-weight: 500;
  color: #e2e8f0;
  font-size: 14px;
}

.mail-time {
  font-size: 12px;
  color: #94a3b8;
}

.mail-subject {
  color: #cbd5e1;
  font-size: 13px;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mail-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-delete-mail {
  padding: 4px 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 4px;
  color: #fca5a5;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-delete-mail:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

/* 邮件详情弹窗 */
.mail-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.mail-detail {
  background: rgba(30, 41, 59, 0.98);
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mail-detail-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mail-detail-header h3 {
  margin: 0;
  color: #e2e8f0;
  font-size: 18px;
  flex: 1;
}

.btn-close-detail {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 28px;
  cursor: pointer;
  padding: 0 10px;
  transition: color 0.3s;
}

.btn-close-detail:hover {
  color: #e2e8f0;
}

.mail-detail-info {
  padding: 15px 20px;
  background: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: #94a3b8;
  min-width: 60px;
}

.info-row .value {
  color: #cbd5e1;
  flex: 1;
}

.mail-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  color: #cbd5e1;
  line-height: 1.6;
}

.mail-detail-body pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  margin: 0;
}

.no-content {
  text-align: center;
  color: #64748b;
  padding: 40px;
}

/* 滚动条样式 */
.mail-list-container::-webkit-scrollbar,
.mail-detail-body::-webkit-scrollbar {
  width: 8px;
}

.mail-list-container::-webkit-scrollbar-track,
.mail-detail-body::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

.mail-list-container::-webkit-scrollbar-thumb,
.mail-detail-body::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 4px;
}

.mail-list-container::-webkit-scrollbar-thumb:hover,
.mail-detail-body::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.7);
}
</style>
