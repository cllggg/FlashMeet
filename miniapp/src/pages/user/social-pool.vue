<template>
  <view class="social-pool-page">
    <view class="pool-header">
      <text class="pool-title">🔮 社交沉淀池</text>
      <text class="pool-subtitle">活动后 24 小时内可查看与你标签最相似的人</text>
    </view>

    <view v-if="topMatches.length === 0" class="empty-state">
      <text class="empty-icon">🕸️</text>
      <text class="empty-text">暂无匹配结果</text>
      <text class="empty-hint">完善你的标签，增加匹配机会</text>
    </view>

    <view v-else class="match-list">
      <view
        v-for="(m, i) in topMatches"
        :key="'m' + i"
        class="match-card"
        :style="{ animationDelay: `${i * 0.1}s` }"
      >
        <view class="rank-badge" :class="`rank-${i + 1}`">{{ i + 1 }}</view>

        <view class="match-body">
          <view class="match-row">
            <view class="user-avatar">
              <text class="avatar-text">{{ m.user_b.display_id?.[0] || '?' }}</text>
            </view>
            <view class="user-info">
              <text class="user-name">{{ m.user_b.display_id }}</text>
              <view class="tag-row">
                <text
                  v-for="tag in m.user_b.tags"
                  :key="tag"
                  class="tag"
                  :class="{ common: m.common_tags.includes(tag) }"
                >{{ tag }}</text>
              </view>
            </view>
          </view>

          <view class="match-score-bar">
            <view class="score-label">相似度</view>
            <view class="score-track">
              <view class="score-fill" :style="{ width: `${m.score}%` }" />
            </view>
            <text class="score-value">{{ m.score }}%</text>
          </view>

          <view v-if="m.common_tags.length > 0" class="common-tags">
            <text class="common-hint">共同标签：</text>
            <text class="common-tag" v-for="tag in m.common_tags" :key="tag">{{ tag }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="topMatches.length > 0" class="pool-footer">
      <text class="footer-hint">数据将在活动结束 24 小时后自动清理</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { matchApi } from '../../services/api';

const eventId = ref('');
const userId = ref('');
const topMatches = ref<any[]>([]);

onLoad((options: any) => {
  eventId.value = options.eventId || '';
  userId.value = options.userId || JSON.parse(uni.getStorageSync('flashmeet_user') || '{}')?.user_id || '';
  loadTopMatches();
});

const loadTopMatches = async () => {
  try {
    const res: any = await matchApi.getTopMatches(eventId.value, userId.value);
    topMatches.value = res.data || res || [];
  } catch (e) {
    console.warn('Load top matches failed:', e);
  }
};
</script>

<style scoped>
.social-pool-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0a0a2e 100%);
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}

.pool-header {
  text-align: center;
  padding: 40rpx 0 32rpx;
}

.pool-title {
  display: block;
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
}

.pool-subtitle {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  gap: 12rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.6);
}

.empty-hint {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.3);
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.match-card {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20rpx;
  padding: 20rpx;
  gap: 16rpx;
  animation: fadeInUp 0.4s ease both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.rank-badge {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  color: #fff;
  flex-shrink: 0;
}

.rank-1 { background: linear-gradient(135deg, #ffd700, #ff8c00); }
.rank-2 { background: linear-gradient(135deg, #c0c0c0, #808080); }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #8b4513); }
.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: rgba(255, 255, 255, 0.1);
}

.match-body {
  flex: 1;
}

.match-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.user-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.user-name {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
  margin-top: 4rpx;
}

.tag {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
}

.tag.common {
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
}

.match-score-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.score-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.score-track {
  flex: 1;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4rpx;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #ffd700);
  border-radius: 4rpx;
  transition: width 0.8s ease;
}

.score-value {
  font-size: 22rpx;
  color: #ffd700;
  font-weight: bold;
  flex-shrink: 0;
}

.common-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6rpx;
}

.common-hint {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.3);
}

.common-tag {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  background: rgba(255, 215, 0, 0.1);
  color: #ffd700;
}

.pool-footer {
  text-align: center;
  padding: 40rpx 0;
}

.footer-hint {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.2);
}
</style>