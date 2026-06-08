<!--
  Conductor · v3.1 深度重构
  ------------------------------------------------------------
  设计原则：
    1. 单列布局（手机优先），所有信息垂直堆叠，主操作一眼可见
    2. 砍掉 iframe/webview 大屏预览：改用与屏幕共享 useExperienceStream
       数据驱动的"轻量级镜像卡"（CSS 渐变 + 图标 + 呼吸动画）
       ——零 iframe、零第二个 WS、零跨域问题
    3. Hero Card 三合一：当前环节镜像 + 实时数据 + 智能建议
    4. 主操作按钮 100% 宽度、100rpx 高，拇指友好
    5. 时间线固定底部，常驻可点

  对应 v2.0 文档：第八章 · 体验驱动重构 · Conductor View
-->
<template>
  <view class="conductor-page">
    <!-- ========== Header (sticky) ========== -->
    <view class="header">
      <view class="header-left">
        <text class="logo">✨</text>
        <view class="header-info">
          <text class="header-title">{{ stream.meta.title || '聚闪耀' }}</text>
          <view class="header-meta">
            <view class="conn-pill" :class="`conn-${socketStatus}`">
              <view class="conn-dot"></view>
              <text class="conn-text">{{ connLabel }}</text>
            </view>
            <text class="header-id">{{ shortId(eventId) }}</text>
          </view>
        </view>
      </view>
      <view class="header-right">
        <view class="icon-btn" @tap="showEventPicker = true">
          <text class="icon-btn-icon">☰</text>
        </view>
        <view class="icon-btn icon-btn-danger" @tap="onEndEvent">
          <text class="icon-btn-icon">⏹</text>
        </view>
      </view>
    </view>

    <!-- ========== Hero Card (mirror + stats + suggest 三合一) ========== -->
    <view class="hero" :style="{ background: currentGradient }">
      <view class="hero-glow"></view>
      <view class="hero-body">
        <!-- 左侧：轻量级镜像（替代 iframe/webview 预览） -->
        <view class="mirror">
          <view class="mirror-ring mirror-ring-1"></view>
          <view class="mirror-ring mirror-ring-2"></view>
          <view class="mirror-core">
            <text class="mirror-icon">{{ currentIcon }}</text>
          </view>
        </view>

        <!-- 右侧：环节名 + 实时数据 -->
        <view class="hero-info">
          <text class="hero-eyebrow">观众此刻看到</text>
          <text class="hero-title">{{ currentLabel }}</text>
          <view class="hero-stats">
            <view class="hero-stat">
              <text class="hero-stat-num fm-num">{{ stream.meta.checkinCount }}</text>
              <text class="hero-stat-label">到场</text>
            </view>
            <view class="hero-stat-divider"></view>
            <view class="hero-stat">
              <text class="hero-stat-num fm-num">{{ stream.meta.interactionCount }}</text>
              <text class="hero-stat-label">互动</text>
            </view>
            <view class="hero-stat-divider"></view>
            <view class="hero-stat hero-stat-next">
              <text class="hero-stat-num hero-stat-num--text">{{ nextLabel }}</text>
              <text class="hero-stat-label">下一</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 智能建议（合并到主操作之上，提示 + 按钮同区） ========== -->
    <view v-if="topSuggestion" class="suggest" :class="`suggest-${topSuggestion.tone}`">
      <view class="suggest-body">
        <view class="suggest-headline">
          <text class="suggest-tag">💡 {{ topSuggestion.title }}</text>
        </view>
        <text class="suggest-reason">{{ topSuggestion.reason }}</text>
      </view>
    </view>

    <!-- ========== Primary Actions (永远 1-2 个大按钮) ========== -->
    <view class="actions">
      <view
        v-for="btn in primaryActions"
        :key="btn.id"
        class="action-btn"
        :class="`action-${btn.tone} ${btn.primary ? 'action-primary' : ''}`"
        @tap="btn.run()"
      >
        <text class="action-icon">{{ btn.icon }}</text>
        <text class="action-text">{{ btn.text }}</text>
      </view>
    </view>

    <!-- ========== Secondary row: 跳过 / 高级（仅在必要时显示） ========== -->
    <view v-if="secondaryActions.length > 0" class="actions-secondary">
      <view
        v-for="btn in secondaryActions"
        :key="btn.id"
        class="action-btn action-ghost action-sm"
        @tap="btn.run()"
      >
        <text class="action-icon-sm">{{ btn.icon }}</text>
        <text class="action-text-sm">{{ btn.text }}</text>
      </view>
    </view>

    <!-- ========== 展开其他建议（多于 1 条时） ========== -->
    <view v-if="suggestions.length > 1" class="more-suggest-toggle" @tap="showAllSuggest = !showAllSuggest">
      <text class="more-suggest-toggle-text">
        {{ showAllSuggest ? '收起其他建议' : `还有 ${suggestions.length - 1} 条建议 ▾` }}
      </text>
    </view>
    <view v-if="showAllSuggest && suggestions.length > 1" class="more-suggest-list">
      <view
        v-for="s in suggestions.slice(1)"
        :key="s.id"
        class="more-suggest-item"
        @tap="onRunSuggestion(s)"
      >
        <text class="more-suggest-icon">{{ s.icon }}</text>
        <view class="more-suggest-body">
          <text class="more-suggest-title">{{ s.title }}</text>
          <text class="more-suggest-reason">{{ s.reason }}</text>
        </view>
      </view>
    </view>

    <!-- 弹性占位：把时间线压到底部 -->
    <view class="spacer" />

    <!-- ========== Timeline (sticky bottom) ========== -->
    <view class="timeline-bar">
      <view class="timeline-header">
        <text class="timeline-label">流程</text>
        <text class="timeline-progress fm-num">{{ progress }}%</text>
      </view>
      <scroll-view scroll-x class="timeline-scroll" show-scrollbar="false">
        <view class="timeline">
          <view
            v-for="(node, i) in timelineNodes"
            :key="`${node.type}-${i}`"
            class="tl-node"
            :class="tlNodeClass(node)"
            @tap="onTimelineTap(node)"
          >
            <view class="tl-dot">
              <text v-if="node.status === 'done'" class="tl-icon">✓</text>
              <text v-else-if="node.status === 'active'" class="tl-icon">●</text>
              <text v-else class="tl-num fm-num">{{ i + 1 }}</text>
            </view>
            <text class="tl-label">{{ ACTIVITY_META[node.type]?.label || node.type }}</text>
            <view v-if="i < timelineNodes.length - 1" class="tl-line" :class="`tl-line-${node.status}`"></view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 切换聚会抽屉 -->
    <view v-if="showEventPicker" class="picker-mask" @tap="showEventPicker = false">
      <view class="picker-drawer" @tap.stop>
        <text class="picker-title">选择聚会</text>
        <scroll-view scroll-y class="picker-scroll">
          <view
            v-for="evt in myEvents"
            :key="evt.event_id"
            class="picker-item"
            :class="{ active: evt.event_id === eventId }"
            @tap="onSelectEvent(evt)"
          >
            <view class="picker-item-body">
              <text class="picker-item-name">{{ evt.title }}</text>
              <text class="picker-item-id">ID: {{ shortId(evt.event_id) }}</text>
            </view>
            <view class="picker-item-state">
              <text>{{ stateLabel(evt.current_state) }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="picker-footer" @tap="onCreateEvent">+ 创建新聚会</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onMounted, onShow, onUnload } from '@dcloudio/uni-app';
