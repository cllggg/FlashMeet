<template>
  <view class="dashboard-page">
    <text class="title">场控台</text>
    <view class="lang-switch" @tap="toggleLang">
      <text class="lang-switch-text">{{ locale === 'zh-CN' ? '中文' : 'EN' }}</text>
    </view>

    <view v-if="hostChangedHint" class="host-hint">{{ hostChangedHint }}</view>

    <view class="conn-status" :class="socketStatus">
      <view class="conn-dot"></view>
      <text class="conn-text">
        {{ socketStatus === 'open' ? '已连接' : socketStatus === 'connecting' ? '连接中' : '已断开 (重试中)' }}
      </text>
    </view>

    <!-- 顶部 Tabs -->
    <view class="segmented">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="seg-item"
        :class="{ active: activeTab === tab.key }"
        @tap="activeTab = tab.key"
      >
        <text>{{ tab.label }}</text>
        <text v-if="tab.badge" class="seg-badge">{{ tab.badge }}</text>
      </view>
    </view>

    <!-- ===== 现场 Tab ===== -->
    <view v-if="activeTab === 'live'">
      <view class="event-info" v-if="currentEvent">
        <text class="event-name">{{ currentEvent.title }}</text>
        <text class="event-state">当前状态：{{ stateLabel(currentEvent.current_state) }}</text>
        <view class="event-id-row">
          <text class="event-id-label">ID: {{ currentEvent.event_id }}</text>
          <text class="event-id-hint">(在大屏端输入)</text>
        </view>

        <view v-if="presenceList.length > 0" class="presence-row">
          <text class="presence-title">在线场控 ({{ presenceList.length }})</text>
          <view class="presence-pills">
            <view
              v-for="p in presenceList"
              :key="p.user_id"
              class="presence-pill"
              :class="{ primary: p.user_id === currentEvent.host_id, me: p.user_id === hostUserId }"
            >
              <view class="pulse-dot-small"></view>
              <text>{{ shortenId(p.user_id) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 下一步推荐卡 -->
      <view v-if="recommendation" class="rec-card" :class="`rec-${recommendation.tone}`">
        <view class="rec-icon">{{ recommendation.icon }}</view>
        <view class="rec-body">
          <text class="rec-title">{{ recommendation.title }}</text>
          <text class="rec-desc">{{ recommendation.desc }}</text>
        </view>
        <button
          v-if="recommendation.action"
          class="rec-action"
          @tap="runRecommendation(recommendation)"
        >
          {{ recommendation.action }}
        </button>
      </view>

      <view class="scene-buttons">
        <text class="section-title">场景切换</text>
        <view class="btn-grid">
          <button
            v-for="scene in availableScenes"
            :key="scene.state"
            class="scene-btn"
            :class="{ active: currentState === scene.state, disabled: scene.disabled }"
            :disabled="scene.disabled"
            @tap="changeScene(scene.state)"
          >
            {{ scene.label }}
          </button>
        </view>
      </view>

      <view class="icebreaker-panel" v-if="currentEvent && currentState === EventStatus.ICEBREAKER">
        <text class="section-title">破冰互动</text>
        <button class="ice-btn" @tap="goToIcebreaker">配置并发布破冰问题</button>
        <button class="ice-btn" style="background: rgba(255,255,255,0.1);" @tap="closeIcebreaker">关闭当前问题</button>
      </view>
      <button
        v-else-if="currentEvent"
        class="ice-btn-floating"
        @tap="goToIcebreaker"
      >
        配置破冰问题
      </button>
    </view>

    <!-- ===== 活动 Tab ===== -->
    <view v-else-if="activeTab === 'events'">
      <view class="events-list" v-if="myEvents.length > 0">
        <text class="section-title">我的聚会 ({{ myEvents.length }})</text>
        <view
          v-for="evt in myEvents"
          :key="evt.event_id"
          class="event-item"
          :class="{ active: currentEvent?.event_id === evt.event_id }"
          @tap="selectEvent(evt)"
        >
          <view class="event-item-main">
            <text class="event-item-name">{{ evt.title }}</text>
            <text class="event-item-meta">
              ID: {{ evt.event_id.slice(0, 8) }}…
            </text>
          </view>
          <view class="event-item-state-tag" :class="`state-${evt.current_state}`">
            <text>{{ stateLabel(evt.current_state) }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-card">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">还没有聚会</text>
      </view>
      <button class="create-btn" @tap="goToCreate">创建新聚会</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { eventApi, matchApi } from '../../services/api';
import { httpErrorToMessage } from '../../services/request';
import { EventStatus, WsEvent } from '../../services/ws-events';
import { useI18n } from '../../utils/i18n';

const { locale, setLocale } = useI18n();
const toggleLang = () => {
  setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN');
  uni.showToast({
    title: locale.value === 'zh-CN' ? 'Switched to English' : '已切换到中文',
    icon: 'none',
  });
};
import { ReconnectingSocket } from '../../utils/reconnecting-socket';

const myEvents = ref<any[]>([]);
const currentEvent = ref<any>(null);
const currentState = ref(EventStatus.STANDBY);
const hostUserId = ref<string>('');
const hostChangedHint = ref<string>('');
const presenceList = ref<Array<{ user_id: string; ts: number }>>([]);
const socketStatus = ref<'connecting' | 'open' | 'closed'>('connecting');
let socket: ReconnectingSocket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let presenceTimer: ReturnType<typeof setInterval> | null = null;
let statePollTimer: ReturnType<typeof setInterval> | null = null;

// ===== Tabs =====
type TabKey = 'live' | 'events';
const activeTab = ref<TabKey>('live');
const tabs = computed(() => [
  { key: 'live' as TabKey, label: '现场', badge: '' },
  {
    key: 'events' as TabKey,
    label: '活动',
    badge: myEvents.value.length > 0 ? String(myEvents.value.length) : '',
  },
]);

// ===== 下一步推荐 =====
interface Recommendation {
  icon: string;
  title: string;
  desc: string;
  action?: string;
  tone: 'primary' | 'warning' | 'success' | 'info';
  run?: () => void | Promise<void>;
}

const recommendation = computed<Recommendation | null>(() => {
  if (!currentEvent.value) return null;
  const state = currentEvent.value.current_state || currentState.value;
  const evt = currentEvent.value;

  switch (state) {
    case EventStatus.STANDBY:
      return {
        icon: '🚀',
        title: '下一步：开始签到',
        desc: '在签到环节让参与者扫码入场，领取大屏定位身份',
        action: '切到签到',
        tone: 'primary',
        run: () => changeScene(EventStatus.CHECKIN),
      };
    case EventStatus.CHECKIN:
      return {
        icon: '💬',
        title: '下一步：发布破冰问题',
        desc: '通过一两个轻松问题让参与者互相认识、活跃气氛',
        action: '配置问题',
        tone: 'info',
        run: () => goToIcebreaker(),
      };
    case EventStatus.ICEBREAKER:
      return {
        icon: '🎁',
        title: '下一步：准备抽奖',
        desc: '气氛已经热起来，趁热打铁开始抽奖环节',
        action: '切到抽奖',
        tone: 'warning',
        run: () => changeScene(EventStatus.LOTTERY_READY),
      };
    case EventStatus.LOTTERY_READY:
      return {
        icon: '🎰',
        title: '下一步：进入抽奖',
        desc: '确保奖池配置完成，进入抽奖环节开始派奖',
        action: '开始抽奖',
        tone: 'warning',
        run: () => {
          uni.setStorageSync('flashmeet_current_event', evt.event_id);
          uni.navigateTo({
            url: `/pages/host/lottery-manage?eventId=${evt.event_id}`,
          });
        },
      };
    case EventStatus.LOTTERY_RUNNING:
      return {
        icon: '🎉',
        title: '下一步：激活气氛',
        desc: '抽奖之余，试试摇一摇带动全场参与',
        action: '切到摇一摇',
        tone: 'info',
        run: () => changeScene(EventStatus.GAME_SHAKE),
      };
    case EventStatus.GAME_SHAKE:
      return {
        icon: '🏁',
        title: '下一步：CP盲盒匹配',
        desc: '摇一摇热身后，开启CP盲盒让参与者找到灵魂搭档',
        action: '切到CP盲盒',
        tone: 'info',
        run: () => changeScene(EventStatus.GAME_MATCH),
      };
    case EventStatus.GAME_MATCH:
      return {
        icon: '💫',
        title: '下一步：收官',
        desc: 'CP盲盒匹配后，可以结束聚会或继续其他环节',
        action: '结束聚会',
        tone: 'success',
        run: () => changeScene(EventStatus.ENDED),
      };
    case EventStatus.ENDED:
      return {
        icon: '✅',
        title: '活动已结束',
        desc: '可在「活动」Tab 中查看历史聚会记录',
        action: '查看活动',
        tone: 'success',
        run: () => {
          activeTab.value = 'events';
        },
      };
    default:
      return null;
  }
});

const runRecommendation = (r: Recommendation) => {
  r.run?.();
};

const shortenId = (id: string) => {
  if (!id) return '?';
  return id.slice(0, 4) + '…' + id.slice(-4);
};

const scenes = [
  { state: EventStatus.STANDBY, label: '待机' },
  { state: EventStatus.CHECKIN, label: '签到' },
  { state: EventStatus.ICEBREAKER, label: '破冰' },
  { state: EventStatus.LOTTERY_READY, label: '抽奖准备' },
  { state: EventStatus.LOTTERY_RUNNING, label: '抽奖中' },
  { state: EventStatus.GAME_SHAKE, label: '摇一摇' },
  { state: EventStatus.GAME_MATCH, label: 'CP盲盒' },
  { state: EventStatus.ENDED, label: '结束' },
];

// 与后端 state-transitions.ts 保持同步
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [EventStatus.STANDBY]: [EventStatus.CHECKIN, EventStatus.ICEBREAKER, EventStatus.LOTTERY_READY, EventStatus.GAME_SHAKE, EventStatus.GAME_MATCH, EventStatus.ENDED],
  [EventStatus.CHECKIN]: [EventStatus.STANDBY, EventStatus.ICEBREAKER, EventStatus.LOTTERY_READY, EventStatus.GAME_SHAKE, EventStatus.GAME_MATCH, EventStatus.ENDED],
  [EventStatus.ICEBREAKER]: [EventStatus.STANDBY, EventStatus.CHECKIN, EventStatus.LOTTERY_READY, EventStatus.GAME_SHAKE, EventStatus.GAME_MATCH, EventStatus.ENDED],
  [EventStatus.LOTTERY_READY]: [EventStatus.STANDBY, EventStatus.CHECKIN, EventStatus.ICEBREAKER, EventStatus.LOTTERY_RUNNING, EventStatus.GAME_SHAKE, EventStatus.GAME_MATCH, EventStatus.ENDED],
  [EventStatus.LOTTERY_RUNNING]: [EventStatus.STANDBY, EventStatus.CHECKIN, EventStatus.LOTTERY_READY, EventStatus.ICEBREAKER, EventStatus.GAME_SHAKE, EventStatus.GAME_MATCH, EventStatus.ENDED],
  [EventStatus.GAME_SHAKE]: [EventStatus.STANDBY, EventStatus.LOTTERY_READY, EventStatus.CHECKIN, EventStatus.ICEBREAKER, EventStatus.GAME_MATCH, EventStatus.ENDED],
  [EventStatus.GAME_MATCH]: [EventStatus.STANDBY, EventStatus.CHECKIN, EventStatus.ICEBREAKER, EventStatus.LOTTERY_READY, EventStatus.GAME_SHAKE, EventStatus.ENDED],
  [EventStatus.ENDED]: [EventStatus.STANDBY],
};

// 根据当前状态计算可用的场景按钮
const availableScenes = computed(() => {
  const allowed = ALLOWED_TRANSITIONS[currentState.value] || [];
  return scenes.map((s) => ({
    ...s,
    disabled: s.state !== currentState.value && !allowed.includes(s.state),
  }));
});

const stateLabel = (state: string) => {
  const map: Record<string, string> = {
    [EventStatus.STANDBY]: '待机',
    [EventStatus.CHECKIN]: '签到中',
    [EventStatus.ICEBREAKER]: '破冰中',
    [EventStatus.LOTTERY_READY]: '抽奖准备',
    [EventStatus.LOTTERY_RUNNING]: '抽奖中',
    [EventStatus.GAME_SHAKE]: '摇一摇',
    [EventStatus.GAME_MATCH]: 'CP盲盒',
    [EventStatus.ENDED]: '已结束',
  };
  return map[state] || state;
};

const selectEvent = async (evt: any) => {
  const isSame = currentEvent.value && currentEvent.value.event_id === evt.event_id;
  if (isSame) return; // 重复点击同一个活动，无需重新加载
  const isSwitching = !!currentEvent.value;
  currentEvent.value = evt;
  try {
    const res: any = await eventApi.getCurrentState(evt.event_id);
    currentState.value = res.state;
  } catch {}

  // 切换活动时重建 WS 连接和 presence 轮询
  if (isSwitching) {
    cleanupSocket();
    if (hostUserId.value) {
      connectHostSocket();
      startPresencePolling();
    }
  }
};

const changeScene = async (targetState: EventStatus) => {
  if (!currentEvent.value) {
    uni.showToast({ title: '请先选择聚会', icon: 'none' });
    return;
  }

  try {
    await eventApi.changeScene(currentEvent.value.event_id, targetState);
    currentState.value = targetState;
    uni.showToast({ title: `已切换至${stateLabel(targetState)}`, icon: 'success' });

    // 切换到 CP盲盒 时自动生成匹配
    if (targetState === EventStatus.GAME_MATCH) {
      try {
        await matchApi.generate(currentEvent.value.event_id);
      } catch (e) {
        console.warn('Match generation failed:', e);
      }
    }
  } catch (err) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  }
};

const goToCreate = () => {
  uni.navigateTo({ url: '/pages/host/create-event' });
};

const goToIcebreaker = () => {
  if (!currentEvent.value) {
    uni.showToast({ title: '请先选择聚会', icon: 'none' });
    return;
  }
  // 确保状态机进入 ICEBREAKER
  if (currentState.value !== EventStatus.ICEBREAKER) {
    changeScene(EventStatus.ICEBREAKER);
  }
  uni.navigateTo({ url: `/pages/host/icebreaker-manage?eventId=${currentEvent.value.event_id}` });
};

const closeIcebreaker = async () => {
  if (!currentEvent.value) return;
  try {
    const { icebreakerApi } = await import('../../services/api');
    await icebreakerApi.close(currentEvent.value.event_id);
    uni.showToast({ title: '已关闭当前问题', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  }
};

onMounted(async () => {
  try {
    const res: any = await eventApi.getMyEvents();
    myEvents.value = res;
    if (res.length > 0) {
      await selectEvent(res[0]);
    }
  } catch {}

  // 读取当前登录用户（host/co-host 身份）
  try {
    const cached = uni.getStorageSync('flashmeet_user_id');
    if (cached) hostUserId.value = cached;
  } catch {}

  if (currentEvent.value && hostUserId.value) {
    connectHostSocket();
    startPresencePolling();
  }
});

// 每次回到本页都刷新：处理"创建活动 / 加入活动 / 切回"等场景
onShow(async () => {
  try {
    const res: any = await eventApi.getMyEvents();
    myEvents.value = res || [];
    if (currentEvent.value) {
      // 重新拉取当前活动状态（可能被其他 host 切换）
      try {
        const st: any = await eventApi.getCurrentState(currentEvent.value.event_id);
        if (st?.state) currentState.value = st.state;
      } catch {}
      // 重连 socket（页面隐藏后可能被踢）
      if (!socket || socketStatus.value === 'closed') {
        cleanupSocket();
        if (hostUserId.value) {
          connectHostSocket();
          startPresencePolling();
        }
      }
    } else if (myEvents.value.length > 0) {
      await selectEvent(myEvents.value[0]);
      if (hostUserId.value) {
        connectHostSocket();
        startPresencePolling();
      }
    }
  } catch {}
});

onUnload(() => {
  cleanupSocket();
  if (presenceTimer) {
    clearInterval(presenceTimer);
    presenceTimer = null;
  }
  if (statePollTimer) {
    clearInterval(statePollTimer);
    statePollTimer = null;
  }
});

const cleanupSocket = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketStatus.value = 'closed';
};

const startPresencePolling = () => {
  if (presenceTimer) clearInterval(presenceTimer);
  const tick = async () => {
    if (!currentEvent.value) return;
    try {
      const res: any = await eventApi.getPresence(currentEvent.value.event_id);
      presenceList.value = res.active || [];
    } catch {
      // 403: 当前用户不是 host/co-host
    }
  };
  tick();
  presenceTimer = setInterval(tick, 5000);
};

const startStatePolling = () => {
  if (statePollTimer) return;
  statePollTimer = setInterval(async () => {
    if (!currentEvent.value) return;
    try {
      const st: any = await eventApi.getCurrentState(currentEvent.value.event_id);
      if (st?.state) currentState.value = st.state;
    } catch {}
  }, 10_000);
};

const stopStatePolling = () => {
  if (statePollTimer) {
    clearInterval(statePollTimer);
    statePollTimer = null;
  }
};

const connectHostSocket = async () => {
  if (!currentEvent.value) return;
  // 防止重复连接：先清理旧 socket 避免泄漏
  cleanupSocket();
  const base = import.meta.env.VITE_API_BASE || (uni as any).$socketUrl || '';
  const s = new ReconnectingSocket({
    baseDelayMs: 500,
    maxDelayMs: 30_000,
    jitter: 0.3,
  });
  s.onStatus((st) => {
    socketStatus.value = st;
    // WS 断开时启动状态轮询兜底，重连后停止
    if (st === 'open') {
      stopStatePolling();
    } else if (st === 'closed') {
      startStatePolling();
    }
  });
  await s.connect(base, {
    event_id: currentEvent.value.event_id,
    role: 'host',
    user_id: hostUserId.value,
  });
  socket = s;

  // 监听 host 切换
  s.on(WsEvent.HOST_CHANGED, (data: any) => {
    if (data.event_id !== currentEvent.value?.event_id) return;
    if (data.new_host_id === hostUserId.value) {
      hostChangedHint.value = '你已被提升为主场控';
    } else if (data.old_host_id === hostUserId.value) {
      hostChangedHint.value = '主场控已交接控制权';
    } else {
      hostChangedHint.value = data.reason === 'offline' ? '主场控已离线' : '主场控已切换';
    }
    setTimeout(() => (hostChangedHint.value = ''), 5000);
  });

  // 监听场景切换：其他 co-host 切换场景时也能同步更新
  s.on(WsEvent.SCENE_UPDATED, (data: any) => {
    if (data.event_id !== currentEvent.value?.event_id) return;
    if (data.state) {
      currentState.value = data.state;
    }
  });

  // 启动心跳：每 3s 一次
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (currentEvent.value && hostUserId.value && socketStatus.value === 'open') {
      socket?.emit(WsEvent.HOST_HEARTBEAT, {
        event_id: currentEvent.value.event_id,
        user_id: hostUserId.value,
      });
    }
  }, 3000);
};
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
  position: relative;
}

