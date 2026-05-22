<template>
  <view class="profile-page">
    <text class="title">渐进式画像</text>
    <text class="desc">回答问题，点亮你的星系标签</text>

    <view class="question-card">
      <text class="question">{{ currentQuestion.text }}</text>
      <view class="options">
        <view
          v-for="option in currentQuestion.options"
          :key="option.value"
          class="option"
          :class="{ selected: selectedTags.includes(option.value) }"
          @tap="selectOption(option.value)"
        >
          <text>{{ option.label }}</text>
        </view>
      </view>
    </view>

    <view class="my-tags" v-if="myTags.length > 0">
      <text class="tags-title">我的标签</text>
      <view class="tags-list">
        <text v-for="tag in myTags" :key="tag" class="tag">{{ tag }}</text>
      </view>
    </view>

    <button class="next-btn" @tap="nextQuestion" v-if="currentQuestionIndex < questions.length - 1">
      下一题
    </button>
    <button class="next-btn finish" @tap="finishProfile" v-else>
      完成画像
    </button>
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

const selectOption = (value: string) => {
  const idx = selectedTags.value.indexOf(value);
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1);
  } else {
    selectedTags.value.push(value);
  }
};

const nextQuestion = () => {
  myTags.value = [...new Set([...myTags.value, ...selectedTags.value])];
  selectedTags.value = [];
  currentQuestionIndex.value++;
};

const finishProfile = async () => {
  myTags.value = [...new Set([...myTags.value, ...selectedTags.value])];
  const eventId = uni.getStorageSync('flashmeet_current_event');
  if (eventId) {
    try {
      await checkinApi.updateTags(eventId, myTags.value);
    } catch {}
  }
  uni.showToast({ title: '画像完成！', icon: 'success' });
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 60rpx 40rpx;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 12rpx;
}

.desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 60rpx;
}

.question-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
}

.question {
  font-size: 36rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 40rpx;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.option {
  padding: 20rpx 40rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 40rpx;
  color: rgba(255, 255, 255, 0.7);
  font-size: 28rpx;
}

.option.selected {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  color: white;
}

.my-tags {
  margin-bottom: 40rpx;
}

.tags-title {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 16rpx;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  padding: 8rpx 24rpx;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #667eea;
}

.next-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}

.finish {
  background: linear-gradient(135deg, #4fc3f7 0%, #66bb6a 100%);
}
</style>
