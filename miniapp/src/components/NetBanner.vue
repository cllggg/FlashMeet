<template>
  <view v-if="state !== 'online'" class="net-banner" :class="state">
    <text class="net-icon">{{ state === 'offline' ? '📡' : '⚠️' }}</text>
    <text class="net-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { onNetStateChange, getNetState } from '../services/request';

const state = ref<'online' | 'offline' | 'unstable'>(getNetState());
let off: (() => void) | null = null;

onMounted(() => {
  off = onNetStateChange((s) => (state.value = s));
});
onUnmounted(() => {
  off?.();
});

const text = computed(() => {
  if (state.value === 'offline') return '网络已断开，部分功能暂不可用';
  if (state.value === 'unstable') return '网络不稳定，正在努力重连...';
  return '';
});
</script>

<style scoped>
.net-banner {
  position: fixed;
  /* 顶部：状态栏 + 自适应安全区 */
  top: 0;
  left: 0;
  right: 0;
  padding-top: calc(var(--status-bar-height, 20px) + 8rpx);
  padding-bottom: 8rpx;
  padding-left: 24rpx;
  padding-right: 24rpx;
  z-index: 9999;
  font-size: 24rpx;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  color: white;
  animation: slide-down 0.3s var(--fm-ease-out, ease-out);
  /* 永远不拦截下方页面的点击/输入 */
  pointer-events: none;
}
.net-banner.offline {
  background: linear-gradient(90deg, #c0392b 0%, #e74c3c 100%);
}
.net-banner.unstable {
  background: linear-gradient(90deg, #d35400 0%, #f39c12 100%);
}
@keyframes slide-down {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
.net-icon {
  font-size: 28rpx;
}
.net-text {
  font-weight: 500;
}
</style>
