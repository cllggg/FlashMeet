/**
 * 通用「可重试」action 包装
 *
 * 用法：
 *   const submit = useRetryableAction(async () => {
 *     await someApi.x();
 *   });
 *   submit.run();
 *   // 失败后：
 *   submit.retry();
 */
import { ref } from 'vue';
import { mapErrorToMessage, isRetryable } from './error-message';

export function useRetryableAction(
  fn: () => Promise<any>,
  opts: { onError?: (msg: string) => void } = {},
) {
  const loading = ref(false);
  const errorMsg = ref('');
  const canRetry = ref(false);
  const lastArgs: { value: any[] | null } = { value: null };

  const run = async (...args: any[]) => {
    lastArgs.value = args;
    loading.value = true;
    errorMsg.value = '';
    canRetry.value = false;
    try {
      const res = await fn();
      return res;
    } catch (err) {
      const apiErr = err as any;
      const msg = mapErrorToMessage(apiErr);
      errorMsg.value = msg;
      canRetry.value = isRetryable(apiErr);
      opts.onError?.(msg);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const retry = () => run(...(lastArgs.value || []));

  return { loading, errorMsg, canRetry, run, retry };
}
