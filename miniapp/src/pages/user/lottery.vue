<template>
  <view class="lottery-page">
    <text class="title">抽奖</text>
    <text class="desc">请看大屏，等待开奖</text>

    <view class="waiting" v-if="!hasWon">
      <view class="lottery-icon">🎁</view>
      <text class="waiting-text">等待主持人抽取...</text>
    </view>

    <view class="won" v-if="hasWon">
      <text class="won-icon">🎊</text>
      <text class="won-text">恭喜你中奖了！</text>
      <text class="prize-name">{{ prizeName }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { lotteryApi } from '../../services/api';

const eventId = ref('');
const hasWon = ref(false);
const prizeName = ref('');
let pollTimer: any = null;

onLoad((options: any) => {
  if (options?.eventId) {
    eventId.value = options.eventId;
    pollWinnerStatus();
  }
});

const pollWinnerStatus = () => {
  const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
  const userId = userInfo?.user_id;

  pollTimer = setInterval(async () => {
    if (!eventId.value || !userId) return;
    try {
      const winners: any = await lotteryApi.getWinners(eventId.value);
      const myWin = winners.find((w: any) => w.user_id === userId);
      if (myWin) {
        hasWon.value = true;
        prizeName.value = myWin.prize_name;
        if (pollTimer) clearInterval(pollTimer);
      }
    } catch {}
  }, 3000);
};

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.lottery-page {
  min-height: 100vh;
  padding: 60rpx 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #2a1a4e 100%);
  text-align: center;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
  margin-bottom: 12rpx;
}

.desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 100rpx;
}

.waiting {
  text-align: center;
}

.lottery-icon {
  font-size: 120rpx;
  display: block;
  margin-bottom: 40rpx;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30rpx); }
}

.waiting-text {
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.5);
}

.won {
  text-align: center;
}

.won-icon {
  font-size: 120rpx;
  display: block;
  margin-bottom: 30rpx;
}

.won-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
  margin-bottom: 20rpx;
}

.prize-name {
  font-size: 36rpx;
  color: #ff6b6b;
  display: block;
}
</style>
