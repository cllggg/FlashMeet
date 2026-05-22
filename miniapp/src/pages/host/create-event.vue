<template>
  <view class="create-event-page">
    <text class="title">创建聚会</text>

    <view class="form">
      <view class="form-item">
        <text class="label">聚会名称 *</text>
        <input class="input" v-model="form.title" placeholder="请输入聚会名称" placeholder-style="color: rgba(255,255,255,0.3)" />
      </view>

      <view class="form-item">
        <text class="label">聚会描述</text>
        <textarea class="textarea" v-model="form.description" placeholder="请输入聚会描述" placeholder-style="color: rgba(255,255,255,0.3)" />
      </view>

      <view class="form-item">
        <text class="label">地点</text>
        <input class="input" v-model="form.location" placeholder="请输入聚会地点" placeholder-style="color: rgba(255,255,255,0.3)" />
      </view>

      <view class="form-item">
        <text class="label">计划时间</text>
        <picker mode="date" @change="onDateChange">
          <text class="picker-text">{{ form.scheduled_at || '选择日期' }}</text>
        </picker>
      </view>
    </view>

    <button class="submit-btn" @tap="createEvent" :loading="loading">
      创建并发布
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { eventApi } from '../../services/api';

const form = ref({
  title: '',
  description: '',
  location: '',
  scheduled_at: '',
});

const loading = ref(false);

const onDateChange = (e: any) => {
  form.value.scheduled_at = e.detail.value;
};

const createEvent = async () => {
  if (!form.value.title) {
    uni.showToast({ title: '请输入聚会名称', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(form.value)) {
      if (v !== '' && v !== null && v !== undefined) {
        data[k] = v;
      }
    }
    const res: any = await eventApi.create(data);
    await eventApi.publish(res.event_id);
    uni.showToast({ title: '创建成功！', icon: 'success' });

    const eventId = res.event_id;
    uni.showModal({
      title: '聚会已创建',
      content: `聚会ID: ${eventId}\n\n请在大屏端输入此ID进入聚会`,
      confirmText: '复制并返回',
      cancelText: '直接返回',
      success: (modalRes) => {
        if (modalRes.confirm) {
          uni.setClipboardData({
            data: eventId,
            showToast: true,
          });
        }
        uni.navigateBack();
      },
    });
  } catch {
    uni.showToast({ title: '创建失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.create-event-page {
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  display: block;
  margin-bottom: 12rpx;
}

.input, .textarea {
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  color: white;
  font-size: 30rpx;
  width: 100%;
}

.textarea {
  height: 200rpx;
}

.picker-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 30rpx;
}

.submit-btn {
  margin-top: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}
</style>
