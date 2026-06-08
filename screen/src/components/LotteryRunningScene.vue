<template>
  <div class="lottery-running-scene">
    <!-- 背景粒子效果 -->
    <div class="particles">
      <div v-for="n in 30" :key="n" class="particle" :style="particleStyle(n)" />
    </div>

    <!-- 上一轮结果展示 -->
    <div class="last-winner-wrapper" v-if="lastWinner" :class="{ 'reveal': lastWinnerJustRevealed }">
      <div class="spotlight" />
      <div class="spotlight-beam" />
      <div class="winner-reveal">
        <div class="winner-confetti-ring">
          <span v-for="n in 12" :key="n" class="w-confetti" :style="wConfettiStyle(n)">✦</span>
        </div>
        <div class="winner-crown">🏆</div>
        <div class="winner-display-id">{{ lastWinner.display_id || lastWinner.user?.nickname }}</div>
        <div class="winner-prize-tag">{{ lastWinner.prize_name }}</div>
        <div class="winner-congrats">{{ congratsMessage }}</div>
      </div>
    </div>

    <!-- 滚动中：名字滚动效果 -->
    <div class="center-content" v-else>
      <h1 class="title">抽奖中</h1>
      <div class="slot-machine">
        <div class="slot-window">
          <div class="slot-scroll" :class="{ 'rolling': isRolling }">
            <div class="slot-name" v-for="n in 20" :key="n">{{ randomName() }}</div>
          </div>
        </div>
        <div class="slot-glow" />
      </div>
      <p class="hint">紧张刺激的抽奖环节...</p>
    </div>

    <!-- 中奖名单 -->
    <div class="winners-panel" v-if="winners.length > 0">
      <h2 class="panel-title">
        <span class="trophy">🎉</span>
        中奖名单 ({{ winners.length }})
      </h2>
      <TransitionGroup name="winner-list" tag="div" class="winners-grid">
        <div
          class="winner-card"
          v-for="(winner, idx) in winners"
          :key="winner.id"
          :style="{ animationDelay: idx * 0.1 + 's' }"
        >
          <div class="winner-rank" :class="rankClass(idx)">{{ idx + 1 }}</div>
          <div class="winner-info">
            <span class="winner-dname">{{ winner.display_id || winner.user?.nickname || '幸运儿' }}</span>
          </div>
          <span class="winner-prize-badge">{{ winner.prize_name }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{ winners: any[] }>();
const isRolling = ref(true);
const rollTimer = ref<ReturnType<typeof setInterval> | null>(null);

// 最近揭晓的 winner
const lastWinner = computed(() => {
  if (props.winners.length === 0) return null;
  return props.winners[props.winners.length - 1];
});

const lastWinnerJustRevealed = ref(false);

const congratsMessages = [
  '恭喜！幸运之星降临！',
  '太棒了！你就是今晚的主角！',
  '幸运大爆发！恭喜获奖！',
  '命运的齿轮为你转动！',
  '闪耀时刻！恭喜恭喜！',
  '天选之人就是你！',
  '好运连连，恭喜中奖！',
  '这一刻，聚光灯为你而亮！',
];

const congratsMessage = computed(() => {
  if (!lastWinner.value) return '';
  const idx = Math.floor(Math.random() * congratsMessages.length);
  return congratsMessages[idx];
});

watch(
  () => props.winners.length,
  (newLen, oldLen) => {
    if (newLen > (oldLen || 0)) {
      isRolling.value = false;
      lastWinnerJustRevealed.value = true;
      setTimeout(() => {
        lastWinnerJustRevealed.value = false;
        isRolling.value = true;
      }, 4000);
    }
  },
);

// 模拟滚动名字
const fakeNames = [
  'A001', 'B012', 'C023', 'D034', 'E045', 'F056', 'G067', 'H078',
  'I089', 'J090', 'K101', 'L112', 'M123', 'N134', 'O145', 'P156',
  'Q167', 'R178', 'S189', 'T190', 'U201', 'V212', 'W223', 'X234',
];
let nameIdx = 0;
const randomName = () => {
  nameIdx = (nameIdx + 1) % fakeNames.length;
  return fakeNames[nameIdx];
};

const rankClass = (idx: number) => {
  if (idx === 0) return 'rank-gold';
  if (idx === 1) return 'rank-silver';
  if (idx === 2) return 'rank-bronze';
  return '';
};

const particleStyle = (n: number) => ({
  left: `${(n * 13 + 7) % 100}%`,
  top: `${(n * 17 + 3) % 100}%`,
  animationDelay: `${(n * 0.3) % 4}s`,
  animationDuration: `${3 + (n % 4)}s`,
  width: `${3 + (n % 4)}px`,
  height: `${3 + (n % 4)}px`,
  background: n % 3 === 0 ? '#ffd700' : n % 3 === 1 ? '#ff6b35' : '#667eea',
  opacity: 0.3 + (n % 3) * 0.15,
});

const wConfettiStyle = (n: number) => {
  const angle = (n / 12) * 360;
  const distance = 100 + (n % 3) * 30;
  const rad = (angle * Math.PI) / 180;
  return {
    '--x': `${Math.cos(rad) * distance}px`,
    '--y': `${Math.sin(rad) * distance}px`,
    animationDelay: `${n * 0.1}s`,
    color: ['#ffd700', '#ff6b35', '#667eea', '#4fc3f7'][n % 4],
  };
};
</script>

<style scoped>
.lottery-running-scene {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #1a1040 0%, #0a0a1e 80%);
}

/* 粒子 */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  animation: floatUp 4s ease-in-out infinite;
}

