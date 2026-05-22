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
import { computed } from 'vue';
import QRCodeVue from 'qrcode.vue';
import CheckinGalaxy3D from './CheckinGalaxy3D.vue';

const props = defineProps<{
  event: any;
  checkinUsers: any[];
  use3D: boolean;
}>();

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