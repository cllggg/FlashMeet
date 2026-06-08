<template>
  <div class="lottery-ready-scene">
    <!-- 背景光效 -->
    <div class="bg-aura">
      <div class="aura-ring aura-1" />
      <div class="aura-ring aura-2" />
      <div class="aura-ring aura-3" />
    </div>

    <div class="center-content">
      <div class="anticipation">
        <div class="gift-bounce">
          <span class="gift-icon">🎁</span>
        </div>
        <div class="sparkles">
          <span v-for="n in 8" :key="n" class="sparkle" :style="sparkleStyle(n)">✦</span>
        </div>
      </div>

      <h1 class="title">抽奖即将开始</h1>
      <p class="subtitle">请看大屏，准备好你的专属编号...</p>

      <div class="teaser-bar">
        <div class="teaser-text">正在准备奖品池...</div>
        <div class="teaser-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ event: any }>();

const sparkleStyle = (n: number) => {
  const angle = (n / 8) * 360;
  const distance = 80 + (n % 3) * 20;
  const rad = (angle * Math.PI) / 180;
  return {
    '--x': `${Math.cos(rad) * distance}px`,
    '--y': `${Math.sin(rad) * distance}px`,
    animationDelay: `${n * 0.15}s`,
    color: n % 2 === 0 ? '#ffd700' : '#ff6b35',
  };
};
</script>

<style scoped>
.lottery-ready-scene {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #1a1040 0%, #0a0a1e 80%);
  overflow: hidden;
  position: relative;
}

.bg-aura {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.aura-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 215, 0, 0.15);
  animation: auraExpand 3s ease-out infinite;
}

.aura-1 { width: 200px; height: 200px; }
.aura-2 { width: 200px; height: 200px; animation-delay: 1s; }
.aura-3 { width: 200px; height: 200px; animation-delay: 2s; }

@keyframes auraExpand {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(3); opacity: 0; }
}

.center-content {
  text-align: center;
  z-index: 1;
}

.anticipation {
  position: relative;
  display: inline-block;
  margin-bottom: 30px;
}

.gift-bounce {
  animation: giftFloat 2s ease-in-out infinite;
}

@keyframes giftFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.gift-icon {
  font-size: 8rem;
  display: block;
  filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.4));
}

.sparkles {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: 1.2rem;
  animation: sparkleAnim 1.5s ease-in-out infinite;
  opacity: 0;
  transform: translate(-50%, -50%);
}

@keyframes sparkleAnim {
  0% { transform: translate(-50%, -50%) translate(0, 0) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(0); opacity: 0; }
}

.title {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b35 50%, #ffd700 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 2s ease-in-out infinite;
  margin-bottom: 16px;
  letter-spacing: 0.08em;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.subtitle {
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 50px;
  letter-spacing: 0.05em;
}

.teaser-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 32px;
  background: rgba(255, 215, 0, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 50px;
  max-width: 400px;
  margin: 0 auto;
}

.teaser-text {
  font-size: 1rem;
  color: rgba(255, 215, 0, 0.6);
}

.teaser-dots {
  display: flex;
  gap: 4px;
}

.teaser-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.5);
  animation: teaserDot 1.4s ease-in-out infinite;
}

.teaser-dots span:nth-child(2) { animation-delay: 0.2s; }
.teaser-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes teaserDot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.6); }
  40% { opacity: 1; transform: scale(1); }
}
</style>