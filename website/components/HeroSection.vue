<template>
  <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
    <!-- 星空背景 -->
    <StarField class="absolute inset-0" />

    <!-- 顶部装饰光晕 -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl pointer-events-none"
      style="background: radial-gradient(circle, rgba(102, 126, 234, 0.5) 0%, transparent 60%);"
    />

    <div class="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
      <!-- 顶部 tag -->
      <div
        data-reveal
        class="fm-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur mb-8 text-sm text-white/70"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 fm-pulse-glow"></span>
        正在为 <span class="text-emerald-300 fm-tabular">{{ liveEvents }}</span> 场活动提供支持
      </div>

      <!-- 主标题 -->
      <h1
        data-reveal
        class="fm-reveal fm-reveal-delay-1 text-6xl md:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
      >
        <span class="fm-text-gradient-rainbow">聚闪耀</span>
        <span class="text-white/90 ml-3">FlashMeet</span>
      </h1>

      <!-- 副标题 -->
      <p
        data-reveal
        class="fm-reveal fm-reveal-delay-2 text-xl md:text-2xl text-white/60 mb-3"
      >
        计算相遇的概率，渲染心动的瞬间
      </p>
      <p
        data-reveal
        class="fm-reveal fm-reveal-delay-3 text-base md:text-lg text-white/40 max-w-2xl mx-auto mb-12"
      >
        线下聚会互动大屏系统：扫码签到、星系上墙、实时互动游戏、智能匹配。
        <br class="hidden md:block" />
        让 30 秒破冰不再只是传说，让每一场聚会都闪耀。
      </p>

      <!-- CTA -->
      <div
        data-reveal
        class="fm-reveal fm-reveal-delay-4 flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <a class="fm-btn fm-btn-primary" href="#playground">
          立即体验 Demo
          <span class="ml-2">→</span>
        </a>
        <a class="fm-btn fm-btn-ghost" href="#scenarios">
          了解应用场景
        </a>
      </div>

      <!-- 实时数据条 -->
      <div
        data-reveal
        class="fm-reveal fm-reveal-delay-4 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-left"
      >
        <div v-for="m in quickStats" :key="m.label" class="border-l border-white/10 pl-4">
          <div class="text-2xl md:text-3xl font-bold fm-text-gradient fm-tabular">
            {{ m.value }}
          </div>
          <div class="text-xs text-white/40 mt-1">{{ m.label }}</div>
        </div>
      </div>
    </div>

    <!-- 向下滚动提示 -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-sm flex flex-col items-center gap-2 animate-bounce">
      <span>向下探索</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
// 实时"活动数" 浮点模拟（带轻微随机游走）
const liveEvents = ref(38);
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    const next = liveEvents.value + (Math.random() > 0.5 ? 1 : -1);
    liveEvents.value = Math.max(20, Math.min(80, next));
  }, 4200);
});
onBeforeUnmount(() => { if (timer) clearInterval(timer); });

const quickStats = [
  { value: '30s', label: '扫码即用' },
  { value: '10K+', label: '并发互动' },
  { value: '50+', label: '覆盖城市' },
  { value: '4.9/5', label: '用户评分' },
];
</script>
