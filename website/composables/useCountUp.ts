/**
 * useCountUp - 数字从 0 滚到目标值（视口可见时启动）
 *
 * 用法：
 *   const v = useCountUp(() => 1200)
 *   <span data-countup>{{ v }}</span>
 */
export function useCountUp(
  getTarget: () => number,
  durationMs = 1800,
) {
  const value = ref(0);
  if (import.meta.server) return value;

  let raf = 0;
  let started = false;

  const start = () => {
    if (started) return;
    started = true;
    const target = getTarget();
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      value.value = Math.floor(eased * target);
      if (p < 1) raf = requestAnimationFrame(tick);
      else value.value = target;
    };
    raf = requestAnimationFrame(tick);
  };

  onMounted(() => {
    // 找到第一个 [data-countup] 元素
    const node = document.querySelector('[data-countup]');
    if (!node) {
      start();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            start();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    onBeforeUnmount(() => {
      io.disconnect();
      cancelAnimationFrame(raf);
    });
  });

  return value;
}
