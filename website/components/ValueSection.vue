<template>
  <section class="relative py-32">
    <div class="max-w-6xl mx-auto px-6">
      <div data-reveal class="fm-reveal text-center mb-20">
        <p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Why FlashMeet</p>
        <h2 class="text-5xl md:text-6xl font-bold mb-6">
          为什么主办方选择 <span class="fm-text-gradient">我们</span>
        </h2>
        <p class="text-white/50 text-lg max-w-2xl mx-auto">
          不止是娱乐工具，更是用户增长与社交资产沉淀的操作系统。
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="(v, i) in values"
          :key="v.title"
          data-reveal
          class="fm-reveal fm-glass p-8 group"
          :class="`fm-reveal-delay-${i + 1}`"
        >
          <!-- 数字序号 -->
          <div class="text-xs text-white/30 fm-tabular mb-4">0{{ i + 1 }}</div>
          <!-- 大图标 -->
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3"
            :style="{
              background: v.bg,
              boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
            }"
          >
            {{ v.icon }}
          </div>
          <h3 class="text-2xl font-bold mb-3">{{ v.title }}</h3>
          <p class="text-white/55 leading-relaxed mb-6">{{ v.desc }}</p>
          <ul class="space-y-2">
            <li v-for="b in v.bullets" :key="b" class="flex items-start gap-2 text-sm text-white/60">
              <span class="text-emerald-400 mt-0.5">✓</span>
              <span>{{ b }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const values = [
  {
    icon: '⚡',
    title: '打破尴尬',
    desc: '30 秒破冰不再是传说。我们用游戏化机制把"破冰"从心理门槛变成视觉冲击。',
    bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    bullets: [
      '扫码即参与，零下载',
      '渐进式画像，越玩越懂你',
      '大屏视觉冲击，让冷场变爆点',
    ],
  },
  {
    icon: '🚀',
    title: '激活参与',
    desc: '从"低头族"到"全场焦点"。让每一个参与者都有戏，让主持人不再尬场。',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bullets: [
      '万人并发不卡',
      '实时排行，激发竞争心',
      '副场控无缝接管，不怕断网',
    ],
  },
  {
    icon: '💎',
    title: '沉淀资产',
    desc: '不只是娱乐，更是用户画像与社交关系。活动结束，资产留得住。',
    bg: 'linear-gradient(135deg, #4fc3f7 0%, #66bb6a 100%)',
    bullets: [
      '数字成就卡裂变传播',
      '延时社交池，活动后仍可破冰',
      '复盘数据看板，量化活动 ROI',
    ],
  },
];
</script>
