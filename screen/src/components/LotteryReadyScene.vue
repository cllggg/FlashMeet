<template>
  <div class="lottery-ready-scene">
    <div class="center-content">
      <h1 class="title">抽奖即将开始</h1>
      <p class="subtitle">请看大屏，准备好...</p>
      <div class="prize-preview">
        <div class="gift-icon">🎁</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ event: any }>();
</script>

<style scoped>
.lottery-ready-scene {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #2a1a4e 0%, #0a0a2e 70%);
}

.center-content {
  text-align: center;
}

.title {
  font-size: 4rem;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin-bottom: 20px;
}

.subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.prize-preview {
  animation: prize-bounce 1s ease-in-out infinite;
}

.gift-icon {
  font-size: 8rem;
}

@keyframes prize-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
