<template>
  <view class="achievement-page">
    <text class="title">数字社交成就卡</text>

    <view class="card">
      <view class="card-header">
        <text class="card-name">聚闪耀</text>
        <text class="card-event">{{ eventName }}</text>
      </view>

      <view class="card-stats">
        <view class="stat">
          <text class="stat-value">{{ stats.checkins }}</text>
          <text class="stat-label">参与人数</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ stats.tags }}</text>
          <text class="stat-label">我的标签</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ stats.score }}</text>
          <text class="stat-label">摇一摇</text>
        </view>
      </view>

      <view class="card-tags" v-if="myTags.length > 0">
        <text v-for="tag in myTags" :key="tag" class="card-tag">{{ tag }}</text>
      </view>

      <view class="card-footer">
        <text class="card-slogan">计算相遇的概率，渲染心动的瞬间</text>
      </view>
    </view>

    <button class="share-btn" open-type="share">分享成就卡</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { eventApi, checkinApi } from '../../services/api';

const eventName = ref('聚会名称');
const myTags = ref<string[]>([]);
const stats = ref({
  checkins: 0,
  tags: 0,
  score: 0,
});

onLoad(async (options: any) => {
  const eventId = options?.eventId;
  if (eventId) {
    try {
      const event: any = await eventApi.getOne(eventId);
      eventName.value = event.title;
    } catch {}

    try {
      const checkins: any = await checkinApi.getCheckins(eventId);
      stats.value.checkins = checkins.length;

      const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
      const myCheckin = checkins.find((c: any) => c.user_id === userInfo.user_id);
      if (myCheckin) {
        myTags.value = myCheckin.local_tags || [];
        stats.value.tags = myTags.value.length;
      }
    } catch {}
  }
});
</script>

<style scoped>
.achievement-page {
  min-height: 100vh;
  padding: 60rpx 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
  display: block;
  text-align: center;
  margin-bottom: 40rpx;
}

.card {
  background: linear-gradient(135deg, #1a1a4e 0%, #2a1a6e 100%);
  border: 2rpx solid rgba(102, 126, 234, 0.3);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
}

.card-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.card-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-bottom: 8rpx;
}

.card-event {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.5);
}

.card-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30rpx;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.4);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 30rpx;
}

.card-tag {
  padding: 8rpx 20rpx;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #667eea;
}

.card-footer {
  text-align: center;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
}

.card-slogan {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.3);
}

.share-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}
</style>
