/**
 * 性能 / 异常 埋点客户端（screen 端）
 *
 * 上报时机：
 *  - 启动时打点 'event' name=app_start（业务面）
 *  - 收到 WS 心跳 / SCENE_UPDATED 时打点 'event' name=scene_change
 *  - requestAnimationFrame 计算 FPS，每 5s 聚合上报一次
 *  - window.onerror / unhandledrejection 捕获后打点 'error'
 *
 * 不阻塞业务：上报失败一律吞掉（console.warn）
 */
type Metric = 'fps' | 'latency' | 'error' | 'event';

interface ReportPayload {
  metric: Metric;
  data: Record<string, any>;
  event_id?: string;
  role?: 'screen' | 'host' | 'user' | 'guest';
  app_ver?: string;
  client_ts: number;
  session_id: string;
}

const SESSION_ID = (() => {
  try {
    let id = sessionStorage.getItem('fm_session');
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('fm_session', id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
})();

const APP_VER = (import.meta as any).env?.VITE_APP_VER || '0.1.0';

let buffer: ReportPayload[] = [];
let flushTimer: number | null = null;

function flush() {
  if (buffer.length === 0) return;
  const queue = buffer;
  buffer = [];
  // 用 navigator.sendBeacon 走 fire-and-forget，不阻塞渲染
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify({ batch: queue })], {
        type: 'application/json',
      });
      const ok = navigator.sendBeacon('/api/telemetry/report', blob);
      if (!ok) {
        // 浏览器满了/被禁，回退 fetch keepalive
        fetchFallback(queue);
      }
    } catch {
      fetchFallback(queue);
    }
  } else {
    fetchFallback(queue);
  }
}

function fetchFallback(queue: ReportPayload[]) {
  fetch('/api/telemetry/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batch: queue }),
    keepalive: true,
  }).catch(() => {
    // 上报失败：把数据放回 buffer，等下次重试
    buffer = [...queue, ...buffer].slice(0, 200);
  });
}

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flush();
  }, 5000);
}

export function reportMetric(
  metric: Metric,
  data: Record<string, any>,
  ctx: { event_id?: string; role?: ReportPayload['role'] } = {},
) {
  buffer.push({
    metric,
    data,
    event_id: ctx.event_id,
    role: ctx.role || 'screen',
    app_ver: APP_VER,
    client_ts: Date.now(),
    session_id: SESSION_ID,
  });
  if (buffer.length >= 20) flush();
  else scheduleFlush();
}

// ── 启动入口 ──────────────────────────────
let started = false;
let fpsRafId: number | null = null;
let fpsLastSampleAt = 0;
let fpsFrameCount = 0;
let fpsLatestValue = 0;

function fpsLoop(now: number) {
  fpsFrameCount++;
  if (now - fpsLastSampleAt >= 1000) {
    fpsLatestValue = fpsFrameCount;
    fpsFrameCount = 0;
    fpsLastSampleAt = now;
    reportMetric('fps', { value: fpsLatestValue }, telemetryCtx);
  }
  fpsRafId = requestAnimationFrame(fpsLoop);
}

let telemetryCtx: { event_id?: string; role: 'screen' } = {
  role: 'screen',
};

export function startTelemetry(opts: { eventId?: string } = {}) {
  if (started) return;
  started = true;
  telemetryCtx = { event_id: opts.eventId, role: 'screen' };

  reportMetric('event', { name: 'app_start', ua: navigator.userAgent }, telemetryCtx);

  // FPS：rAF 采帧，每 1s 聚合一次
  fpsLastSampleAt = performance.now();
  fpsRafId = requestAnimationFrame(fpsLoop);

  // 全局错误捕获
  window.addEventListener('error', (e) => {
    reportMetric(
      'error',
      {
        kind: 'js',
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        stack: e.error?.stack,
      },
      telemetryCtx,
    );
  });
  window.addEventListener('unhandledrejection', (e) => {
    reportMetric(
      'error',
      {
        kind: 'promise',
        reason: String(e.reason),
        stack: (e.reason as any)?.stack,
      },
      telemetryCtx,
    );
  });

  // 页面隐藏前 flush
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export function stopTelemetry() {
  if (fpsRafId) cancelAnimationFrame(fpsRafId);
  fpsRafId = null;
  flush();
  started = false;
}
