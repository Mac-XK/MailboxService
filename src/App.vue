<script setup>
import { ref, onMounted, reactive } from 'vue'
import TempMailbox from './components/TempMailbox.vue'

const sidebarOpen = ref(false)
const showWelcome = ref(true)

// 当前激活的页面
const currentPage = ref('home')

// 控制侧边栏分组展开状态
const expandedGroups = reactive({
  email: false,
  register: false,
  account: false,
  bin: false
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleContentClick = () => {
  if (sidebarOpen.value) {
    sidebarOpen.value = false
  }
}

const toggleGroup = (groupName) => {
  expandedGroups[groupName] = !expandedGroups[groupName]
}

// 切换页面
const navigateTo = (page) => {
  currentPage.value = page
  sidebarOpen.value = false
}

onMounted(() => {
  // 3秒后隐藏欢迎页面
  setTimeout(() => {
    showWelcome.value = false
  }, 3000)
})

const accountCategories = [
  {
    name: 'Augment',
    subtitle: 'AI 浏览器与自动化',
    price: '￥89',
    accent: 'linear-gradient(135deg, #7f5af0 0%, #2cb1bc 100%)',
    features: ['官方邮箱注册', '附赠入门教程', '可绑定个人邮箱', '提供首登协助']
  },
  {
    name: 'Cursor',
    subtitle: 'AI 编程助手账号',
    price: '￥109',
    accent: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
    features: ['全功能 Pro 权限', '支持多端同步', '赠送 Prompt 模板合集', '7×24 客服协助']
  },
  {
    name: 'GPT',
    subtitle: 'ChatGPT 全系列',
    price: '￥129',
    accent: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
    features: ['官方 Plus 订阅', '包含 GPT-4 / o1', 'API Key 可用', '支持企业级发票']
  },
  {
    name: 'Gemini',
    subtitle: 'Google AI 工具套件',
    price: '￥99',
    accent: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    features: ['Gemini Advanced 权限', 'Google Workspace 可选', '指导科学上网配置', '一次购买永久使用']
  },
  {
    name: 'Warp',
    subtitle: '高效云端终端',
    price: '￥79',
    accent: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    features: ['Warp+ Premium', '无限流量加速', '支持团队协作', '附赠加速节点教程']
  }
]
</script>

<template>
  <div class="app-container">
    <!-- 欢迎动画页面 -->
    <div v-if="showWelcome" class="welcome-screen">
      <div class="welcome-content">
        <!-- Logo 动画 -->
        <div class="logo-container">
          <div class="logo-circle">
            <svg class="logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
              </defs>
              <!-- 信封图标 -->
              <path class="envelope-back" d="M10 30 L50 55 L90 30 L90 75 C90 78 88 80 85 80 L15 80 C12 80 10 78 10 75 Z"
                    fill="url(#gradient1)" stroke="white" stroke-width="2"/>
              <path class="envelope-front" d="M10 30 L50 55 L90 30"
                    stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <!-- 光圈效果 -->
          <div class="ripple ripple-1"></div>
          <div class="ripple ripple-2"></div>
          <div class="ripple ripple-3"></div>
        </div>

        <!-- 欢迎文字 -->
        <h1 class="welcome-title">欢迎使用 AiGo</h1>
        <p class="welcome-subtitle">智能邮箱管理系统</p>

        <!-- 加载点动画 -->
        <div class="loading-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <!-- 主应用界面 -->
    <div v-if="!showWelcome" class="main-app">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="menu-btn" @click="toggleSidebar">
            <!-- 开锁图标 (侧边栏打开时) -->
            <svg v-if="sidebarOpen" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            <!-- 锁图标 (侧边栏关闭时) -->
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
          </button>
          <div class="toolbar-title">AiGo</div>
        </div>
        <button class="qq-group-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M8 10h8M8 14h6" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>加入QQ群</span>
        </button>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 侧边栏 -->
        <div class="sidebar" :class="{ 'open': sidebarOpen }">
          <div class="sidebar-content">
            <nav class="sidebar-nav">
              <!-- 首页 -->
              <a href="#" class="nav-item" :class="{ 'active': currentPage === 'home' }" @click.prevent="navigateTo('home')">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 9l7-6 7 6v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M8 17v-6h4v6" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <span>首页</span>
              </a>

              <!-- 虚拟邮箱 -->
              <div class="nav-group">
                <div class="nav-item nav-parent" @click="toggleGroup('email')">
                  <div class="nav-item-content">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 6l7 5 7-5M3 6v8a2 2 0 002 2h10a2 2 0 002-2V6M3 6a2 2 0 012-2h10a2 2 0 012 2" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>虚拟邮箱</span>
                  </div>
                  <svg class="nav-arrow" :class="{ 'expanded': expandedGroups.email }" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="nav-submenu" v-show="expandedGroups.email">
                  <a href="#" class="nav-subitem" :class="{ 'active': currentPage === 'mailbox1' }" @click.prevent="navigateTo('mailbox1')">普通邮箱1</a>
                  <a href="#" class="nav-subitem" :class="{ 'active': currentPage === 'mailbox2' }" @click.prevent="navigateTo('mailbox2')">普通邮箱2</a>
                  <a href="#" class="nav-subitem" :class="{ 'active': currentPage === 'mailbox3' }" @click.prevent="navigateTo('mailbox3')">普通邮箱3</a>
                  <a href="#" class="nav-subitem" :class="{ 'active': currentPage === 'mailbox4' }" @click.prevent="navigateTo('mailbox4')">精品邮箱1</a>
                  <a href="#" class="nav-subitem" :class="{ 'active': currentPage === 'mailbox5' }" @click.prevent="navigateTo('mailbox5')">精品邮箱2</a>
                </div>
              </div>

              <!-- 自动注册 -->
              <div class="nav-group">
                <div class="nav-item nav-parent" @click="toggleGroup('register')">
                  <div class="nav-item-content">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M13 3l4 4-4 4M7 17l-4-4 4-4" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M17 7h-7M3 13h7" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>自动注册</span>
                  </div>
                  <svg class="nav-arrow" :class="{ 'expanded': expandedGroups.register }" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="nav-submenu" v-show="expandedGroups.register">
                  <a href="#" class="nav-subitem">Cursor</a>
                  <a href="#" class="nav-subitem">Augment</a>
                </div>
              </div>

              <!-- 账号出售 -->
              <a
                href="#"
                class="nav-item"
                :class="{ 'active': currentPage === 'accountSale' }"
                @click.prevent="navigateTo('accountSale')"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <span>账号出售</span>
              </a>

              <!-- Bin业务 -->
              <div class="nav-group">
                <div class="nav-item nav-parent" @click="toggleGroup('bin')">
                  <div class="nav-item-content">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M3 9h14M7 13h2" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>Bin业务</span>
                  </div>
                  <svg class="nav-arrow" :class="{ 'expanded': expandedGroups.bin }" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="nav-submenu" v-show="expandedGroups.bin">
                  <a href="#" class="nav-subitem">Bin查询</a>
                  <a href="#" class="nav-subitem">Bin生成</a>
                  <a href="#" class="nav-subitem">Bin购买</a>
                </div>
              </div>
            </nav>
          </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="content" @click="handleContentClick">
          <!-- 首页 -->
          <div v-if="currentPage === 'home'" class="container">
            <!-- 简洁的标题 -->
            <div class="header-section">
              <div class="subtitle-container">
                <span class="subtitle-item">虚拟邮箱</span>
                <span class="subtitle-divider">|</span>
                <span class="subtitle-item">自动注册</span>
                <span class="subtitle-divider">|</span>
                <span class="subtitle-item">账号出售</span>
                <span class="subtitle-divider">|</span>
                <span class="subtitle-item">Bin业务</span>
              </div>
            </div>

            <!-- 核心功能 -->
            <div class="section">
              <h2 class="section-title">核心功能</h2>
              <div class="features-grid">
                <div class="feature-item" @click="navigateTo('mailbox1')">
                  <div class="feature-icon">📧</div>
                  <h3>虚拟邮箱</h3>
                  <p>临时邮箱服务，保护隐私</p>
                </div>
                <div class="feature-item">
                  <div class="feature-icon">⚡</div>
                  <h3>自动注册</h3>
                  <p>批量注册，提高效率</p>
                </div>
                <div class="feature-item" @click="navigateTo('accountSale')">
                  <div class="feature-icon">💼</div>
                  <h3>账号出售</h3>
                  <p>安全交易，有保障</p>
                </div>
                <div class="feature-item">
                  <div class="feature-icon">💳</div>
                  <h3>Bin业务</h3>
                  <p>专业Bin码查询服务</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 普通邮箱1 -->
          <div v-else-if="currentPage === 'mailbox1'" class="page-container">
            <TempMailbox mailbox-id="1" />
          </div>

          <!-- 普通邮箱2 -->
          <div v-else-if="currentPage === 'mailbox2'" class="page-container">
            <TempMailbox mailbox-id="2" provider="tempmail" />
          </div>

          <!-- 普通邮箱3 -->
          <div v-else-if="currentPage === 'mailbox3'" class="page-container">
            <TempMailbox mailbox-id="3" provider="gptmail" />
          </div>

          <!-- 精品邮箱1 -->
          <div v-else-if="currentPage === 'mailbox4'" class="page-container">
            <TempMailbox mailbox-id="4" provider="emailmux" />
          </div>

          <!-- 精品邮箱2 -->
          <div v-else-if="currentPage === 'mailbox5'" class="page-container">
            <TempMailbox mailbox-id="5" provider="kyfudao" />
          </div>

          <!-- 账号出售 -->
          <div v-else-if="currentPage === 'accountSale'" class="page-container account-sale">
            <section class="account-sale-hero">
              <div class="hero-tag-group">
                <span class="hero-tag">安心交易</span>
                <span class="hero-tag">极速发货</span>
                <span class="hero-tag">售后保障</span>
              </div>
              <h1>虚拟账号精品商城</h1>
              <p>精选高质量账号一站式购齐，覆盖 Augment、Cursor、GPT、Gemini 与 Warp 等热门服务，支持批量采购与专属售后。</p>
            </section>

            <section class="account-sale-categories">
              <div
                v-for="category in accountCategories"
                :key="category.name"
                class="account-sale-card"
              >
                <div class="card-header" :style="{ background: category.accent }">
                  <span class="card-icon">{{ category.icon }}</span>
                  <div>
                    <h3>{{ category.name }}</h3>
                    <p>{{ category.subtitle }}</p>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-price">
                    <span class="price">{{ category.price }}</span>
                    <span class="price-unit">/个</span>
                  </div>
                  <ul class="card-features">
                    <li v-for="feature in category.features" :key="feature">
                      <span class="dot"></span>{{ feature }}
                    </li>
                  </ul>
                  <button class="card-button">联系客服下单</button>
                </div>
              </div>
            </section>

            <section class="account-sale-notice">
              <div class="notice-card">
                <h4>购买须知</h4>
                <ul>
                  <li>所有账号均提供 24 小时内售后支持，确认可登录后再发货。</li>
                  <li>如需批量采购、定制套餐或企业合作，请与客服沟通获取专属报价。</li>
                  <li>严禁将账号用于违法违规用途，如账号因滥用被封，将不在售后范围内。</li>
                </ul>
              </div>
              <div class="notice-action">
                <div class="contact-block">
                  <span class="contact-icon">💬</span>
                  <div>
                    <h5>专属客服</h5>
                    <p>添加客服微信或 QQ，实时沟通获取最新库存与折扣信息。</p>
                  </div>
                </div>
                <div class="contact-block">
                  <span class="contact-icon">⚡</span>
                  <div>
                    <h5>极速交付</h5>
                    <p>付款后 10 分钟内完成发货，支持自动化批量交付方案。</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <footer class="footer">
        <div class="footer-content">
          <p class="footer-copyright">© 2025 AiGo 团队服务平台</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* ========== 欢迎页面动画 ========== */
.welcome-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0093E9 0%, #80D0C7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.welcome-content {
  text-align: center;
  position: relative;
  z-index: 2;
}

/* Logo 容器 */
.logo-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 40px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Logo 圆圈 */
.logo-circle {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: pulse 2s ease-in-out infinite;
  position: relative;
  z-index: 2;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Logo 图标 */
.logo-icon {
  width: 70px;
  height: 70px;
}

.envelope-back {
  animation: envelope-draw 1.5s ease-out forwards;
}

.envelope-front {
  animation: envelope-line 1.5s ease-out 0.3s forwards;
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
}

@keyframes envelope-draw {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes envelope-line {
  to {
    stroke-dashoffset: 0;
  }
}

/* 光圈效果 */
.ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: ripple-animation 3s ease-out infinite;
}

.ripple-2 {
  animation-delay: 1s;
}

.ripple-3 {
  animation-delay: 2s;
}

@keyframes ripple-animation {
  0% {
    width: 120px;
    height: 120px;
    opacity: 1;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

/* 欢迎文字 */
.welcome-title {
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin-bottom: 15px;
  animation: fadeInUp 1s ease-out 0.5s both;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.welcome-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
  animation: fadeInUp 1s ease-out 0.8s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 加载点动画 */
.loading-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  animation: fadeIn 1s ease-out 1.2s both;
}

.dot {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 背景粒子 */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.particle {
  position: absolute;
  bottom: -10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: rise linear infinite;
}

@keyframes rise {
  to {
    bottom: 110%;
    opacity: 0;
  }
}

/* 欢迎页面淡出动画 */
.welcome-fade-enter-active,
.welcome-fade-leave-active {
  transition: opacity 0.8s ease;
}

.welcome-fade-enter-from,
.welcome-fade-leave-to {
  opacity: 0;
}

/* ========== 主应用界面 ========== */
.main-app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
}

/* 工具栏 */
.toolbar {
  height: 60px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.menu-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e2e8f0;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.toolbar-title {
  margin-left: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.qq-group-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.qq-group-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
}

.qq-group-btn svg {
  flex-shrink: 0;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  position: relative;
  overflow-y: auto;
}

/* 侧边栏 */
.sidebar {
  width: 260px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.5);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 15px;
  overflow-y: auto;
}

/* 导航项 */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s;
  font-size: 14px;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
  color: white;
}

.nav-item svg {
  flex-shrink: 0;
}

/* 导航分组 */
.nav-group {
  margin-bottom: 6px;
}

.nav-parent {
  justify-content: space-between;
  cursor: pointer;
}

.nav-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-arrow {
  flex-shrink: 0;
  transition: transform 0.3s ease;
  opacity: 0.6;
}

.nav-arrow.expanded {
  transform: rotate(180deg);
}

/* 子菜单 */
.nav-submenu {
  margin-left: 32px;
  margin-top: 4px;
  margin-bottom: 8px;
  padding-left: 12px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.nav-subitem {
  display: block;
  padding: 10px 16px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 6px;
  margin-bottom: 4px;
  transition: all 0.2s;
  font-size: 13px;
}

.nav-subitem:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  transform: translateX(4px);
}

.nav-subitem.active {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-left: 2px solid #3b82f6;
  padding-left: 14px;
}

/* 主要内容 */
.main-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  padding: 0 4px 0 0;
}

/* 页面容器 */
.page-container {
  width: 100%;
  min-height: 100%;
  padding: 30px;
}

/* 深色背景装饰 */
.content::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.content::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.container {
  width: 100%;
  max-width: 900px;
  padding: 40px 40px;
  position: relative;
  z-index: 1;
}

/* 标题区域 */
.header-section {
  text-align: center;
  margin-bottom: 50px;
  margin-top: 20px;
}

.subtitle-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 20px 36px;
  background: rgba(51, 65, 85, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: inline-flex;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.subtitle-item {
  font-size: 16px;
  font-weight: 500;
  color: #cbd5e1;
  transition: all 0.3s;
}

.subtitle-item:hover {
  color: #60a5fa;
  transform: scale(1.05);
}

.subtitle-divider {
  color: #64748b;
  font-weight: 300;
}

/* 区块 */
.section {
  margin-bottom: 0;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 24px;
  padding-bottom: 10px;
  border-bottom: 3px solid #3b82f6;
  display: inline-block;
}

/* 功能网格 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feature-item {
  text-align: center;
  padding: 24px 18px;
  background: rgba(51, 65, 85, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.feature-item:hover {
  border-color: #3b82f6;
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  background: rgba(51, 65, 85, 0.8);
}

.feature-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.feature-item h3 {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 6px;
}

.feature-item p {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 40px 20px;
  }

  .subtitle-container {
    flex-wrap: wrap;
    gap: 10px;
    padding: 15px 20px;
  }

  .subtitle-divider {
    display: none;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .qq-group-btn span {
    display: none;
  }

  .qq-group-btn {
    padding: 10px 12px;
  }
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .subtitle-item {
    font-size: 14px;
  }
}

/* 底部信息 */
.footer {
  width: 100%;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(10px);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  text-align: center;
}

.footer-copyright {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.3px;
}

/* 账号出售 */
.account-sale {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.78) 100%);
  border-radius: 20px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.1);
}

