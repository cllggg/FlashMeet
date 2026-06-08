<template>
  <div class="standby-scene">
    <!-- 动态粒子背景 -->
    <div class="bg-particles">
      <span v-for="i in 40" :key="i" class="particle" :style="particleStyle(i)" />
    </div>

    <div class="center-content">
      <div class="brand-ring">
        <div class="ring-outer" />
        <div class="ring-inner">
          <span class="brand-icon">✨</span>
        </div>
      </div>

      <h1 class="title">{{ event?.title || '聚闪耀 FlashMeet' }}</h1>
      <p class="subtitle">计算相遇的概率，渲染心动的瞬间</p>

      <div class="countdown" v-if="event?.scheduled_at">
        <p class="countdown-label">活动即将开始</p>
        <p class="time">{{ formatTime(event.scheduled_at) }}</p>
      </div>

      <div class="loading-section">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
        <p class="hint">等待主持人开启活动...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ event: any }>();

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${h}:${m}`;
};

const particleStyle = (i: number) => {
  const hue = (i * 47 + 200) % 360;
  return {
    left: `${(i * 13 + 7) % 100}%`,
    top: `${(i * 19 + 3) % 100}%`,
    animationDelay: `${(i * 0.3) % 4}s`,
    animationDuration: `${3 + (i % 4)}s`,
    width: `${3 + (i % 5)}px`,
    height: `${3 + (i % 5)}px`,
    background: `hsl(${hue}, 70%, 65%)`,
    opacity: 0.4 + (i % 3) * 0.2,
  };
};
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
  overflow: hidden;
}

.bg-particles {
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
  50% { transform: translateY(-40px) scale(1.8); opacity: 0.8; }
}

.center-content {
  text-align: center;
  z-index: 10;
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.brand-ring {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.ring-outer {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: rgba(102, 126, 234, 0.6);
  border-right-color: rgba(118, 75, 162, 0.4);
  position: absolute;
  animation: ringSpin 8s linear infinite;
}

.ring-inner {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 30px rgba(102, 126, 234, 0.2);
}

.brand-icon {
  font-size: 2rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes ringSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.title {
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
  letter-spacing: 0.05em;
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 50px;
  letter-spacing: 0.1em;
}

.countdown {
  margin-bottom: 40px;
}

.countdown-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 8px;
}

.time {
  font-size: 2rem;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.loading-section {
  margin-top: 30px;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.6);
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.hint {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.05em;
}
</style>