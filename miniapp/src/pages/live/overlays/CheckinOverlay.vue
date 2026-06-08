<!--
  CheckinOverlay · 签到浮层
  ------------------------------------------------------------
  作为 Live 容器的浮层出现，不顶替主舞台。
  - 未签到时：浮层升起一个 form / 扫码按钮
  - 已签到时：浮层显示"已签到" + 修改信息入口
-->
<template>
  <view class="checkin-overlay">
    <view class="overlay-card">
      <!-- 头部 -->
      <view class="overlay-head">
        <text class="overlay-tag">第一步</text>
        <text class="overlay-title">签到入场</text>
        <text class="overlay-desc">
          {{ checkedIn ? '已签到 · 你已在现场' : '提交后即出现在大屏的暗星图谱上' }}
        </text>
      </view>

      <!-- 已签到态：精简信息卡 + 修改入口 -->
      <view v-if="checkedIn" class="checked-card">
        <view class="check-icon">✓</view>
        <text class="check-text">已加入「{{ eventId.slice(0, 6) }}…」</text>
        <button class="link-btn" @tap="onResubmit">修改信息</button>
      </view>

      <!-- 未签到态：表单 + 扫码 -->
      <view v-else class="form">
        <view class="form-row">
          <text class="form-label">你的名字</text>
          <input
            v-model="formName"
            class="form-input"
            placeholder="出现在大屏上的名字"
            placeholder-style="color: rgba(255,255,255,0.3)"
            maxlength="16"
          />
        </view>
        <view class="form-row">
          <text class="form-label">手机（选填）</text>
          <input
            v-model="formPhone"
            class="form-input"
            type="number"
            placeholder="用于匹配同频的人"
            placeholder-style="color: rgba(255,255,255,0.3)"
            maxlength="11"
          />
        </view>
        <view class="form-actions">
          <button class="submit-btn" @tap="onSubmit">立即签到</button>
          <button class="scan-btn" @tap="onScan">📷 扫大屏码</button>
        </view>
        <text class="form-tip">已 {{ checkinCount }} 人签到 · 主持人正在等你 ✨</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { eventApi, checkinApi } from '../../../services/api';

interface Props {
  eventId: string;
  checkedIn: boolean;
  checkinCount: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'checkin', payload: { name: string; phone?: string }): void;
  (e: 'resubmit'): void;
}>();

const formName = ref('');
const formPhone = ref('');

const onSubmit = async () => {
  if (!props.eventId) {
    uni.showToast({ title: '缺少活动ID', icon: 'none' });
    return;
  }
  if (!formName.value.trim()) {
    uni.showToast({ title: '请输入名字', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '签到中…' });
  try {
    await checkinApi.guestCheckIn(
      props.eventId,
      formName.value.trim(),
      formPhone.value.trim(),
    );
    uni.hideLoading();
    uni.showToast({ title: '签到成功 ✨', icon: 'success' });
    emit('checkin', { name: formName.value.trim(), phone: formPhone.value.trim() });
  } catch (e: any) {
    uni.hideLoading();
    uni.showToast({ title: e?.message || '签到失败', icon: 'none' });
  }
};

const onScan = () => {
  // #ifdef MP-WEIXIN
  uni.scanCode({
    success: async (res) => {
      const eventId = res.result?.split('eventId=')[1] || res.result;
      if (eventId) {
        try {
          await eventApi.getOne(eventId);
          emit('checkin', { name: formName.value || '扫码用户' });
        } catch {}
      }
    },
  });
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请在微信中扫码', icon: 'none' });
  // #endif
};

const onResubmit = () => emit('resubmit');
</script>

<style scoped>
.checkin-overlay {
  width: 100%;
  animation: slide-up 0.4s var(--fm-ease-smooth, ease);
}
@keyframes slide-up {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.overlay-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04));
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 24rpx;
  padding: 32rpx;
  backdrop-filter: blur(20rpx);
}
.overlay-head {
  margin-bottom: 24rpx;
}
.overlay-tag {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 215, 0, 0.18);
  color: #ffd700;
  border-radius: 999rpx;
  margin-bottom: 12rpx;
}
.overlay-title {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
  margin-bottom: 6rpx;
}
.overlay-desc {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}
.form-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
  width: 160rpx;
}
.form-input {
  flex: 1;
  font-size: 28rpx;
  color: white;
}

.form-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.submit-btn {
  flex: 2;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 28rpx;
  font-weight: 700;
  border-radius: 999rpx;
  height: 80rpx;
  line-height: 80rpx;
}
.scan-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
  border-radius: 999rpx;
  height: 80rpx;
  line-height: 80rpx;
}
.form-tip {
  display: block;
  margin-top: 20rpx;
  text-align: center;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.4);
}

.checked-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: rgba(74, 222, 128, 0.12);
  border: 1rpx solid rgba(74, 222, 128, 0.3);
  border-radius: 16rpx;
}
.check-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 800;
  flex-shrink: 0;
}
.check-text {
  flex: 1;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}
.link-btn {
  background: transparent;
  color: rgba(255, 215, 0, 0.85);
  font-size: 24rpx;
  border: none;
  padding: 0 8rpx;
  height: auto;
  line-height: 1.2;
}
</style>
