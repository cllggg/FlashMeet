<template>
  <div class="event-screen">
    <!-- v3.0: 不再有 FPS 降级与 2D 兜底 -->

    <!-- 主题切换器（右上角悬浮） -->
    <div class="theme-toggle" @click="toggleTheme" title="切换主题">
      <span class="theme-toggle-icon">{{ themeIcon }}</span>
      <span class="theme-toggle-label">{{ themeLabel }}</span>
    </div>

    <!-- WS 状态提示 -->
    <div v-if="wsStatus !== 'open'" class="ws-status" :class="wsStatus">
      <span class="ws-dot"></span>
      <span class="ws-text">
        {{ wsStatus === 'connecting' ? '正在连接...' : '连接已断开，全量轮询兜底中' }}
      </span>
    </div>

    <!-- v3.0: 统一 3D 舞台，所有状态共用一个 Stage3D 实例 -->
    <Stage3D
      ref="stageRef"
      :event="event"
      :checkin-users="checkinUsers"
      :question="icebreakerQuestion"
      :star-lit-events="starLitEvents"
      :winners="winners"
      :leaderboard="shakeLeaderboard"
      :pairs="matchPairs"
    />

    <!-- 始终显示扫码加入（除 ENDED 外） -->
    <JoinQR
      v-if="currentState !== EventStatus.ENDED && finalJoinUrl"
      :join-url="finalJoinUrl"
      :event-id="eventId"
    />

    <!-- v2.0: 底部活动进度条（让观众也看到节奏） -->
    <QueueStrip :current-state="currentState" />

    <!-- 活动不存在兑底 -->
    <div v-if="notFound" class="not-found-mask">
      <div class="not-found-card">
        <div class="not-found-icon">🔍</div>
        <div class="not-found-title">活动不存在或已结束</div>
        <div class="not-found-desc">
          聚会 ID: <code>{{ eventId }}</code>
        </div>
        <button class="not-found-btn" @click="goHome">返回首页重新输入</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { EventStatus, WsEvent } from '../types/enums';
import { socketService } from '../services/socket';
import api from '../services/api';
import {
  cycleTheme,
  getCurrentTheme,
  THEME_LABELS,
  type ThemeName,
} from '../utils/theme';
import { startTelemetry, stopTelemetry, reportMetric } from '../utils/telemetry';
import Stage3D from '../components/Stage3D.vue';
import JoinQR from '../components/JoinQR.vue';
import QueueStrip from '../components/QueueStrip.vue';

const route = useRoute();
const router = useRouter();
const eventId = route.params.eventId as string;

// 主题切换状态
const currentTheme = ref<ThemeName>(getCurrentTheme());
const toggleTheme = () => {
  currentTheme.value = cycleTheme();
};
const themeLabel = computed(() => THEME_LABELS[currentTheme.value]);
const themeIcon = computed(() => {
  const m: Record<ThemeName, string> = {
    cyber: '🪐',
    dark: '🌑',
    light: '☀️',
  };
  return m[currentTheme.value];
});
// 监听跨标签页同步（其他窗口改了 storage 也跟上）
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'screen_theme' && e.newValue) {
      currentTheme.value = e.newValue as ThemeName;
      document.documentElement.setAttribute('data-theme', e.newValue);
    }
  });
}

const goHome = () => {
  router.replace('/');
};

const currentState = ref<EventStatus>(EventStatus.STANDBY);
const previousState = ref<EventStatus>(EventStatus.STANDBY);
const event = ref<any>({});
const checkinUsers = ref<any[]>([]);
const winners = ref<any[]>([]);
const shakeLeaderboard = ref<any[]>([]);
const stageRef = ref<any>(null);
const wsStatus = ref<'connecting' | 'open' | 'closed'>('connecting');
const notFound = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let offStatus: () => void = () => {}; // 由 onMounted 内 onStatusChange 赋值

// Icebreaker
const icebreakerQuestion = ref<any | null>(null);
const starLitEvents = ref<any[]>([]);

// Match
const matchPairs = ref<any[]>([]);

// v3.0: 状态变化时通知 Stage3D 切换模式
watch(currentState, (newState) => {
  if (stageRef.value?.setState) {
    stageRef.value.setState(newState);
  }
});

const onSceneUpdated = (data: { state: EventStatus; event_id: string }) => {
  previousState.value = currentState.value;
  currentState.value = data.state;
  reportMetric('event', { name: 'scene_change', to: data.state }, {
    event_id: data.event_id,
    role: 'screen',
  });
  if (data.state !== EventStatus.ICEBREAKER) {
    icebreakerQuestion.value = null;
    starLitEvents.value = [];
  }
  console.log('Scene updated:', data.state);
};

