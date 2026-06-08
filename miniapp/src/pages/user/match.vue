<template>
  <view class="match-page">
    <!-- 无匹配 -->
    <view v-if="!myMatch" class="no-match">
      <view class="no-match-orb">
        <view class="orb-ring" />
        <view class="orb-ring orb-ring--2" />
        <text class="no-match-icon">🔮</text>
      </view>
      <text class="no-match-title">等待匹配结果</text>
      <text class="no-match-desc">主持人正在基于标签为你匹配灵魂搭档...</text>
    </view>

    <!-- 有匹配 -->
    <view v-else class="match-card">
      <!-- 顶部装饰 -->
      <view class="card-top">
        <view class="star-line" />
        <text class="star-icon">✦</text>
        <view class="star-line" />
      </view>

      <text class="card-title">你的 CP 盲盒结果</text>
      <text class="card-score-num">{{ myMatch.score }}<text class="card-score-unit">%</text></text>
      <text class="card-score-label">相似度</text>

      <!-- 配对双方 -->
      <view class="pair-row">
        <view class="pair-item">
          <view class="avatar">🧑</view>
          <text class="pair-name">{{ myMatch.user_a.display_id }}</text>
          <view class="tag-list">
            <view
              v-for="tag in myMatch.user_a.tags"
              :key="tag"
              class="tag"
            >{{ tag }}</view>
          </view>
        </view>

        <view class="pair-connect">
          <view class="connect-line" />
          <text class="connect-icon">💫</text>
          <view class="connect-line" />
        </view>

        <view class="pair-item">
          <view class="avatar">🧑</view>
          <text class="pair-name">{{ myMatch.user_b.display_id }}</text>
          <view class="tag-list">
            <view
              v-for="tag in myMatch.user_b.tags"
              :key="tag"
              class="tag"
            >{{ tag }}</view>
          </view>
        </view>
      </view>

      <!-- 共同标签 -->
      <view v-if="myMatch.common_tags.length > 0" class="common-tags">
        <text class="common-label">共同标签</text>
        <view class="common-tag-list">
          <view
            v-for="tag in myMatch.common_tags"
            :key="tag"
            class="common-tag"
          >#{{ tag }}</view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view v-if="matchStatus === 'pending'" class="actions">
        <view class="btn accept" @tap="handleAccept">交换名片</view>
        <view class="btn reject" @tap="handleReject">再等等</view>
      </view>

      <view v-else-if="matchStatus === 'half'" class="result waiting">
        <text class="result-icon">⏳</text>
        <text class="result-text">等待对方确认...</text>
        <text class="result-desc">你已同意交换名片，等对方也同意后即可配对</text>
        <view class="btn reject" style="margin-top: 24rpx" @tap="handleReject">取消并退出</view>
      </view>

      <view v-else-if="matchStatus === 'accepted'" class="result success">
        <text class="result-icon">🎉</text>
        <text class="result-text">名片已交换！</text>
        <text class="result-desc">你们已成功配对，快去认识新朋友吧</text>
      </view>

      <view v-else-if="matchStatus === 'rejected'" class="result neutral">
        <text class="result-icon">👋</text>
        <text class="result-text">已跳过</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { matchApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { WsEvent, EventStatus } from '../../services/ws-events';

const eventId = ref('');
const userId = ref('');
const myMatch = ref<any>(null);
const matchStatus = ref<'pending' | 'half' | 'accepted' | 'rejected'>('pending');
let unbindMatch: (() => void) | null = null;
let unbindAccepted: (() => void) | null = null;
let unbindRejected: (() => void) | null = null;
let unbindScene: (() => void) | null = null;
let acceptInFlight = false; // 防止用户多次点交换名片

onLoad((options: any) => {
  eventId.value = options.eventId || '';
  const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
  userId.value = options.userId || userInfo?.user_id || '';
  loadMatches();
  listenMatch();
});

const loadMatches = async () => {
  try {
    const res: any = await matchApi.getMatches(eventId.value);
    const pairs = res.data || res;
    const myPair = pairs.find(
      (p: any) => p.user_a_id === userId.value || p.user_b_id === userId.value,
    );
    if (myPair) {
      myMatch.value = myPair;
      matchStatus.value = myPair.status || 'pending';
    }
  } catch (e) {
    console.warn('Load matches failed:', e);
  }
};

const listenMatch = () => {
  if (!eventId.value) return;
  socketService.connect(eventId.value, { role: 'user' });
  // 清理旧绑定
  unbindMatch?.();
  unbindAccepted?.();
  unbindRejected?.();
  unbindScene?.();

  // 场景切换自动导航
  unbindScene = socketService.onSceneChange((data: any) => {
    if (!data || data.event_id !== eventId.value) return;
    const state = data.state;
    const pages = getCurrentPages();
    const cur = pages[pages.length - 1];
    const curRoute = cur?.route || '';
    if ((state === EventStatus.LOTTERY_RUNNING || state === EventStatus.LOTTERY_READY) && !curRoute.includes('lottery')) {
      uni.navigateTo({ url: `/pages/user/lottery?eventId=${eventId.value}` });
    } else if (state === EventStatus.ENDED && !curRoute.includes('achievement')) {
      uni.navigateTo({ url: `/pages/user/achievement?eventId=${eventId.value}` });
    }
  });

  unbindMatch = socketService.onMatchResult((data: any) => {
    const pairs = data.pairs || [];
    const myPair = pairs.find(
      (p: any) =>
        p.user_a.user_id === userId.value || p.user_b.user_id === userId.value,
    );
    if (myPair) {
      myMatch.value = myPair;
      matchStatus.value = 'pending';
    }
  });
  unbindAccepted = socketService.on(WsEvent.MATCH_ACCEPT, (data: any) => {
    // 仅校验该事件是否与当前用户相关
    const pair = data?.pair;
    if (!pair || (pair.user_a_id !== userId.value && pair.user_b_id !== userId.value)) return;
    matchStatus.value = 'accepted';
  });
  unbindRejected = socketService.on(WsEvent.MATCH_REJECT, (data: any) => {
    const pair = data?.pair;
    if (!pair || (pair.user_a_id !== userId.value && pair.user_b_id !== userId.value)) return;
    matchStatus.value = 'rejected';
  });
};

onUnload(() => {
  unbindMatch?.();
  unbindAccepted?.();
  unbindRejected?.();
  unbindScene?.();
  unbindMatch = unbindAccepted = unbindRejected = unbindScene = null;
});

const handleAccept = async () => {
  if (acceptInFlight) return;
  acceptInFlight = true;
  try {
    const res = await matchApi.accept(eventId.value, userId.value);
    // 后端返回 { status: 'half' | 'matched', pair: ... }
    if (res?.status === 'matched') {
      matchStatus.value = 'accepted';
      uni.showToast({ title: '名片已交换！', icon: 'success' });
      setTimeout(() => {
        uni.navigateTo({ url: `/pages/user/chat?matchId=${myMatch.value?.id}&userId=${userId.value}` });
      }, 800);
    } else {
      // 单方同意，等待对方确认
      matchStatus.value = 'half';
      uni.showToast({ title: '已同意，等待对方确认', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '操作失败，请重试', icon: 'none' });
  } finally {
    acceptInFlight = false;
  }
};

const handleReject = async () => {
  try {
    await matchApi.reject(eventId.value, userId.value);
    matchStatus.value = 'rejected';
  } catch (e) {
    uni.showToast({ title: '操作失败，请重试', icon: 'none' });
  }
};
</script>

<style scoped>
.match-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0a0a2e 100%);
  padding: calc(40rpx + env(safe-area-inset-top)) 24rpx
    calc(60rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
}

.no-match {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 160rpx;
  gap: 20rpx;
}

.no-match-orb {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}
.orb-ring {
  position: absolute;
  inset: 0;
  border: 3rpx solid rgba(118, 75, 162, 0.4);
  border-radius: 50%;
  animation: orb-spin 6s linear infinite;
}
.orb-ring--2 {
  inset: 24rpx;
  border-color: rgba(102, 126, 234, 0.35);
  border-style: dashed;
  animation: orb-spin 8s linear infinite reverse;
}
@keyframes orb-spin {
  to { transform: rotate(360deg); }
}

.no-match-icon {
  font-size: 80rpx;
  line-height: 1;
  filter: drop-shadow(0 0 16rpx rgba(118, 75, 162, 0.5));
}

.no-match-title {
  font-size: 40rpx;
  color: #fff;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.no-match-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 1rpx;
  max-width: 480rpx;
  text-align: center;
  line-height: 1.6;
}

.match-card {
  width: 100%;
  max-width: 640rpx;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
  border-radius: 28rpx;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 48rpx 32rpx;
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.25);
  animation: card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes card-in {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.star-line {
  width: 80rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.5), transparent);
}

