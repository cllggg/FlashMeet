<!--
  Live 容器 · v2.0 体验流（用户端）
  ------------------------------------------------------------
  设计目标：
    - 一次进入，零跳转：所有活动（签到、破冰、抽奖、摇一摇、匹配）作为 Overlay 叠加在主屏
    - 用户视觉焦点始终在主舞台，Overlay 只是"浮层"不会顶替主舞台
    - 通过 useExperienceStream 拉取并订阅 stream 状态，本地驱动 Overlay 切换
    - 不删除旧页面（checkin.vue、shake.vue 等），仅作为兼容入口，逐步引流到 /pages/live/index

  页面层级（自上而下）：
    1. 顶部状态栏：当前环节 + 倒计时 + 关闭按钮
    2. 主舞台（persistent）：暗星图谱 / 大屏同步
    3. 浮层（Overlay）：根据 stream.current.type 切换显示哪个 Overlay
    4. 底部操作：参与者能做的事（举手、抢答、抽奖入口等）

  对应 v2.0 文档：第八章 · 体验驱动重构 · Stage Model
-->
<template>
  <view class="live-page">
    <!-- 顶部状态条：当前环节 + 倒计时 + 网络 -->
    <view class="topbar">
      <view class="topbar-left">
        <text class="event-name">{{ stream.meta.title || '聚会' }}</text>
        <text class="event-state">{{ currentLabel || '加载中…' }}</text>
      </view>
      <view class="topbar-right">
        <view class="socket-dot" :class="`socket-${socketStatus}`" />
        <text class="socket-text">{{ socketStatusText }}</text>
      </view>
    </view>

    <!-- 主舞台：始终可见，承担"现场感"和沉浸感 -->
    <view class="stage" :style="{ background: currentGradient }">
      <!-- 阶段标题 -->
      <view class="stage-center">
        <text class="stage-icon">{{ currentIcon }}</text>
        <text class="stage-title">{{ currentLabel }}</text>
        <text class="stage-sub">{{ currentSubtitle }}</text>
      </view>

      <!-- 参与者计数（始终显示，不被 Overlay 覆盖） -->
      <view class="stage-stats">
        <view class="stat">
          <text class="stat-num">{{ stream.meta.checkinCount || 0 }}</text>
          <text class="stat-label">到场</text>
        </view>
        <view class="stat-divider" />
        <view class="stat">
          <text class="stat-num">{{ stream.meta.interactionCount || 0 }}</text>
          <text class="stat-label">互动</text>
        </view>
      </view>
    </view>

    <!--
      浮层区（Overlays）
      - 不在主舞台上"贴满"，而是从底部升起，避免遮挡主舞台
      - 每个 Overlay 独立、互斥；多个时通过 z-index 与缩进表达层级
    -->
    <view class="overlay-area">
      <!-- 签到浮层（不活跃时仅显示加入提示；活跃时显示"已完成签到"+ 提交信息） -->
      <CheckinOverlay
        v-if="showCheckinOverlay"
        :event-id="eventId"
        :checked-in="userCheckedIn"
        :checkin-count="stream.meta.checkinCount || 0"
        @checkin="onUserCheckin"
        @resubmit="onResubmit"
      />

      <!-- 破冰浮层 -->
      <IcebreakerOverlay
        v-else-if="showIcebreaker"
        :event-id="eventId"
        :current-question="icebreakerQuestion"
        :answered="icebreakerAnswered"
        @submit="onIcebreakerSubmit"
      />

      <!-- 摇一摇浮层 -->
      <ShakeOverlay
        v-else-if="showShake"
        :event-id="eventId"
        :active="current?.type === 'STATUS_GAME_SHAKE'"
        :leaderboard="shakeLeaderboard"
        @shake="onShake"
      />

      <!-- 抽奖浮层 -->
      <LotteryOverlay
        v-else-if="showLottery"
        :event-id="eventId"
        :phase="current?.type"
        :won="lotteryWon"
        @join="onJoinLottery"
      />

      <!-- 匹配浮层 -->
      <MatchOverlay
        v-else-if="showMatch"
        :event-id="eventId"
        :result="matchResult"
        @accept="onMatchAccept"
        @reject="onMatchReject"
      />

      <!-- 待机和结束态：浮层显示加入引导 -->
      <IdleHint
        v-else-if="!auxiliaryOverlay"
        :state="current?.type"
        :event-id="eventId"
        @share="onShare"
        @open-chat="openOverlay('chat')"
        @open-achievement="openOverlay('achievement')"
      />

      <!-- 辅助浮层：聊天 / 画像 / 成就（v3.0 极简，浮在主舞台之上） -->
      <ChatOverlay
        v-if="auxiliaryOverlay === 'chat'"
        :event-id="eventId"
        @close="closeOverlay"
      />
      <ProfileOverlay
        v-if="auxiliaryOverlay === 'profile'"
        @close="closeOverlay"
      />
      <AchievementOverlay
        v-if="auxiliaryOverlay === 'achievement'"
        @close="closeOverlay"
      />
    </view>

    <!-- 底部操作：始终可见的"我"相关操作（v3.0 极简：3 按钮全在容器内） -->
    <view class="bottom-bar">
      <view class="bottom-btn" @tap="openOverlay('profile')">
        <text class="bottom-icon">🌟</text>
        <text class="bottom-text">我</text>
      </view>
      <view class="bottom-btn" @tap="openOverlay('chat')">
        <text class="bottom-icon">💬</text>
        <text class="bottom-text">聊天</text>
      </view>
      <view class="bottom-btn" @tap="onShare">
        <text class="bottom-icon">📤</text>
        <text class="bottom-text">邀请</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useExperienceStream } from '../../composables/useExperienceStream';
