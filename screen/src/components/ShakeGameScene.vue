<template>
  <div class="shake-game-scene">
    <!-- 粒子背景 -->
    <div class="bg-particles">
      <span v-for="n in 20" :key="n" class="bg-particle" :style="bgParticleStyle(n)" />
    </div>

    <!-- 倒计时 / 进度 -->
    <div class="header">
      <h1 class="title">🏁 摇一摇大赛</h1>
      <div v-if="endedAt" class="ended-badge">已结束</div>
      <div v-else-if="endsAt" class="countdown-wrap">
        <div class="countdown-ring" :style="ringStyle">
          <div class="countdown-num">{{ displayCountdown }}</div>
        </div>
      </div>
    </div>

    <!-- 终榜庆祝 -->
    <transition name="celebrate">
      <div v-if="showCelebrate && finalLeaderboard.length > 0" class="celebrate-banner">
        <div class="celebrate-confetti">
          <span v-for="n in 40" :key="n" class="confetti" :style="confettiStyle(n)" />
        </div>
        <div class="celebrate-title">🏆 比赛结束 🏆</div>
        <div class="podium">
          <div
            v-for="(p, i) in finalLeaderboard.slice(0, 3)"
            :key="p.user_id"
            class="podium-col"
            :class="`podium-${i + 1}`"
          >
            <div class="podium-rank">{{ ['🥇', '🥈', '🥉'][i] }}</div>
            <div class="podium-name">{{ p.nickname || p.display_id || '匿名' }}</div>
            <div class="podium-score">{{ p.score }}</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 赛道 -->
    <div class="race-track" v-if="leaderboard.length > 0">
      <div
        v-for="(player, index) in displayLeaderboard"
        :key="player.user_id"
        class="track-lane"
        :class="{ 'is-moving': isSessionActive }"
      >
        <div class="lane-number">{{ index + 1 }}</div>
        <div class="lane-info">
          <div class="avatar">
            <img v-if="player.avatar_url" :src="player.avatar_url" :alt="player.nickname" />
            <span v-else>{{ (player.nickname || player.display_id || '?')[0] }}</span>
          </div>
          <div class="nickname">{{ player.nickname || player.display_id || '匿名' }}</div>
        </div>
        <div class="lane-track">
          <div class="track-bg" :style="{ background: laneColors[index % laneColors.length] }" />
          <div
            class="car"
            :style="{
              left: `${Math.min((player.score / maxScore) * 85, 85)}%`,
              transform: `translateX(${Math.min((player.score / maxScore) * 85, 85)}%)`,
            }"
          >
            <span class="car-icon">🏎️</span>
            <div class="car-trail" />
          </div>
          <!-- 速度线 -->
          <div class="speed-lines" :style="{ opacity: isSessionActive ? 0.6 : 0.2 }">
            <span v-for="n in 5" :key="n" class="speed-line" />
          </div>
        </div>
        <div class="lane-score">
          <span class="score-value">{{ player.score }}</span>
          <span class="score-label">摇</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🎮</div>
      <p>等待参赛者加入...</p>
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';

const props = defineProps<{ leaderboard: any[] }>();
const emit = defineEmits<{
  (e: 'shake-started', data: { ends_at: number; duration_ms: number }): void;
  (e: 'shake-ended', data: { final_leaderboard: any[] }): void;
}>();

const endsAt = ref<number | null>(null);
const durationMs = ref(0);
const endedAt = ref<number | null>(null);
const finalLeaderboard = ref<any[]>([]);
const showCelebrate = ref(false);
const now = ref(Date.now());
let nowTimer: ReturnType<typeof setInterval> | null = null;

const isSessionActive = computed(() => {
  if (!endsAt.value) return false;
  return now.value < endsAt.value;
});

const elapsed = computed(() => {
  if (!endsAt.value || !durationMs.value) return 0;
  return Math.max(0, durationMs.value - (endsAt.value - now.value));
});

const progressPercent = computed(() => {
  if (!durationMs.value || !isSessionActive.value) return 0;
  return Math.min(100, (elapsed.value / durationMs.value) * 100);
});

const displayCountdown = computed(() => {
  if (!endsAt.value) return '--';
  const ms = Math.max(0, endsAt.value - now.value);
  return Math.ceil(ms / 1000);
});

const ringStyle = computed(() => {
  const pct = progressPercent.value;
  return {
    background: `conic-gradient(#ffd700 ${pct * 3.6}deg, transparent 0deg)`,
  };
});

const maxScore = computed(() => {
  if (props.leaderboard.length === 0) return 1;
  return Math.max(...props.leaderboard.map((p: any) => p.score || 0), 1);
});

const displayLeaderboard = computed(() => {
  return [...props.leaderboard]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8);
});

const laneColors = [
  'rgba(102, 126, 234, 0.15)',
  'rgba(118, 75, 162, 0.15)',
  'rgba(255, 107, 107, 0.15)',
  'rgba(79, 195, 247, 0.15)',
  'rgba(102, 187, 106, 0.15)',
  'rgba(255, 167, 38, 0.15)',
  'rgba(206, 147, 216, 0.15)',
  'rgba(77, 182, 172, 0.15)',
];

const bgParticleStyle = (n: number) => ({
  left: `${(n * 17 + 3) % 100}%`,
  animationDelay: `${(n * 0.4) % 3}s`,
  animationDuration: `${2 + (n % 3)}s`,
  opacity: 0.15 + (n % 3) * 0.1,
});

