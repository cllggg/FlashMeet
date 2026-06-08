<template>
  <view class="login-page">
    <!-- 顶部品牌区 -->
    <view class="brand">
      <view class="brand-logo">
        <text class="logo-emoji">✨</text>
      </view>
      <text class="app-name">聚闪耀</text>
      <text class="app-en">FLASHMEET</text>
      <text class="slogan">计算相遇的概率，渲染心动的瞬间</text>
    </view>

    <!-- 登录按钮区 -->
    <view class="login-actions">
      <button
        class="login-btn primary"
        :class="{ disabled: submitting }"
        open-type="getUserInfo"
        :disabled="submitting"
        @getuserinfo="onGetUserInfo"
        hover-class="none"
      >
        <text v-if="submitting" class="dot-pulse">登录中</text>
        <text v-else>微信一键登录</text>
      </button>

      <button
        class="login-btn ghost"
        :class="{ disabled: submitting }"
        :disabled="submitting"
        @tap="mockLogin"
        hover-class="none"
      >
        MVP 模拟登录
      </button>

      <text class="login-tip">登录即代表同意《用户协议》《隐私政策》</text>
    </view>

    <!-- 底部装饰 -->
    <view class="bottom-sparkle" aria-hidden="true">
      <text v-for="i in 8" :key="i" class="sparkle" :style="sparkleStyle(i)">✦</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { authApi } from '../../services/api';
import { httpErrorToMessage } from '../../services/request';

const submitting = ref(false);

const doLogin = async (code: string) => {
  if (submitting.value) return;
  submitting.value = true;
  // 用轻量 toast 替代全屏 mask，保留上下文
  uni.showLoading({ title: '登录中…', mask: false });
  try {
    const res: any = await authApi.wechatLogin(code);
    uni.setStorageSync('flashmeet_token', res.access_token);
    uni.setStorageSync('flashmeet_user', JSON.stringify(res.user));
    // dashboard 等组件直接读取 user_id（避免每次都 JSON.parse 整个 user 对象）
    if (res.user?.user_id) {
      uni.setStorageSync('flashmeet_user_id', res.user.user_id);
    }
    uni.hideLoading();
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 400);
  } catch (err) {
    uni.hideLoading();
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none', duration: 2000 });
  } finally {
    submitting.value = false;
  }
};

const onGetUserInfo = async (e: any) => {
  console.log('User info:', e);
  uni.vibrateShort?.({ type: 'light' });
  await doLogin('wx_mock_code');
};

const mockLogin = async () => {
  uni.vibrateShort?.({ type: 'light' });
  const code = `mock_${Date.now()}`;
  await doLogin(code);
};

const sparkleStyle = (i: number) => {
  const left = (i * 79) % 100;
  const top = (i * 47) % 100;
  const delay = (i % 4) * 0.5;
  const size = 24 + ((i * 9) % 20);
  return {
    left: `${left}%`,
    top: `${top}%`,
    'font-size': `${size}rpx`,
    'animation-delay': `${delay}s`,
  };
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(120rpx + env(safe-area-inset-top)) 60rpx
    calc(80rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
  position: relative;
  overflow: hidden;
}

.brand {
  text-align: center;
  margin-top: 80rpx;
  margin-bottom: 160rpx;
  position: relative;
  z-index: 2;
}

.brand-logo {
  width: 140rpx;
  height: 140rpx;
  margin: 0 auto 36rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #ff6b6b 50%, #ffd700 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 48rpx rgba(102, 126, 234, 0.5);
  animation: pulse-glow 3s ease-in-out infinite;
}
.logo-emoji {
  font-size: 80rpx;
  line-height: 1;
  filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.3));
}

.app-name {
  display: block;
  font-size: 72rpx;
  font-weight: 800;
  letter-spacing: 8rpx;
  background: linear-gradient(135deg, #667eea 0%, #ff6b6b 50%, #ffd700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
  margin-bottom: 6rpx;
}

.app-en {
  display: block;
  font-size: 22rpx;
  letter-spacing: 10rpx;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
  margin-bottom: 24rpx;
}

.slogan {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 2rpx;
}

.login-actions {
  width: 100%;
  max-width: 560rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  margin-bottom: 24rpx;
  letter-spacing: 2rpx;
  transition: transform 0.2s var(--fm-ease-smooth, ease), opacity 0.2s;
}
.login-btn::after { border: none; }
.login-btn:active:not(.disabled) {
  transform: scale(0.97);
  opacity: 0.9;
}
.login-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}
.login-btn.ghost {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 28rpx;
  font-weight: 500;
}
.login-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.dot-pulse::after {
  content: '...';
  display: inline-block;
  animation: dot-pulse 1.2s steps(4) infinite;
  overflow: hidden;
  vertical-align: bottom;
  width: 0;
}
@keyframes dot-pulse {
  0%   { content: ''; }
  25%  { content: '.'; }
  50%  { content: '..'; }
  75%  { content: '...'; }
  100% { content: ''; }
}

.login-tip {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 16rpx;
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
  color: rgba(255, 215, 0, 0.5);
  animation: twinkle 2.4s ease-in-out infinite;
  line-height: 1;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6); }
  50% { opacity: 0.9; transform: scale(1.1); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 48rpx rgba(102, 126, 234, 0.5); }
  50% { box-shadow: 0 0 64rpx rgba(255, 215, 0, 0.6); }
}
</style>
