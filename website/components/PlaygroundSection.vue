<template>
  <section id="playground" class="relative py-32 overflow-hidden">
    <!-- 背景装饰 -->
    <div
      class="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
      style="background: radial-gradient(circle, #764ba2 0%, transparent 60%);"
    />

    <div class="max-w-6xl mx-auto px-6">
      <div data-reveal class="fm-reveal text-center mb-20">
        <p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Core Playgrounds</p>
        <h2 class="text-5xl md:text-6xl font-bold mb-6">
          <span class="fm-text-gradient">四大核心玩法</span>
        </h2>
        <p class="text-white/50 text-lg max-w-2xl mx-auto">
          点击下方任意一个 demo，立即体验。每一个都已经在数千场真实活动中跑通。
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- 抽奖 Demo -->
        <div
          data-reveal
          class="fm-reveal fm-glass p-8 cursor-pointer"
          @click="drawLottery"
        >
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">🎰</span>
            <h3 class="text-xl font-bold">互动抽奖</h3>
          </div>
          <p class="text-white/50 text-sm mb-6">原子性库存扣减，防超发防刷票。手机震动反馈，大屏实时滚动。</p>
          <!-- 抽奖舞台 -->
          <div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-white/5 flex items-center justify-center">
            <transition name="lottery">
              <div
                v-if="lotteryWinner"
                :key="lotteryKey"
                class="text-3xl font-bold fm-text-gradient-rainbow"
              >
                {{ lotteryWinner }}
              </div>
              <div v-else class="text-white/40 text-sm">{{ lotteryHint }}</div>
            </transition>
          </div>
          <button
            class="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition"
            :class="lotterySpinning
              ? 'bg-white/5 text-white/40 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white'"
            :disabled="lotterySpinning"
          >
            {{ lotterySpinning ? '抽奖中…' : '点我抽一次' }}
          </button>
        </div>

        <!-- 摇一摇 Demo -->
        <div
          data-reveal
          class="fm-reveal fm-reveal-delay-1 fm-glass p-8 cursor-pointer"
          @click="addShake"
        >
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">📱</span>
            <h3 class="text-xl font-bold">摇一摇大赛</h3>
          </div>
          <p class="text-white/50 text-sm mb-6">全场同频竞技，500ms 实时排行。突破社交冷场，瞬间点燃全场。</p>
          <!-- 摇一摇分 -->
          <div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-900/40 to-emerald-900/40 border border-white/5 flex flex-col items-center justify-center">
            <div class="text-5xl font-bold fm-text-gradient-cool fm-tabular">
              {{ shakeScore }}
            </div>
            <div class="text-white/40 text-xs mt-2">点击累积分数（模拟加速度计）</div>
          </div>
          <button
            class="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-white"
          >
            点击摇一下
          </button>
        </div>

        <!-- 匹配 Demo -->
        <div
          data-reveal
          class="fm-reveal fm-reveal-delay-2 fm-glass p-8 cursor-pointer"
          @click="startMatch"
        >
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">💫</span>
            <h3 class="text-xl font-bold">CP 盲盒匹配</h3>
          </div>
          <p class="text-white/50 text-sm mb-6">基于标签雷达的智能匹配，双盲破冰保护隐私。</p>
          <!-- 匹配动效 -->
          <div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-rose-900/40 to-orange-900/40 border border-white/5 flex items-center justify-center">
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-700"
                :class="matchMatched ? 'bg-rose-500/30' : 'bg-white/10'"
                :style="matchStyle.left"
              >
                👩
              </div>
              <transition name="heart">
                <div v-if="matchMatched" class="text-rose-400 text-2xl">💕</div>
              </transition>
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-700"
                :class="matchMatched ? 'bg-rose-500/30' : 'bg-white/10'"
                :style="matchStyle.right"
              >
                🧑
              </div>
            </div>
          </div>
          <button
            class="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition"
            :class="matching
              ? 'bg-white/5 text-white/40 cursor-not-allowed'
              : 'bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 text-white'"
            :disabled="matching"
          >
            {{ matching ? '匹配中…' : matchMatched ? '再来一组' : '开始匹配' }}
          </button>
        </div>

        <!-- 签到 Demo -->
        <div
          data-reveal
          class="fm-reveal fm-reveal-delay-3 fm-glass p-8 cursor-pointer"
          @click="addSignin"
        >
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">🌌</span>
            <h3 class="text-xl font-bold">星系签到</h3>
          </div>
          <p class="text-white/50 text-sm mb-6">扫码秒级上墙，化作暗星飞入星系。渐进式画像游戏化收集标签。</p>
          <!-- 星系 -->
          <div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900/60 to-violet-900/60 border border-white/5">
            <div
              v-for="(p, i) in signinDots"
              :key="i"
              class="absolute w-2 h-2 rounded-full bg-cyan-300"
              :style="{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: p.o,
                transform: `scale(${p.s})`,
                transition: 'all 0.4s',
                boxShadow: '0 0 8px rgba(79, 195, 247, 0.8)',
              }"
            />
            <div class="absolute bottom-2 right-3 text-xs text-white/40">
              {{ signinDots.length }} 颗星已点亮
            </div>
          </div>
          <button
            class="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 text-white"
          >
            点亮我的星
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// ===== 抽奖 =====
const participants = ['林深时见鹿', '海蓝时见鲸', 'Moonlight', '小狐狸', '星河', 'Lucky🐱', 'Echo', '奥利奥', '七月', '南风'];
const lotteryWinner = ref<string | null>(null);
const lotterySpinning = ref(false);
const lotteryHint = ref('点击下方按钮抽一次');
const lotteryKey = ref(0);
const drawLottery = () => {
  if (lotterySpinning.value) return;
  lotterySpinning.value = true;
  lotteryHint.value = '抽奖中…';
  let ticks = 0;
  const id = setInterval(() => {
    lotteryWinner.value = participants[Math.floor(Math.random() * participants.length)];
    lotteryKey.value++;
    ticks++;
    if (ticks > 10) {
      clearInterval(id);
      lotterySpinning.value = false;
    }
  }, 80);
};

