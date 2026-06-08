/**
 * useReveal - 滚动揭示动画
 * 给元素加上 .fm-reveal + data-reveal，进入视口时自动加 .is-visible
 */
export function useReveal() {
  if (import.meta.server) return;

  onMounted(() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    els.forEach((el) => io.observe(el));
    onBeforeUnmount(() => io.disconnect());
  });
}
