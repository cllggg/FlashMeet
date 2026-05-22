<template>
  <view class="lottery-manage-page">
    <text class="title">抽奖管理</text>

    <view class="section" v-if="eventId">
      <text class="section-title">创建奖池</text>
      <view class="form-item">
        <text class="label">奖池名称</text>
        <input class="input" v-model="poolForm.name" placeholder="如：一等奖" placeholder-style="color: rgba(255,255,255,0.3)" />
      </view>

      <view class="prizes">
        <view v-for="(prize, i) in poolForm.prizes" :key="i" class="prize-item">
          <input class="input small" v-model="prize.name" placeholder="奖品名" placeholder-style="color: rgba(255,255,255,0.3)" />
          <input class="input small" v-model.number="prize.total_count" type="number" placeholder="数量" placeholder-style="color: rgba(255,255,255,0.3)" />
        </view>
        <button class="add-prize-btn" @tap="addPrize">+ 添加奖品</button>
      </view>

      <button class="submit-btn" @tap="createPool">创建奖池</button>
    </view>

    <view class="section">
      <text class="section-title">奖池列表</text>
      <view v-for="pool in pools" :key="pool.id" class="pool-item">
        <view class="pool-header">
          <text class="pool-name">{{ pool.name }}</text>
          <button class="draw-btn" size="mini" @tap="drawLottery(pool.id)">抽取</button>
        </view>
        <view v-for="prize in pool.prizes" :key="prize.id" class="prize-info">
          <text>{{ prize.name }}: {{ prize.remaining_count }}/{{ prize.total_count }}</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="winners.length > 0">
      <text class="section-title">中奖名单</text>
      <view v-for="w in winners" :key="w.id" class="winner-item">
        <text class="winner-name">{{ w.user?.nickname || '幸运儿' }}</text>
        <text class="winner-prize">{{ w.prize_name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { lotteryApi } from '../../services/api';

const eventId = ref('');
const pools = ref<any[]>([]);
const winners = ref<any[]>([]);

const poolForm = ref({
  name: '',
  prizes: [{ name: '', total_count: 1 }],
});

onLoad((options: any) => {
  if (options?.eventId) {
    eventId.value = options.eventId;
    uni.setStorageSync('flashmeet_current_event', options.eventId);
    loadPools();
    loadWinners();
  }
});

const addPrize = () => {
  poolForm.value.prizes.push({ name: '', total_count: 1 });
};

const createPool = async () => {
  if (!eventId.value || !poolForm.value.name) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }
  try {
    await lotteryApi.createPool({
      event_id: eventId.value,
      name: poolForm.value.name,
      prizes: poolForm.value.prizes.filter((p) => p.name),
    });
    uni.showToast({ title: '创建成功', icon: 'success' });
    poolForm.value = { name: '', prizes: [{ name: '', total_count: 1 }] };
    loadPools();
  } catch {
    uni.showToast({ title: '创建失败', icon: 'none' });
  }
};

const drawLottery = async (poolId: string) => {
  if (!eventId.value) return;
  try {
    const res = await lotteryApi.draw(eventId.value, poolId, `draw_${Date.now()}`);
    uni.showToast({ title: '抽取成功！', icon: 'success' });
    loadWinners();
    loadPools();
  } catch (err) {
    uni.showToast({ title: '抽取失败', icon: 'none' });
  }
};

const loadPools = async () => {
  if (!eventId.value) return;
  try {
    const res: any = await lotteryApi.getPools(eventId.value);
    pools.value = res;
  } catch {}
};

const loadWinners = async () => {
  if (!eventId.value) return;
  try {
    const res: any = await lotteryApi.getWinners(eventId.value);
    winners.value = res;
  } catch {}
};

onMounted(() => {
  // Get current event ID from storage
  const stored = uni.getStorageSync('flashmeet_current_event');
  if (stored) {
    eventId.value = stored;
    loadPools();
    loadWinners();
  }
});
</script>

<style scoped>
.lottery-manage-page {
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffd700;
  display: block;
  margin-bottom: 30rpx;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 20rpx;
}

.label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 8rpx;
}

.input {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 12rpx;
  padding: 20rpx;
  color: white;
  font-size: 28rpx;
}

.input.small {
  width: 48%;
  display: inline-block;
  margin-right: 4%;
  margin-bottom: 12rpx;
}

.prize-item {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.add-prize-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #667eea;
  font-size: 26rpx;
  border: 2rpx dashed rgba(102, 126, 234, 0.3);
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.submit-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  color: #0a0a2e;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
  border: none;
}

.pool-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.pool-name {
  font-size: 30rpx;
  font-weight: bold;
  color: white;
}

.draw-btn {
  background: #667eea;
  color: white;
  border-radius: 30rpx;
  font-size: 24rpx;
  border: none;
}

.prize-info {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4rpx;
}

.winner-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.winner-name {
  font-size: 28rpx;
  color: white;
}

.winner-prize {
  font-size: 26rpx;
  color: #ffd700;
}
</style>
