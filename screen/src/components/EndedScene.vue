<template>
  <div class="ended-scene">
    <div class="center-content">
      <h1 class="title">感谢参与</h1>
      <p class="event-name">{{ event?.title }}</p>
      <div class="fireworks">
        <span v-for="i in 20" :key="i" class="spark" :style="sparkStyle(i)"></span>
      </div>
      <p class="message">活动已结束，期待下次相聚</p>
      <p class="sub-message">请在手机端查看你的数字社交成就卡</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ event: any }>();

const sparkStyle = (i: number) => ({
  '--x': `${(Math.random() - 0.5) * 600}px`,
  '--y': `${(Math.random() - 0.5) * 600}px`,
  animationDelay: `${Math.random() * 1}s`,
  background: ['#ff6b6b', '#ffd700', '#667eea', '#4fc3f7', '#66bb6a'][
    Math.floor(Math.random() * 5)
  ],
});
</script>

<style scoped>
.ended-scene {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #1a1a4e 0%, #0a0a2e 70%);
}

.center-content {
  text-align: center;
  position: relative;
}

.title {
  font-size: 5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.event-name {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.fireworks {
  position: relative;
  height: 200px;
  width: 600px;
  margin: 0 auto;
}

.spark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: firework 1.5s ease-out infinite;
}

@keyframes firework {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; }
}

.message {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 40px;
}

.sub-message {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 12px;
}
</style>
