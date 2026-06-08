<template>
  <view class="icebreaker-page">
    <!-- 等待中：展示提示语 -->
    <view v-if="!currentQuestion" class="waiting">
      <view class="pulse-dot"></view>
      <text class="waiting-title">等待主持人发起问题</text>
      <text class="waiting-hint">请关注大屏，主持人发起问题后</text>
      <text class="waiting-hint">请点击下方选项进行选择</text>
      <view class="waiting-tips">
        <view class="tip-row">
          <text class="tip-icon">💡</text>
          <text class="tip-text">你的回答会点亮大屏上的一颗暗星</text>
        </view>
        <view class="tip-row">
          <text class="tip-icon">🎨</text>
          <text class="tip-text">每颗星的颜色代表你的选择</text>
        </view>
      </view>
    </view>

    <!-- 问题展示 -->
    <view v-else class="question-card">
      <view class="q-header">
        <text class="question-label">破冰问题</text>
        <view class="q-timer" v-if="questionEndsAt">
          <text class="timer-icon">⏱</text>
          <text class="timer-text">{{ displayCountdown }}s</text>
        </view>
      </view>
      <text class="question-prompt">{{ currentQuestion.prompt }}</text>

      <view class="options">
        <view
          v-for="opt in currentQuestion.options"
          :key="opt.key"
          class="option-btn"
          :style="{ borderColor: opt.color }"
          :class="{ selected: selectedKey === opt.key, disabled: answered }"
          @tap="onSelect(opt)"
        >
          <view class="option-left">
            <view
              class="option-color-dot"
              :style="{ background: opt.color }"
            />
            <text class="option-label">{{ opt.label }}</text>
          </view>
          <view class="option-right">
            <text v-if="answerStats[opt.key] !== undefined" class="option-count">
              {{ answerStats[opt.key] }} 人
            </text>
            <text v-if="selectedKey === opt.key" class="option-check">✓</text>
          </view>
        </view>
      </view>

      <view v-if="answered" class="answered-banner">
        <text class="answered-text">已点亮 ✨</text>
        <text v-if="myDisplayId" class="answered-display-id">大屏定位：{{ myDisplayId }}</text>
        <text class="answered-hint">你已被点亮为「{{ chosenTag }}」</text>
        <text class="answered-fun">{{ funInterpretation }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { WsEvent, EventStatus } from '../../services/ws-events';
import { icebreakerApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { httpErrorToMessage } from '../../services/request';
import { mapErrorToMessage } from '../../utils/error-message';

const eventId = ref('');
const currentQuestion = ref<any>(null);
const selectedKey = ref('');
const answered = ref(false);
const chosenTag = ref('');
const myDisplayId = ref('');
const myUserId = ref('');
const questionEndsAt = ref(0);
const answerStats = ref<Record<string, number>>({});

let unbindQuestion: (() => void) | null = null;
let unbindClosed: (() => void) | null = null;
let unbindStar: (() => void) | null = null;
let unbindAnswered: (() => void) | null = null;
let unbindScene: (() => void) | null = null;
let countdownTimer: any = null;

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const interpretations: Record<string, string[]> = {
  'A': ['你选择了 A，看来你是个果断的人！', 'A 选项派！你有着独特的品味。', 'A阵营集结！你总是最直接的那个。'],
  'B': ['B 选项！稳健是你的代名词。', '选择了 B，你是个深思熟虑的人。', 'B阵营！你总是考虑周全。'],
  'C': ['C 选项！你有着与众不同的视角。', 'C阵营！你总是能发现别人忽略的细节。', '选择 C，你是个创意十足的人。'],
  'D': ['D 选项！你敢于挑战常规。', 'D阵营！不走寻常路就是你的风格。', '选择了 D，你总有自己的想法。'],
};

const displayCountdown = computed(() => {
  if (!questionEndsAt.value) return 0;
  return Math.max(0, Math.ceil((questionEndsAt.value - Date.now()) / 1000));
});

const funInterpretation = computed(() => {
  const list = interpretations[selectedKey.value] || [
    '你的选择点亮了夜空！',
    '大屏上多了一颗属于你的星！',
    '每一次选择都让这场派对更精彩！',
  ];
  return list[Math.floor(Math.random() * list.length)];
});

onLoad((options: any) => {
  eventId.value = options.event_id || '';
  if (!eventId.value) {
    uni.showToast({ title: '缺少活动ID', icon: 'none' });
  }
  const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
  myDisplayId.value = userInfo?.display_id || '';
  myUserId.value = userInfo?.user_id || '';
});

onShow(() => {
  connect();
  loadActive();
});

onUnload(() => {
  unbindQuestion?.();
  unbindClosed?.();
  unbindStar?.();
  unbindAnswered?.();
  unbindScene?.();
  unbindQuestion = unbindClosed = unbindStar = unbindAnswered = unbindScene = null;
  if (countdownTimer) clearInterval(countdownTimer);
});

const connect = () => {
  if (!eventId.value) return;
  socketService.connect(eventId.value, { role: 'user' });

  // 清理旧绑定
  unbindQuestion?.();
  unbindClosed?.();
  unbindStar?.();
  unbindAnswered?.();
  unbindScene?.();

  // 场景切换自动导航
  unbindScene = socketService.onSceneChange((data: any) => {
    if (!data || data.event_id !== eventId.value) return;
    const state = data.state;
    const pages = getCurrentPages();
    const cur = pages[pages.length - 1];
    const curRoute = cur?.route || '';
    if (state === EventStatus.GAME_SHAKE && !curRoute.includes('shake')) {
      uni.navigateTo({ url: `/pages/user/shake?eventId=${eventId.value}` });
    } else if (state === EventStatus.GAME_MATCH && !curRoute.includes('match')) {
      uni.navigateTo({ url: `/pages/user/match?eventId=${eventId.value}` });
    } else if ((state === EventStatus.LOTTERY_RUNNING || state === EventStatus.LOTTERY_READY) && !curRoute.includes('lottery')) {
      uni.navigateTo({ url: `/pages/user/lottery?eventId=${eventId.value}` });
    } else if (state === EventStatus.ENDED && !curRoute.includes('achievement')) {
      uni.navigateTo({ url: `/pages/user/achievement?eventId=${eventId.value}` });
    }
  });

  unbindQuestion = socketService.onIcebreakerQuestion((data: any) => {
    if (data.event_id !== eventId.value) return;
    currentQuestion.value = data.question;
    selectedKey.value = '';
    answered.value = false;
    chosenTag.value = '';
    answerStats.value = {};

    // 设置倒计时
    if (data.question?.duration_seconds) {
      questionEndsAt.value = Date.now() + data.question.duration_seconds * 1000;
      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        if (Date.now() >= questionEndsAt.value) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
      }, 500);
    }
  });

  unbindStar = socketService.on(WsEvent.STAR_LIT_UP, (data: any) => {
    if (data.user_id === myUserId.value) {
      uni.vibrateShort?.({ type: 'heavy' });
    }
  });

  unbindClosed = socketService.on(WsEvent.ICEBREAKER_CLOSED, (data: any) => {
    if (data.event_id !== eventId.value) return;
    currentQuestion.value = null;
    selectedKey.value = '';
    answered.value = false;
    questionEndsAt.value = 0;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  });

  unbindAnswered = socketService.on(WsEvent.ICEBREAKER_ANSWERED, (data: any) => {
    if (data.event_id !== eventId.value) return;
    if (data.option_key) {
      answerStats.value[data.option_key] =
        (answerStats.value[data.option_key] || 0) + 1;
    }
  });
};