import { ACTIVITY_META } from '../../composables/experience-stream-types';
import { EventStatus } from '../../services/ws-events';
import { matchApi } from '../../services/api';
import CheckinOverlay from './overlays/CheckinOverlay.vue';
import IcebreakerOverlay from './overlays/IcebreakerOverlay.vue';
import ShakeOverlay from './overlays/ShakeOverlay.vue';
import LotteryOverlay from './overlays/LotteryOverlay.vue';
import MatchOverlay from './overlays/MatchOverlay.vue';
import IdleHint from './overlays/IdleHint.vue';
import ChatOverlay from './overlays/ChatOverlay.vue';
import ProfileOverlay from './overlays/ProfileOverlay.vue';
import AchievementOverlay from './overlays/AchievementOverlay.vue';

// 接收路由参数：eventId
const eventIdRef = ref<string | null>(null);

onLoad((q: any) => {
  eventIdRef.value = q?.eventId || uni.getStorageSync('flashmeet_recent_event_id');
  if (q?.eventId) uni.setStorageSync('flashmeet_recent_event_id', q.eventId);
});

// 给模板里 :event-id 用的稳定字符串（空时给个占位让 Overlay 渲染骨架）
const eventId = computed(() => eventIdRef.value || '');

// 体验流（参与者角色，只读）
const {
  stream,
  current,
  next,
  socketStatus,
  reload,
} = useExperienceStream(() => eventIdRef.value, { role: 'participant' });

// ===== 视图层派生 =====
const currentMeta = computed(() => {
  const t = current.value?.type;
  if (!t) return ACTIVITY_META[EventStatus.STANDBY];
  return ACTIVITY_META[t] || ACTIVITY_META[EventStatus.STANDBY];
});

const currentLabel = computed(() => currentMeta.value.label);
const currentIcon = computed(() => currentMeta.value.icon);
const currentGradient = computed(() => currentMeta.value.gradient);
const currentSubtitle = computed(() => {
  switch (current.value?.type) {
    case EventStatus.STANDBY:
      return '等待主持人开始……';
    case EventStatus.CHECKIN:
      return '扫码 / 提交信息即可加入';
    case EventStatus.ICEBREAKER:
      return '回答破冰问题，让陌生人认识你';
    case EventStatus.GAME_SHAKE:
      return '一起摇动手机，看谁最嗨';
    case EventStatus.LOTTERY_READY:
    case EventStatus.LOTTERY_RUNNING:
      return '大奖就在前方';
    case EventStatus.GAME_MATCH:
      return '遇见同频的人';
    case EventStatus.ENDED:
      return '本次聚会已圆满结束';
    default:
      return '';
  }
});

const socketStatusText = computed(() => {
  switch (socketStatus.value) {
    case 'open':
      return '已连接';
    case 'connecting':
      return '连接中';
    case 'closed':
      return '已断开';
    default:
      return '离线';
  }
});

// ===== Overlay 显隐控制 =====
const showCheckinOverlay = computed(
  () =>
    current.value?.type === EventStatus.CHECKIN ||
    current.value?.type === EventStatus.STANDBY,
);
const showIcebreaker = computed(
  () => current.value?.type === EventStatus.ICEBREAKER,
);
const showShake = computed(
  () => current.value?.type === EventStatus.GAME_SHAKE,
);
const showLottery = computed(
  () =>
    current.value?.type === EventStatus.LOTTERY_READY ||
    current.value?.type === EventStatus.LOTTERY_RUNNING,
);
const showMatch = computed(
  () => current.value?.type === EventStatus.GAME_MATCH,
);

// ===== 参与者本地状态（写给 Overlays 用） =====
const userCheckedIn = ref(false);
const icebreakerQuestion = ref<{ id: string; text: string } | null>(null);
const icebreakerAnswered = ref(false);
const shakeLeaderboard = ref<Array<{ name: string; count: number }>>([]);
const lotteryWon = ref<{ prize: string; code: string } | null>(null);
const matchResult = ref<{ peerName: string; peerTags: string[] } | null>(null);

