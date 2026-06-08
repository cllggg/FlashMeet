<template>
  <section class="relative py-24">
    <div class="max-w-6xl mx-auto px-6">
      <div data-reveal class="fm-reveal text-center mb-12">
        <p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Trusted By</p>
        <h2 class="text-3xl md:text-4xl font-bold text-white/80">
          已被 <span class="fm-text-gradient">内测合作伙伴</span> 选择
        </h2>
      </div>

      <div data-reveal class="fm-reveal fm-glass p-10 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
        <div v-for="(p, i) in partners" :key="i" class="flex flex-col items-center gap-2 group">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
            :style="{ background: p.bg }"
          >
            {{ p.icon }}
          </div>
          <div class="text-sm text-white/50 group-hover:text-white/90 transition">
            {{ p.name }}
          </div>
          <div class="text-xs text-white/30">{{ p.type }}</div>
        </div>
      </div>

      <p class="text-center text-white/30 text-xs mt-6">
        * 合作伙伴占位，实际合作请联系我们补充。
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const partners = [
  { name: '某高校学生会', type: '校园活动', icon: '🎓', bg: 'rgba(102, 126, 234, 0.2)' },
  { name: '某互联网公司', type: '企业团建', icon: '🏢', bg: 'rgba(79, 195, 247, 0.2)' },
  { name: '某 Live House', type: '线下派对', icon: '🎤', bg: 'rgba(255, 107, 107, 0.2)' },
  { name: '某行业沙龙', type: 'B 端峰会', icon: '💼', bg: 'rgba(255, 215, 0, 0.2)' },
];
</script>