const loadActive = async () => {
  if (!eventId.value) return;
  try {
    const res: any = await icebreakerApi.getCurrent(eventId.value);
    if (res?.question) {
      currentQuestion.value = res.question;
      if (res.question.duration_seconds) {
        questionEndsAt.value = Date.now() + res.question.duration_seconds * 1000;
      }
    }
  } catch {}
};

const onSelect = async (opt: any) => {
  if (answered.value || !currentQuestion.value) return;
  selectedKey.value = opt.key;
  try {
    const payload = {
      event_id: eventId.value,
      question_id: currentQuestion.value.question_id,
      option_key: opt.key,
    };
    // 优先用 JWT 答题，失败则回退 Guest 答题（扫码用户无 JWT）
    try {
      await icebreakerApi.answer(payload);
    } catch (err: any) {
      if (err?.status === 401 || err?.statusCode === 401) {
        await icebreakerApi.answerGuest(payload);
      } else {
        throw err;
      }
    }
    answered.value = true;
    chosenTag.value = opt.label;
    uni.vibrateShort?.({ type: 'medium' });
    uni.showToast({ title: '已点亮 ✨', icon: 'success' });
  } catch (err: any) {
    if (err?.message?.includes('409') || err?.statusCode === 409) {
      answered.value = true;
      chosenTag.value = opt.label;
    } else {
      uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
    }
  }
};
</script>

