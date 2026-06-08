<template>
  <view v-if="visible" class="retry-bar">
    <text class="retry-msg">{{ message }}</text>
    <button
      class="retry-btn"
      size="mini"
      :disabled="loading"
      @tap="onRetry"
    >
      {{ loading ? '重试中…' : '重试' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    message: string;
    loading?: boolean;
  }>(),
  { loading: false },
);

const emit = defineEmits<{ (e: 'retry'): void }>();

const onRetry = () => {
  if (!props.loading) emit('retry');
};
</script>

<style scoped>
.retry-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: rgba(255, 107, 107, 0.1);
  border: 1rpx solid rgba(255, 107, 107, 0.35);
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  animation: slide-down 0.24s ease-out;
}

.retry-msg {
  flex: 1;
  font-size: 24rpx;
  color: #ff8a8a;
  line-height: 1.4;
}

.retry-btn {
  flex-shrink: 0;
  background: #ff6b6b;
  color: white;
  font-size: 22rpx;
  border-radius: 999rpx;
  padding: 0 24rpx;
  border: none;
  line-height: 48rpx;
  height: 48rpx;
}

.retry-btn:disabled {
  opacity: 0.6;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8rpx); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