const confettiStyle = (n: number) => ({
  left: `${(n * 13 + 7) % 100}%`,
  animationDelay: `${Math.random() * 2}s`,
  animationDuration: `${2 + Math.random() * 3}s`,
  background: ['#ff6b6b', '#ffd700', '#667eea', '#4fc3f7', '#66bb6a'][n % 5],
  width: `${6 + (n % 5) * 2}px`,
  height: `${6 + (n % 5) * 2}px`,
});

// 公共方法供外部调用
const onShakeStarted = (data: { ends_at: number; duration_ms: number }) => {
  endsAt.value = data.ends_at;
  durationMs.value = data.duration_ms;
  endedAt.value = null;
  showCelebrate.value = false;
  finalLeaderboard.value = [];
  startTicking();
};

const onShakeEnded = (data: { final_leaderboard: any[] }) => {
  endedAt.value = Date.now();
  finalLeaderboard.value = data.final_leaderboard || [];
  stopTicking();
  setTimeout(() => {
    showCelebrate.value = true;
  }, 300);
};

const startTicking = () => {
  stopTicking();
  nowTimer = setInterval(() => {
    now.value = Date.now();
  }, 50);
};

const stopTicking = () => {
  if (nowTimer) {
    clearInterval(nowTimer);
    nowTimer = null;
  }
};

defineExpose({ onShakeStarted, onShakeEnded });

onUnmounted(() => stopTicking());
</script>

<style scoped>
.shake-game-scene {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  background: radial-gradient(ellipse at center, #1a1a4e 0%, #0a0a2e 70%);
  overflow: hidden;
  padding: 20px;
}

.bg-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-particle {
  position: absolute;
  top: 0;
  width: 3px;
  height: 3px;
  background: rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  animation: bgFloat 3s ease-in-out infinite;
}

@keyframes bgFloat {
  0%, 100% { transform: translateY(100vh) scale(1); opacity: 0; }
  50% { transform: translateY(50vh) scale(1.5); opacity: 0.5; }
}

.header {
  text-align: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.title {
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 14px;
}

.ended-badge {
  display: inline-block;
  padding: 6px 20px;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 999px;
  color: #ffd700;
  font-size: 0.9rem;
  font-weight: 600;
}

.countdown-wrap {
  display: flex;
  justify-content: center;
}

.countdown-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
}

.countdown-ring::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: #0a0a2e;
}

.countdown-num {
  position: relative;
  z-index: 1;
  font-size: 1.4rem;
  font-weight: 900;
  color: #ffd700;
}

/* 庆祝横幅 */
.celebrate-enter-active { transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.celebrate-leave-active { transition: all 0.3s ease-out; }
.celebrate-enter-from, .celebrate-leave-to { opacity: 0; transform: scale(0.8) translateY(20px); }

.celebrate-banner {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 46, 0.9);
  z-index: 100;
  backdrop-filter: blur(8px);
}

.celebrate-confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -10px;
  border-radius: 2px;
  animation: confettiFall 2.5s ease-in-out infinite;
}

@keyframes confettiFall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.celebrate-title {
  font-size: 3rem;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.4);
  margin-bottom: 40px;
  z-index: 1;
}

.podium {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  z-index: 1;
}

.podium-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border-radius: 16px;
  min-width: 160px;
  animation: podiumUp 0.6s ease-out;
}

.podium-1 { background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.3); padding-bottom: 48px; }
.podium-2 { background: rgba(192, 192, 192, 0.1); border: 1px solid rgba(192, 192, 192, 0.2); padding-bottom: 36px; }
.podium-3 { background: rgba(205, 127, 50, 0.1); border: 1px solid rgba(205, 127, 50, 0.2); padding-bottom: 24px; }

@keyframes podiumUp {
  0% { transform: translateY(40px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.podium-rank { font-size: 2.5rem; margin-bottom: 8px; }
.podium-name { font-size: 1.2rem; font-weight: 700; color: white; margin-bottom: 6px; }
.podium-score { font-size: 1.5rem; font-weight: 900; color: #ffd700; }

/* 赛道 */
.race-track {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  overflow-y: auto;
}

.track-lane {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.track-lane.is-moving {
  border-color: rgba(255, 215, 0, 0.15);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.05);
}

.lane-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.lane-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 120px;
  flex-shrink: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #667eea;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nickname {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lane-track {
  flex: 1;
  height: 36px;
  border-radius: 18px;
  position: relative;
  overflow: hidden;
}

.track-bg {
  position: absolute;
  inset: 0;
  border-radius: 18px;
}

.speed-lines {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 12px;
  pointer-events: none;
}

.speed-line {
  width: 2px;
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
  animation: speedLine 1s linear infinite;
}

.speed-line:nth-child(2) { animation-delay: 0.2s; }
.speed-line:nth-child(3) { animation-delay: 0.4s; }
.speed-line:nth-child(4) { animation-delay: 0.6s; }
.speed-line:nth-child(5) { animation-delay: 0.8s; }

@keyframes speedLine {
  0% { transform: translateX(-100px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100px); opacity: 0; }
}

.car {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.car-icon {
  font-size: 1.4rem;
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.5));
  display: block;
}

.car-trail {
  position: absolute;
  top: 50%;
  right: 100%;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4));
  transform: translateY(-50%);
}

.lane-score {
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.score-value {
  font-size: 1.1rem;
  font-weight: 900;
  color: #ffd700;
}

.score-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 1.1rem;
}

.empty-icon {
  font-size: 3rem;
  animation: emptyFloat 2s ease-in-out infinite;
}

@keyframes emptyFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}
</style>