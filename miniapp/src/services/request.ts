const BASE_URL = import.meta.env.VITE_API_BASE || '/api';
import { mapErrorToMessage } from '../utils/error-message';
import type { ApiError as ApiErrorT } from '../utils/error-message';
import { getDeviceToken } from '../utils/device-token';
import { loadUserToken } from '../utils/user-storage';

interface RequestOptions {
  url: string;
  method?:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'PATCH'
    | 'OPTIONS'
    | 'HEAD'
    | 'TRACE'
    | 'CONNECT';
  data?: any;
  header?: Record<string, string>;
  /** 超时时间（ms），默认 15000 */
  timeout?: number;
  /** 失败时是否静默（用于后台轮询） */
  silent?: boolean;
}

class HttpError extends Error implements ApiErrorT {
  code?: string;
  userMessage?: string;
  status: number;
  constructor(opts: ApiErrorT) {
    super(opts.message || 'Request failed');
    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.status = opts.status ?? 0;
  }
}

/** 将 HttpError 转成用户可读文案（在业务页 catch 中调用） */
export function httpErrorToMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return '操作失败，请稍后重试';
  return mapErrorToMessage(err as ApiErrorT);
}

/**
 * 全局网络状态订阅
 *  - 成功请求 → online=true
 *  - 网络层失败（fail）或 5xx → 通知 offline
 *  - 任何一端订阅即可在 App.vue 里驱动 banner
 */
type NetState = 'online' | 'offline' | 'unstable';
const netListeners = new Set<(s: NetState, info?: any) => void>();
let netState: NetState = 'online';
let unstableStreak = 0;

/** 401 注销钩子（App.vue 注册） */
type LogoutHandler = (reason: 'expired' | 'manual') => void;
const logoutHandlers = new Set<LogoutHandler>();
export function onLogout(fn: LogoutHandler): () => void {
  logoutHandlers.add(fn);
  return () => logoutHandlers.delete(fn);
}
function emitLogout(reason: 'expired' | 'manual') {
  logoutHandlers.forEach((fn) => fn(reason));
}

export function getNetState(): NetState {
  return netState;
}
export function onNetStateChange(fn: (s: NetState, info?: any) => void): () => void {
  netListeners.add(fn);
  return () => netListeners.delete(fn);
}
function emitNetState(s: NetState, info?: any) {
  if (netState === s) return;
  netState = s;
  netListeners.forEach((fn) => fn(s, info));
}

/** 是否正在处理 401（防多个并发请求同时触发跳转） */
let handling401 = false;
const emitNetStateIfReachable = (next: NetState, info?: any) => {
  // silent 请求不更新全局网络状态（避免后台轮询短暂失败把 banner 标红）
  // 调用方在判断 silent 之后才决定是否调用此函数
  emitNetState(next, info);
};

export const request = <T = any>(options: RequestOptions): Promise<T> => {
  const timeout = options.timeout ?? 15_000;
  const silent = options.silent === true;
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('flashmeet_token');
    // 服务端签发的稳定身份（最强召回 key，丢失后由 resolve 重新签发）
    const userToken = loadUserToken();
    const timer = setTimeout(() => {
      reject(new HttpError({ status: 0, message: 'timeout' }));
      if (!silent) {
        unstableStreak++;
        if (unstableStreak >= 2) emitNetState('unstable', { reason: 'timeout' });
      }
    }, timeout);

    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: (options.method || 'GET') as
        | 'OPTIONS'
        | 'GET'
        | 'HEAD'
        | 'POST'
        | 'PUT'
        | 'DELETE'
        | 'TRACE'
        | 'CONNECT',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        // 设备稳定身份：所有请求自动携带，后端用于"扫码静默召回"
        'X-Device-Token': getDeviceToken(),
        // 服务端签发身份：召回优先级最高，丢失场景下 resolve 会重新签发
        ...(userToken ? { 'X-User-Token': userToken } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header,
      },
      timeout,
      success: (res) => {
        clearTimeout(timer);
        const data: any = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300) {
          unstableStreak = 0;
          emitNetStateIfReachable('online');
          resolve(data as T);
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('flashmeet_token');
          emitLogout('expired');
          if (!handling401) {
            handling401 = true;
            uni.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 1800 });
            setTimeout(() => {
              uni.reLaunch({ url: '/pages/login/index' });
              handling401 = false;
            }, 600);
          }
          reject(new HttpError({ status: 401, message: 'Unauthorized' }));
        } else {
          if (!silent) {
            unstableStreak++;
            if (unstableStreak >= 3) emitNetState('unstable', { status: res.statusCode });
          }
          reject(
            new HttpError({
              status: res.statusCode,
              code: data?.code,
              message: data?.message,
              userMessage: data?.userMessage,
            }),
          );
        }
      },
      fail: (err) => {
        clearTimeout(timer);
        if (!silent) {
          unstableStreak++;
          emitNetState('offline', { err });
        }
        reject(
          new HttpError({
            status: 0,
            message: err?.errMsg || 'network error',
          }),
        );
      },
    });
  });
};

export default request;

// ── 请求重试与指数退避 ──────────────────────

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 判断错误是否可重试（网络错误、超时、5xx） */
function isRetryableErr(err: unknown): boolean {
  if (!(err instanceof HttpError)) return false;
  if (err.status === 0) return true; // 网络断连
  if (err.status === 408) return true;
  if (err.status >= 500) return true;
  if (err.message?.includes('timeout')) return true;
  return false;
}

/** 对请求包装指数退避重试 */
export async function requestWithRetry<T = any>(
  options: RequestOptions,
  retryOpts?: RetryOptions,
): Promise<T> {
  const maxRetries = retryOpts?.maxRetries ?? 3;
  const baseDelay = retryOpts?.baseDelay ?? 1000;
  const maxDelay = retryOpts?.maxDelay ?? 30000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await request<T>(options);
    } catch (err: unknown) {
      lastError = err;
      if (attempt === maxRetries || !isRetryableErr(err)) {
        throw err;
      }
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await sleep(delay);
    }
  }
  throw lastError;
}
