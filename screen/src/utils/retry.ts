/**
 * 请求重试与指数退避工具
 * 设计文档 5.1 弱网环境要求：自动重试 + 退避
 */

interface RetryOptions {
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
  /** 基础退避延迟（ms），默认 1000 */
  baseDelay?: number;
  /** 最大退避延迟（ms），默认 30000 */
  maxDelay?: number;
  /** 判断错误是否可重试 */
  isRetryable?: (error: any) => boolean;
  /** 每次重试前的回调 */
  onRetry?: (attempt: number, delay: number) => void;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  isRetryable: (error: any) => {
    // 网络错误、超时、5xx 可重试；4xx 不可重试
    if (error?.status === 0) return true; // 网络断连
    if (error?.status === 408) return true; // 超时
    if (error?.status && error.status >= 500) return true; // 5xx
    if (error?.code === 'ECONNABORTED') return true;
    if (error?.message?.includes('timeout')) return true;
    if (error?.message?.includes('Network Error')) return true;
    return false;
  },
  onRetry: () => {},
};

/**
 * 对异步函数 fn 包装指数退避重试
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt === opts.maxRetries || !opts.isRetryable(err)) {
        throw err;
      }
      // 指数退避：baseDelay * 2^attempt，上限 maxDelay
      const delay = Math.min(opts.baseDelay * Math.pow(2, attempt), opts.maxDelay);
      opts.onRetry(attempt + 1, delay);
      await sleep(delay);
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 判断是否为可重试错误
 */
export function isRetryableError(err: any): boolean {
  return defaultRetryOptions.isRetryable(err);
}