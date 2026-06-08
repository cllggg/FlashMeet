<!--
  ProfileOverlay · 我的画像 & 成就浮层
  ------------------------------------------------------------
  v3.0 极简化：渐进式画像 + 成就卡 + 邀请卡
  - 头像 + 昵称 + 标签 + 累计场次 + 成就
  - 邀请卡一键分享
-->
<template>
  <view class="profile-overlay">
    <view class="profile-head">
      <text class="profile-title">🌟 我的</text>
      <text class="profile-close" @tap="$emit('close')">✕</text>
    </view>

    <view class="profile-hero">
      <view class="profile-avatar">
        <text class="profile-avatar-emoji">{{ profile.emoji }}</text>
      </view>
      <text class="profile-name">{{ profile.name }}</text>
      <view class="profile-tags">
        <text v-for="t in profile.tags" :key="t" class="profile-tag">{{ t }}</text>
      </view>
    </view>

    <view class="profile-stats">
      <view class="stat-cell">
        <text class="stat-value">{{ profile.attendance }}</text>
        <text class="stat-label">累计场次</text>
      </view>
      <view class="stat-cell">
        <text class="stat-value">{{ profile.matches }}</text>
        <text class="stat-label">灵魂匹配</text>
      </view>
      <view class="stat-cell">
        <text class="stat-value">{{ profile.achievements }}</text>
        <text class="stat-label">成就徽章</text>
      </view>
    </view>

    <view class="profile-card">
      <text class="profile-card-title">🎁 邀请卡</text>
      <text class="profile-card-desc">"这次聚会很有意思，下次一起来？"</text>
      <view class="profile-card-btn" @tap="onShareCard">
        <text class="profile-card-btn-text">分享给好友</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'close'): void }>();

const profile = {
  emoji: '🦊',
  name: '灵动狐',
  tags: ['🌙 夜猫子', '🍵 茶派', '🎸 民谣', '📷 胶片'],
  attendance: 12,
  matches: 5,
  achievements: 8,
};

const onShareCard = () => {
  uni.showShareMenu({ withShareTicket: true });
};
</script>

<style scoped>
.profile-overlay {
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
.profile-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 4rpx 16rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}
.profile-title { font-size: 30rpx; font-weight: 700; }
.profile-close { font-size: 32rpx; color: rgba(255, 255, 255, 0.6); padding: 8rpx 16rpx; }

.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 24rpx;
}
.profile-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(108, 92, 231, 0.4);
}
.profile-avatar-emoji { font-size: 64rpx; }
.profile-name { font-size: 32rpx; font-weight: 800; margin-bottom: 12rpx; }
.profile-tags { display: flex; flex-wrap: wrap; gap: 8rpx; justify-content: center; }
.profile-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
  color: rgba(255, 255, 255, 0.7);
}

.profile-stats {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 0;
}
.stat-cell {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  padding: 20rpx;
  text-align: center;
}
.stat-value { display: block; font-size: 40rpx; font-weight: 800; color: #a29bfe; }
.stat-label { display: block; font-size: 20rpx; color: rgba(255, 255, 255, 0.5); margin-top: 4rpx; }

.profile-card {
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(162, 155, 254, 0.05));
  border: 1rpx solid rgba(108, 92, 231, 0.3);
  border-radius: 20rpx;
  padding: 24rpx;
  margin: 16rpx 0;
}
.profile-card-title { display: block; font-size: 28rpx; font-weight: 700; margin-bottom: 8rpx; }
.profile-card-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16rpx;
  font-style: italic;
}
.profile-card-btn {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  padding: 18rpx;
  border-radius: 999rpx;
  text-align: center;
}
.profile-card-btn-text { color: #fff; font-size: 26rpx; font-weight: 700; }
</style>
