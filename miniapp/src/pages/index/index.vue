<!--
  index/index · v3.0 极简入口
  ------------------------------------------------------------
  - 一个角色选择
  - 主持人 → conductor
  - 参与者 → live（带 eventId）
  - 移除所有"最近活动"、"查看画像"等冗余入口
-->
<template>
  <view class="index-page">
    <view class="header">
      <view class="logo-wrap">
        <text class="app-name">聚闪耀</text>
        <text class="app-en">FLASHMEET</text>
      </view>
      <text class="app-slogan">计算相遇的概率，渲染心动的瞬间</text>
    </view>

    <view class="role-select">
      <view class="role-card fm-press" hover-class="none" @tap="goToConductor">
        <view class="role-icon-wrap role-icon-wrap--host">
          <text class="role-icon">🎯</text>
        </view>
        <text class="role-title">主持人</text>
        <text class="role-desc">创建聚会 · 指挥流程</text>
      </view>
      <view class="role-card fm-press" hover-class="none" @tap="goToLive">
        <view class="role-icon-wrap role-icon-wrap--user">
          <text class="role-icon">🌟</text>
        </view>
        <text class="role-title">参与者</text>
        <text class="role-desc">扫码加入 · 沉浸体验</text>
      </view>
    </view>

    <view class="bottom-sparkle" aria-hidden="true">
      <text v-for="i in 12" :key="i" class="sparkle" :style="sparkleStyle(i)">✦</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';

const userInfo = ref<any>(null);

onShow(() => {
  const stored = uni.getStorageSync('flashmeet_user');
  if (stored) userInfo.value = JSON.parse(stored);
});

const requireLogin = () => {
  const token = uni.getStorageSync('flashmeet_token');
  if (!token) {
    uni.reLaunch({ url: '/pages/login/index' });
    return false;
  }
  return true;
};

const goToConductor = () => {
  if (requireLogin()) {
    uni.navigateTo({ url: '/pages/host/conductor' });
  }
};

const goToLive = () => {
  // 参与者从大屏扫码进入，主入口不强制 eventId
  uni.navigateTo({ url: '/pages/live/index' });
};

const sparkleStyle = (i: number) => {
  const left = (i * 73) % 100;
  const top = (i * 41) % 100;
  const delay = (i % 5) * 0.4;
  const size = 20 + ((i * 7) % 16);
  return {
    left: `${left}%`,
    top: `${top}%`,
    'font-size': `${size}rpx`,
    'animation-delay': `${delay}s`,
  };
};
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(60rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
  position: relative;
  overflow: hidden;
}

.header {
  text-align: center;
  margin-bottom: 100rpx;
  position: relative;
  z-index: 2;
}

.logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  margin-bottom: 24rpx;
}

.app-name {
  font-size: 88rpx;
  font-weight: 800;
  letter-spacing: 8rpx;
  background: linear-gradient(135deg, #667eea 0%, #ff6b6b 50%, #ffd700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.app-en {
  font-size: 24rpx;
  letter-spacing: 10rpx;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 3rpx;
}

.role-select {
  display: flex;
  gap: 40rpx;
  width: 100%;
  max-width: 700rpx;
  position: relative;
  z-index: 2;
}

.role-card {
  flex: 1;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32rpx;
  padding: 60rpx 32rpx 50rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s var(--fm-ease-smooth, ease), box-shadow 0.3s;
}
.role-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
}
.role-card:active::before { opacity: 1; }
.role-card:active { transform: scale(0.97); }

.role-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
  position: relative;
}
.role-icon-wrap--host {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.25));
  box-shadow: 0 0 32rpx rgba(102, 126, 234, 0.4);
}
.role-icon-wrap--user {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 107, 107, 0.25));
  box-shadow: 0 0 32rpx rgba(255, 215, 0, 0.3);
}

.role-icon { font-size: 64rpx; line-height: 1; }

.role-title {
  font-size: 36rpx;
  font-weight: 700;
  color: white;
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 2rpx;
}

.role-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1rpx;
}

.bottom-sparkle {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.sparkle {
  position: absolute;
  color: rgba(255, 215, 0, 0.4);
  animation: twinkle 2.4s ease-in-out infinite;
  line-height: 1;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6); }
  50% { opacity: 0.9; transform: scale(1.1); }
}
</style>
