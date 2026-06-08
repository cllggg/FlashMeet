<!--
  AchievementOverlay · 成就卡浮层
  ------------------------------------------------------------
  v3.0 极简化：本次活动获得的所有成就
  - 由 IdleHint / ProfileOverlay 触发
-->
<template>
  <view class="achievement-overlay">
    <view class="ach-head">
      <text class="ach-title">🏆 你的成就</text>
      <text class="ach-close" @tap="$emit('close')">✕</text>
    </view>

    <view v-if="achievements.length === 0" class="ach-empty">
      <text class="ach-empty-icon">✨</text>
      <text class="ach-empty-text">活动结束时会自动生成</text>
    </view>

    <view v-else class="ach-grid">
      <view v-for="a in achievements" :key="a.id" class="ach-card">
        <text class="ach-emoji">{{ a.emoji }}</text>
        <text class="ach-name">{{ a.name }}</text>
        <text class="ach-desc">{{ a.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'close'): void }>();

interface Ach { id: string; emoji: string; name: string; desc: string }
const achievements: Ach[] = [
  { id: '1', emoji: '🚀', name: '首批到达', desc: '活动开始前 5 分钟到场' },
  { id: '2', emoji: '💬', name: '破冰先锋', desc: '在破冰环节率先发言' },
  { id: '3', emoji: '🤝', name: '同频之约', desc: '成功匹配 1 位同频伙伴' },
];
</script>

<style scoped>
.achievement-overlay {
  background: linear-gradient(160deg, rgba(15, 15, 35, 0.95), rgba(8, 8, 24, 0.95));
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx;
  animation: slide-up 0.3s var(--fm-ease-smooth, ease);
}
@keyframes slide-up {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.ach-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 4rpx 16rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}
.ach-title { font-size: 30rpx; font-weight: 700; }
.ach-close { font-size: 32rpx; color: rgba(255, 255, 255, 0.6); padding: 8rpx 16rpx; }
.ach-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  color: rgba(255, 255, 255, 0.4);
}
.ach-empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.ach-empty-text { font-size: 24rpx; }
.ach-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; padding: 24rpx 0; }
.ach-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  padding: 24rpx;
  text-align: center;
}
.ach-emoji { display: block; font-size: 60rpx; margin-bottom: 8rpx; }
.ach-name { display: block; font-size: 26rpx; font-weight: 700; }
.ach-desc { display: block; font-size: 20rpx; color: rgba(255, 255, 255, 0.5); margin-top: 4rpx; }
</style>
