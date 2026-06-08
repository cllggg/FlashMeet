<template>
  <ErrorBoundary>
    <router-view />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import ErrorBoundary from './components/ErrorBoundary.vue';
</script>

<style>
/* ===================== 主题变量 =====================
 * 三个主题：cyber（默认）/ dark / light
 * 通过 [data-theme] 在 <html> 上切换，所有组件用 var(--xxx)
 * ==================================================== */
:root,
:root[data-theme='cyber'] {
  --bg-primary: #0a0a2e;
  --bg-secondary: #1a1a4e;
  --bg-elevated: rgba(255, 255, 255, 0.05);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --accent-primary: #8b5cf6;
  --accent-secondary: #6366f1;
  --accent-glow: rgba(139, 92, 246, 0.4);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.2);
  --star-color: #ffffff;
  --star-glow: rgba(255, 255, 255, 0.6);
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --shadow-card: 0 8rpx 32rpx rgba(0, 0, 0, 0.4);
}

:root[data-theme='dark'] {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-elevated: rgba(255, 255, 255, 0.04);
  --text-primary: #e5e5e5;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.4);
  --accent-primary: #38bdf8;
  --accent-secondary: #0ea5e9;
  --accent-glow: rgba(56, 189, 248, 0.3);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-strong: rgba(255, 255, 255, 0.15);
  --star-color: #cbd5e1;
  --star-glow: rgba(203, 213, 225, 0.4);
  --success: #22c55e;
  --warning: #eab308;
  --danger: #f87171;
  --shadow-card: 0 8rpx 32rpx rgba(0, 0, 0, 0.6);
}

:root[data-theme='light'] {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-elevated: rgba(0, 0, 0, 0.04);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --accent-primary: #2563eb;
  --accent-secondary: #3b82f6;
  --accent-glow: rgba(37, 99, 235, 0.2);
  --border-subtle: rgba(0, 0, 0, 0.08);
  --border-strong: rgba(0, 0, 0, 0.15);
  --star-color: #64748b;
  --star-glow: rgba(100, 116, 139, 0.3);
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --shadow-card: 0 8rpx 24rpx rgba(15, 23, 42, 0.08);
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  transition: background 0.4s ease, color 0.3s ease;
}
</style>