.title {
  font-size: 48rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  margin-bottom: 24rpx;
  letter-spacing: 4rpx;
}

.lang-switch {
  position: absolute;
  top: calc(40rpx + env(safe-area-inset-top));
  right: 40rpx;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 10;
  transition: background 0.2s, transform 0.2s;
}
.lang-switch:active {
  transform: scale(0.96);
  background: rgba(255, 255, 255, 0.14);
}
.lang-switch-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 1rpx;
  font-weight: 600;
}

.host-hint {
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  margin-bottom: 20rpx;
  text-align: center;
  animation: hint-fade 5s forwards;
}

@keyframes hint-fade {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

.conn-status {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  margin-bottom: 20rpx;
  align-self: flex-start;
}

.conn-status.open {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.conn-status.connecting,
.conn-status.closed {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

.conn-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8rpx currentColor;
}

.conn-status.connecting .conn-dot {
  animation: pulse-conn 1s infinite;
}

@keyframes pulse-conn {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.event-info {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.2);
}

.presence-row {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
}

.presence-title {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 12rpx;
}

.presence-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.presence-pill {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(102, 126, 234, 0.15);
  border: 1rpx solid rgba(102, 126, 234, 0.4);
  border-radius: 999rpx;
  padding: 6rpx 16rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
}

.presence-pill.primary {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.5);
  color: #ffd700;
}

.presence-pill.me {
  border-color: #4fc3f7;
  color: #4fc3f7;
}

.pulse-dot-small {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8rpx #4ade80;
  animation: pulse-small 1.4s infinite;
}

@keyframes pulse-small {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.event-name {
  font-size: 34rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 8rpx;
}

.event-state {
  font-size: 26rpx;
  color: #667eea;
}

.event-id-row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
}

.event-id-label {
  font-size: 24rpx;
  color: #ffd700;
  padding: 6rpx 16rpx;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8rpx;
  word-break: break-all;
}

.event-id-hint {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.35);
  margin-left: 10rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 20rpx;
}

