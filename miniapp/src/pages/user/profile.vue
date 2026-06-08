<template>
  <view class="profile-page">
    <view class="header">
      <text class="title">渐进式画像</text>
      <text class="desc">回答问题，点亮你的星系标签</text>
      <view class="progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPct }" />
        </view>
        <text class="progress-text">{{ currentQuestionIndex + 1 }} / {{ questions.length }}</text>
      </view>
    </view>

    <view class="question-card">
      <view class="q-num-badge">
        <text>Q{{ currentQuestionIndex + 1 }}</text>
      </view>
      <text class="question">{{ currentQuestion.text }}</text>
      <view class="options">
        <view
          v-for="option in currentQuestion.options"
          :key="option.value"
          class="option"
          :class="{ selected: selectedTags.includes(option.value) }"
          @tap="selectOption(option.value)"
        >
          <view v-if="selectedTags.includes(option.value)" class="option-check">✓</view>
          <text>{{ option.label }}</text>
        </view>
      </view>
    </view>

    <view v-if="myTags.length > 0" class="my-tags">
      <view class="my-tags-head">
        <text class="tags-title">已点亮</text>
        <text class="tags-count">{{ myTags.length }}</text>
      </view>
      <view class="tags-list">
        <view v-for="tag in myTags" :key="tag" class="tag">
          <text class="tag-icon">✦</text>
          <text>{{ tag }}</text>
        </view>
      </view>
    </view>

    <view class="btn-row">
      <button
        class="next-btn"
        @tap="nextQuestion"
        v-if="currentQuestionIndex < questions.length - 1"
        :class="{ 'is-disabled': selectedTags.length === 0 }"
      >
        下一题
      </button>
      <button
        class="next-btn finish"
        @tap="finishProfile"
        v-else
        :class="{ 'is-disabled': selectedTags.length === 0 }"
      >
        完成画像
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { checkinApi } from '../../services/api';

const questions = [
  {
    text: '你是 I 人还是 E 人？',
    options: [
      { label: 'I - 内向型', value: 'I' },
      { label: 'E - 外向型', value: 'E' },
    ],
  },
  {
    text: '你的职能领域是？',
    options: [
      { label: '技术', value: 'tech' },
      { label: '设计', value: 'design' },
      { label: '产品', value: 'product' },
      { label: '市场', value: 'marketing' },
    ],
  },
  {
    text: '你的社交风格？',
    options: [
      { label: '主动出击', value: 'proactive' },
      { label: '被动等待', value: 'passive' },
      { label: '看心情', value: 'flexible' },
    ],
  },
];

const currentQuestionIndex = ref(0);
const selectedTags = ref<string[]>([]);
const myTags = ref<string[]>([]);

const currentQuestion = computed(() => questions[currentQuestionIndex.value]);

const progressPct = computed(() => {
  return `${Math.round(((currentQuestionIndex.value + 1) / questions.length) * 100)}%`;
});

const selectOption = (value: string) => {
  const idx = selectedTags.value.indexOf(value);
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1);
  } else {
    selectedTags.value.push(value);
  }
};

const nextQuestion = () => {
  if (selectedTags.value.length === 0) {
    uni.showToast({ title: '请至少选择一个选项', icon: 'none' });
    return;
  }
  myTags.value = [...new Set([...myTags.value, ...selectedTags.value])];
  selectedTags.value = [];
  currentQuestionIndex.value++;
};

const finishProfile = async () => {
  if (selectedTags.value.length === 0) {
    uni.showToast({ title: '请至少选择一个选项', icon: 'none' });
    return;
  }
  myTags.value = [...new Set([...myTags.value, ...selectedTags.value])];
  const eventId = uni.getStorageSync('flashmeet_current_event');
  if (eventId) {
    try {
      await checkinApi.updateTags(eventId, myTags.value);
    } catch {}
  }
  uni.showToast({ title: '画像完成！', icon: 'success' });
  setTimeout(() => {
    uni.navigateBack();
  }, 800);
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.header { margin-bottom: 40rpx; }

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

.desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  display: block;
  margin-bottom: 28rpx;
  letter-spacing: 1rpx;
}

.progress {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.progress-bar {
  flex: 1;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #ff6b6b, #ffd700);
  border-radius: 999rpx;
  transition: width 0.4s var(--fm-ease-smooth, ease);
  box-shadow: 0 0 12rpx rgba(255, 215, 0, 0.4);
}
.progress-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  letter-spacing: 1rpx;
}

.question-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 36rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
  animation: q-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes q-in {
  0% { transform: translateY(20rpx); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.q-num-badge {
  display: inline-block;
  padding: 4rpx 16rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 999rpx;
  font-size: 22rpx;
  color: white;
  font-weight: 700;
  letter-spacing: 1rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.35);
}

.question {
  font-size: 36rpx;
  font-weight: 700;
  color: white;
  line-height: 1.5;
  display: block;
  margin-bottom: 32rpx;
  letter-spacing: 1rpx;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.option {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 18rpx 32rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 999rpx;
  color: rgba(255, 255, 255, 0.75);
  font-size: 28rpx;
  letter-spacing: 0.5rpx;
  transition: all 0.2s var(--fm-ease-smooth, ease);
}
.option:active { transform: scale(0.96); }

.option.selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.25));
  border-color: #667eea;
  color: white;
  font-weight: 600;
  box-shadow: 0 0 16rpx rgba(102, 126, 234, 0.3);
}

.option-check {
  font-size: 28rpx;
  font-weight: 700;
  color: #4fc3f7;
}

.my-tags {
  margin-bottom: 40rpx;
  padding: 24rpx 28rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  border-radius: 20rpx;
}

.my-tags-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tags-title {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2rpx;
}

.tags-count {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.12);
  border-radius: 999rpx;
  padding: 2rpx 12rpx;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 20rpx;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.22), rgba(118, 75, 162, 0.15));
  border: 1rpx solid rgba(102, 126, 234, 0.3);
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #a8b9ff;
  font-weight: 500;
}

.tag-icon {
  color: #ffd700;
  font-size: 20rpx;
}

.btn-row { margin-top: 8rpx; }

.next-btn {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 46rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
  transition: transform 0.2s, opacity 0.2s;
}
.next-btn::after { border: none; }
.next-btn:active { transform: scale(0.98); opacity: 0.92; }
.next-btn.is-disabled {
  opacity: 0.4;
  box-shadow: none;
}

.finish {
  background: linear-gradient(135deg, #4fc3f7 0%, #66bb6a 100%);
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.35);
}
</style>
