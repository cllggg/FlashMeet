<template>
  <div class="join-qr">
    <div class="qr-card">
      <div class="qr-title">扫码参与</div>
      <QrCodeVue3
        :value="joinUrl"
        :size="160"
        level="M"
        :background="'#ffffff'"
        :foreground="'#1a1a4e'"
        :corners-square-color="'#ffd700'"
        :corners-dot-color="'#ffd700'"
        :download="false"
      />
      <div class="qr-hint">微信扫一扫 · 加入派对</div>
      <div class="qr-id">活动 ID: {{ shortId }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// @ts-ignore - qrcode.vue 没有官方 .d.ts
import QrCodeVue3 from 'qrcode.vue';

const props = defineProps<{
  joinUrl: string;
  eventId: string;
}>();

const shortId = computed(() => {
  if (!props.eventId) return '----';
  return props.eventId.slice(-6).toUpperCase();
});
</script>

<style scoped>
.join-qr {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  pointer-events: auto;
}

.qr-card {
  background: rgba(10, 10, 30, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 215, 0, 0.35);
  border-radius: 16px;
  padding: 16px;
  width: 200px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.qr-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 12px;
  letter-spacing: 2px;
}

.qr-card :deep(canvas),
.qr-card :deep(svg) {
  border-radius: 8px;
}

.qr-hint {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.qr-id {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(255, 215, 0, 0.6);
  font-family: monospace;
  letter-spacing: 1px;
}
</style>
