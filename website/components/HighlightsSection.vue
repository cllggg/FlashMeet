<template>
  <section class="relative py-32">
    <div class="max-w-6xl mx-auto px-6">
      <div data-reveal class="fm-reveal text-center mb-20">
        <p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Under the Hood</p>
        <h2 class="text-5xl md:text-6xl font-bold mb-6">
          <span class="fm-text-gradient">技术护城河</span>
        </h2>
        <p class="text-white/50 text-lg max-w-2xl mx-auto">
          不只是看起来酷炫。我们把稳定性、易用性、扩展性都做到了生产级。
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="(h, i) in highlights"
          :key="h.title"
          data-reveal
          class="fm-reveal fm-glass p-6"
          :class="`fm-reveal-delay-${(i % 4) + 1}`"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
              {{ h.icon }}
            </div>
            <h3 class="text-lg font-bold">{{ h.title }}</h3>
          </div>
          <p class="text-white/55 text-sm leading-relaxed">{{ h.desc }}</p>
          <div v-if="h.code" class="mt-3 text-xs text-emerald-300 font-mono">
            {{ h.code }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const highlights = [
  {
    icon: '🚀',
    title: '三端协同',
    desc: 'miniapp / screen / backend 单一仓库，端到端类型安全，毫秒级联调。',
  },
  {
    icon: '🔒',
    title: 'Lua 原子扣库存',
    desc: '抽奖库存走 Redis Lua 脚本，杜绝超发与并发穿透。',
    code: 'EVAL deduct-prize.lua KEYS[1] ARGV[1]',
  },
  {
    icon: '📡',
    title: 'WebSocket 重连 + 幂等',
    desc: '断网重连自动恢复，现场去重 seqId，绝不丢消息。',
  },
  {
    icon: '📶',
    title: '弱网 5s 兜底',
    desc: '签到/答题本地缓存，恢复网络后自动补发，弱网不掉线。',
  },
  {
    icon: '🎮',
    title: '3D / 2D 自适应',
    desc: '大屏自动检测 WebGL 能力，无 3D 降级 CSS 动画。',
  },
  {
    icon: '🛠️',
    title: '可观测内置',
    desc: '客户端错误实时上报，活动复盘一键导出。',
  },
];
</script>
