<template>
  <section id="scenarios" class="relative py-32 overflow-hidden">
    <div
      class="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-15 pointer-events-none"
      style="background: radial-gradient(circle, #ff6b6b 0%, transparent 60%);"
    />

    <div class="max-w-6xl mx-auto px-6">
      <div data-reveal class="fm-reveal text-center mb-20">
        <p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Scenarios</p>
        <h2 class="text-5xl md:text-6xl font-bold mb-6">
          <span class="fm-text-gradient-warm">六大落地场景</span>
        </h2>
        <p class="text-white/50 text-lg max-w-2xl mx-auto">
          从校园迎新到企业团建，从行业沙龙到私人派对，每一场聚会都能被重新定义。
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(s, i) in scenarios"
          :key="s.title"
          data-reveal
          class="fm-reveal fm-glass p-7 group relative overflow-hidden"
          :class="`fm-reveal-delay-${(i % 4) + 1}`"
        >
          <!-- hover 光晕 -->
          <div
            class="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            :style="{ background: `radial-gradient(circle at 50% 0%, ${s.glow} 0%, transparent 70%)` }"
          />
          <div class="relative">
            <div class="flex items-start justify-between mb-4">
              <div class="text-5xl group-hover:scale-110 transition-transform">{{ s.icon }}</div>
              <span class="text-xs text-white/30 fm-tabular">{{ s.tag }}</span>
            </div>
            <h3 class="text-xl font-bold mb-2">{{ s.title }}</h3>
            <p class="text-white/50 text-sm leading-relaxed">{{ s.desc }}</p>
            <div class="mt-5 flex flex-wrap gap-2">
              <span
                v-for="t in s.tags"
                :key="t"
                class="px-2.5 py-0.5 rounded-full text-xs bg-white/5 text-white/60 border border-white/5"
              >
                {{ t }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const scenarios = [
  {
    icon: '🎓',
    title: '校园迎新',
    desc: '让新生不再社恐，从入学的第一晚就找到归属感。',
    tag: 'Edu',
    glow: 'rgba(102, 126, 234, 0.4)',
    tags: ['破冰', '破圈', '校园'],
  },
  {
    icon: '🏢',
    title: '企业团建',
    desc: '让 HR 头疼的破冰游戏终于有解，团建效果可量化。',
    tag: 'Corp',
    glow: 'rgba(102, 126, 234, 0.4)',
    tags: ['破冰', '数据', 'ROI'],
  },
  {
    icon: '💼',
    title: '行业峰会',
    desc: '精准人脉匹配，让"加微信"变成"聊得来"。',
    tag: 'Biz',
    glow: 'rgba(79, 195, 247, 0.4)',
    tags: ['匹配', '人脉', '沉淀'],
  },
  {
    icon: '🎉',
    title: '私人派对',
    desc: '让派对燃到爆，宾客参与度拉满，朋友圈素材管够。',
    tag: 'Party',
    glow: 'rgba(255, 107, 107, 0.4)',
    tags: ['娱乐', '氛围', '传播'],
  },
  {
    icon: '🛍️',
    title: '商场开业',
    desc: '吸睛引流转化一体，把路人变成粉丝。',
    tag: 'Retail',
    glow: 'rgba(255, 215, 0, 0.4)',
    tags: ['引流', '转化', '品牌'],
  },
  {
    icon: '💒',
    title: '婚礼互动',
    desc: '宾客不再只顾低头吃饭，参与感拉满，祝福更走心。',
    tag: 'Wedding',
    glow: 'rgba(240, 147, 251, 0.4)',
    tags: ['祝福', '互动', '温情'],
  },
];
</script>
