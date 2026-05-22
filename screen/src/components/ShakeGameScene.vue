<template>
  <div class="shake-game-scene">
    <div class="header">
      <h1 class="title">摇一摇大赛</h1>
      <p class="subtitle">疯狂摇动手机！</p>
    </div>

    <div class="race-track">
      <div
        v-for="(player, index) in leaderboard"
        :key="player.user_id"
        class="track-lane"
      >
        <div class="lane-number">{{ index + 1 }}</div>
        <div class="lane-track">
          <div
            class="car"
            :style="{ left: `${Math.min((player.score / maxScore) * 90, 90)}%` }"
          >
            <span class="car-icon">🏎️</span>
          </div>
        </div>
        <div class="lane-score">{{ player.score }}</div>
      </div>
    </div>

    <div v-if="leaderboard.length === 0" class="empty-state">
      <p>等待参赛者...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ leaderboard: any[] }>();

const maxScore = computed(() => {
  if (props.leaderboard.length === 0) return 1;
  return Math.max(...props.leaderboard.map((p) => p.score), 1);
});
</script>

<style scoped>
.shake-game-scene {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 40px 60px;
  background: radial-gradient(ellipse at center, #1a1a4e 0%, #0a0a2e 70%);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 3rem;
  color: #ff6b6b;
  text-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
}

.subtitle {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.race-track {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.track-lane {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 50px;
}

.lane-number {
  width: 40px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffd700;
  text-align: center;
}

.lane-number:first-child {
  color: #ff6b6b;
}

.lane-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.car {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: left 0.5s ease-out;
}

.car-icon {
  font-size: 1.8rem;
}

.lane-score {
  width: 80px;
  text-align: right;
  font-size: 1.2rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 1.5rem;
}
</style>