.btn-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 40rpx;
}

.scene-btn {
  width: calc(33.33% - 12rpx);
  height: 84rpx;
  line-height: 84rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  color: rgba(255, 255, 255, 0.7);
  font-size: 26rpx;
  padding: 0;
  letter-spacing: 1rpx;
  transition: transform 0.2s var(--fm-ease-smooth, ease);
}
.scene-btn:active:not(:disabled) { transform: scale(0.97); }

.scene-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: white;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.4);
}

.scene-btn.disabled {
  opacity: 0.35;
  pointer-events: none;
}

.events-list {
  margin-bottom: 40rpx;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.event-item-name {
  font-size: 28rpx;
  color: white;
}

.event-item-state {
  font-size: 24rpx;
  color: #667eea;
}

.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 46rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  height: 92rpx;
  line-height: 92rpx;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
  transition: transform 0.2s, opacity 0.2s;
}
.create-btn::after { border: none; }
.create-btn:active { transform: scale(0.98); opacity: 0.92; }

.icebreaker-panel {
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.25);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
}

.ice-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16rpx;
  font-size: 28rpx;
  border: none;
  margin-bottom: 12rpx;
}

.ice-btn-floating {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 16rpx;
  font-size: 26rpx;
  margin-bottom: 30rpx;
}

