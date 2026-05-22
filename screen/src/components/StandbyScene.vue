<template>
  <div class="standby-scene">
    <div class="center-content">
      <h1 class="title">{{ event?.title || '聚闪耀 FlashMeet' }}</h1>
      <p class="subtitle">计算相遇的概率，渲染心动的瞬间</p>
      <div class="countdown" v-if="event?.scheduled_at">
        <p>活动即将开始</p>
        <p class="time">{{ formatTime(event.scheduled_at) }}</p>
      </div>
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p class="hint">等待主持人开启活动...</p>
    </div>
    <div class="bg-particles" ref="particlesContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{ event: any }>();
const particlesContainer = ref<HTMLElement>();

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

onMounted(() => {
  // Simple CSS particle animation for standby
  if (particlesContainer.value) {
    for (let i = 0; i < 30; i++) {
      const dot = document.createElement('div');
      dot.className = 'particle';
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${Math.random() * 100}%`;
      dot.style.animationDelay = `${Math.random() * 3}s`;
      dot.style.animationDuration = `${2 + Math.random() * 3}s`;
      particlesContainer.value.appendChild(dot);
    }
  }
});
</script>

<style scoped>
.standby-scene {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: radial-gradient(ellipse at center, #1a1a4e 0%, #0a0a2e 70%);
}

.center-content {
  text-align: center;
  z-index: 10;
}

.title {
  font-size: 4rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 40px;
}

.countdown {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
}

.time {
  font-size: 1.8rem;
  color: #667eea;
  margin-top: 8px;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.loading-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #667eea;
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
}

.bg-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(102, 126, 234, 0.6);
  border-radius: 50%;
  animation: float-up linear infinite;
}

@keyframes float-up {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}
</style>