// 事件总线（透传到具体 Overlay 由各 Overlay 自行处理）
// 这里只是占位：v2.0 阶段不同 Overlay 通过 props 拿到所需数据，
// WebSocket 实时事件在 useExperienceStream 内已分发

// ===== 简单 action handlers（占位：转发到具体 Overlay 由其内部处理） =====
const onUserCheckin = async (payload: { name: string; phone?: string }) => {
  // 由 CheckinOverlay 自行处理实际 API；这里只记录状态
  userCheckedIn.value = true;
  uni.setStorageSync('flashmeet_recent_event_id', eventIdRef.value);
};

const onResubmit = () => {
  userCheckedIn.value = false;
};

const onIcebreakerSubmit = (answer: string) => {
  icebreakerAnswered.value = true;
  // 简化：v2.0 阶段实际 WS 推送由后端
};

const onShake = () => {
  // 由 ShakeOverlay 内部处理
};

const onJoinLottery = () => {
  // 由 LotteryOverlay 内部处理
};

const onMatchAccept = async () => {
  if (!matchResult.value) return;
  try {
    // matchApi.accept 需要 (eventId, user_id) - 这里传对方 id 占位
    await matchApi.accept(eventIdRef.value!, (matchResult.value as any).peerId || '');
  } catch {}
};

const onMatchReject = async () => {
  if (!matchResult.value) return;
  try {
    await matchApi.reject(eventIdRef.value!, (matchResult.value as any).peerId || '');
  } catch {}
};

const onShare = () => {
  // 调用 uni 分享
  uni.showShareMenu({ withShareTicket: true });
};

// ===== 辅助浮层：聊天 / 画像 / 成就（v3.0 极简：不再 navigateTo） =====
type AuxiliaryOverlay = 'chat' | 'profile' | 'achievement' | null;
const auxiliaryOverlay = ref<AuxiliaryOverlay>(null);

const openOverlay = (name: AuxiliaryOverlay) => {
  auxiliaryOverlay.value = name;
};
const closeOverlay = () => {
  auxiliaryOverlay.value = null;
};
</script>

<style scoped>
.live-page {
  min-height: 100vh;
  background: #050714;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 顶部 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(20rpx + env(safe-area-inset-top)) 32rpx 20rpx;
  background: linear-gradient(180deg, rgba(10, 10, 46, 0.95), rgba(10, 10, 46, 0.6));
  backdrop-filter: blur(20rpx);
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
  min-width: 0;
}
.event-name {
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.event-state {
  font-size: 22rpx;
  color: rgba(255, 215, 0, 0.85);
  letter-spacing: 1rpx;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}
.socket-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8rpx rgba(74, 222, 128, 0.6);
}
.socket-connecting {
  background: #fbbf24;
  box-shadow: 0 0 8rpx rgba(251, 191, 36, 0.6);
  animation: pulse 1.4s ease-in-out infinite;
}
.socket-closed {
  background: #ef4444;
  box-shadow: 0 0 8rpx rgba(239, 68, 68, 0.5);
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.socket-text {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.55);
}

/* 主舞台 */
.stage {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 480rpx;
  transition: background 0.6s ease;
}
.stage-center {
  text-align: center;
  z-index: 1;
  padding: 60rpx 40rpx;
}
.stage-icon {
  display: block;
  font-size: 140rpx;
  line-height: 1;
  margin-bottom: 24rpx;
  filter: drop-shadow(0 0 24rpx rgba(255, 215, 0, 0.5));
  animation: stage-float 4s ease-in-out infinite;
}
.stage-title {
  display: block;
  font-size: 56rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  margin-bottom: 16rpx;
}
.stage-sub {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1rpx;
}
.stage-stats {
  position: absolute;
  top: 32rpx;
  right: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 24rpx;
  background: rgba(0, 0, 0, 0.35);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 999rpx;
  backdrop-filter: blur(20rpx);
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-num {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffd700;
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.55);
}
.stat-divider {
  width: 1rpx;
  height: 32rpx;
  background: rgba(255, 255, 255, 0.15);
}
@keyframes stage-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12rpx); }
}

/* Overlay 区 */
.overlay-area {
  position: relative;
  background: linear-gradient(180deg, transparent 0%, #050714 30%);
  padding: 0 24rpx 24rpx;
  margin-top: -40rpx;
  z-index: 2;
}

/* 底部操作 */
.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(10, 10, 46, 0.95);
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);
  position: sticky;
  bottom: 0;
  z-index: 5;
}
.bottom-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 0;
  transition: opacity 0.2s;
}
.bottom-btn:active { opacity: 0.6; }
.bottom-icon {
  font-size: 36rpx;
}
.bottom-text {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
