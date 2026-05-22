<template>
  <view class="login-page">
    <view class="logo-area">
      <text class="app-name">聚闪耀</text>
      <text class="slogan">计算相遇的概率，渲染心动的瞬间</text>
    </view>
    <button class="login-btn" open-type="getUserInfo" @getuserinfo="onGetUserInfo">
      微信一键登录
    </button>
    <button class="login-btn mock-btn" @tap="mockLogin">
      MVP 模拟登录
    </button>
  </view>
</template>

<script setup lang="ts">
import { authApi } from '../../services/api';

const onGetUserInfo = async (e: any) => {
  // MVP: In production, get wx.login code first
  console.log('User info:', e);
  try {
    const res: any = await authApi.wechatLogin('wx_mock_code');
    uni.setStorageSync('flashmeet_token', res.access_token);
    uni.setStorageSync('flashmeet_user', JSON.stringify(res.user));
    uni.reLaunch({ url: '/pages/index/index' });
  } catch (err) {
    uni.showToast({ title: '登录失败', icon: 'none' });
  }
};

const mockLogin = async () => {
  try {
    const code = `mock_${Date.now()}`;
    const res: any = await authApi.wechatLogin(code);
    uni.setStorageSync('flashmeet_token', res.access_token);
    uni.setStorageSync('flashmeet_user', JSON.stringify(res.user));
    uni.reLaunch({ url: '/pages/index/index' });
  } catch (err) {
    uni.showToast({ title: '登录失败', icon: 'none' });
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.logo-area {
  text-align: center;
  margin-bottom: 120rpx;
}

.app-name {
  font-size: 72rpx;
  font-weight: bold;
  display: block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20rpx;
}

.slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.5);
}

.login-btn {
  width: 500rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  margin-bottom: 30rpx;
}

.mock-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 28rpx;
}
</style>
