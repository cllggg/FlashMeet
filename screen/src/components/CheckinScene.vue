<template>
  <div class="checkin-scene">
    <CheckinGalaxy3D
      v-if="use3D"
      :checkin-users="checkinUsers"
      :event="event"
    />

    <div class="scene-overlay">
      <div class="top-bar">
        <div class="event-title">{{ event?.title }}</div>
        <div class="scene-badge">✦ CHECKIN</div>
      </div>

      <!-- 实时签到计数 -->
      <div class="live-counter">
        <div class="counter-number" :key="checkinUsers.length">
          <span class="counter-value">{{ checkinUsers.length }}</span>
          <span class="counter-label">人已签到</span>
        </div>
        <div class="counter-pulse" v-if="showPulse" />
      </div>

      <div class="qr-widget">
        <div class="qr-card">
          <QRCodeVue
            :value="checkinUrl"
            :size="160"
            level="H"
            fg-color="#667eea"
            bg-color="transparent"
          />
        </div>
        <p class="qr-text">扫码签到</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import QRCodeVue from 'qrcode.vue';
import CheckinGalaxy3D from './CheckinGalaxy3D.vue';

const props = defineProps<{
  event: any;
  checkinUsers: any[];
  use3D: boolean;
}>();

const showPulse = ref(false);

watch(
  () => props.checkinUsers.length,
  () => {
    showPulse.value = true;
    setTimeout(() => { showPulse.value = false; }, 600);
  },
);

const checkinUrl = computed(() => {
  const base = import.meta.env.VITE_SERVER_URL || window.location.origin;
  return `${base}/e/${props.event?.event_id || ''}`;
});
</script>

<style scoped>
.checkin-scene {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #030310;
}

.scene-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 30px 40px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.event-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-badge {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  padding: 6px 18px;
}

/* 实时签到计数 */
.live-counter {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.counter-number {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.counter-value {
  font-size: 5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  animation: counterPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes counterPopIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.counter-label {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8px;
  letter-spacing: 0.1em;
}

.counter-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  margin-top: -100px;
  margin-left: -100px;
  border-radius: 50%;
  border: 2px solid rgba(102, 126, 234, 0.4);
  animation: counterPulse 0.6s ease-out;
  pointer-events: none;
}

@keyframes counterPulse {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.qr-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: flex-end;
  pointer-events: auto;
}

.qr-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
}

.qr-card :deep(canvas) {
  display: block;
}

.qr-text {
  margin-top: 10px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}
</style>