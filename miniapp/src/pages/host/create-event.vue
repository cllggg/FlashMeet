<template>
  <view class="create-event-page">
    <view class="header">
      <text class="title">创建聚会</text>
      <text class="subtitle">起一个有仪式感的名字，让它值得被记住</text>
    </view>

    <view class="form">
      <view class="form-item">
        <text class="label">聚会名称 *</text>
        <input
          class="input"
          v-model="form.title"
          placeholder="如：周五技术酒局"
          placeholder-style="color: rgba(255,255,255,0.3)"
        />
        <text class="counter counter--right">{{ form.title.length }}/40</text>
      </view>

      <view class="form-item">
        <text class="label">聚会描述</text>
        <textarea
          class="textarea"
          v-model="form.description"
          placeholder="介绍一下这场聚会的玩法和主题..."
          placeholder-style="color: rgba(255,255,255,0.3)"
          maxlength="200"
        />
        <text class="counter counter--right">{{ form.description.length }}/200</text>
      </view>

      <view class="form-item">
        <text class="label">地点</text>
        <input
          class="input"
          v-model="form.location"
          placeholder="如：上海·外滩某露台"
          placeholder-style="color: rgba(255,255,255,0.3)"
        />
      </view>

      <view class="form-item">
        <text class="label">计划时间</text>
        <view class="datetime-row">
          <picker mode="date" :value="form.scheduled_date" @change="onDateChange" fields="day">
            <view class="picker picker-half">
              <text class="picker-icon">📅</text>
              <text :class="['picker-text', { 'picker-text--active': form.scheduled_date }]">
                {{ form.scheduled_date || '选择日期' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
          <picker mode="time" :value="form.scheduled_time" @change="onTimeChange">
            <view class="picker picker-half">
              <text class="picker-icon">⏰</text>
              <text :class="['picker-text', { 'picker-text--active': form.scheduled_time }]">
                {{ form.scheduled_time || '选择时间' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>
    </view>

    <button
      class="submit-btn"
      @tap="createEvent"
      :loading="loading"
      :class="{ 'is-loading': loading }"
    >
      <text v-if="!loading">创建并发布</text>
      <text v-else>创建中...</text>
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { eventApi } from '../../services/api';
import { httpErrorToMessage } from '../../services/request';

const form = ref({
  title: '',
  description: '',
  location: '',
  scheduled_date: '',
  scheduled_time: '',
});

const loading = ref(false);

const onDateChange = (e: any) => {
  form.value.scheduled_date = e.detail.value;
};

const onTimeChange = (e: any) => {
  form.value.scheduled_time = e.detail.value;
};

const createEvent = async () => {
  if (!form.value.title) {
    uni.showToast({ title: '请输入聚会名称', icon: 'none' });
    return;
  }

  // 检查日期是否在过去
  if (form.value.scheduled_date) {
    const dateStr = form.value.scheduled_date;
    const timeStr = form.value.scheduled_time || '00:00';
    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);
    if (!isNaN(scheduledAt.getTime()) && scheduledAt < new Date()) {
      uni.showToast({ title: '聚会时间不能早于当前时间', icon: 'none' });
      return;
    }
  }

  loading.value = true;
  try {
    const data: Record<string, any> = {};
    // 合并日期和时间为 scheduled_at
    if (form.value.scheduled_date) {
      const timePart = form.value.scheduled_time || '00:00';
      data['scheduled_at'] = `${form.value.scheduled_date}T${timePart}:00`;
    }
    if (form.value.title) data['title'] = form.value.title;
    if (form.value.description) data['description'] = form.value.description;
    if (form.value.location) data['location'] = form.value.location;
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
  } catch (err) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ===== 基础布局 ===== */
.create-event-page {
  min-height: 100vh;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}
.header { margin-bottom: 48rpx; }
.title {
  font-size: 48rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  margin-bottom: 10rpx;
  letter-spacing: 4rpx;
}
.subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  display: block;
  letter-spacing: 1rpx;
  line-height: 1.5;
}
.form-item {
  margin-bottom: 32rpx;
  position: relative;
}
.label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 14rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}
.required { color: #ff6b6b; }
.counter {
  display: block;
  text-align: right;
  margin-top: 10rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.3);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  pointer-events: none;
}
.counter--right { text-align: right; }

/* ===== 关键修复：uni-app H5 全局 CSS 强制 <uni-input> 高度为 1.4em + overflow:hidden，
   导致 input 被压扁、padding 溢出被切，必须用 ::v-deep 穿透覆盖。 */
:deep(uni-input) {
  display: block;
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  font-size: inherit;
  line-height: inherit;
}
:deep(uni-textarea) {
  display: block;
  font-size: inherit;
  line-height: inherit;
}

/* ===== 容器：class="input" 实际落在 <uni-input> 根元素上 ===== */
.input {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 18rpx;
  padding: 24rpx;
  color: white;
  font-size: 30rpx;
  width: 100%;
  letter-spacing: 0.5rpx;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
  display: block;
  outline: none;
  pointer-events: auto;
  -webkit-user-select: text;
  user-select: text;
  caret-color: white;
}

/* ===== 真实 input 元素：.uni-input-input ===== */
:deep(.uni-input-input) {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 18rpx;
  padding: 24rpx;
  color: white;
  font-size: 30rpx;
  width: 100%;
  letter-spacing: 0.5rpx;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
  display: block;
  outline: none;
  pointer-events: auto !important;
  -webkit-user-select: text !important;
  user-select: text !important;
  caret-color: white;
  height: auto !important;
  min-height: 1.6em;
  position: relative;
  z-index: 2;
}
:deep(.uni-input-input:focus) {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.1);
}
:deep(.uni-input-placeholder) {
  padding: 24rpx;
  color: rgba(255, 255, 255, 0.3);
  font-size: 30rpx;
  z-index: 1;
  top: 0 !important;
}

/* ===== 真实 textarea 元素 ===== */
.textarea {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 18rpx;
  padding: 24rpx;
  color: white;
  font-size: 30rpx;
  width: 100%;
  letter-spacing: 0.5rpx;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
  outline: none;
  caret-color: white;
  height: 200rpx;
  line-height: 1.5;
}
:deep(.uni-textarea-textarea) {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 18rpx;
  padding: 24rpx;
  color: white;
  font-size: 30rpx;
  letter-spacing: 0.5rpx;
  caret-color: white;
}
:deep(.uni-textarea-textarea:focus) {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

/* ===== Picker ===== */
.picker {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 18rpx;
  transition: border-color 0.2s;
}
.picker:active { border-color: rgba(102, 126, 234, 0.5); }
.picker-icon { font-size: 32rpx; }
.picker-text {
  flex: 1;
  color: rgba(255, 255, 255, 0.4);
  font-size: 30rpx;
  letter-spacing: 0.5rpx;
}
.picker-text--active { color: white; }
.picker-arrow {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 300;
  line-height: 1;
}
.datetime-row {
  display: flex;
  gap: 16rpx;
}
.picker-half {
  flex: 1;
  min-width: 0;
}

/* ===== Submit button ===== */
.submit-btn {
  margin-top: 48rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 46rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  height: 92rpx;
  line-height: 92rpx;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
  transition: transform 0.2s, opacity 0.2s;
}
.submit-btn::after { border: none; }
.submit-btn:active { transform: scale(0.98); opacity: 0.92; }
.submit-btn.is-loading { opacity: 0.7; }
</style>
