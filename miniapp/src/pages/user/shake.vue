<template>
  <view class="shake-page">
    <view v-if="!isSessionActive && !countdownEndsAt" class="wait-card">
      <view class="wait-emoji-wrapper">
        <view class="wait-emoji-ring" />
        <view class="wait-emoji-ring wait-emoji-ring--2" />
        <text class="wait-emoji">⏳</text>
      </view>
      <text class="wait-title">等待主持人开始</text>
      <text class="wait-desc">主持人开启「摇一摇」后，将出现倒计时</text>
      <view class="wait-guide-wrap">
        <StepList
          title="玩法说明"
          :steps="[
            { label: '倒计时响起，疯狂摇动手机', hint: '前 3 秒最关键，节奏要快', icon: '⏰', tone: 'gold' },
            { label: '摇得越快，分数越高', hint: '系统会按 500ms 内的加速度积分', icon: '⚡', tone: 'cyan' },
            { label: '实时排名，争当第一', hint: 'TOP 3 在大屏上专属展示', icon: '🏆', tone: 'red' },
          ]"
        />
      </view>
    </view>

    <view v-else>
      <!-- 倒计时 / 进度 -->
      <view class="countdown-card">
        <view class="countdown-num" :class="{ 'countdown-urgent': displayCountdownNum <= 3 }">
          {{ displayCountdown }}
        </view>
        <progress
          class="countdown-bar"
          :percent="100 - progressPercent"
          stroke-width="6"
          :activeColor="displayCountdownNum <= 3 ? '#ff6b6b' : '#ffd700'"
          backgroundColor="rgba(255,255,255,0.1)"
        />
        <text v-if="!isSessionActive" class="countdown-tip">已结束</text>
      </view>

      <!-- 主操作区 -->
      <view class="shake-area">
        <view class="phone-icon-wrapper" :class="{ shaking: isShaking }">
          <view class="shake-rays" v-if="isShaking">
            <view v-for="n in 8" :key="n" class="ray" :style="rayStyle(n)" />
          </view>
          <text class="phone-icon">📱</text>
        </view>
        <text v-if="isSessionActive" class="shake-hint" :class="{ active: isShaking }">
          {{ isShaking ? '太棒了！继续摇！' : '疯狂摇动手机！' }}
        </text>
        <text v-else class="shake-hint">本轮已结束</text>

        <!-- 速度指示器 -->
        <view class="speed-indicator" v-if="isSessionActive">
          <view class="speed-bar">
            <view class="speed-fill" :style="{ width: speedPercent + '%' }" />
          </view>
          <text class="speed-label" :data-level="speedLevel">{{ speedLabel }}</text>
        </view>
      </view>

      <view class="score-area">
        <text class="score" :class="{ 'score-pop': scorePop }">{{ myScore }}</text>
        <text class="score-label">我的分数</text>
        <text v-if="myDisplayId" class="shake-display-id">大屏身份 · {{ myDisplayId }}</text>
        <text v-if="myRank > 0" class="shake-rank" :class="{ 'rank-top': myRank <= 3 }">
          {{ myRank <= 3 ? ['🥇', '🥈', '🥉'][myRank - 1] : '#' + myRank }}
          当前排名
        </text>
      </view>

      <view class="rank-area" v-if="leaderboard.length > 0">
        <text class="rank-title">实时排行 TOP 10</text>
        <TransitionGroup name="rank-list" tag="view">
          <view
            v-for="(p, i) in leaderboard.slice(0, 10)"
            :key="p.user_id"
            class="rank-item"
            :class="{ 'rank-me': p.user_id === myUserId, 'rank-podium': i < 3 }"
          >
            <text class="rank-num" :class="'rank-num-' + (i + 1)">
              {{ i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1 }}
            </text>
            <text class="rank-name">{{ p.display_id || (p.user_id ? p.user_id.slice(-4) : '?') }}</text>
            <view class="rank-score-bar">
              <view
                class="rank-score-fill"
                :style="{
                  width: leaderboard.length > 0
                    ? (p.score / (leaderboard[0]?.score || 1)) * 100 + '%'
                    : '0%',
                  background: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#667eea',
                }"
              />
            </view>
            <text class="rank-score">{{ p.score }}</text>
          </view>
        </TransitionGroup>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app';
import { eventApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { WsEvent, EventStatus } from '../../services/ws-events';
import StepList from '../../components/StepList.vue';

const eventId = ref('');
const isShaking = ref(false);
const myScore = ref(0);
const myDisplayId = ref('');
const myUserId = ref('');
const leaderboard = ref<any[]>([]);
const scorePop = ref(false);
const recentShakeCount = ref(0);

// 速度指示器
const speedLevel = ref(0); // 0-3
const speedLabel = computed(() => {
  const labels = ['轻摇', '加速', '很快', '狂暴！'];
  return labels[speedLevel.value] || '轻摇';
});
const speedPercent = computed(() => (speedLevel.value / 3) * 100);

// 光线样式
const rayStyle = (n: number) => {
  const angle = (n / 8) * 360;
  const color = `hsl(${angle}, 80%, 60%)`;
  return {
    transform: `rotate(${angle}deg)`,
    background: color,
    boxShadow: `0 0 8px ${color}`,
  };
};

// 倒计时 / 进度
const countdownEndsAt = ref<number | null>(null);
const serverNow = ref<number>(Date.now());
const localNow = ref<number>(Date.now());
let nowTimer: ReturnType<typeof setInterval> | null = null;

const isSessionActive = computed(() => {
  if (!countdownEndsAt.value) return false;
  return countdownEndsAt.value > localNow.value;
});

const displayCountdown = computed(() => {
  if (!countdownEndsAt.value) return '--';
  const ms = Math.max(0, countdownEndsAt.value - localNow.value);
  return Math.ceil(ms / 1000).toString();
});

const displayCountdownNum = computed(() => {
  if (!countdownEndsAt.value) return 999;
  return Math.ceil((countdownEndsAt.value - localNow.value) / 1000);
});

const progressPercent = computed(() => {
  if (!countdownEndsAt.value || !sessionDurationMs.value) return 0;
  const total = sessionDurationMs.value;
  const remain = Math.max(0, countdownEndsAt.value - localNow.value);
  return Math.min(100, Math.max(0, (remain / total) * 100));
});

const sessionDurationMs = ref(0);
const myRank = computed(() => {
  if (!myUserId.value) return 0;
  const idx = leaderboard.value.findIndex((p) => p.user_id === myUserId.value);
  return idx >= 0 ? idx + 1 : 0;
});

// 防抖/限速
let shakeCount = 0;
let lastSendTime = 0;
let lastShakeAt = 0;
let speedTimer: any = null;

let unbindShake: (() => void) | null = null;
let unbindScene: (() => void) | null = null;

onLoad(async (options: any) => {
  if (options?.eventId) eventId.value = options.eventId;
  const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
  myDisplayId.value = userInfo?.display_id || '';
  myUserId.value = userInfo?.user_id || '';

  if (eventId.value) {
    // 先注册 WS 监听器，避免错过 SHAKE_STARTED 事件
    socketService.connect(eventId.value, { role: 'user' });
    unbindShake = socketService.onShakeState(onShakeStarted, onShakeEnded, onLeaderboardTick);

    // 场景切换自动导航
    unbindScene = socketService.onSceneChange((data: any) => {
      if (!data || data.event_id !== eventId.value) return;
      const state = data.state;
      const pages = getCurrentPages();
      const cur = pages[pages.length - 1];
      const curRoute = cur?.route || '';
      if (state === EventStatus.GAME_MATCH && !curRoute.includes('match')) {
        uni.navigateTo({ url: `/pages/user/match?eventId=${eventId.value}` });
      } else if ((state === EventStatus.LOTTERY_RUNNING || state === EventStatus.LOTTERY_READY) && !curRoute.includes('lottery')) {
        uni.navigateTo({ url: `/pages/user/lottery?eventId=${eventId.value}` });
      } else if (state === EventStatus.ENDED && !curRoute.includes('achievement')) {
        uni.navigateTo({ url: `/pages/user/achievement?eventId=${eventId.value}` });
      }
    });

    try {
      const res = await eventApi.shakeSession(eventId.value);
      if (res?.active && res.ends_at) {
        serverNow.value = res.server_now;
        const drift = Date.now() - res.server_now;
        countdownEndsAt.value = res.ends_at + drift;
        sessionDurationMs.value = res.duration_ms || (res.ends_at + drift - Date.now());
      }
    } catch {}
  }
});

const startAccelerometer = () => {
  // 先解绑防重复
  try {
    uni.offAccelerometerChange(() => {});
  } catch {}
  uni.onAccelerometerChange((res) => {
    if (!isSessionActive.value) return;
    const { x, y, z } = res;
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    // 速度等级计算
    if (acceleration > 2.5) {
      speedLevel.value = 3;
    } else if (acceleration > 1.8) {
      speedLevel.value = 2;
    } else if (acceleration > 1.2) {
      speedLevel.value = 1;
    } else {
      speedLevel.value = 0;
    }

    if (acceleration > 1.5 && now - lastShakeAt > 100) {
      isShaking.value = true;
      lastShakeAt = now;
      shakeCount++;
      recentShakeCount.value++;

      // 速度衰减
      if (speedTimer) clearTimeout(speedTimer);
      speedTimer = setTimeout(() => {
        speedLevel.value = 0;
      }, 500);

      setTimeout(() => (isShaking.value = false), 250);
    }

    if (now - lastSendTime >= 500 && shakeCount > 0) {
      myScore.value += shakeCount;
      scorePop.value = true;
      setTimeout(() => (scorePop.value = false), 300);
      sendShakeAction(shakeCount);
      shakeCount = 0;
      lastSendTime = now;
    }
  });
};

const sendShakeAction = (count: number) => {
  if (!eventId.value || !isSessionActive.value) return;
  // 优先通过 WebSocket 发送（低延迟）
  if (socketService.connected) {
    socketService.emit(WsEvent.USER_SHAKE_ACTION, {
      event_id: eventId.value,
      user_id: myUserId.value,
      count,
    });
  } else {
    // WebSocket 断开时降级到 HTTP
    eventApi.shake(eventId.value, count).catch(() => {});
  }
};

const onShakeStarted = (payload: any) => {
  countdownEndsAt.value = payload.ends_at;
  sessionDurationMs.value = payload.duration_ms;
  myScore.value = 0;
  speedLevel.value = 0;
  uni.vibrateShort({ type: 'medium' });
};

const onShakeEnded = (payload: any) => {
  countdownEndsAt.value = null;
  if (payload?.final_leaderboard) {
    leaderboard.value = payload.final_leaderboard;
  }
  uni.vibrateLong();
};

const onLeaderboardTick = (payload: any) => {
  if (payload?.leaderboard) {
    leaderboard.value = payload.leaderboard;
  }
};

onShow(() => {
  // 防止 onShow 重复触发导致加速器回调叠加
  uni.stopAccelerometer();
  setTimeout(() => {
    uni.startAccelerometer({ interval: 'game' });
    startAccelerometer();
  }, 50);

  if (nowTimer) clearInterval(nowTimer);
  nowTimer = setInterval(() => {
    localNow.value = Date.now();
  }, 250);
});

onHide(() => {
  uni.stopAccelerometer();
  if (nowTimer) {
    clearInterval(nowTimer);
    nowTimer = null;
  }
  if (speedTimer) {
    clearTimeout(speedTimer);
    speedTimer = null;
  }
  isShaking.value = false;
  speedLevel.value = 0;
  shakeCount = 0;
});

onUnload(() => {
  uni.stopAccelerometer();
  if (nowTimer) clearInterval(nowTimer);
  if (speedTimer) clearTimeout(speedTimer);
  if (unbindShake) {
    unbindShake();
    unbindShake = null;
  }
  if (unbindScene) {
    unbindScene();
    unbindScene = null;
  }
});
</script>

<style scoped>
.shake-page {
  min-height: 100vh;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
  text-align: center;
}

.wait-card {
  margin-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.wait-emoji-wrapper {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}
.wait-emoji-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3rpx solid rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  animation: ringPulse 2.4s ease-in-out infinite;
}
.wait-emoji-ring--2 {
  animation-delay: 1.2s;
  border-color: rgba(255, 107, 107, 0.3);
}
@keyframes ringPulse {
  0% { transform: scale(0.9); opacity: 0.3; }
  50% { transform: scale(1.15); opacity: 0.6; }
  100% { transform: scale(0.9); opacity: 0.3; }
}
.wait-emoji { font-size: 80rpx; }
.wait-title { font-size: 40rpx; color: white; font-weight: 700; letter-spacing: 2rpx; }
.wait-desc { font-size: 26rpx; color: rgba(255, 255, 255, 0.55); letter-spacing: 1rpx; }

.wait-guide-wrap {
  margin-top: 40rpx;
  width: 100%;
  padding: 0 16rpx;
}

.countdown-card {
  background: rgba(255,215,0,0.08);
  border: 1rpx solid rgba(255,215,0,0.3);
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
}
.countdown-num {
  font-size: 88rpx;
  font-weight: 900;
  color: #ffd700;
  font-feature-settings: 'tnum';
  display: block;
  line-height: 1;
  transition: color 0.3s;
}
.countdown-num.countdown-urgent {
  color: #ff6b6b;
  animation: countPulse 0.5s infinite;
}
@keyframes countPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.countdown-bar {
  margin-top: 16rpx;
  width: 100%;
}
.countdown-tip {
  font-size: 22rpx;
  color: rgba(255,255,255,0.4);
  display: block;
  margin-top: 8rpx;
}

.shake-area {
  margin-bottom: 24rpx;
  position: relative;
}

.phone-icon-wrapper {
  display: inline-block;
  position: relative;
  transition: transform 0.1s;
}

.phone-icon-wrapper.shaking {
  animation: shake 0.15s infinite;
}

@keyframes shake {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
  100% { transform: rotate(0deg); }
}

.phone-icon {
  font-size: 120rpx;
  display: block;
}

.shake-rays {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
}

.ray {
  position: absolute;
  width: 4rpx;
  height: 80rpx;
  border-radius: 2rpx;
  transform-origin: bottom center;
  bottom: 0;
  left: -2rpx;
  animation: rayFlash 0.4s ease-out infinite;
}

@keyframes rayFlash {
  0% { opacity: 0.3; transform: rotate(var(--rot, 0deg)) scaleY(0.3); }
  50% { opacity: 1; transform: rotate(var(--rot, 0deg)) scaleY(1); }
  100% { opacity: 0; transform: rotate(var(--rot, 0deg)) scaleY(0.3); }
}

.shake-hint {
  font-size: 26rpx;
  color: rgba(255,255,255,0.6);
  display: block;
  margin-top: 16rpx;
  transition: color 0.3s;
}
.shake-hint.active {
  color: #ffd700;
  font-weight: bold;
}

/* 速度指示器 */
.speed-indicator {
  margin-top: 20rpx;
  padding: 0 60rpx;
}
.speed-bar {
  height: 8rpx;
  background: rgba(255,255,255,0.1);
  border-radius: 4rpx;
  overflow: hidden;
}
.speed-fill {
  height: 100%;
  border-radius: 4rpx;
  background: linear-gradient(90deg, #4ecdc4, #ffd700, #ff6b6b);
  transition: width 0.3s;
}
.speed-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-top: 8rpx;
  letter-spacing: 1rpx;
  font-variant-numeric: tabular-nums;
}
.speed-label[data-level='3'] {
  color: #ff6b6b;
  font-weight: 700;
  text-shadow: 0 0 8rpx rgba(255, 107, 107, 0.5);
}

.score-area {
  margin-bottom: 40rpx;
}
.score {
  font-size: 80rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
  font-feature-settings: 'tnum';
  transition: transform 0.2s;
}
.score.score-pop {
  animation: scorePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes scorePop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.score-label {
  font-size: 26rpx;
  color: rgba(255,255,255,0.6);
}
.shake-display-id {
  display: block;
  font-size: 22rpx;
  color: #ffd700;
  margin-top: 8rpx;
  letter-spacing: 1rpx;
}
.shake-rank {
  display: block;
  font-size: 24rpx;
  color: #667eea;
  margin-top: 6rpx;
}
.shake-rank.rank-top {
  font-size: 28rpx;
  font-weight: bold;
  color: #ffd700;
}

.rank-area {
  background: rgba(255,255,255,0.05);
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
  gap: 12rpx;
  padding: 12rpx 12rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  border-radius: 8rpx;
  transition: all 0.3s;
}
.rank-item.rank-me {
  background: rgba(255,215,0,0.12);
  border: 1rpx solid rgba(255,215,0,0.3);
}
.rank-item.rank-podium {
  background: rgba(255,255,255,0.03);
}
.rank-num {
  width: 56rpx;
  font-size: 28rpx;
  font-weight: bold;
  text-align: center;
  flex-shrink: 0;
}
.rank-num-1, .rank-num-2, .rank-num-3 {
  font-size: 36rpx;
}
.rank-name {
  flex: 1;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.rank-score-bar {
  width: 100rpx;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3rpx;
  overflow: hidden;
  flex-shrink: 0;
}
.rank-score-fill {
  height: 100%;
  border-radius: 3rpx;
  transition: width 0.5s;
}
.rank-score {
  width: 100rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #667eea;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

/* 排行动画 */
.rank-list-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rank-list-leave-active {
  transition: all 0.2s;
}
.rank-list-enter-from {
  opacity: 0;
  transform: translateX(-30rpx);
}
.rank-list-leave-to {
  opacity: 0;
  transform: translateX(30rpx);
}
</style>
