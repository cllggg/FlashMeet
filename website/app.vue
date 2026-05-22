<template>
  <div class="min-h-screen bg-gradient-to-b from-[#0a0a2e] to-[#1a1a4e] text-white">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="max-w-6xl mx-auto px-6 py-20 text-center relative z-10">
        <h1 class="text-6xl md:text-7xl font-bold mb-6">
          <span class="bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            聚闪耀
          </span>
          <span class="text-white ml-2">FlashMeet</span>
        </h1>
        <p class="text-2xl md:text-3xl text-white/60 mb-4">
          计算相遇的概率，渲染心动的瞬间
        </p>
        <p class="text-lg text-white/40 mb-12 max-w-2xl mx-auto">
          线下聚会互动大屏系统，让每一场聚会都闪耀。扫码签到、星系上墙、实时互动游戏、智能匹配，一站式解决聚会冷场问题。
        </p>
        <div class="flex gap-4 justify-center">
          <button class="px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-lg font-bold hover:opacity-90 transition">
            扫码注册成为主持人
          </button>
          <button class="px-8 py-4 border border-white/20 rounded-full text-lg text-white/70 hover:border-white/40 transition">
            了解更多
          </button>
        </div>
      </div>
      <!-- Background particles -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div v-for="i in 20" :key="i"
          class="absolute w-2 h-2 bg-[#667eea]/30 rounded-full"
          :style="{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }"
        />
      </div>
    </section>

    <!-- Features Section -->
    <section class="max-w-6xl mx-auto px-6 py-20">
      <h2 class="text-4xl font-bold text-center mb-16">
        <span class="bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
          核心玩法
        </span>
      </h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div v-for="feature in features" :key="feature.title"
          class="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#667eea]/50 transition">
          <div class="text-5xl mb-4">{{ feature.icon }}</div>
          <h3 class="text-xl font-bold mb-3">{{ feature.title }}</h3>
          <p class="text-white/50">{{ feature.desc }}</p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="max-w-6xl mx-auto px-6 py-20">
      <h2 class="text-4xl font-bold text-center mb-16">
        <span class="bg-gradient-to-r from-[#4fc3f7] to-[#66bb6a] bg-clip-text text-transparent">
          四步闪耀
        </span>
      </h2>
      <div class="grid md:grid-cols-4 gap-6">
        <div v-for="(step, i) in steps" :key="step.title" class="text-center">
          <div class="w-16 h-16 mx-auto rounded-full bg-[#667eea]/20 flex items-center justify-center text-2xl font-bold text-[#667eea] mb-4">
            {{ i + 1 }}
          </div>
          <h3 class="text-lg font-bold mb-2">{{ step.title }}</h3>
          <p class="text-white/40 text-sm">{{ step.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Scenarios -->
    <section class="max-w-6xl mx-auto px-6 py-20">
      <h2 class="text-4xl font-bold text-center mb-16">
        <span class="bg-gradient-to-r from-[#ff6b6b] to-[#ffd700] bg-clip-text text-transparent">
          应用场景
        </span>
      </h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div v-for="scene in scenarios" :key="scene.title"
          class="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
          <span class="text-4xl">{{ scene.icon }}</span>
          <div>
            <h3 class="font-bold mb-1">{{ scene.title }}</h3>
            <p class="text-white/40 text-sm">{{ scene.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/10 py-12 text-center text-white/30">
      <p>聚闪耀 FlashMeet - 计算相遇的概率，渲染心动的瞬间</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '🌌',
    title: '星系签到',
    desc: '扫码秒级上墙，化作暗星飞入星系。渐进式画像游戏化收集标签，无感高效。',
  },
  {
    icon: '🎰',
    title: '互动抽奖',
    desc: '大屏实时滚动抽奖，手机震动反馈中奖。原子性库存扣减，防超发防刷票。',
  },
  {
    icon: '📱',
    title: '摇一摇大赛',
    desc: '全场同频竞技，500ms实时排行大屏渲染。突破社交冷场，瞬间点燃全场。',
  },
  {
    icon: '🎯',
    title: '移动场控',
    desc: '主持人在手机上一键切屏，副场控无缝接管。再也不怕主场控断网断电。',
  },
  {
    icon: '💫',
    title: 'CP盲盒匹配',
    desc: '基于标签雷达的智能匹配，双盲破冰保护隐私。双方同意才交换名片。',
  },
  {
    icon: '🏆',
    title: '数字成就卡',
    desc: '活动结束自动生成社交成就卡，鼓励分享裂变。延时社交沉淀池，活动后仍可破冰。',
  },
];

const steps = [
  { title: '主持人建会', desc: '小程序创建聚会，配置互动游戏' },
  { title: '大屏就绪', desc: '电脑打开链接，自动检测3D/2D' },
  { title: '扫码互动', desc: '参会者扫码签到，参与游戏抽奖' },
  { title: '数据沉淀', desc: '活动结束，成就卡裂变+数据报告' },
];

const scenarios = [
  { icon: '🏢', title: '企业团建', desc: '破冰互动，增强团队凝聚力' },
  { icon: '🎓', title: '校园活动', desc: '迎新晚会，让新生快速融入' },
  { icon: '💼', title: '行业峰会', desc: '社交匹配，精准连接人脉' },
  { icon: '🎉', title: '私人聚会', desc: '派对游戏，让聚会不再无聊' },
];
</script>

<style>
@keyframes float {
  0%, 100% { transform: translateY(0px); opacity: 0.3; }
  50% { transform: translateY(-20px); opacity: 0.8; }
}
</style>
