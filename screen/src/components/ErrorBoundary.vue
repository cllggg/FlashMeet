<template>
  <slot v-if="!error" />
  <div v-else class="error-boundary">
    <div class="error-boundary__card">
      <div class="error-boundary__icon">⚠️</div>
      <h2 class="error-boundary__title">画面渲染异常</h2>
      <p class="error-boundary__msg">{{ friendlyMessage }}</p>
      <button class="error-boundary__btn" @click="onRetry">重试恢复</button>
      <button class="error-boundary__btn secondary" @click="onReload">刷新页面</button>
    </div>
  </div>
</template>

<script setup lang="ts">
/** ErrorBoundary — 全局错误兜底组件
 * 用法：<ErrorBoundary><router-view /></ErrorBoundary>
 * 捕获 Vue render 期间的错误，防止白屏 */
import { ref, onErrorCaptured, computed } from 'vue';

const error = ref<Error | null>(null);
const errorCount = ref(0);

const friendlyMessage = computed(() => {
  if (!error.value) return '';
  const msg = error.value.message || '';
  if (msg.includes('Cannot read properties of')) return '数据加载异常，请刷新重试';
  if (msg.includes('timeout')) return '网络连接超时，请检查网络后重试';
  if (msg.includes('Failed to fetch')) return '网络连接失败，请检查网络设置';
  return '系统遇到意外错误，请尝试刷新页面';
});

onErrorCaptured((err: Error, _instance, _info) => {
  error.value = err;
  errorCount.value++;
  console.error('[ErrorBoundary]', err.message);
  // 阻止错误继续向上冒泡
  return false;
});

function onRetry() {
  error.value = null;
}

function onReload() {
  window.location.reload();
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: var(--bg-primary, #0a0a2e);
  padding: 24px;
  box-sizing: border-box;
}
.error-boundary__card {
  text-align: center;
  max-width: 420px;
  width: 100%;
  padding: 48px 32px;
  background: var(--bg-secondary, #1a1a4e);
  border-radius: 16px;
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
}
.error-boundary__icon {
  font-size: 3rem;
  margin-bottom: 16px;
}
.error-boundary__title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0 0 12px;
}
.error-boundary__msg {
  font-size: 0.9rem;
  color: var(--text-secondary, rgba(255,255,255,0.7));
  margin: 0 0 32px;
  line-height: 1.5;
}
.error-boundary__btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 8px;
  background: var(--accent-primary, #8b5cf6);
  color: #fff;
  transition: opacity 0.2s;
}
.error-boundary__btn:hover {
  opacity: 0.85;
}
.error-boundary__btn.secondary {
  background: transparent;
  border: 1px solid var(--border-strong, rgba(255,255,255,0.2));
  color: var(--text-secondary, rgba(255,255,255,0.7));
}
</style>