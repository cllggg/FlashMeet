<!--
  LotteryOverlay · 抽奖浮层
  ------------------------------------------------------------
  - READY 阶段：浮层显示"加入抽奖"按钮 + 实时参与人数
  - RUNNING 阶段：浮层显示抽奖动画 + 中奖结果
-->
<template>
  <view class="lottery-overlay">
    <view class="overlay-card">
      <view class="overlay-head">
        <text class="overlay-tag">🎁 抽奖</text>
        <text class="overlay-title">{{ phaseTitle }}</text>
        <text class="overlay-desc">{{ phaseDesc }}</text>
      </view>

      <!-- READY -->
      <view v-if="phase === 'STATUS_LOTTERY_READY'" class="ready">
        <view class="lottery-box">
          <text class="lottery-icon">🎁</text>
          <text class="lottery-text">已准备就绪</text>
        </view>
        <button class="join-btn" @tap="onJoin">加入抽奖</button>
        <text class="ready-tip">主持人即将开奖</text>
      </view>

      <!-- RUNNING -->
      <view v-else-if="phase === 'STATUS_LOTTERY_RUNNING'" class="running">
        <view class="lottery-box rolling">
          <text class="lottery-icon spinning">🎁</text>
          <text class="lottery-text">开奖中…</text>
        </view>
        <view v-if="won" class="won">
          <text class="won-icon">🏆</text>
          <text class="won-text">恭喜！中了 {{ won.prize }}</text>
          <text class="won-code">兑奖码：{{ won.code }}</text>
        </view>
        <view v-else class="not-won">
          <text class="not-won-icon">🍀</text>
          <text class="not-won-text">这次没中，下次继续</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  eventId: string;
  phase?: string;
  won: { prize: string; code: string } | null;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'join'): void }>();

const phaseTitle = computed(() => {
  if (props.phase === 'STATUS_LOTTERY_RUNNING') return '开奖中';
  return '即将开奖';
});
const phaseDesc = computed(() => {
  if (props.phase === 'STATUS_LOTTERY_RUNNING') return '大屏同步滚动结果';
  return '点下方按钮加入抽奖池';
});

const onJoin = async () => {
  if (!props.eventId) return;
  // 参与者加入抽奖池：v2.0 简化为"报名"，实际签到动作由 checkin 完成，
  // 抽奖池 server 端会把所有已签到用户视为候选。
  try {
    uni.showToast({ title: '已加入抽奖池', icon: 'success' });
    emit('join');
  } catch (e: any) {
    uni.showToast({ title: e?.message || '加入失败', icon: 'none' });
  }
};
</script>

<style scoped>
.lottery-overlay { width: 100%; animation: slide-up 0.4s var(--fm-ease-smooth, ease); }
@keyframes slide-up {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.overlay-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04));
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 24rpx;
  padding: 32rpx;
  backdrop-filter: blur(20rpx);
}
.overlay-head { margin-bottom: 24rpx; }
.overlay-tag {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border-radius: 999rpx;
  margin-bottom: 12rpx;
}
.overlay-title { display: block; font-size: 36rpx; font-weight: 800; margin-bottom: 6rpx; }
.overlay-desc { display: block; font-size: 22rpx; color: rgba(255, 255, 255, 0.55); }

.lottery-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 24rpx auto;
  width: 240rpx;
  height: 240rpx;
  border-radius: 24rpx;
  background: linear-gradient(160deg, rgba(255, 215, 0, 0.15), rgba(255, 107, 107, 0.1));
  border: 2rpx solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 40rpx rgba(255, 215, 0, 0.2);
  gap: 12rpx;
}
.lottery-box.rolling {
  border-color: rgba(255, 107, 107, 0.5);
  animation: pulse-box 1.2s ease-in-out infinite;
}
@keyframes pulse-box {
  0%, 100% { box-shadow: 0 0 40rpx rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 80rpx rgba(255, 107, 107, 0.5); }
}
.lottery-icon {
  font-size: 96rpx;
  line-height: 1;
}
.lottery-icon.spinning {
  animation: spin 1.5s linear infinite;
  display: inline-block;
}
@keyframes spin {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}
.lottery-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.join-btn {
  width: 100%;
  background: linear-gradient(135deg, #ffd700, #ff6b6b);
  color: #1a1a4e;
  font-size: 30rpx;
  font-weight: 800;
  border-radius: 999rpx;
  height: 88rpx;
  line-height: 88rpx;
  margin-top: 16rpx;
}
.ready-tip {
  display: block;
  text-align: center;
  margin-top: 12rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.4);
}

.won, .not-won {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx;
  background: rgba(255, 215, 0, 0.1);
  border: 1rpx solid rgba(255, 215, 0, 0.3);
  border-radius: 16rpx;
  margin-top: 16rpx;
}
.not-won { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.1); }
.won-icon, .not-won-icon { font-size: 60rpx; }
.won-text { font-size: 30rpx; font-weight: 700; color: #ffd700; }
.won-code {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
  font-variant-numeric: tabular-nums;
  letter-spacing: 2rpx;
}
.not-won-text { font-size: 24rpx; color: rgba(255, 255, 255, 0.55); }
</style>