.star-icon {
  color: #ffd700;
  font-size: 28rpx;
}

.card-title {
  font-size: 32rpx;
  color: #fff;
  font-weight: 700;
  margin-bottom: 8rpx;
  letter-spacing: 2rpx;
}

.card-score-num {
  font-size: 64rpx;
  font-weight: 900;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  margin-bottom: 4rpx;
}
.card-score-unit {
  font-size: 36rpx;
  font-weight: 700;
  margin-left: 2rpx;
}
.card-score-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 4rpx;
  margin-bottom: 32rpx;
  display: block;
}

.pair-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
  margin-bottom: 32rpx;
}

.pair-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  box-shadow: 0 0 20rpx rgba(102, 126, 234, 0.4);
}

.pair-name {
  font-size: 30rpx;
  color: #fff;
  font-weight: 700;
  letter-spacing: 1rpx;
  font-variant-numeric: tabular-nums;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  justify-content: center;
  max-width: 100%;
}

.tag {
  padding: 4rpx 14rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5rpx;
}

.pair-connect {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
}

.connect-line {
  width: 2rpx;
  height: 32rpx;
  background: linear-gradient(180deg, transparent, rgba(255, 215, 0, 0.5), transparent);
}

.connect-icon {
  font-size: 40rpx;
  filter: drop-shadow(0 0 8rpx rgba(255, 215, 0, 0.6));
  animation: connect-pulse 2s ease-in-out infinite;
}
@keyframes connect-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.common-tags {
  width: 100%;
  margin-bottom: 32rpx;
}

.common-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 14rpx;
  display: block;
  text-align: center;
  letter-spacing: 2rpx;
}

.common-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: center;
}

.common-tag {
  padding: 8rpx 20rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 107, 107, 0.1));
  border: 1rpx solid rgba(255, 215, 0, 0.3);
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #ffd700;
  font-weight: 500;
  letter-spacing: 0.5rpx;
}

.actions {
  display: flex;
  gap: 24rpx;
  width: 100%;
}

.btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 16rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  transition: transform 0.2s var(--fm-ease-smooth, ease), opacity 0.2s;
  letter-spacing: 2rpx;
}
.btn:active { transform: scale(0.97); opacity: 0.9; }

.btn.accept {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a2e;
  box-shadow: 0 6rpx 20rpx rgba(255, 170, 0, 0.35);
}

.btn.reject {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 0;
}

.result-icon {
  font-size: 72rpx;
  line-height: 1;
}

.result-text {
  font-size: 34rpx;
  color: #fff;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.result-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
  letter-spacing: 1rpx;
  line-height: 1.5;
}
</style>