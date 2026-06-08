<!--
  IdleHint · 待机和结束态浮层
  ------------------------------------------------------------
  - 当活动未开始（STANDBY）或已结束（ENDED）时显示
  - 提供"分享邀请"和"查看我的成就"两个行动
-->
<template>
  <view class="idle-hint">
    <view class="overlay-card">
      <view class="overlay-head">
        <text class="overlay-tag">{{ isEnded ? '已结束' : '即将开始' }}</text>
        <text class="overlay-title">
          {{ isEnded ? '本次聚会圆满结束' : '等待主持人开场' }}
        </text>
        <text class="overlay-desc">
          {{
            isEnded
              ? '你的成就卡已生成 · 把它分享出去'
              : '主持人准备中 · 你可以先看看当前到场的人'
          }}
        </text>
      </view>

      <view class="hint-actions">
        <view class="hint-btn" @tap="onShare">
          <text class="hint-icon">📤</text>
          <text class="hint-text">邀请好友</text>
        </view>
        <view class="hint-btn" @tap="onAchievement">
          <text class="hint-icon">🏆</text>
          <text class="hint-text">我的成就</text>
        </view>
        <view class="hint-btn" @tap="onChat">
          <text class="hint-icon">💬</text>
          <text class="hint-text">进入聊天</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  state?: string;
  eventId: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'share'): void; (e: 'open-chat'): void; (e: 'open-achievement'): void }>();

const isEnded = computed(() => props.state === 'STATUS_ENDED');

const onShare = () => emit('share');
const onAchievement = () => emit('open-achievement');
const onChat = () => emit('open-chat');
</script>

<style scoped>
.idle-hint { width: 100%; animation: slide-up 0.4s var(--fm-ease-smooth, ease); }
@keyframes slide-up {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.overlay-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 32rpx;
  backdrop-filter: blur(20rpx);
}
.overlay-head { margin-bottom: 20rpx; }
.overlay-tag {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 999rpx;
  margin-bottom: 12rpx;
}
.overlay-title { display: block; font-size: 32rpx; font-weight: 800; margin-bottom: 6rpx; }
.overlay-desc { display: block; font-size: 22rpx; color: rgba(255, 255, 255, 0.55); }

.hint-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}
.hint-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 20rpx 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 16rpx;
  transition: background 0.2s;
}
.hint-btn:active { background: rgba(255, 255, 255, 0.12); }
.hint-icon { font-size: 40rpx; }
.hint-text { font-size: 22rpx; color: rgba(255, 255, 255, 0.8); }
</style>