import { eventApi } from '../../services/api';
import { httpErrorToMessage } from '../../services/request';
import { EventStatus } from '../../services/ws-events';
import { ACTIVITY_META } from '../../composables/experience-stream-types';
import { useExperienceStream } from '../../composables/useExperienceStream';

const eventId = ref<string>('');
const myEvents = ref<any[]>([]);
const showEventPicker = ref(false);
const showAllSuggest = ref(false);
const dismissedSuggestIds = ref<Set<string>>(new Set());

const { stream, current, currentLabel, nextLabel, suggestions, progress, socketStatus, changeScene, runSuggestion, reload } =
  useExperienceStream(() => eventId.value, { role: 'host' });

// ====== 视觉辅助 ======
const currentIcon = computed(() => {
  const t = current.value?.type;
  return ACTIVITY_META[t!]?.icon || '✨';
});
const currentGradient = computed(() => {
  const t = current.value?.type;
  return ACTIVITY_META[t!]?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
});
const connLabel = computed(() => {
  if (socketStatus.value === 'open') return '已连接';
  if (socketStatus.value === 'connecting') return '连接中';
  return '已断开';
});

const shortId = (id: string) => (id ? id.slice(0, 4) + '…' + id.slice(-4) : '-');

const stateLabel = (state: string) => {
  const m: Record<string, string> = {
    [EventStatus.STANDBY]: '待机',
    [EventStatus.CHECKIN]: '签到中',
    [EventStatus.ICEBREAKER]: '破冰中',
    [EventStatus.LOTTERY_READY]: '抽奖准备',
    [EventStatus.LOTTERY_RUNNING]: '抽奖中',
    [EventStatus.GAME_SHAKE]: '摇一摇',
    [EventStatus.GAME_MATCH]: 'CP盲盒',
    [EventStatus.ENDED]: '已结束',
  };
  return m[state] || state;
};

