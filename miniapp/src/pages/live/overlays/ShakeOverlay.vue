<!--
  ShakeOverlay · 摇一摇浮层
  ------------------------------------------------------------
  - 不在主舞台显示，只在底部浮层
  - 使用 wx.startAccelerometer / uni.onAccelerometerChange 检测摇动
  - 倒计时由后端推送（active=true 期间持续接收）
-->
<template>
  <view class="shake-overlay">
    <view class="overlay-card">
      <view class="overlay-head">
        <text class="overlay-tag">互动 · 摇一摇</text>
        <text class="overlay-title">狂摇手机看谁最嗨</text>
        <text class="overlay-desc">大屏同步直播 · 每 0.5s 上报一次</text>
      </view>

      <!-- 倒计时环 -->
      <view v-if="active" class="ring" :class="{ pulse: isShaking }">
        <text class="ring-num">{{ countDown || 'GO!' }}</text>
        <text class="ring-tip">{{ isShaking ? '已感应到' : '摇动中…' }}</text>
      </view>
      <view v-else class="ring idle">
        <text class="ring-num">⏳</text>
        <text class="ring-tip">等待主持人开始</text>
      </view>

      <view v-if="leaderboard.length" class="lb">
        <text class="lb-title">实时排行榜</text>
        <view class="lb-row" v-for="(u, i) in leaderboard.slice(0, 5)" :key="i">
          <text class="lb-rank">{{ i + 1 }}</text>
          <text class="lb-name">{{ u.name }}</text>
          <text class="lb-count">{{ u.count }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue';
import { eventApi } from '../../../services/api';

interface Props {
  eventId: string;
  active: boolean;
  leaderboard: Array<{ name: string; count: number }>;
  countDown?: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'shake'): void }>();

const isShaking = ref(false);
let lastReport = 0;
let accelListener: any = null;

const onAccelChange = (res: any) => {
  const { x, y, z } = res;
  const mag = Math.sqrt(x * x + y * y + z * z);
  if (mag > 2.2) {
    isShaking.value = true;
    const now = Date.now();
    if (now - lastReport > 400) {
      lastReport = now;
      // 节流上报：v2.0 简化为累计 +1
      eventApi.shake(props.eventId, 1).catch(() => {});
      emit('shake');
    }
    setTimeout(() => (isShaking.value = false), 400);
  }
};

watch(
  () => props.active,
  (v) => {
    if (v) {
      // #ifdef MP-WEIXIN || APP-PLUS
      uni.startAccelerometer({ interval: 'game' });
      uni.onAccelerometerChange(onAccelChange);
      // #endif
    } else {
      // #ifdef MP-WEIXIN || APP-PLUS
      uni.stopAccelerometer();
      uni.offAccelerometerChange(onAccelChange);
      // #endif
      isShaking.value = false;
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  // #ifdef MP-WEIXIN || APP-PLUS
  uni.stopAccelerometer();
  uni.offAccelerometerChange(onAccelChange);
  // #endif
});
</script>

<style scoped>
.shake-overlay { width: 100%; animation: slide-up 0.4s var(--fm-ease-smooth, ease); }
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
.overlay-head { margin-bottom: 20rpx; }
.overlay-tag {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
  border-radius: 999rpx;
  margin-bottom: 12rpx;
}
.overlay-title { display: block; font-size: 32rpx; font-weight: 800; margin-bottom: 6rpx; }
.overlay-desc { display: block; font-size: 22rpx; color: rgba(255, 255, 255, 0.55); }

.ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 24rpx auto;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.15));
  border: 4rpx solid #667eea;
  box-shadow: 0 0 40rpx rgba(102, 126, 234, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.ring.idle {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: none;
}
.ring.pulse {
  transform: scale(1.06);
  box-shadow: 0 0 80rpx rgba(102, 126, 234, 0.7);
}
.ring-num {
  font-size: 60rpx;
  font-weight: 800;
  color: white;
  font-variant-numeric: tabular-nums;
}
.ring-tip {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.lb { margin-top: 16rpx; }
.lb-title {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 12rpx;
}
.lb-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
  font-size: 26rpx;
}
.lb-rank {
  width: 36rpx;
  text-align: center;
  color: #ffd700;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.lb-name { flex: 1; color: white; }
.lb-count {
  color: rgba(255, 215, 0, 0.85);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
