<template>
  <view class="index-page">
    <view class="header">
      <text class="app-name">聚闪耀</text>
      <text class="app-slogan">计算相遇的概率，渲染心动的瞬间</text>
    </view>

    <view class="role-select">
      <view class="role-card" @tap="goToHost">
        <text class="role-icon">🎯</text>
        <text class="role-title">我是主持人</text>
        <text class="role-desc">创建聚会，场控管理</text>
      </view>
      <view class="role-card" @tap="goToUser">
        <text class="role-icon">🌟</text>
        <text class="role-title">我是参与者</text>
        <text class="role-desc">扫码签到，互动游戏</text>
      </view>
    </view>

    <view class="user-info" v-if="userInfo">
      <text class="greeting">欢迎，{{ userInfo.nickname }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const userInfo = ref<any>(null);

onShow(() => {
  const stored = uni.getStorageSync('flashmeet_user');
  if (stored) {
    userInfo.value = JSON.parse(stored);
  }
});

const goToHost = () => {
  uni.navigateTo({ url: '/pages/host/dashboard' });
};

const goToUser = () => {
  // Simulate scan: in production use uni.scanCode
  uni.navigateTo({ url: '/pages/user/checkin' });
};
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
}

.app-name {
  font-size: 60rpx;
  font-weight: bold;
  display: block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.5);
}

.role-select {
  display: flex;
  gap: 30rpx;
  width: 100%;
}

.role-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 50rpx 30rpx;
  text-align: center;
}

.role-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.role-title {
  font-size: 32rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 12rpx;
}

.role-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.user-info {
  margin-top: 60rpx;
}

.greeting {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
