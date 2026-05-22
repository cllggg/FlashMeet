<template>
  <view class="dashboard-page">
    <text class="title">场控台</text>

    <view class="event-info" v-if="currentEvent">
      <text class="event-name">{{ currentEvent.title }}</text>
      <text class="event-state">当前状态：{{ stateLabel(currentEvent.current_state) }}</text>
      <view class="event-id-row">
        <text class="event-id-label">ID: {{ currentEvent.event_id }}</text>
        <text class="event-id-hint">(在大屏端输入)</text>
      </view>
    </view>

    <view class="scene-buttons">
      <text class="section-title">场景切换</text>
      <view class="btn-grid">
        <button
          v-for="scene in scenes"
          :key="scene.state"
          class="scene-btn"
          :class="{ active: currentState === scene.state }"
          @tap="changeScene(scene.state)"
        >
          {{ scene.label }}
        </button>
      </view>
    </view>

    <view class="events-list" v-if="myEvents.length > 0">
      <text class="section-title">我的聚会</text>
      <view
        v-for="evt in myEvents"
        :key="evt.event_id"
        class="event-item"
        @tap="selectEvent(evt)"
      >
        <text class="event-item-name">{{ evt.title }}</text>
        <text class="event-item-state">{{ stateLabel(evt.current_state) }}</text>
      </view>
    </view>

    <button class="create-btn" @tap="goToCreate">创建新聚会</button>
    <button class="create-btn" style="background: rgba(255,215,0,0.15); margin-top: 16rpx;" @tap="goToLottery" v-if="currentEvent">
      抽奖管理
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { eventApi } from '../../services/api';
import { EventStatus, WsEvent } from '../../services/ws-events';

const myEvents = ref<any[]>([]);
const currentEvent = ref<any>(null);
const currentState = ref(EventStatus.STANDBY);

const scenes = [
  { state: EventStatus.STANDBY, label: '待机' },
  { state: EventStatus.CHECKIN, label: '签到' },
  { state: EventStatus.LOTTERY_READY, label: '抽奖准备' },
  { state: EventStatus.LOTTERY_RUNNING, label: '抽奖中' },
  { state: EventStatus.GAME_SHAKE, label: '摇一摇' },
  { state: EventStatus.ENDED, label: '结束' },
];

const stateLabel = (state: string) => {
  const map: Record<string, string> = {
    [EventStatus.STANDBY]: '待机',
    [EventStatus.CHECKIN]: '签到中',
    [EventStatus.LOTTERY_READY]: '抽奖准备',
    [EventStatus.LOTTERY_RUNNING]: '抽奖中',
    [EventStatus.GAME_SHAKE]: '摇一摇',
    [EventStatus.ENDED]: '已结束',
  };
  return map[state] || state;
};

const selectEvent = async (evt: any) => {
  currentEvent.value = evt;
  try {
    const res: any = await eventApi.getCurrentState(evt.event_id);
    currentState.value = res.state;
  } catch {}
};

const changeScene = async (targetState: EventStatus) => {
  if (!currentEvent.value) {
    uni.showToast({ title: '请先选择聚会', icon: 'none' });
    return;
  }

  try {
    await eventApi.changeScene(currentEvent.value.event_id, targetState);
    currentState.value = targetState;
    uni.showToast({ title: `已切换至${stateLabel(targetState)}`, icon: 'success' });
  } catch {
    uni.showToast({ title: '切换失败', icon: 'none' });
  }
};

const goToCreate = () => {
  uni.navigateTo({ url: '/pages/host/create-event' });
};

const goToLottery = () => {
  if (currentEvent.value) {
    uni.setStorageSync('flashmeet_current_event', currentEvent.value.event_id);
    uni.navigateTo({ url: `/pages/host/lottery-manage?eventId=${currentEvent.value.event_id}` });
  }
};

onMounted(async () => {
  try {
    const res: any = await eventApi.getMyEvents();
    myEvents.value = res;
    if (res.length > 0) {
      await selectEvent(res[0]);
    }
  } catch {}
});
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 30rpx;
}

.event-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
}

.event-name {
  font-size: 34rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 8rpx;
}

.event-state {
  font-size: 26rpx;
  color: #667eea;
}

.event-id-row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
}

.event-id-label {
  font-size: 24rpx;
  color: #ffd700;
  padding: 6rpx 16rpx;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8rpx;
  word-break: break-all;
}

.event-id-hint {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.35);
  margin-left: 10rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 20rpx;
}

.btn-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 40rpx;
}

.scene-btn {
  width: calc(33.33% - 12rpx);
  height: 80rpx;
  line-height: 80rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  color: rgba(255, 255, 255, 0.7);
  font-size: 26rpx;
  padding: 0;
}

.scene-btn.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  color: white;
}

.events-list {
  margin-bottom: 40rpx;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.event-item-name {
  font-size: 28rpx;
  color: white;
}

.event-item-state {
  font-size: 24rpx;
  color: #667eea;
}

.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}
</style>
