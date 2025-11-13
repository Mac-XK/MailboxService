<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="modelValue" class="dialog-overlay" @click="handleCancel">
        <Transition name="dialog-scale">
          <div v-if="modelValue" class="dialog-container" @click.stop>
            <div class="dialog-header">
              <div class="dialog-icon" :class="iconClass">
                {{ icon }}
              </div>
              <h3 class="dialog-title">{{ title }}</h3>
            </div>
            
            <div class="dialog-body">
              <p class="dialog-message">{{ message }}</p>
            </div>
            
            <div class="dialog-footer">
              <button 
                class="dialog-btn dialog-btn-cancel" 
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button 
                class="dialog-btn dialog-btn-confirm" 
                :class="confirmClass"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'warning', // warning, danger, info
    validator: (value) => ['warning', 'danger', 'info'].includes(value)
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const icon = computed(() => {
  const icons = {
    warning: '⚠️',
    danger: '🗑️',
    info: 'ℹ️'
  }
  return icons[props.type] || icons.warning
})

const iconClass = computed(() => `dialog-icon-${props.type}`)

const confirmClass = computed(() => {
  return props.type === 'danger' ? 'dialog-btn-danger' : ''
})

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-container {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  width: 90%;
  max-width: 420px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header {
  padding: 24px 24px 16px;
  text-align: center;
}

.dialog-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: bounce-in 0.5s ease-out;
}

.dialog-icon-warning {
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
}

.dialog-icon-danger {
  filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
}

.dialog-icon-info {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.dialog-body {
  padding: 0 24px 24px;
  text-align: center;
}

.dialog-message {
  font-size: 15px;
  color: #cbd5e0;
  line-height: 1.6;
  margin: 0;
}

.dialog-footer {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.dialog-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.dialog-btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dialog-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.dialog-btn-cancel:active {
  transform: translateY(0);
}

.dialog-btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.dialog-btn-confirm:hover {
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
  transform: translateY(-1px);
}

.dialog-btn-confirm:active {
  transform: translateY(0);
}

.dialog-btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.dialog-btn-danger:hover {
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5);
}

/* 动画效果 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-scale-leave-active {
  transition: all 0.2s ease;
}

.dialog-scale-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