// ====== 主操作按钮（极简 1-2 个大按钮） ======
const primaryActions = computed(() => {
  const cur = current.value?.type;
  const list: Array<{ id: string; icon: string; text: string; tone: string; primary: boolean; run: () => void }> = [];

  if (!cur || cur === EventStatus.STANDBY) {
    list.push({
      id: 'start',
      icon: '🚀',
      text: '开始签到',
      tone: 'primary',
      primary: true,
      run: () => changeScene(EventStatus.CHECKIN),
    });
  } else if (cur === EventStatus.CHECKIN) {
    list.push({
      id: 'ice',
      icon: '💬',
      text: '发起破冰',
      tone: 'primary',
      primary: true,
      run: () => onOpenIcebreaker(),
    });
  } else if (cur === EventStatus.ICEBREAKER) {
    list.push({
      id: 'lottery',
      icon: '🎁',
      text: '开始抽奖',
      tone: 'primary',
      primary: true,
      run: () => onOpenLottery(),
    });
  } else if (cur === EventStatus.LOTTERY_READY) {
    list.push({
      id: 'lottery-go',
      icon: '🎰',
      text: '开 抽',
      tone: 'primary',
      primary: true,
      run: () => changeScene(EventStatus.LOTTERY_RUNNING),
    });
  } else if (cur === EventStatus.LOTTERY_RUNNING) {
    list.push({
      id: 'shake',
      icon: '📳',
      text: '切到摇一摇',
      tone: 'primary',
      primary: true,
      run: () => changeScene(EventStatus.GAME_SHAKE),
    });
  } else if (cur === EventStatus.GAME_SHAKE) {
    list.push({
      id: 'match',
      icon: '💘',
      text: 'CP 盲盒',
      tone: 'primary',
      primary: true,
      run: () => onRunMatch(),
    });
  } else if (cur === EventStatus.GAME_MATCH) {
    list.push({
      id: 'end',
      icon: '🏁',
      text: '收 官',
      tone: 'primary',
      primary: true,
      run: () => onEndEvent(),
    });
  } else {
    list.push({
      id: 'restart',
      icon: '🔄',
      text: '重新开始',
      tone: 'primary',
      primary: true,
      run: () => changeScene(EventStatus.CHECKIN),
    });
  }
  return list;
});

// ====== 次要操作（始终只 1 个："跳过 / 上一环节"） ======
const secondaryActions = computed(() => {
  const cur = current.value?.type;
  if (!cur || cur === EventStatus.STANDBY || cur === EventStatus.ENDED) return [];
  return [
    {
      id: 'skip',
      icon: '⏭',
      text: '跳过此环节',
      tone: 'ghost',
      run: () => onSkip(),
    },
  ];
});

function onSkip() {
  const cur = current.value?.type;
  const queue = stream.value.queue;
  if (queue.length === 0) {
    uni.showToast({ title: '已是最后环节', icon: 'none' });
    return;
  }
  const next = queue[0].type;
  uni.showModal({
    title: '跳过此环节？',
    content: `将切到「${ACTIVITY_META[next]?.label || next}」`,
    success: (r) => {
      if (r.confirm) changeScene(next);
    },
  });
}

// ====== AI 建议 ======
const topSuggestion = computed(() => {
  return suggestions.value.find((s) => !dismissedSuggestIds.value.has(s.id)) || null;
});

function onRunSuggestion(s: any) {
  dismissedSuggestIds.value.delete(s.id);
  runSuggestion(s);
}
function dismissSuggestion(id: string) {
  dismissedSuggestIds.value.add(id);
}

