<template>
  <view class="index-page">
    <!-- 顶部 logo + slogan -->
    <view class="header">
      <view class="logo-wrap">
        <text class="app-name">聚闪耀</text>
        <text class="app-en">FLASHMEET</text>
      </view>
      <text class="app-slogan">计算相遇的概率，渲染心动的瞬间</text>
    </view>

    <!-- 角色选择卡 -->
    <view class="role-select">
      <view class="role-card fm-press" hover-class="none" @tap="goToHost">
        <view class="role-icon-wrap role-icon-wrap--host">
          <text class="role-icon">🎯</text>
        </view>
        <text class="role-title">我是主持人</text>
        <text class="role-desc">创建聚会 · 场控管理</text>
      </view>
      <view class="role-card fm-press" hover-class="none" @tap="goToUser">
        <view class="role-icon-wrap role-icon-wrap--user">
          <text class="role-icon">🌟</text>
        </view>
        <text class="role-title">我是参与者</text>
        <text class="role-desc">扫码签到 · 互动游戏</text>
      </view>
    </view>

    <!-- 自我介绍卡片入口 -->
    <view class="profile-link fm-press" @tap="goProfile" v-if="userInfo">
      <image
        v-if="userInfo.avatar"
        :src="userInfo.avatar"
        class="profile-avatar"
        mode="aspectFill"
      />
      <view v-else class="profile-avatar profile-avatar--placeholder">
        <text class="profile-initial">{{ (userInfo.nickname || '?').charAt(0) }}</text>
      </view>
      <view class="profile-meta">
        <text class="profile-nick">{{ userInfo.nickname || '未登录用户' }}</text>
        <text class="profile-tip">查看我的画像 ›</text>
      </view>
    </view>

    <!-- 最近活动快捷入口（用户上次参与的活动，可一键回到签到页） -->
    <view
      v-if="recentEvent && userInfo"
      class="recent-link fm-press"
      @tap="goRecent"
    >
      <view class="recent-icon">📌</view>
      <view class="recent-meta">
        <text class="recent-label">最近参与的聚会</text>
        <text class="recent-id">{{ recentEvent.event_id.slice(0, 8) }}…</text>
      </view>
      <text class="recent-arrow">›</text>
    </view>

    <!-- 底部装饰 -->
    <view class="bottom-sparkle" aria-hidden="true">
      <text v-for="i in 12" :key="i" class="sparkle" :style="sparkleStyle(i)">✦</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const userInfo = ref<any>(null);
const recentEvent = ref<{ event_id: string } | null>(null);

onShow(() => {
  const stored = uni.getStorageSync('flashmeet_user');
  if (stored) {
    userInfo.value = JSON.parse(stored);
  }
  // 读取最近活动（由 checkin.vue / dashboard.vue 在签到成功时写入）
  try {
    const raw = uni.getStorageSync('flashmeet_recent_event');
    if (raw) recentEvent.value = JSON.parse(raw);
  } catch {
    recentEvent.value = null;
  }
});

/** 跳登录页（路由白名单：login 自身不重定向） */
const requireLogin = () => {
  const token = uni.getStorageSync('flashmeet_token');
  if (!token) {
    uni.reLaunch({ url: '/pages/login/index' });
    return false;
  }
  return true;
};

const goToHost = () => {
  if (requireLogin()) {
    uni.navigateTo({ url: '/pages/host/dashboard' });
  }
};

const goToUser = () => {
  if (requireLogin()) {
    uni.navigateTo({ url: '/pages/user/checkin' });
  }
};

const goProfile = () => {
  if (requireLogin()) {
    uni.navigateTo({ url: '/pages/user/profile' });
  }
};

const goRecent = () => {
  if (!recentEvent.value) return;
  if (requireLogin()) {
    uni.navigateTo({ url: `/pages/user/checkin?eventId=${recentEvent.value.event_id}` });
  }
};

/** 背景星点随机分布 */
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
  padding: calc(120rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
  position: relative;
  overflow: hidden;
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
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
  font-size: 72rpx;
  font-weight: 800;
  letter-spacing: 6rpx;
  background: linear-gradient(135deg, #667eea 0%, #ff6b6b 50%, #ffd700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.app-en {
  font-size: 22rpx;
  letter-spacing: 8rpx;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
}

.app-slogan {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 2rpx;
}

.role-select {
  display: flex;
  gap: 30rpx;
  width: 100%;
  position: relative;
  z-index: 2;
}

.role-card {
  flex: 1;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28rpx;
  padding: 48rpx 24rpx 40rpx;
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
.role-card:active::before {
  opacity: 1;
}
.role-card:active {
  transform: scale(0.97);
}

.role-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24rpx;
  position: relative;
}
.role-icon-wrap--host {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25), rgba(118, 75, 162, 0.2));
  box-shadow: 0 0 24rpx rgba(102, 126, 234, 0.35);
}
.role-icon-wrap--user {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 107, 107, 0.2));
  box-shadow: 0 0 24rpx rgba(255, 215, 0, 0.25);
}

.role-icon {
  font-size: 56rpx;
  line-height: 1;
}

.role-title {
  font-size: 32rpx;
  font-weight: 700;
  color: white;
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 1rpx;
}

.role-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1rpx;
}

.profile-link {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 60rpx;
  padding: 20rpx 28rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
  transition: background 0.2s;
  position: relative;
  z-index: 2;
}
.profile-link:active {
  background: rgba(255, 255, 255, 0.1);
}

.profile-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2rpx solid rgba(255, 215, 0, 0.5);
}
.profile-avatar--placeholder {
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-initial {
  font-size: 28rpx;
  font-weight: 700;
  color: white;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.profile-nick {
  font-size: 28rpx;
  font-weight: 600;
  color: white;
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-tip {
  font-size: 22rpx;
  color: rgba(255, 215, 0, 0.85);
}

.recent-link {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 24rpx;
  padding: 20rpx 28rpx;
  width: 100%;
  max-width: 560rpx;
  background: linear-gradient(160deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.08));
  border: 1rpx solid rgba(102, 126, 234, 0.25);
  border-radius: 20rpx;
  position: relative;
  z-index: 2;
  transition: transform 0.15s ease, background 0.2s;
}
.recent-link:active { transform: scale(0.98); background: rgba(102, 126, 234, 0.18); }
.recent-icon { font-size: 32rpx; }
.recent-meta { flex: 1; display: flex; flex-direction: column; gap: 4rpx; min-width: 0; }
.recent-label { font-size: 22rpx; color: rgba(255, 255, 255, 0.55); }
.recent-id {
  font-size: 28rpx;
  font-weight: 600;
  color: white;
  font-variant-numeric: tabular-nums;
}
.recent-arrow { font-size: 32rpx; color: rgba(255, 255, 255, 0.5); }

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
