/**
 * useExperienceStream
 * ------------------------------------------------------------
 * v2.0 体验流（Experience Stream）核心组合式 API
 *
 * 职责：
 *  - 统一管理"当前活动 / 队列 / 历史 / 建议"四个状态
 *  - 封装 WebSocket 订阅 + 降级轮询
 *  - 提供"零跳转"舞台切换的方法
 *
 * 用法（用户端 Live 容器）：
 *   const { stream, current, next, suggestions, runSuggestion } = useExperienceStream(eventId, role);
 *
 * 用法（主持端 Conductor）：
 *   const { stream, current, next, suggestions, runSuggestion, skipTo, changeScene } =
 *     useExperienceStream(eventId, 'host');
 *
 * 设计原则：
 *  - 单向数据流：后端 push → stream ref → 视图 reactive
 *  - 规则引擎本地可跑：先内置 5 条基础规则，Phase 4 接入后端 AI
 *  - 失败兜底：WS 断开自动轮询，重连后回写
 */

import { ref, computed, watch } from 'vue';
import { onShow, onHide, onUnload } from '@dcloudio/uni-app';
import { eventApi, matchApi } from '../services/api';
import { httpErrorToMessage } from '../services/request';
import { ReconnectingSocket } from '../utils/reconnecting-socket';
import { WsEvent, EventStatus } from '../services/ws-events';
import { ACTIVITY_TIMELINE } from './experience-stream-types';
import {
  generateSuggestions,
  type ActivitySuggestion,
  type ExperienceRole,
} from './suggestion-rules';

export type { ExperienceRole };

export interface StreamNode {
  type: string; // EventStatus
  startedAt?: number;
  meta?: Record<string, any>;
}

export interface ExperienceStream {
  current: StreamNode | null;
  queue: StreamNode[]; // 即将进行
  history: StreamNode[]; // 已经完成
  suggestions: ActivitySuggestion[]; // AI / 规则建议
  meta: {
    eventId: string;
    title: string;
    state: string;
    checkinCount: number;
    interactionCount: number;
    lastUpdatedAt: number;
  };
}

export interface UseExperienceStreamOptions {
  /** 角色：host 拥有切换权，participant 只读 */
  role?: ExperienceRole;
  /** 初始 queue（无后端 stream 时给一个默认流程） */
  defaultQueue?: string[];
}

const ACTIVITY_LABELS: Record<string, string> = {
  [EventStatus.STANDBY]: '待机',
  [EventStatus.CHECKIN]: '签到',
  [EventStatus.ICEBREAKER]: '破冰',
  [EventStatus.LOTTERY_READY]: '抽奖准备',
  [EventStatus.LOTTERY_RUNNING]: '抽奖中',
  [EventStatus.GAME_SHAKE]: '摇一摇',
  [EventStatus.GAME_MATCH]: 'CP盲盒',
  [EventStatus.ENDED]: '已结束',
};

