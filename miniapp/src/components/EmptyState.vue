<template>
  <view class="empty-state">
    <text class="empty-icon">{{ icon }}</text>
    <text v-if="title" class="empty-title">{{ title }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
    <view v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string;
    title?: string;
    desc?: string;
  }>(),
  { icon: '✨', title: '', desc: '' },
);
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--fm-sp-3);
  padding: var(--fm-sp-15) var(--fm-sp-10);
  text-align: center;
}
.empty-icon {
  font-size: 80rpx;
  line-height: 1;
  margin-bottom: var(--fm-sp-3);
  opacity: 0.85;
}
.empty-title {
  font-size: var(--fm-fs-md);
  font-weight: var(--fm-fw-semi);
  color: var(--fm-text-primary);
}
.empty-desc {
  font-size: var(--fm-fs-sm);
  color: var(--fm-text-tertiary);
  line-height: 1.6;
  max-width: 480rpx;
}
.empty-action {
  margin-top: var(--fm-sp-5);
}
</style>
