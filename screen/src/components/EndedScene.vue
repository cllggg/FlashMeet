<template>
  <div class="ended-scene">
    <div class="fireworks-layer">
      <span v-for="i in 30" :key="i" class="spark" :style="sparkStyle(i)" />
    </div>

    <div class="center-content">
      <div class="fade-in title-block">
        <h1 class="title">感谢参与</h1>
        <p class="event-name">{{ event?.title }}</p>
      </div>

      <!-- 活动统计卡片 -->
      <div class="stats-row fade-in" style="animation-delay: 0.5s">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-number">{{ stats.checkinCount }}</div>
          <div class="stat-label">签到人数</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎁</div>
          <div class="stat-number">{{ stats.winnerCount }}</div>
          <div class="stat-label">中奖人数</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✨</div>
          <div class="stat-number">{{ stats.icebreakerCount }}</div>
          <div class="stat-label">破冰参与</div>
        </div>
      </div>

      <!-- 趣味总结 -->
      <div class="summary-card fade-in" style="animation-delay: 0.8s" v-if="funSummary">
        <div class="summary-icon">🎉</div>
        <p class="summary-text">{{ funSummary }}</p>
      </div>

      <!-- 社交成就卡预览 -->
      <div class="achievement-preview fade-in" style="animation-delay: 1.1s">
        <div class="achievement-card">
          <div class="card-header">
            <span class="card-badge">✦ 聚闪耀</span>
            <span class="card-title">社交成就卡</span>
          </div>
          <div class="card-body">
            <div class="card-stat">
              <span class="card-stat-num">{{ stats.checkinCount }}</span>
              <span class="card-stat-label">见证者</span>
            </div>
            <div class="card-divider" />
            <div class="card-stat">
              <span class="card-stat-num">{{ stats.winnerCount }}</span>
              <span class="card-stat-label">幸运星</span>
            </div>
            <div class="card-divider" />
            <div class="card-stat">
              <span class="card-stat-num">{{ stats.icebreakerCount }}</span>
              <span class="card-stat-label">互动数</span>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-date">{{ eventDate }}</span>
          </div>
        </div>
      </div>

      <p class="message fade-in" style="animation-delay: 1.4s">活动已结束，期待下次相聚</p>
      <p class="sub-message fade-in" style="animation-delay: 1.6s">请在手机端查看你的数字社交成就卡</p>

      <!-- 操作按钮 -->
      <div class="action-row fade-in" style="animation-delay: 1.8s">
        <button class="action-btn" @click="$emit('restart')">🔄 重置活动</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import api from '../services/api';

const props = defineProps<{ event: any }>();
defineEmits<{ restart: [] }>();

const stats = reactive({
  checkinCount: 0,
  winnerCount: 0,
  icebreakerCount: 0,
});

const eventDate = computed(() => {
  if (props.event?.ended_at) {
    return new Date(props.event.ended_at).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const funSummary = computed(() => {
  const c = stats.checkinCount;
  const w = stats.winnerCount;
  const i = stats.icebreakerCount;
  if (c === 0 && w === 0 && i === 0) return '';
  const parts: string[] = [];
  if (c > 0) parts.push(`${c} 位伙伴共赴这场闪耀之约`);
  if (w > 0) parts.push(`${w} 位幸运星收获了惊喜`);
  if (i > 0) parts.push(`${i} 次互动点亮了整片星空`);
  if (parts.length === 0) return '';
  return `${parts.join('，')}，今夜因你而闪耀！`;
});

watch(
  () => props.event?.event_id,
  async (eventId) => {
    if (!eventId) return;
    try {
      const [checkinRes, winnerRes, icebreakerRes] = await Promise.allSettled([
        api.get(`/checkin/event/${eventId}/count`),
        api.get(`/lottery/${eventId}/winners`),
        api.get(`/icebreaker/event/${eventId}/stats`),
      ]);
      if (checkinRes.status === 'fulfilled') {
        stats.checkinCount = checkinRes.value?.data?.count || 0;
      }
      if (winnerRes.status === 'fulfilled') {
        const winners = winnerRes.value?.data;
        stats.winnerCount = Array.isArray(winners) ? winners.length : 0;
      }
      if (icebreakerRes.status === 'fulfilled') {
        stats.icebreakerCount = icebreakerRes.value?.data?.totalAnswers || 0;
      }
    } catch {
      // 统计数据非关键，静默失败
    }
  },
  { immediate: true },
);

const sparkColors = ['#ff6b6b', '#ffd700', '#667eea', '#4fc3f7', '#66bb6a', '#ff8a65', '#ce93d8'];

const sparkStyle = (i: number) => ({
  '--x': `${(Math.random() - 0.5) * 700}px`,
  '--y': `${(Math.random() - 0.5) * 700}px`,
  animationDelay: `${Math.random() * 2}s`,
  animationDuration: `${1.5 + Math.random() * 2}s`,
  background: sparkColors[i % sparkColors.length],
  width: `${6 + Math.random() * 8}px`,
  height: `${6 + Math.random() * 8}px`,
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
  position: relative;
  overflow: hidden;
}

.fireworks-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.center-content {
  text-align: center;
  z-index: 1;
  position: relative;
  max-width: 800px;
}

.fade-in {
  animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes fadeInUp {
  0% { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.title-block {
  margin-bottom: 40px;
}

.title {
  font-size: 5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
  letter-spacing: 0.08em;
}

.event-name {
  font-size: 1.6rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 300;
}

/* 统计卡片 */
.stats-row {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px 32px;
  min-width: 130px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.2);
}

.stat-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 2.8rem;
  font-weight: 900;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* 趣味总结 */
.summary-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  margin-bottom: 40px;
}

.summary-icon {
  font-size: 1.8rem;
}

.summary-text {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
}

/* 社交成就卡 */
.achievement-preview {
  margin-bottom: 40px;
}

.achievement-card {
  display: inline-block;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 20px;
  padding: 20px 36px;
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-badge {
  font-size: 0.8rem;
  color: #667eea;
  letter-spacing: 0.2em;
}

.card-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: white;
  letter-spacing: 0.1em;
}

.card-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 12px;
}

.card-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.card-stat-num {
  font-size: 2rem;
  font-weight: 900;
  color: #ffd700;
}

.card-stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.card-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
}

.card-footer {
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.card-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.35);
}

/* 烟花 */
.spark {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  animation: firework 2s ease-out infinite;
  box-shadow: 0 0 6px currentColor;
}

@keyframes firework {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; }
}

.message {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 10px;
}

.sub-message {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 24px;
}

/* 操作按钮 */
.action-row {
  margin-top: 10px;
}

.action-btn {
  padding: 12px 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}
</style>