<style scoped>
.icebreaker-page {
  min-height: 100vh;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.pulse-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #ff6b6b);
  box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.6);
  animation: pulse 1.6s infinite;
  margin-bottom: 40rpx;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.6); }
  70% { box-shadow: 0 0 0 60rpx rgba(102, 126, 234, 0); }
  100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
}

.waiting-title {
  font-size: 38rpx;
  color: white;
  font-weight: 700;
  margin-bottom: 20rpx;
  letter-spacing: 2rpx;
}

.waiting-hint {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.7;
  letter-spacing: 1rpx;
}

.waiting-tips {
  margin-top: 50rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  width: 100%;
  padding: 0 20rpx;
}

.tip-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 24rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  border-radius: 14rpx;
  transition: background 0.2s;
}
.tip-row:active { background: rgba(255, 255, 255, 0.08); }

.tip-icon {
  font-size: 32rpx;
  line-height: 1;
}

.tip-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.question-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28rpx;
  padding: 50rpx 36rpx;
  margin-top: 60rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fadeInUp {
  0% { transform: translateY(40rpx); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.q-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.question-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2rpx;
  text-transform: uppercase;
  font-weight: 600;
}

.q-timer {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 18rpx;
  background: rgba(255, 107, 107, 0.15);
  border: 1rpx solid rgba(255, 107, 107, 0.35);
  border-radius: 999rpx;
}

.timer-icon { font-size: 24rpx; }

.timer-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #ff6b6b;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  min-width: 36rpx;
  text-align: center;
}

.question-prompt {
  font-size: 40rpx;
  color: white;
  font-weight: 700;
  line-height: 1.5;
  display: block;
  margin-bottom: 50rpx;
  letter-spacing: 1rpx;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.option-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 28rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 2rpx solid rgba(255, 255, 255, 0.18);
  border-radius: 18rpx;
  transition: all 0.2s var(--fm-ease-smooth, ease);
}
.option-btn:active:not(.disabled) {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.08);
}

.option-btn.selected {
  background: rgba(255, 255, 255, 0.12);
  border-width: 3rpx;
  box-shadow: 0 0 16rpx rgba(102, 126, 234, 0.3);
}

.option-btn.disabled {
  opacity: 0.6;
}

.option-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.option-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.option-color-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  box-shadow: 0 0 12rpx currentColor;
  flex-shrink: 0;
}

.option-label {
  font-size: 30rpx;
  color: white;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-count {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

.option-check {
  font-size: 36rpx;
  color: #4fc3f7;
  font-weight: 700;
}

.answered-banner {
  margin-top: 40rpx;
  text-align: center;
  padding: 24rpx 28rpx;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.18), rgba(79, 195, 247, 0.12));
  border: 1rpx solid rgba(102, 126, 234, 0.35);
  border-radius: 18rpx;
  animation: fadeInUp 0.4s ease;
}

.answered-text {
  font-size: 32rpx;
  color: #4fc3f7;
  font-weight: 700;
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 2rpx;
}

.answered-display-id {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #ffd700;
  margin: 8rpx 0 4rpx;
  letter-spacing: 2rpx;
  font-variant-numeric: tabular-nums;
}

.answered-hint {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.55);
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 1rpx;
}

.answered-fun {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-top: 12rpx;
  font-style: italic;
  line-height: 1.5;
}
</style>
