<template>
  <view class="step-list">
    <text v-if="title" class="step-title">{{ title }}</text>
    <view
      v-for="(s, i) in steps"
      :key="i"
      class="step-row"
      :class="{ active: s.active }"
      @tap="s.onTap && s.onTap()"
    >
      <view
        class="step-bullet"
        :class="{ 'step-bullet--active': s.active, [`step-bullet--${s.tone || 'primary'}`]: true }"
      >
        <text v-if="s.icon">{{ s.icon }}</text>
        <text v-else>{{ i + 1 }}</text>
      </view>
      <view class="step-content">
        <text class="step-label">{{ s.label }}</text>
        <text v-if="s.hint" class="step-hint">{{ s.hint }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  steps: Array<{
    label: string;
    hint?: string;
    icon?: string;
    active?: boolean;
    tone?: 'primary' | 'gold' | 'cyan' | 'red';
    onTap?: () => void;
  }>;
}>();
</script>

<style scoped>
.step-list {
  display: flex;
  flex-direction: column;
  gap: var(--fm-sp-3);
}
.step-title {
  display: block;
  font-size: var(--fm-fs-md);
  font-weight: var(--fm-fw-semi);
  color: var(--fm-text-secondary);
  margin-bottom: var(--fm-sp-3);
}
.step-row {
  display: flex;
  align-items: center;
  gap: var(--fm-sp-4);
  padding: var(--fm-sp-4) var(--fm-sp-5);
  background: var(--fm-bg-glass-1);
  border-radius: var(--fm-radius-md);
  border: 1rpx solid rgba(255, 255, 255, 0.05);
  transition: background var(--fm-dur-base) var(--fm-ease-smooth);
}
.step-row:active {
  background: var(--fm-bg-glass-hover);
}
.step-row.active {
  background: rgba(102, 126, 234, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}
.step-bullet {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fm-fs-xs);
  font-weight: var(--fm-fw-bold);
  color: var(--fm-text-tertiary);
  background: var(--fm-bg-glass-3);
  flex-shrink: 0;
}
.step-bullet--primary {
  background: var(--fm-gradient-primary);
  color: var(--fm-text-primary);
}
.step-bullet--gold {
  background: var(--fm-gradient-warm);
  color: var(--fm-text-on-gold);
}
.step-bullet--cyan {
  background: var(--fm-gradient-cool);
  color: var(--fm-text-primary);
}
.step-bullet--red {
  background: var(--fm-color-red);
  color: var(--fm-text-primary);
}
.step-bullet--active {
  box-shadow: 0 0 16rpx rgba(102, 126, 234, 0.5);
}
.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  min-width: 0;
}
.step-label {
  font-size: var(--fm-fs-sm);
  color: var(--fm-text-primary);
  font-weight: var(--fm-fw-medium);
}
.step-hint {
  font-size: var(--fm-fs-xs);
  color: var(--fm-text-tertiary);
  line-height: 1.4;
}
</style>