.account-sale-hero {
  text-align: left;
  max-width: 720px;
}

.account-sale-hero .hero-tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.account-sale-hero .hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.account-sale-hero h1 {
  font-size: 34px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 12px;
}

.account-sale-hero p {
  font-size: 16px;
  line-height: 1.8;
  color: #94a3b8;
}

.account-sale-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.account-sale-card {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.08);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45);
  display: flex;
  flex-direction: column;
}

.account-sale-card .card-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px 22px;
  color: #0f172a;
}

.account-sale-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.account-sale-card p {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.7);
}

.account-sale-card .card-body {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: #f8fafc;
}

.card-price .price {
  font-size: 30px;
  font-weight: 700;
}

.card-price .price-unit {
  font-size: 14px;
  color: #94a3b8;
}

.card-features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-features li {
  color: #cbd5f5;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-features .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.card-button {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  color: #f8fafc;
  padding: 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.card-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(37, 99, 235, 0.35);
}

.account-sale-notice {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 24px;
  align-items: stretch;
}

.notice-card {
  background: rgba(15, 23, 42, 0.85);
  border-radius: 18px;
  padding: 26px 28px;
  border: 1px solid rgba(94, 234, 212, 0.15);
  box-shadow: 0 16px 35px rgba(94, 234, 212, 0.15);
}

.notice-card h4 {
  margin: 0 0 14px;
  color: #ccfbf1;
  font-size: 18px;
  font-weight: 600;
}

.notice-card ul {
  margin: 0;
  padding-left: 18px;
  color: #94a3b8;
  line-height: 1.7;
  font-size: 14px;
}

.notice-action {
  background: rgba(30, 41, 59, 0.85);
  border-radius: 18px;
  padding: 26px 28px;
  border: 1px solid rgba(14, 165, 233, 0.12);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.contact-block {
  display: flex;
  gap: 16px;
  align-items: center;
}

.contact-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
}

.contact-block h5 {
  margin: 0;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
}

.contact-block p {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .account-sale {
    padding: 26px;
  }

  .account-sale-notice {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .account-sale {
    padding: 22px 18px;
  }

  .account-sale-hero h1 {
    font-size: 28px;
  }

  .account-sale-hero p {
    font-size: 14px;
  }
}
</style>