@keyframes floatUp {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
  50% { transform: translateY(-30px) scale(1.5); opacity: 0.7; }
}

/* 结果揭晓 */
.last-winner-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.last-winner-wrapper.reveal {
  animation: revealIn 0.5s ease-out;
}

@keyframes revealIn {
  0% { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}

.spotlight {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%);
  animation: spotlightPulse 2s ease-in-out infinite;
}

.spotlight-beam {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, transparent, rgba(255, 215, 0, 0.2), transparent);
  left: 50%;
  transform: translateX(-50%);
}

@keyframes spotlightPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 1; }
}

.winner-reveal {
  position: relative;
  text-align: center;
  z-index: 1;
}

.winner-confetti-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.w-confetti {
  position: absolute;
  font-size: 1.5rem;
  animation: confettiBurst 2s ease-out infinite;
  opacity: 0;
}

@keyframes confettiBurst {
  0% { transform: translate(0, 0) scale(0); opacity: 0; }
  30% { transform: translate(var(--x), var(--y)) scale(1.5); opacity: 1; }
  100% { transform: translate(calc(var(--x) * 1.5), calc(var(--y) * 1.5)) scale(0); opacity: 0; }
}

.winner-crown {
  font-size: 5rem;
  animation: crownBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-bottom: 10px;
}

@keyframes crownBounce {
  0% { transform: scale(0) rotate(-20deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.winner-display-id {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b35 50%, #ffd700 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 2s ease-in-out infinite;
  margin-bottom: 12px;
  letter-spacing: 0.12em;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.winner-prize-tag {
  display: inline-block;
  padding: 10px 28px;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 999px;
  color: #ffd700;
  font-size: 1.4rem;
  font-weight: 700;
  animation: tagIn 0.5s 0.3s ease-out both;
}

.winner-congrats {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 16px;
  animation: tagIn 0.5s 0.5s ease-out both;
  font-style: italic;
}

@keyframes tagIn {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

/* 滚动 */
.center-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.title {
  font-size: 3.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 30px;
  letter-spacing: 0.1em;
}

.slot-machine {
  position: relative;
  margin-bottom: 30px;
}

.slot-window {
  width: 300px;
  height: 60px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  position: relative;
}

.slot-scroll {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.slot-scroll.rolling {
  animation: slotSpin 0.1s steps(3) infinite;
}

@keyframes slotSpin {
  0% { transform: translateY(0); }
  100% { transform: translateY(-60px); }
}

.slot-name {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 900;
  color: rgba(255, 215, 0, 0.8);
  letter-spacing: 0.2em;
}

.slot-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  height: 80px;
  border-radius: 18px;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.15), inset 0 0 40px rgba(255, 215, 0, 0.05);
  pointer-events: none;
}

.hint {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.05em;
}

/* 中奖名单 */
.winners-panel {
  position: absolute;
  bottom: 30px;
  left: 30px;
  right: 30px;
  z-index: 5;
}

.panel-title {
  font-size: 1.1rem;
  color: rgba(255, 215, 0, 0.7);
  margin-bottom: 12px;
  letter-spacing: 0.05em;
}

.trophy {
  margin-right: 8px;
}

.winners-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.winner-list-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.winner-list-leave-active {
  transition: all 0.2s ease-out;
}

.winner-list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.winner-list-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

.winner-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  animation: cardIn 0.4s ease-out both;
}

@keyframes cardIn {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.winner-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.winner-rank.rank-gold {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.winner-rank.rank-silver {
  background: rgba(192, 192, 192, 0.15);
  color: #c0c0c0;
}

.winner-rank.rank-bronze {
  background: rgba(205, 127, 50, 0.15);
  color: #cd7f32;
}

.winner-info {
  display: flex;
  align-items: center;
}

.winner-dname {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.winner-prize-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 215, 0, 0.12);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.2);
}
</style>