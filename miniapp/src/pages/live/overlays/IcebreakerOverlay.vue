<!--
  IcebreakerOverlay · 破冰浮层
  ------------------------------------------------------------
  显示当前问题、提交答案、查看自己是否已答。
  主持人可通过后端切换问题。
-->
<template>
  <view class="icebreaker-overlay">
    <view class="overlay-card">
      <view class="overlay-head">
        <text class="overlay-tag">破冰环节</text>
        <text class="overlay-title">一句话介绍自己</text>
        <text class="overlay-desc">你说什么会决定谁与你"心意相通"</text>
      </view>

      <view v-if="!currentQuestion" class="empty">
        <text class="empty-icon">⏳</text>
        <text class="empty-text">主持人即将发布第一个问题</text>
      </view>

      <view v-else class="question">
        <text class="q-label">Q</text>
        <text class="q-text">{{ currentQuestion.text }}</text>

        <view v-if="answered" class="answered">
          <text class="answered-icon">✓</text>
          <text class="answered-text">已提交 · 等待结果</text>
        </view>
        <textarea
          v-else
          v-model="answer"
          class="answer-input"
          placeholder="用一句话回答（最多 100 字）"
          placeholder-style="color: rgba(255,255,255,0.3)"
          maxlength="100"
          auto-height
        />
        <button v-if="!answered" class="submit-btn" @tap="onSubmit" :disabled="!answer.trim()">
          提交答案
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { icebreakerApi } from '../../../services/api';

interface Question {
  id: string;
  text: string;
}
interface Props {
  eventId: string;
  currentQuestion: Question | null;
  answered: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'submit', answer: string): void;
}>();

const answer = ref('');

watch(
  () => props.currentQuestion,
  () => {
    answer.value = '';
  },
);

const onSubmit = async () => {
  if (!props.eventId || !props.currentQuestion) return;
  if (!answer.value.trim()) return;
  uni.showLoading({ title: '提交中…' });
  try {
    // 破冰答题：v2.0 简化为"提交一句话"，先走 answer 路径，把答案放 option_key
    await icebreakerApi.answerGuest({
      event_id: props.eventId,
      question_id: props.currentQuestion.id,
      option_key: answer.value.trim(),
    });
    uni.hideLoading();
    emit('submit', answer.value.trim());
  } catch (e: any) {
    uni.hideLoading();
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' });
  }
};
</script>

<style scoped>
.icebreaker-overlay {
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
.overlay-head { margin-bottom: 24rpx; }
.overlay-tag {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 107, 107, 0.18);
  color: #ff6b6b;
  border-radius: 999rpx;
  margin-bottom: 12rpx;
}
.overlay-title {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  margin-bottom: 6rpx;
}
.overlay-desc {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  gap: 12rpx;
}
.empty-icon { font-size: 64rpx; }
.empty-text { font-size: 24rpx; color: rgba(255, 255, 255, 0.55); }

.question {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.q-label {
  display: inline-block;
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #ff6b6b, #ffd700);
  color: white;
  font-weight: 800;
  font-size: 28rpx;
  border-radius: 12rpx;
  text-align: center;
  line-height: 48rpx;
  align-self: flex-start;
}
.q-text {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: white;
  line-height: 1.5;
}
.answer-input {
  width: 100%;
  min-height: 120rpx;
  background: rgba(0, 0, 0, 0.25);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: white;
  line-height: 1.5;
}
.submit-btn {
  background: linear-gradient(135deg, #ff6b6b, #ffd700);
  color: white;
  font-size: 28rpx;
  font-weight: 700;
  border-radius: 999rpx;
  height: 80rpx;
  line-height: 80rpx;
  margin-top: 8rpx;
}
.submit-btn:disabled { opacity: 0.4; }

.answered {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx;
  background: rgba(74, 222, 128, 0.12);
  border: 1rpx solid rgba(74, 222, 128, 0.3);
  border-radius: 16rpx;
}
.answered-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #4ade80;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 24rpx;
}
.answered-text { font-size: 26rpx; color: rgba(255, 255, 255, 0.9); }
</style>