const onNewCheckin = (data: any) => {
  checkinUsers.value.push(data.user);
  import('../utils/sound').then(m => m.playCheckinSound());
};

const onShakeLeaderboard = (data: any) => {
  shakeLeaderboard.value = data.leaderboard;
};

const onLotteryWinner = (data: any) => {
  winners.value.push(data.winner);
  import('../utils/sound').then(m => m.playWinSound());
};

const onIcebreakerQuestion = (data: any) => {
  icebreakerQuestion.value = data.question;
  starLitEvents.value = []; // 新问题：清空已点亮
};

const onIcebreakerClosed = () => {
  icebreakerQuestion.value = null;
  // 保留 starLitEvents 以便显示最终分布
};

const onStarLitUp = (data: any) => {
  starLitEvents.value.push({ user_id: data.user_id, tag: data.tag, color: data.color });
};

const onMatchLines = (data: any) => {
  matchPairs.value = data.pairs || [];
};

const onMatchResult = (data: any) => {
  matchPairs.value = data.pairs || [];
};

/**
 * 计算二维码最终显示的完整 URL
 *
 * 规则：
 *  1. 后端返回的 join_url 是相对路径 `/e/{event_id}`，由我们补全
 *  2. 优先用 VITE_MINIAPP_URL（适合生产环境 / miniapp 部署到不同域）
 *  3. 否则默认与当前大屏同 host + 默认端口 5174
 *  4. 后端若已配置了完整 SCREEN_JOIN_URL（含 http(s)://），直接透传
 */
const miniappBaseUrl = (import.meta.env.VITE_MINIAPP_URL as string) || '';
const finalJoinUrl = computed(() => {
  const raw = event.value?.join_url;
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw; // 后端已注入完整地址
  if (miniappBaseUrl) {
    return `${miniappBaseUrl.replace(/\/$/, '')}${raw}`;
  }
  // 同 host + 5174 端口（H5 miniapp 默认）
  const host = window.location.hostname || 'localhost';
  return `http://${host}:5174${raw}`;
});

const loadInitialData = async () => {
  try {
    const { data } = await api.get(`/screen/event/${eventId}`);
    if (!data) {
      notFound.value = true;
      return;
    }
    event.value = data;
    currentState.value = data.current_state;
    notFound.value = false;

    const { data: checkins } = await api.get(`/screen/event/${eventId}/checkins`);
    checkinUsers.value = checkins || [];

    const { data: wonRecords } = await api.get(`/screen/event/${eventId}/winners`);
    winners.value = wonRecords || [];

    // 若当前处于破冰环节，拉取问题快照（晚入场恢复）
    if (currentState.value === EventStatus.ICEBREAKER) {
      try {
        const { data: iceData } = await api.get(
          `/icebreaker/event/${eventId}/current`,
        );
        if (iceData?.question) {
          icebreakerQuestion.value = iceData.question;
        }
      } catch {}
    }

    // 若当前处于摇一摇环节，拉取 session 状态（晚入场恢复倒计时）
    if (currentState.value === EventStatus.GAME_SHAKE) {
      try {
        const { data: shakeData } = await api.get(
          `/screen/event/${eventId}/shake-session`,
        );
        if (shakeData?.active) {
          // v3.0: Stage3D 内部已经显示倒计时 UI，此处仅打点
          reportMetric('event', { name: 'shake_recovered' }, { event_id: eventId });
        }
      } catch {}
    }
  } catch (err: any) {
    if (err?.response?.status === 404) {
      notFound.value = true;
    } else {
      console.error('Failed to load event:', err);
    }
  }
};

const pollCheckins = async () => {
  try {
    const { data } = await api.get(`/screen/event/${eventId}/checkins`);
    if (data) checkinUsers.value = data;
  } catch {}
};

const pollWinners = async () => {
  try {
    const { data } = await api.get(`/screen/event/${eventId}/winners`);
    if (data) winners.value = data;
  } catch {}
};

const pollEventState = async () => {
  try {
    const { data } = await api.get(`/screen/event/${eventId}`);
    if (data) {
      event.value = data;
      currentState.value = data.current_state;
    }
  } catch {}
};

/**
 * 全量兜底轮询：WS 断线时仍能拿到最新数据
 * - WS 在线时：5s 慢轮询（保底）
 * - WS 断线时：2s 快轮询（高频兜底）
 */
