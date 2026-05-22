<template>
  <view class="shake-page">
    <text class="title">摇一摇</text>
    <text class="desc">疯狂摇动手机！</text>

    <view class="shake-area">
      <view class="phone-icon" :class="{ shaking: isShaking }">📱</view>
    </view>

    <view class="score-area">
      <text class="score">{{ myScore }}</text>
      <text class="score-label">我的分数</text>
    </view>

    <view class="rank-area" v-if="leaderboard.length > 0">
      <text class="rank-title">实时排行</text>
      <view v-for="(p, i) in leaderboard.slice(0, 10)" :key="p.user_id" class="rank-item">
        <text class="rank-num">{{ i + 1 }}</text>
        <text class="rank-name">{{ p.user_id.slice(-4) }}</text>
        <text class="rank-score">{{ p.score }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { eventApi } from '../../services/api';

const eventId = ref('');
const isShaking = ref(false);
const myScore = ref(0);
const leaderboard = ref<any[]>([]);
let shakeCount = 0;
let lastSendTime = 0;

onLoad((options: any) => {
  if (options?.eventId) {
    eventId.value = options.eventId;
  }
});

const startAccelerometer = () => {
  uni.onAccelerometerChange((res) => {
    const { x, y, z } = res;
    const acceleration = Math.sqrt(x * x + y * y + z * z);

    if (acceleration > 1.5) {
      isShaking.value = true;
      shakeCount++;

      const now = Date.now();
      if (now - lastSendTime >= 500) {
        myScore.value += shakeCount;
        sendShakeAction(shakeCount);
        shakeCount = 0;
        lastSendTime = now;

        setTimeout(() => {
          isShaking.value = false;
        }, 300);
      }
    }
  });
};

const sendShakeAction = (count: number) => {
  if (!eventId.value) return;
  eventApi.shake(eventId.value, count).catch(() => {});
};

onMounted(() => {
  uni.startAccelerometer({ interval: 'game' });
  startAccelerometer();
});

onUnmounted(() => {
  uni.stopAccelerometer();
});
</script>

<style scoped>
.shake-page {
  min-height: 100vh;
  padding: 60rpx 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
  text-align: center;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  color: #ff6b6b;
  display: block;
  margin-bottom: 12rpx;
}

.desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 60rpx;
}

.shake-area {
  margin-bottom: 40rpx;
}

.phone-icon {
  font-size: 120rpx;
  display: inline-block;
  transition: transform 0.1s;
}

.phone-icon.shaking {
  animation: shake 0.15s infinite;
}

@keyframes shake {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
  100% { transform: rotate(0deg); }
}

.score-area {
  margin-bottom: 60rpx;
}

.score {
  font-size: 80rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
}

.score-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.4);
}

.rank-area {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 30rpx;
  text-align: left;
}

.rank-title {
  font-size: 30rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 20rpx;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.rank-num {
  width: 60rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #ffd700;
}

.rank-name {
  flex: 1;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.rank-score {
  font-size: 28rpx;
  font-weight: bold;
  color: #667eea;
}
</style>