export function useExperienceStream(
  eventIdRef: () => string | null,
  options: UseExperienceStreamOptions = {},
) {
  const { role = 'participant', defaultQueue = ACTIVITY_TIMELINE } = options;

  // ========== 状态 ==========
  const stream = ref<ExperienceStream>({
    current: null,
    queue: (defaultQueue as string[]).map((t: string) => ({ type: t })),
    history: [],
    suggestions: [],
    meta: {
      eventId: '',
      title: '',
      state: EventStatus.STANDBY,
      checkinCount: 0,
      interactionCount: 0,
      lastUpdatedAt: Date.now(),
    },
  });

  const socketStatus = ref<'connecting' | 'open' | 'closed'>('connecting');
  let socket: ReconnectingSocket | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let hostUserId = '';

  try {
    hostUserId = uni.getStorageSync('flashmeet_user_id') || '';
  } catch {}

  // ========== 计算属性 ==========
  const current = computed(() => stream.value.current);
  const currentLabel = computed(() =>
    stream.value.current ? ACTIVITY_LABELS[stream.value.current.type] || stream.value.current.type : '未开始',
  );
  const next = computed<StreamNode | null>(() => stream.value.queue[0] || null);
  const nextLabel = computed(() =>
    next.value ? ACTIVITY_LABELS[next.value.type] || next.value.type : '已结束',
  );
  const suggestions = computed(() => stream.value.suggestions);
  const progress = computed(() => {
    const total = stream.value.history.length + (stream.value.current ? 1 : 0) + stream.value.queue.length;
    if (total === 0) return 0;
    return Math.round((stream.value.history.length / total) * 100);
  });

  // ========== 内部方法 ==========
  function patchCurrent(type: string, meta?: Record<string, any>) {
    const newNode: StreamNode = { type, startedAt: Date.now(), meta };
    // 旧 current 进入 history
    if (stream.value.current && stream.value.current.type !== type) {
      stream.value.history.push(stream.value.current);
    }
    stream.value.current = newNode;
    // 从 queue 移除
    stream.value.queue = stream.value.queue.filter((n) => n.type !== type);
    stream.value.meta.state = type;
    stream.value.meta.lastUpdatedAt = Date.now();
    refreshSuggestions();
  }

  function refreshSuggestions() {
    stream.value.suggestions = generateSuggestions(stream.value, role);
  }

  async function loadInitial() {
    const eventId = eventIdRef();
    if (!eventId) return;
    try {
      const [stateRes, eventInfo] = await Promise.all([
        eventApi.getCurrentState(eventId),
        eventApi.getOne(eventId).catch(() => null),
      ]);
      const state: string = (stateRes as any)?.state || EventStatus.STANDBY;
      // 重建 stream
      stream.value.current = { type: state, startedAt: Date.now() };
      stream.value.queue = (defaultQueue as string[])
        .filter((t: string) => t !== state)
        .map((t: string) => ({ type: t }));
      stream.value.history = [];
      stream.value.meta.eventId = eventId;
      stream.value.meta.title = (eventInfo as any)?.title || '聚会';
      stream.value.meta.state = state;
      stream.value.meta.lastUpdatedAt = Date.now();

      // 签到数量
      try {
        const c: any = await (await import('../services/api')).checkinApi.getCount(eventId);
        stream.value.meta.checkinCount = c?.count ?? 0;
      } catch {}

      refreshSuggestions();
    } catch (err) {
      console.warn('[ExperienceStream] loadInitial failed', err);
    }
  }

  function connectSocket() {
    const eventId = eventIdRef();
    if (!eventId) return;
    cleanupSocket();
    const base = (import.meta as any).env?.VITE_API_BASE || '';
    const s = new ReconnectingSocket({ baseDelayMs: 500, maxDelayMs: 30_000, jitter: 0.3 });
    s.onStatus((st) => {
      socketStatus.value = st;
      if (st === 'open') stopPolling();
      else if (st === 'closed') startPolling();
    });
    s.connect(base, {
      event_id: eventId,
      role: role === 'screen' ? 'screen' : role,
      user_id: hostUserId,
    });
    socket = s;

    s.on(WsEvent.SCENE_UPDATED, (data: any) => {
      if (data.event_id !== eventId) return;
      if (data.state) patchCurrent(data.state, data.meta);
    });

    s.on(WsEvent.HOST_CHANGED, (data: any) => {
      if (data.event_id !== eventId) return;
      uni.showToast({
        title: data.reason === 'offline' ? '主场控已离线' : '主场控已切换',
        icon: 'none',
        duration: 3000,
      });
    });

    s.on(WsEvent.USER_CHECKED_IN, () => {
      stream.value.meta.checkinCount += 1;
      stream.value.meta.interactionCount += 1;
      refreshSuggestions();
    });

    s.on(WsEvent.SHAKE_LEADERBOARD_TICK, () => {
      stream.value.meta.interactionCount += 1;
    });
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      const eventId = eventIdRef();
      if (!eventId) return;
      try {
        const res: any = await eventApi.getCurrentState(eventId);
        if (res?.state && res.state !== stream.value.current?.type) {
          patchCurrent(res.state);
        }
      } catch {}
    }, 8000);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function cleanupSocket() {
    stopPolling();
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    socketStatus.value = 'closed';
  }

  // ========== 主持端控制方法 ==========
  async function changeScene(targetState: string) {
    const eventId = eventIdRef();
    if (!eventId) return;
    try {
      await eventApi.changeScene(eventId, targetState);
      // 后端会推 WS 事件；本地也立即更新以保证响应即时
      patchCurrent(targetState);
      uni.showToast({ title: `已切到${ACTIVITY_LABELS[targetState] || targetState}`, icon: 'success' });
    } catch (err) {
      uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
    }
  }

  async function skipTo(targetState: string) {
    // 主持人"快进"：跳到队列中的某一项
    return changeScene(targetState);
  }

  async function runSuggestion(s: ActivitySuggestion) {
    try {
      switch (s.action.type) {
        case 'change_scene':
          if (s.action.target) await changeScene(s.action.target);
          break;
        case 'open_icebreaker':
          await changeScene(EventStatus.ICEBREAKER);
          // v3.0 极简：不再跳转管理页，UI 反馈交给 Live 端 Overlay
          break;
        case 'open_lottery':
          await changeScene(EventStatus.LOTTERY_READY);
          // v3.0 极简：同上
          break;
        case 'generate_match':
          await changeScene(EventStatus.GAME_MATCH);
          await matchApi.generate(eventIdRef()!);
          break;
        case 'end_event':
          await changeScene(EventStatus.ENDED);
          break;
        default:
          uni.showToast({ title: s.title, icon: 'none' });
      }
    } catch (err) {
      uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
    }
  }

  // ========== 生命周期 ==========
  watch(
    () => eventIdRef(),
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        loadInitial();
        connectSocket();
      }
    },
    { immediate: true },
  );

  onShow(() => {
    if (eventIdRef()) {
      loadInitial();
      if (!socket || socketStatus.value === 'closed') connectSocket();
    }
  });

  onHide(() => {
    // 不立即断，保留 30s 内重连能力
  });

  onUnload(() => {
    cleanupSocket();
  });

  return {
    stream,
    current,
    currentLabel,
    next,
    nextLabel,
    suggestions,
    progress,
    socketStatus,
    changeScene,
    skipTo,
    runSuggestion,
    reload: loadInitial,
  };
}
