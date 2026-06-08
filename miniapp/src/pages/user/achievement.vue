<template>
  <view class="achievement-page">
    <view class="page-header">
      <text class="page-title">数字社交成就卡</text>
      <text class="page-subtitle">每一次相遇，都是繁星闪耀</text>
    </view>

    <!-- 成就卡主体 -->
    <view class="card">
      <!-- 顶部装饰 -->
      <view class="card-top-ornament">
        <view class="ornament-line" />
        <text class="ornament-star">✦</text>
        <view class="ornament-line" />
      </view>

      <view class="card-header">
        <text class="card-logo">聚闪耀</text>
        <text class="card-event">{{ eventName }}</text>
        <text class="card-date">{{ eventDate }}</text>
      </view>

      <view v-if="myDisplayId" class="card-display-id">
        <text class="display-id-dot">●</text>
        <text class="display-id-text">大屏身份 · {{ myDisplayId }}</text>
      </view>

      <!-- 核心统计 -->
      <view class="card-stats">
        <view class="stat">
          <text class="stat-value">{{ stats.checkins }}</text>
          <text class="stat-label">见证者</text>
        </view>
        <view class="stat-divider" />
        <view class="stat">
          <text class="stat-value">{{ stats.tags }}</text>
          <text class="stat-label">标签</text>
        </view>
        <view class="stat-divider" />
        <view class="stat">
          <text class="stat-value">{{ stats.won ? '✦' : '—' }}</text>
          <text class="stat-label">中奖</text>
        </view>
      </view>

      <!-- 标签云 -->
      <view class="card-tags" v-if="myTags.length > 0">
        <text class="tag-label">我的标签</text>
        <view class="tag-list">
          <text v-for="tag in myTags" :key="tag" class="card-tag">{{ tag }}</text>
        </view>
      </view>

      <!-- 趣味总结 -->
      <view class="card-summary">
        <text class="summary-text">{{ funSummary }}</text>
      </view>

      <!-- 底部 -->
      <view class="card-footer">
        <view class="footer-ornament" />
        <text class="footer-slogan">计算相遇的概率，渲染心动的瞬间</text>
        <view class="footer-ornament" />
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button class="share-btn" open-type="share">
        <text class="share-icon">📤</text>
        分享成就卡
      </button>
      <button class="back-btn" @tap="goBack">
        返回首页
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { eventApi, checkinApi, lotteryApi } from '../../services/api';

const eventName = ref('聚会名称');
const eventDate = ref('');
const myTags = ref<string[]>([]);
const myDisplayId = ref('');
const myUserId = ref('');
const stats = ref({
  checkins: 0,
  tags: 0,
  won: false,
});

const funSummaries = [
  '在这场星际聚会中，你留下了独特的轨迹 ✨',
  '每一个标签，都是你闪耀的证明 🌟',
  '你与{checkins}位伙伴共赴这场闪耀之约',
  '今夜，{checkins}颗星星因你而更加璀璨',
  '你的标签，让你成为夜空中最独特的星',
];

const funSummary = computed(() => {
  const idx = Math.floor(Math.random() * funSummaries.length);
  return funSummaries[idx].replace('{checkins}', String(stats.value.checkins));
});

onLoad(async (options: any) => {
  const eventId = options?.eventId;
  const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
  myDisplayId.value = userInfo?.display_id || '';
  myUserId.value = userInfo?.user_id || '';

  if (eventId) {
    try {
      const event: any = await eventApi.getOne(eventId);
      eventName.value = event.title || '聚会名称';
      if (event.ended_at) {
        const d = new Date(event.ended_at);
        if (!isNaN(d.getTime())) {
          eventDate.value = d.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      }
    } catch {}

    try {
      const checkins: any = await checkinApi.getCheckins(eventId);
      const list = Array.isArray(checkins) ? checkins : checkins?.data || [];
      stats.value.checkins = list.length || 0;

      const myCheckin = list.find((c: any) => c.user_id === myUserId.value);
      if (myCheckin) {
        myTags.value = myCheckin.local_tags || [];
        stats.value.tags = myTags.value.length;
      }
    } catch {}

    // 抽奖中奖：拉取本场中奖名单
    if (myUserId.value) {
      try {
        const winners: any = await lotteryApi.getWinners(eventId);
        const list = Array.isArray(winners) ? winners : winners?.data || [];
        stats.value.won = list.some((w: any) => w.user_id === myUserId.value);
      } catch {}
    }
  }
});

function goBack() {
  uni.reLaunch({ url: '/pages/index/index' });
}
</script>

<style scoped>
.achievement-page {
  min-height: 100vh;
  padding: 60rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #151540 40%, #1a1a4e 100%);
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 48rpx;
}
.page-title {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
  margin-bottom: 12rpx;
  text-shadow: 0 0 20rpx rgba(255, 215, 0, 0.3);
}
.page-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
}

/* 卡片主体 */
.card {
  background: linear-gradient(145deg, #1e1e5e 0%, #2a1a6e 50%, #1e1e5e 100%);
  border: 2rpx solid rgba(102, 126, 234, 0.25);
  border-radius: 32rpx;
  padding: 48rpx 36rpx;
  margin-bottom: 48rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

/* 卡片顶部装饰 */
.card-top-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 32rpx;
}
.ornament-line {
  width: 60rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent);
}
.ornament-star {
  font-size: 28rpx;
  color: #ffd700;
}

/* 卡片头部 */
.card-header {
  text-align: center;
  margin-bottom: 24rpx;
}
.card-logo {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
  margin-bottom: 8rpx;
  text-shadow: 0 0 12rpx rgba(255, 215, 0, 0.3);
}
.card-event {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  display: block;
}
.card-date {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 6rpx;
  display: block;
}

/* Display ID */
.card-display-id {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-bottom: 32rpx;
  padding: 12rpx 24rpx;
  background: rgba(255, 215, 0, 0.08);
  border-radius: 24rpx;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}
.display-id-dot {
  font-size: 16rpx;
  color: #ffd700;
}
.display-id-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

/* 统计 */
.card-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40rpx;
  margin-bottom: 32rpx;
  padding: 28rpx 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20rpx;
}
.stat {
  text-align: center;
  min-width: 80rpx;
}
.stat-value {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
}
.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 4rpx;
}
.stat-divider {
  width: 2rpx;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.1);
}

/* 标签云 */
.card-tags {
  margin-bottom: 28rpx;
}
.tag-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 12rpx;
  display: block;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.card-tag {
  padding: 8rpx 20rpx;
  background: rgba(102, 126, 234, 0.2);
  border: 1rpx solid rgba(102, 126, 234, 0.3);
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #a8b4ff;
}

/* 趣味总结 */
.card-summary {
  margin-bottom: 28rpx;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16rpx;
  text-align: center;
}
.summary-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
}

/* 底部 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}
.footer-ornament {
  width: 40rpx;
  height: 2rpx;
  background: rgba(255, 255, 255, 0.15);
}
.footer-slogan {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.25);
}

/* 按钮 */
.actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.share-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 28rpx 0;
}
.share-icon {
  font-size: 32rpx;
}
.back-btn {
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  border-radius: 44rpx;
  font-size: 28rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  padding: 24rpx 0;
}
</style>