// ====== Timeline ======
const timelineNodes = computed(() => {
  const cur = current.value?.type;
  const hist = stream.value.history.map((n) => n.type);
  const queue = stream.value.queue.map((n) => n.type);
  const all = [cur, ...queue].filter(Boolean) as string[];
  const full = Array.from(new Set([...hist, ...all]));
  return full.map((t) => {
    let status: 'done' | 'active' | 'pending' = 'pending';
    if (hist.includes(t)) status = 'done';
    else if (t === cur) status = 'active';
    return { type: t, status };
  });
});
function tlNodeClass(node: { type: string; status: string }) {
  return {
    [`tl-${node.status}`]: true,
    clickable: node.status === 'pending' && current.value?.type !== EventStatus.ENDED,
  };
}
function onTimelineTap(node: { type: string; status: string }) {
  if (node.status === 'pending') {
    uni.showModal({
      title: '切换到该环节？',
      content: `将大屏与所有客户端切到「${ACTIVITY_META[node.type]?.label || node.type}」`,
      success: (r) => {
        if (r.confirm) changeScene(node.type);
      },
    });
  }
}

// ====== 业务动作 ======
function onOpenIcebreaker() {
  if (!eventId.value) return;
  changeScene(EventStatus.ICEBREAKER);
  uni.showToast({ title: '已切到破冰 · 参与者端已亮', icon: 'none' });
}
function onOpenLottery() {
  if (!eventId.value) return;
  changeScene(EventStatus.LOTTERY_READY);
  uni.showToast({ title: '已切到抽奖 · 奖品已上墙', icon: 'none' });
}
async function onRunMatch() {
  if (!eventId.value) return;
  await changeScene(EventStatus.GAME_MATCH);
  try {
    const { matchApi } = await import('../../services/api');
    await matchApi.generate(eventId.value);
    uni.showToast({ title: 'CP 盲盒已生成', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  }
}
function onEndEvent() {
  if (!eventId.value) return;
  uni.showModal({
    title: '结束聚会？',
    content: '所有参与者将收到成就卡，活动归档',
    success: (r) => {
      if (r.confirm) changeScene(EventStatus.ENDED);
    },
  });
}
function onCreateEvent() {
  showEventPicker.value = false;
  uni.navigateTo({ url: '/pages/host/create-event' });
}

async function onSelectEvent(evt: any) {
  if (evt.event_id === eventId.value) {
    showEventPicker.value = false;
    return;
  }
  eventId.value = evt.event_id;
  showEventPicker.value = false;
  await reload();
  try {
    uni.setStorageSync('flashmeet_current_event', evt.event_id);
  } catch {}
}

// ====== 生命周期 ======
onMounted(async () => {
  try {
    const res: any = await eventApi.getMyEvents();
    myEvents.value = res || [];
  } catch {}
  let restored: string | null = null;
  try {
    restored = uni.getStorageSync('flashmeet_current_event') || null;
  } catch {}
  if (!restored && myEvents.value.length > 0) {
    restored = myEvents.value[0].event_id;
  }
  if (restored) {
    eventId.value = restored;
  }
});

onShow(async () => {
  try {
    const res: any = await eventApi.getMyEvents();
    myEvents.value = res || [];
  } catch {}
});

onUnload(() => {
  // useExperienceStream 内部已处理
});
</script>

<style scoped>
.conductor-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
  color: var(--fm-text-primary);
  display: flex;
  flex-direction: column;
  padding: calc(20rpx + env(safe-area-inset-top)) 24rpx calc(20rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ========== Header (sticky, 56rpx) ========== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0 16rpx;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex: 1;
  min-width: 0;
}
.logo {
  font-size: 40rpx;
  line-height: 1;
}
.header-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
  min-width: 0;
}
.header-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--fm-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-meta {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.conn-pill {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 3rpx 10rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}
.conn-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #aaa;
  box-shadow: 0 0 6rpx rgba(170, 170, 170, 0.6);
}
.conn-open .conn-dot { background: #66bb6a; box-shadow: 0 0 6rpx rgba(102, 187, 106, 0.8); }
.conn-connecting .conn-dot { background: #ffd700; box-shadow: 0 0 6rpx rgba(255, 215, 0, 0.6); animation: pulse 1.2s infinite; }
.conn-closed .conn-dot { background: #ff6b6b; box-shadow: 0 0 6rpx rgba(255, 107, 107, 0.6); }
.conn-text { font-size: 18rpx; color: var(--fm-text-secondary); }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
.header-id { font-size: 18rpx; color: var(--fm-text-tertiary); font-family: monospace; }

.header-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.icon-btn {
  width: 64rpx;
  height: 64rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  transition: transform 0.15s, background 0.15s;
}
.icon-btn:active { transform: scale(0.92); background: rgba(255, 255, 255, 0.15); }
.icon-btn-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border: none;
  color: #fff;
}
.icon-btn-icon { font-size: 30rpx; line-height: 1; color: #fff; }

/* ========== Hero Card (mirror + stats) ========== */
.hero {
  position: relative;
  border-radius: 28rpx;
  padding: 24rpx;
  margin-top: 4rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.5);
  transition: background 0.6s ease;
}
.hero-glow {
  position: absolute;
  top: -60%;
  right: -20%;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  pointer-events: none;
  animation: glow-breath 4s ease-in-out infinite;
}
@keyframes glow-breath {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}
.hero-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

/* ---- Mirror (CSS-only, 替代 iframe) ---- */
.mirror {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mirror-ring {
  position: absolute;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  animation: ring-pulse 3s ease-in-out infinite;
}
.mirror-ring-1 {
  width: 100%;
  height: 100%;
  animation-delay: 0s;
}
.mirror-ring-2 {
  width: 75%;
  height: 75%;
  animation-delay: 1.5s;
  border-color: rgba(255, 255, 255, 0.5);
}
@keyframes ring-pulse {
  0%, 100% { transform: scale(0.9); opacity: 0.4; }
  50% { transform: scale(1.05); opacity: 0.9; }
}
.mirror-core {
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 60%, rgba(255, 255, 255, 0.3) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 32rpx rgba(255, 255, 255, 0.6);
  animation: core-pulse 2.5s ease-in-out infinite;
}
@keyframes core-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 32rpx rgba(255, 255, 255, 0.6); }
  50% { transform: scale(1.06); box-shadow: 0 0 48rpx rgba(255, 255, 255, 0.9); }
}
.mirror-icon {
  font-size: 56rpx;
  line-height: 1;
  filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.3));
}

