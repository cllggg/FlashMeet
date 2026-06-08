<template>
  <view class="lottery-page">
    <text class="title">🎁 抽奖</text>
    <text class="desc">请看大屏，等待开奖</text>

    <!-- 实时播报条 -->
    <view v-if="recentWinners.length > 0" class="broadcast-ticker">
      <text class="broadcast-label">🎊 刚刚开奖</text>
      <view class="broadcast-track">
        <text
          v-for="(w, i) in recentWinners.slice(0, 5)"
          :key="`${w.user_id}-${w.drawn_at || i}`"
          class="broadcast-item"
        >
          {{ w.display_id || (w.user_id ? w.user_id.slice(-4) : '?') }} · {{ w.prize_name }}
          <text v-if="i < Math.min(recentWinners.length, 5) - 1" class="broadcast-sep"> | </text>
        </text>
      </view>
    </view>

    <view class="waiting" v-if="!hasWon">
      <view class="lottery-icon">🎁</view>
      <text class="waiting-text">等待主持人抽取...</text>
      <view v-if="pools.length > 0" class="pool-preview">
        <text class="pool-preview-title">本场奖池</text>
        <view v-for="p in pools" :key="p.id" class="pool-preview-row">
          <text class="pool-name">{{ p.name }}</text>
          <text class="pool-remaining">{{ totalRemaining(p) }} 份待抽</text>
        </view>
      </view>
    </view>

    <!-- 中奖面板：彩带 + 大奖名 + 视觉强化 -->
    <view v-else class="won" :class="`won-tier-${winTier}`">
      <view class="confetti-bg">
        <text v-for="i in 12" :key="i" class="confetti-piece" :style="confettiStyle(i)">{{ ['🎊','✨','🎉','⭐','💫'][i % 5] }}</text>
      </view>
      <view class="won-card">
        <text class="won-icon">🏆</text>
        <text class="won-text">恭喜你中奖了！</text>
        <text class="prize-name">{{ prizeName }}</text>
        <text v-if="myDisplayId" class="won-display-id">大屏定位 · {{ myDisplayId }}</text>
        <text v-if="winTier === 'big'" class="won-extra">🌟 大奖 🌟</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { lotteryApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { WsEvent, EventStatus } from '../../services/ws-events';

const eventId = ref('');
const hasWon = ref(false);
const prizeName = ref('');
const prizeValue = ref(0);
const myDisplayId = ref('');
const myUserId = ref('');
const pools = ref<any[]>([]);
const recentWinners = ref<any[]>([]);
let pollTimer: any = null;
let pollStartedAt = 0;
let slowPollTimer: any = null;
let unbindSocket: (() => void) | null = null;
let unbindWon: (() => void) | null = null;
let unbindScene: (() => void) | null = null;
const POLL_TIMEOUT_MS = 30_000;

onLoad((options: any) => {
  if (options?.eventId) {
    eventId.value = options.eventId;
    const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
    myDisplayId.value = userInfo?.display_id || '';
    myUserId.value = userInfo?.user_id || '';
    // 重新进入页面时重置中奖状态（可能从其他活动切回来）
    hasWon.value = false;
    prizeName.value = '';
    prizeValue.value = 0;
    loadPools();
    bindSocket();
    // 仅当 WS 未连接时启动轮询兜底
    if (!socketService.connected) {
      pollWinnerStatus();
    }
  }
});

const totalRemaining = (pool: any) => {
  if (!pool?.prizes) return 0;
  return pool.prizes.reduce(
    (s: number, p: any) => s + (p.remaining_count || 0),
    0,
  );
};

const winTier = computed(() => (prizeValue.value >= 100 ? 'big' : 'normal'));

const confettiStyle = (i: number) => {
  // 12 片彩带的随机位置
  const left = ((i * 37 + 13) % 100);
  const delay = (i % 5) * 0.2;
  const dur = 2 + (i % 4) * 0.5;
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${dur}s`,
  };
};

const loadPools = async () => {
  if (!eventId.value) return;
  try {
    const res: any = await lotteryApi.getPools(eventId.value);
    pools.value = Array.isArray(res) ? res : [];
  } catch {}
};

const bindSocket = () => {
  if (!eventId.value) return;
  socketService.connect(eventId.value);
  // 清理旧绑定
  if (unbindSocket) unbindSocket();
  if (unbindWon) unbindWon();
  if (unbindScene) unbindScene();
  unbindSocket = socketService.onLotteryAnnounce(onWinnerAnnounce);
  // 中奖者专属事件：自己中奖时立刻收到
  unbindWon = socketService.on(WsEvent.LOTTERY_WON, (data: any) => {
    if (data.event_id !== eventId.value) return;
    if (data.user_id && data.user_id === myUserId.value) {
      handleWin(data.prize_name, data.prize_value || 0);
    }
  });
  // 场景切换自动导航
  unbindScene = socketService.onSceneChange((data: any) => {
    if (!data || data.event_id !== eventId.value) return;
    const state = data.state;
    if (state === EventStatus.ENDED) {
      const pages = getCurrentPages();
      const cur = pages[pages.length - 1];
      const curRoute = cur?.route || '';
      if (!curRoute.includes('achievement')) {
        uni.navigateTo({ url: `/pages/user/achievement?eventId=${eventId.value}` });
      }
    }
  });
};

const onWinnerAnnounce = (data: any) => {
  if (!eventId.value || data.event_id !== eventId.value) return;
  const w = data.winner;
  if (!w) return;
  // 实时播报：去重（同 user_id+prize_name+record_id 优先）
  const keyOf = (x: any) =>
    x.record_id || `${x.user_id}|${x.prize_name}|${x.drawn_at || ''}`;
  const exists = recentWinners.value.some((x) => keyOf(x) === keyOf(w));
  if (!exists) {
    recentWinners.value = [w, ...recentWinners.value].slice(0, 10);
  }
  // 是我？
  if (w.user_id && w.user_id === myUserId.value) {
    handleWin(w.prize_name, w.prize_value || 0);
  }
};

const handleWin = (prize: string, value: number) => {
  if (hasWon.value) return;
  hasWon.value = true;
  prizeName.value = prize;
  prizeValue.value = value;
  uni.vibrateLong?.();
  uni.showToast({ title: '🎉 中奖啦！', icon: 'success', duration: 2000 });
  stopPolling();
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (slowPollTimer) {
    clearTimeout(slowPollTimer);
    slowPollTimer = null;
  }
};

const poller = async () => {
  const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
  const userId = userInfo?.user_id;
  if (!eventId.value || !userId) return;
  try {
    const winners: any = await lotteryApi.getWinners(eventId.value);
    // 顺带把全量中奖塞进播报（去重）
    if (Array.isArray(winners)) {
      const seen = new Set(
        recentWinners.value.map((x) => `${x.user_id}-${x.prize_name}`),
      );
      const fresh = winners
        .filter((w: any) => !seen.has(`${w.user_id}-${w.prize_name}`))
        .reverse();
      if (fresh.length > 0) {
        recentWinners.value = [...fresh, ...recentWinners.value].slice(0, 10);
      }
      const myWin = winners.find((w: any) => w.user_id === userId);
      if (myWin) {
        handleWin(myWin.prize_name, myWin.prize_value || 0);
      }
    }
  } catch {}
};

const pollWinnerStatus = () => {
  pollStartedAt = Date.now();
  // 启动期 2s 轮询
  pollTimer = setInterval(poller, 2000);
  // 30s 后切到 5s 慢轮询（兜底 WS 断）
  slowPollTimer = setTimeout(() => {
    if (pollTimer && !hasWon.value) {
      stopPolling();
      pollTimer = setInterval(poller, 5000);
    }
  }, POLL_TIMEOUT_MS);
};

onUnload(() => {
  stopPolling();
  if (unbindSocket) {
    unbindSocket();
    unbindSocket = null;
  }
  if (unbindWon) {
    unbindWon();
    unbindWon = null;
  }
  if (unbindScene) {
    unbindScene();
    unbindScene = null;
  }
});
</script>

<style scoped>
.lottery-page {
  min-height: 100vh;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx
    calc(120rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #2a1a4e 100%);
  text-align: center;
}

.title {
  font-size: 48rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 4rpx;
}

.desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  display: block;
  margin-bottom: 40rpx;
  letter-spacing: 1rpx;
}

.broadcast-ticker {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), rgba(102, 126, 234, 0.1));
  border: 1rpx solid rgba(255, 215, 0, 0.3);
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  margin-bottom: 40rpx;
  text-align: left;
  overflow: hidden;
}
.broadcast-label {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 215, 0, 0.7);
  margin-bottom: 8rpx;
  font-weight: bold;
}
.broadcast-track {
  font-size: 24rpx;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.broadcast-item {
  color: white;
}
.broadcast-sep {
  color: rgba(255, 255, 255, 0.3);
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
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 1rpx;
}

.won {
  position: relative;
  text-align: center;
  padding: 60rpx 0 40rpx;
  min-height: 600rpx;
}

.won-card {
  position: relative;
  z-index: 2;
  display: inline-block;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(102, 126, 234, 0.18));
  border: 4rpx solid #ffd700;
  border-radius: 32rpx;
  padding: 60rpx 80rpx;
  box-shadow: 0 0 60rpx rgba(255, 215, 0, 0.5);
  animation: won-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes won-pop {
  0% { transform: scale(0.3); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.won-tier-big .won-card {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.25), rgba(255, 215, 0, 0.25));
  border-color: #ff6b6b;
  box-shadow: 0 0 80rpx rgba(255, 107, 107, 0.6);
  animation: won-pop-big 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), won-glow 1.5s ease-in-out infinite;
}
@keyframes won-pop-big {
  0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes won-glow {
  0%, 100% { box-shadow: 0 0 60rpx rgba(255, 107, 107, 0.6); }
  50% { box-shadow: 0 0 100rpx rgba(255, 215, 0, 0.9); }
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
  font-size: 44rpx;
  color: #ff6b6b;
  font-weight: 900;
  display: block;
  margin-bottom: 16rpx;
}

.won-display-id {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 16rpx;
  letter-spacing: 2rpx;
  font-variant-numeric: tabular-nums;
}

.won-extra {
  display: block;
  font-size: 36rpx;
  color: #ff6b6b;
  font-weight: 900;
  margin-top: 16rpx;
  text-shadow: 0 0 20rpx rgba(255, 107, 107, 0.5);
  letter-spacing: 4rpx;
}

.confetti-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.confetti-piece {
  position: absolute;
  top: -40rpx;
  font-size: 40rpx;
  animation: confetti-fall 2.5s linear infinite;
}
@keyframes confetti-fall {
  0% { transform: translateY(-40rpx) rotate(0deg); opacity: 1; }
  100% { transform: translateY(700rpx) rotate(360deg); opacity: 0.3; }
}

.pool-preview {
  margin-top: 40rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: left;
}

.pool-preview-title {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16rpx;
}

.pool-preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.pool-name {
  font-size: 28rpx;
  color: white;
}

.pool-remaining {
  font-size: 24rpx;
  color: #ffd700;
}
</style>
