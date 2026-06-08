<template>
  <section class="relative py-32">
    <div class="max-w-6xl mx-auto px-6">
      <div data-reveal class="fm-reveal text-center mb-20">
        <p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">By the Numbers</p>
        <h2 class="text-5xl md:text-6xl font-bold mb-6">
          数据 <span class="fm-text-gradient-cool">不说谎</span>
        </h2>
        <p class="text-white/50 text-lg max-w-2xl mx-auto">
          从内测到生产环境，每一个数字都来自真实运行。
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6" data-countup>
        <div
          v-for="(m, i) in metrics"
          :key="m.label"
          data-reveal
          class="fm-reveal fm-glass p-6 text-center"
          :class="`fm-reveal-delay-${(i % 4) + 1}`"
        >
          <div class="text-4xl md:text-5xl font-bold fm-text-gradient fm-tabular mb-2">
            {{ displayValue(m, i) }}{{ m.suffix }}
          </div>
          <div class="text-sm text-white/55">{{ m.label }}</div>
          <div class="text-xs text-white/30 mt-2">{{ m.note }}</div>
        </div>
      </div>

      <!-- 性能指标条 -->
      <div data-reveal class="fm-reveal mt-16 fm-glass p-8">
        <h3 class="text-lg font-bold mb-6 text-white/80">⚡ 性能基线（生产环境）</h3>
        <div class="space-y-5">
          <div v-for="bar in perfBars" :key="bar.label">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-white/70">{{ bar.label }}</span>
              <span class="text-white/90 fm-tabular font-semibold">{{ bar.value }}</span>
            </div>
            <div class="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000"
                :style="{
                  width: bar.w + '%',
                  background: bar.color,
                  boxShadow: `0 0 12px ${bar.color}`,
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type Metric = { value: number; suffix: string; label: string; note: string };
const metrics: Metric[] = [
  { value: 1280, suffix: '+', label: '累计活动场次', note: '覆盖 50+ 城市' },
  { value: 48, suffix: 'K+', label: '累计签到用户', note: '内测期数据' },
  { value: 10000, suffix: '+', label: '单场并发互动', note: 'WebSocket 压测峰值' },
  { value: 99, suffix: '%', label: '签到成功率', note: '弱网 5s 兜底' },
];

// 让每个数字走自己的 useCountUp（通过 ref 注入）
const m0 = useCountUp(() => metrics[0].value);
const m1 = useCountUp(() => metrics[1].value);
const m2 = useCountUp(() => metrics[2].value);
const m3 = useCountUp(() => metrics[3].value);
const live = [m0, m1, m2, m3];

const displayValue = (_: Metric, i: number) => {
  const v = live[i].value;
  if (v >= 1000) return v.toLocaleString();
  return v;
};

const perfBars = [
  { label: '签到响应 P99', value: '< 80ms', w: 92, color: 'linear-gradient(90deg, #66bb6a, #4fc3f7)' },
  { label: 'WebSocket 消息延迟', value: '< 120ms', w: 88, color: 'linear-gradient(90deg, #4fc3f7, #667eea)' },
  { label: '抽奖并发吞吐', value: '5K QPS', w: 96, color: 'linear-gradient(90deg, #667eea, #764ba2)' },
  { label: '大屏 FPS（3D 模式）', value: '60 FPS', w: 100, color: 'linear-gradient(90deg, #764ba2, #f093fb)' },
];
</script>
