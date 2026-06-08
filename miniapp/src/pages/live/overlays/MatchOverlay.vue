<!--
  MatchOverlay · 匹配浮层
  ------------------------------------------------------------
  - 当后端推送 MATCH_RESULT 时浮层升起
  - 接受 / 拒绝 → 后端写入 / 推送给对方
  - 双方均接受 → 解锁盲聊
-->
<template>
  <view class="match-overlay">
    <view v-if="result" class="overlay-card">
      <view class="overlay-head">
        <text class="overlay-tag">✨ 同频匹配</text>
        <text class="overlay-title">发现一个和你很像的人</text>
        <text class="overlay-desc">基于你的画像与现场行为计算</text>
      </view>

      <view class="peer">
        <view class="peer-avatar">
          <text class="peer-initial">{{ result.peerName?.charAt(0) || '?' }}</text>
        </view>
        <text class="peer-name">{{ result.peerName || '神秘人' }}</text>
        <view class="tag-row">
          <text v-for="t in result.peerTags || []" :key="t" class="tag">{{ t }}</text>
        </view>
      </view>

      <view class="match-actions">
        <button class="match-btn reject" @tap="onReject">✕ 跳过</button>
        <button class="match-btn accept" @tap="onAccept">✓ 加好友</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface MatchResult {
  peerName: string;
  peerTags?: string[];
}
interface Props {
  eventId: string;
  result: MatchResult | null;
}
defineProps<Props>();
const emit = defineEmits<{
  (e: 'accept'): void;
  (e: 'reject'): void;
}>();

const onAccept = () => emit('accept');
const onReject = () => emit('reject');
</script>

<style scoped>
.match-overlay { width: 100%; animation: slide-up 0.4s var(--fm-ease-smooth, ease); }
@keyframes slide-up {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.overlay-card {
  background: linear-gradient(160deg, rgba(255, 107, 107, 0.12), rgba(255, 215, 0, 0.06));
  border: 1rpx solid rgba(255, 107, 107, 0.25);
  border-radius: 24rpx;
  padding: 32rpx;
  backdrop-filter: blur(20rpx);
}
.overlay-head { margin-bottom: 24rpx; }
.overlay-tag {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 107, 107, 0.18);
  color: #ff6b6b;
  border-radius: 999rpx;
  margin-bottom: 12rpx;
}
.overlay-title { display: block; font-size: 32rpx; font-weight: 800; margin-bottom: 6rpx; }
.overlay-desc { display: block; font-size: 22rpx; color: rgba(255, 255, 255, 0.55); }

.peer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 0;
}
.peer-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ffd700);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 32rpx rgba(255, 107, 107, 0.5);
}
.peer-initial {
  font-size: 56rpx;
  font-weight: 800;
  color: white;
}
.peer-name {
  font-size: 32rpx;
  font-weight: 700;
  color: white;
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  justify-content: center;
}
.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 999rpx;
}

.match-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
.match-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 700;
}
.match-btn.reject {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}
.match-btn.accept {
  background: linear-gradient(135deg, #ff6b6b, #ffd700);
  color: #1a1a4e;
}
</style>
