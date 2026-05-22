<template>
  <view class="checkin-page">
    <view class="scan-area">
      <text class="title">扫码签到</text>
      <text class="desc">扫描大屏二维码，1秒上墙</text>
      <button class="scan-btn" @tap="scanQRCode">扫描二维码</button>
      <button class="scan-btn mock-btn" @tap="mockCheckin">MVP 模拟签到</button>
    </view>

    <view class="event-input" v-if="showManualInput">
      <input
        class="input"
        v-model="eventId"
        placeholder="输入活动ID"
        placeholder-style="color: rgba(255,255,255,0.3)"
      />
      <button class="submit-btn" @tap="doCheckin">签到</button>
    </view>

    <view class="checked-in" v-if="checkedIn">
      <text class="success-icon">✅</text>
      <text class="success-text">签到成功！</text>
      <text class="hint">你已化作一颗暗星飞入星系</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { checkinApi, eventApi } from '../../services/api';

const eventId = ref('');
const checkedIn = ref(false);
const showManualInput = ref(false);

const scanQRCode = () => {
  // In production: uni.scanCode
  uni.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success: (res) => {
      // Parse event_id from QR URL
      const match = res.result.match(/\/e\/([^?/]+)/);
      if (match) {
        eventId.value = match[1];
        doCheckin();
      }
    },
    fail: () => {
      showManualInput.value = true;
    },
  });
};

const mockCheckin = () => {
  showManualInput.value = true;
};

const doCheckin = async () => {
  if (!eventId.value) {
    uni.showToast({ title: '请输入活动ID', icon: 'none' });
    return;
  }

  try {
    await checkinApi.checkIn(eventId.value);
    checkedIn.value = true;
    uni.showToast({ title: '签到成功！', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: '签到失败', icon: 'none' });
  }
};
</script>

<style scoped>
.checkin-page {
  min-height: 100vh;
  padding: 60rpx 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.scan-area {
  text-align: center;
  padding-top: 100rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 20rpx;
}

.desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 60rpx;
}

.scan-btn {
  width: 400rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  margin-bottom: 20rpx;
}

.mock-btn {
  background: rgba(255, 255, 255, 0.1);
  font-size: 28rpx;
}

.event-input {
  margin-top: 60rpx;
  padding: 0 40rpx;
}

.input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  color: white;
  font-size: 30rpx;
  margin-bottom: 30rpx;
}

.submit-btn {
  background: #667eea;
  color: white;
  border-radius: 16rpx;
  font-size: 32rpx;
  border: none;
}

.checked-in {
  text-align: center;
  margin-top: 80rpx;
}

.success-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 20rpx;
}

.success-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #4fc3f7;
  display: block;
  margin-bottom: 16rpx;
}

.hint {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.4);
}
</style>