/* ---- Hero Info ---- */
.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.hero-eyebrow {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.65);
  letter-spacing: 2rpx;
  text-transform: uppercase;
}
.hero-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}
.hero-stats {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 4rpx;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 14rpx;
  padding: 10rpx 14rpx;
}
.hero-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
  min-width: 0;
}
.hero-stat-num {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hero-stat-num--text { font-size: 22rpx; }
.hero-stat-label {
  font-size: 16rpx;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5rpx;
}
.hero-stat-divider {
  width: 1rpx;
  height: 30rpx;
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

/* ========== Suggestion ========== */
.suggest {
  margin-top: 16rpx;
  border-radius: 18rpx;
  padding: 14rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.suggest-primary { background: linear-gradient(135deg, rgba(102, 126, 234, 0.18), rgba(118, 75, 162, 0.18)); border-color: rgba(102, 126, 234, 0.4); }
.suggest-warning { background: linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(255, 107, 107, 0.18)); border-color: rgba(255, 215, 0, 0.4); }
.suggest-success { background: linear-gradient(135deg, rgba(102, 187, 106, 0.18), rgba(79, 195, 247, 0.18)); border-color: rgba(102, 187, 106, 0.4); }
.suggest-info { background: linear-gradient(135deg, rgba(78, 205, 196, 0.18), rgba(69, 183, 209, 0.18)); border-color: rgba(78, 205, 196, 0.4); }

.suggest-headline { display: flex; align-items: center; }
.suggest-tag { font-size: 26rpx; font-weight: 700; color: #fff; letter-spacing: 0.5rpx; }
.suggest-reason { font-size: 22rpx; color: rgba(255, 255, 255, 0.75); line-height: 1.5; }

/* ========== Primary Actions (大按钮，永远 1-2 个) ========== */
.actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}
.action-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 0 24rpx;
  height: 100rpx;
  border-radius: 24rpx;
  color: #fff;
  font-weight: 700;
  font-size: 30rpx;
  letter-spacing: 1rpx;
  box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.4);
  transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s;
  position: relative;
  overflow: hidden;
}
.action-btn::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 50%);
  pointer-events: none;
}
.action-btn:active { transform: scale(0.97); opacity: 0.92; }
.action-icon { font-size: 40rpx; line-height: 1; }
.action-text { font-size: 30rpx; font-weight: 700; }
.action-primary { background: var(--fm-gradient-primary); }
.action-warm { background: var(--fm-gradient-warm); color: #0a0a2e; box-shadow: 0 6rpx 20rpx rgba(255, 107, 107, 0.4); }
.action-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: var(--fm-text-primary);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

/* ========== Secondary actions (跳过) ========== */
.actions-secondary {
  display: flex;
  gap: 10rpx;
  margin-top: 10rpx;
}
.action-btn.action-sm {
  height: 64rpx;
  padding: 0 16rpx;
  font-size: 22rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
  color: var(--fm-text-secondary);
  font-weight: 500;
}
.action-icon-sm { font-size: 24rpx; }
.action-text-sm { font-size: 22rpx; }

/* ========== More suggestions ========== */
.more-suggest-toggle {
  margin-top: 12rpx;
  text-align: center;
  padding: 10rpx;
  font-size: 22rpx;
  color: var(--fm-text-secondary);
}
.more-suggest-toggle-text {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
}
.more-suggest-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 4rpx;
}
.more-suggest-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
}
.more-suggest-item:active { background: rgba(255, 255, 255, 0.08); }
.more-suggest-icon { font-size: 30rpx; }
.more-suggest-body { display: flex; flex-direction: column; gap: 2rpx; flex: 1; min-width: 0; }
.more-suggest-title { font-size: 24rpx; color: #fff; font-weight: 600; }
.more-suggest-reason { font-size: 20rpx; color: var(--fm-text-tertiary); }

/* ========== Spacer: 把时间线压到底 ========== */
.spacer { flex: 1; min-height: 16rpx; }

/* ========== Timeline Bar (sticky bottom, 100rpx) ========== */
.timeline-bar {
  background: rgba(0, 0, 0, 0.45);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 22rpx;
  padding: 10rpx 16rpx;
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}
.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4rpx;
  font-size: 20rpx;
  color: var(--fm-text-secondary);
}
.timeline-progress { font-weight: 700; color: var(--fm-color-gold); }
.timeline-scroll { white-space: nowrap; }
.timeline {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 4rpx 0;
}
.tl-node {
  display: inline-flex;
  align-items: center;
  position: relative;
  flex-shrink: 0;
}
.tl-node.clickable { cursor: pointer; }
.tl-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  font-size: 20rpx;
  color: var(--fm-text-tertiary);
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.2s;
}
.tl-done .tl-dot {
  background: linear-gradient(135deg, #4fc3f7 0%, #66bb6a 100%);
  border-color: rgba(102, 187, 106, 0.5);
  color: #fff;
  box-shadow: 0 0 8rpx rgba(102, 187, 106, 0.4);
}
.tl-active .tl-dot {
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  border-color: rgba(255, 215, 0, 0.6);
  color: #0a0a2e;
  box-shadow: 0 0 12rpx rgba(255, 215, 0, 0.6);
  animation: pulse-active 1.5s infinite;
}
@keyframes pulse-active { 0%,100%{transform:scale(1);} 50%{transform:scale(1.1);} }
.tl-label {
  margin-left: 6rpx;
  font-size: 20rpx;
  color: var(--fm-text-tertiary);
  padding-right: 8rpx;
}
.tl-done .tl-label { color: var(--fm-text-secondary); }
.tl-active .tl-label { color: #ffd700; font-weight: 700; }
.tl-line {
  width: 28rpx;
  height: 2rpx;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4rpx;
}
.tl-line-done { background: linear-gradient(90deg, #66bb6a 0%, rgba(102, 187, 106, 0.3) 100%); }
.tl-line-active { background: linear-gradient(90deg, #ffd700 0%, rgba(255, 215, 0, 0.3) 100%); }

/* ========== Event Picker Drawer ========== */
.picker-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}
.picker-drawer {
  width: 100%;
  max-height: 70vh;
  background: linear-gradient(180deg, #1a1a4e 0%, #0a0a2e 100%);
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}
.picker-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16rpx;
}
.picker-scroll { max-height: 60vh; }
.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 12rpx;
}
.picker-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
  border: 1rpx solid rgba(102, 126, 234, 0.4);
}
.picker-item-body { display: flex; flex-direction: column; gap: 4rpx; flex: 1; min-width: 0; }
.picker-item-name { font-size: 28rpx; font-weight: 600; color: #fff; }
.picker-item-id { font-size: 20rpx; color: var(--fm-text-tertiary); }
.picker-item-state {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  font-size: 20rpx;
  color: var(--fm-text-secondary);
}
.picker-footer {
  margin-top: 16rpx;
  text-align: center;
  padding: 20rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx dashed rgba(255, 255, 255, 0.15);
  color: var(--fm-color-gold);
  font-size: 26rpx;
  font-weight: 600;
}
</style>
