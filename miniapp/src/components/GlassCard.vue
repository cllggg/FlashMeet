<template>
  <view
    class="glass-card"
    :class="[`glass-card--${tone}`, { 'glass-card--glow': glow }]"
  >
    <view v-if="title || $slots.header" class="glass-header">
      <view v-if="icon || title" class="glass-title-wrap">
        <text v-if="icon" class="glass-icon">{{ icon }}</text>
        <text v-if="title" class="glass-title">{{ title }}</text>
      </view>
      <slot name="header" />
    </view>
    <view class="glass-body">
      <slot />
    </view>
    <view v-if="$slots.footer" class="glass-footer">
      <slot name="footer" />
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    tone?: 'default' | 'primary' | 'gold' | 'cyan';
    glow?: boolean;
  }>(),
  { tone: 'default', glow: false },
);
</script>

<style scoped>
.glass-card {
  background: var(--fm-bg-glass-2);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: var(--fm-radius-lg);
  padding: var(--fm-sp-6);
  transition: box-shadow var(--fm-dur-slow) var(--fm-ease-smooth);
}
.glass-card--primary {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12));
  border-color: rgba(102, 126, 234, 0.3);
}
.glass-card--gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 107, 107, 0.08));
  border-color: rgba(255, 215, 0, 0.25);
}
.glass-card--cyan {
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(69, 183, 209, 0.1));
  border-color: rgba(78, 205, 196, 0.25);
}
.glass-card--glow {
  box-shadow: var(--fm-glow-primary);
}
.glass-card--gold.glass-card--glow {
  box-shadow: var(--fm-glow-gold);
}
.glass-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--fm-sp-5);
  gap: var(--fm-sp-3);
}
.glass-title-wrap {
  display: flex;
  align-items: center;
  gap: var(--fm-sp-3);
  flex: 1;
  min-width: 0;
}
.glass-icon {
  font-size: var(--fm-fs-lg);
  line-height: 1;
}
.glass-title {
  font-size: var(--fm-fs-md);
  font-weight: var(--fm-fw-semi);
  color: var(--fm-text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.glass-body {
  position: relative;
}
.glass-footer {
  margin-top: var(--fm-sp-5);
  padding-top: var(--fm-sp-4);
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);
}
</style>
