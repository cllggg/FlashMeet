<template>
  <div class="lottery-running-scene">
    <div class="center-content">
      <h1 class="title">抽奖中</h1>
      <div class="avatar-rolling">
        <div class="rolling-circle" :class="{ 'rolling': isRolling }">
          <div class="avatar-placeholder">?</div>
        </div>
      </div>
      <div class="winners-list" v-if="winners.length > 0">
        <h2>中奖名单</h2>
        <div class="winner" v-for="winner in winners" :key="winner.id">
          <span class="winner-name">{{ winner.user?.nickname || '幸运儿' }}</span>
          <span class="winner-prize">{{ winner.prize_name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ winners: any[] }>();
const isRolling = ref(true);
</script>

<style scoped>
.lottery-running-scene {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #2a1a4e 0%, #0a0a2e 70%);
}

.center-content {
  text-align: center;
  width: 100%;
  max-width: 800px;
}

.title {
  font-size: 3rem;
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin-bottom: 40px;
}

.avatar-rolling {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.rolling-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(102, 126, 234, 0.5);
}

.rolling-circle.rolling {
  animation: spin 0.3s linear infinite;
}

.avatar-placeholder {
  font-size: 4rem;
  color: white;
}

@keyframes spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
}

.winners-list {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
}

.winners-list h2 {
  font-size: 1.5rem;
  color: #ffd700;
  margin-bottom: 20px;
}

.winner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  animation: winner-appear 0.5s ease-out;
}

.winner-name {
  font-size: 1.2rem;
  color: white;
}

.winner-prize {
  font-size: 1rem;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

@keyframes winner-appear {
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
</style>