/* ===== Segmented Control ===== */
.segmented {
  display: flex;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 30rpx;
  position: relative;
}

.seg-item {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.seg-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
}

.seg-badge {
  font-size: 20rpx;
  background: rgba(255, 255, 255, 0.25);
  color: inherit;
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  font-weight: normal;
  min-width: 32rpx;
  text-align: center;
}

.seg-item.active .seg-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* ===== 下一步推荐卡 ===== */
.rec-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  border: 1rpx solid;
}

.rec-primary {
  background: rgba(102, 126, 234, 0.12);
  border-color: rgba(102, 126, 234, 0.4);
}

.rec-info {
  background: rgba(79, 195, 247, 0.1);
  border-color: rgba(79, 195, 247, 0.35);
}

.rec-warning {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.35);
}

.rec-success {
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.35);
}

.rec-icon {
  font-size: 56rpx;
  line-height: 1;
  flex-shrink: 0;
}

.rec-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.rec-title {
  font-size: 28rpx;
  font-weight: bold;
  color: white;
}

.rec-desc {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

.rec-action {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 12rpx;
  font-size: 24rpx;
  padding: 0 20rpx;
  height: 56rpx;
  line-height: 56rpx;
  flex-shrink: 0;
}

.rec-action::after {
  border: none;
}

/* ===== 活动 Tab 列表项 ===== */
.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.event-item.active {
  background: rgba(102, 126, 234, 0.12);
  border-color: rgba(102, 126, 234, 0.5);
}

.event-item-main {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
  flex: 1;
}

.event-item-meta {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.4);
}

.event-item-state-tag {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}

.state-STANDBY { background: rgba(160, 160, 160, 0.15); color: #a0a0a0; }
.state-CHECKIN { background: rgba(102, 126, 234, 0.2); color: #8ea2ff; }
.state-ICEBREAKER { background: rgba(79, 195, 247, 0.2); color: #4fc3f7; }
.state-LOTTERY_READY { background: rgba(255, 215, 0, 0.15); color: #ffd700; }
.state-LOTTERY_RUNNING { background: rgba(255, 165, 0, 0.2); color: #ffa500; }
.state-GAME_SHAKE { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
.state-GAME_MATCH { background: rgba(236, 72, 153, 0.2); color: #f472b6; }
.state-ENDED { background: rgba(74, 222, 128, 0.15); color: #4ade80; }

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 80rpx 0;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16rpx;
  border: 1rpx dashed rgba(255, 255, 255, 0.15);
}

.empty-emoji {
  font-size: 80rpx;
}

.empty-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.5);
}
</style>