const pollAll = async (isOnline: boolean) => {
  if (isOnline) {
    await pollCheckins();
    await pollWinners();
  } else {
    await pollEventState();
    await pollCheckins();
    await pollWinners();
    if (currentState.value === EventStatus.ICEBREAKER) {
      try {
        const { data: iceData } = await api.get(
          `/icebreaker/event/${eventId}/current`,
        );
        if (iceData?.question) icebreakerQuestion.value = iceData.question;
      } catch {}
    }
    if (currentState.value === EventStatus.GAME_SHAKE) {
      try {
        const { data: shakeData } = await api.get(
          `/screen/event/${eventId}/shake-session`,
        );
        if (shakeData?.active) {
          // v3.0: Stage3D 自己接管倒计时 UI，此处只保留状态
          console.log('shake session active, ends_at:', shakeData.ends_at);
        }
      } catch {}
    }
  }
};

const startPolling = (isOnline: boolean) => {
  if (pollTimer) clearInterval(pollTimer);
  pollAll(isOnline);
  pollTimer = setInterval(() => pollAll(isOnline), isOnline ? 5000 : 2000);
};

const switchPolling = (isOnline: boolean) => {
  startPolling(isOnline);
};

onMounted(async () => {
  await loadInitialData();

  // 启动性能埋点（错误捕获 + scene 切换事件）
  startTelemetry({ eventId });

  // v3.0: 不再有 FPS 双向自适应与 2D 兜底
  // 仅保留场景切换音效反馈
  watch(currentState, (newState, oldState) => {
    if (newState && oldState && newState !== oldState) {
      import('../utils/sound').then(m => m.playSceneSwitchSound());
    }
  });

  socketService.connect(eventId);
  socketService.onSceneUpdated(onSceneUpdated);
  socketService.onUserCheckedIn(onNewCheckin);
  socketService.onShakeLeaderboard(onShakeLeaderboard);
  socketService.onLotteryWinner(onLotteryWinner);
  socketService.onIcebreakerQuestion(onIcebreakerQuestion);
  socketService.onIcebreakerClosed(onIcebreakerClosed);
  socketService.onStarLitUp(onStarLitUp);
  socketService.onMatchLines(onMatchLines);
  socketService.onMatchResult(onMatchResult);

  // 监听 WS 状态：动态切换轮询节奏
  offStatus = socketService.onStatusChange((s) => {
    wsStatus.value = s;
    if (s === 'open') {
      pollAll(false).then(() => switchPolling(true));
    } else if (s === 'closed') {
      switchPolling(false);
    }
  });

  startPolling(false);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  socketService.off(WsEvent.SCENE_UPDATED);
  socketService.off(WsEvent.USER_CHECKED_IN);
  socketService.off(WsEvent.SHAKE_LEADERBOARD_TICK);
  socketService.off(WsEvent.SHAKE_STARTED);
  socketService.off(WsEvent.SHAKE_ENDED);
  socketService.off(WsEvent.LOTTERY_WINNER_ANNOUNCE);
  socketService.off(WsEvent.ICEBREAKER_QUESTION);
  socketService.off(WsEvent.ICEBREAKER_CLOSED);
  socketService.off(WsEvent.STAR_LIT_UP);
  socketService.off(WsEvent.MATCH_LINES);
  socketService.off(WsEvent.MATCH_RESULT);
  offStatus();
  socketService.disconnect();
  stopTelemetry();
});
</script>

<style scoped>
.event-screen {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: transform 0.15s ease, background 0.25s ease, color 0.25s ease;
}
.theme-toggle:hover {
  color: var(--text-primary);
  background: var(--border-subtle);
}
.theme-toggle:active {
  transform: scale(0.96);
}
.theme-toggle-icon {
  font-size: 16px;
  line-height: 1;
}

.ws-status {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 9998;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ws-status .ws-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #888;
  animation: ws-blink 1.4s ease-in-out infinite;
}
.ws-status.connecting .ws-dot { background: #ffd700; }
.ws-status.closed .ws-dot { background: #ff5252; }

@keyframes ws-blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.not-found-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 46, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9000;
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.not-found-card {
  text-align: center;
  padding: 56px 60px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 420px;
  max-width: 560px;
}

.not-found-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.not-found-title {
  font-size: 1.4rem;
  color: white;
  font-weight: 600;
  margin-bottom: 12px;
}

.not-found-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 28px;
  word-break: break-all;
}

.not-found-desc code {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', Menlo, monospace;
  color: #ffd700;
}

.not-found-btn {
  padding: 12px 32px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.not-found-btn:hover {
  opacity: 0.9;
}
</style>