// ===== 摇一摇 =====
const shakeScore = ref(0);
const addShake = () => {
  const inc = 5 + Math.floor(Math.random() * 15);
  shakeScore.value += inc;
  if ('vibrate' in navigator) navigator.vibrate(20);
};

// ===== 匹配 =====
const matching = ref(false);
const matchMatched = ref(false);
const matchStyle = reactive({ left: '', right: '' });
const startMatch = () => {
  if (matching.value) return;
  matchMatched.value = false;
  matchStyle.left = 'transform: translateX(-40px);';
  matchStyle.right = 'transform: translateX(40px);';
  matching.value = true;
  setTimeout(() => {
    matchStyle.left = '';
    matchStyle.right = '';
    matchMatched.value = true;
    matching.value = false;
  }, 1200);
};

// ===== 签到 =====
const signinDots = ref<{ x: number; y: number; o: number; s: number }[]>([]);
const addSignin = () => {
  signinDots.value.push({
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 70,
    o: 0,
    s: 0.5,
  });
  setTimeout(() => {
    const last = signinDots.value[signinDots.value.length - 1];
    if (last) {
      last.o = 1;
      last.s = 1.2 + Math.random() * 0.8;
    }
  }, 30);
  if (signinDots.value.length > 30) signinDots.value.shift();
};
</script>

<style scoped>
.lottery-enter-active, .lottery-leave-active { transition: all 0.1s; }
.lottery-enter-from { opacity: 0; transform: translateY(20px) scale(0.8); }
.lottery-leave-to { opacity: 0; transform: translateY(-20px) scale(0.8); }
.heart-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.heart-enter-from { opacity: 0; transform: scale(0); }
</style>
