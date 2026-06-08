<!--
  ChatOverlay · 双盲聊天浮层
  ------------------------------------------------------------
  v3.0 极简化：所有用户功能都在 Live 容器内 Overlay 切换
  - 不再跳转独立 page
  - 通过 emit('close') 退回到主容器
-->
<template>
  <view class="chat-overlay">
    <view class="chat-head">
      <text class="chat-title">💬 双盲聊天</text>
      <text class="chat-close" @tap="$emit('close')">✕</text>
    </view>

    <scroll-view scroll-y class="chat-list">
      <view v-if="messages.length === 0" class="chat-empty">
        <text class="chat-empty-icon">🌌</text>
        <text class="chat-empty-text">匹配成功后，对话会出现在这里</text>
      </view>
      <view
        v-for="m in messages"
        :key="m.id"
        class="chat-bubble"
        :class="{ 'chat-bubble--mine': m.fromMe }"
      >
        <text class="chat-text">{{ m.text }}</text>
      </view>
    </scroll-view>

    <view class="chat-input">
      <input
        v-model="draft"
        class="chat-input-field"
        placeholder="说点什么..."
        placeholder-style="color: rgba(255,255,255,0.4);"
        confirm-type="send"
        @confirm="onSend"
      />
      <view class="chat-send" @tap="onSend">
        <text class="chat-send-text">发送</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface ChatMsg {
  id: string;
  text: string;
  fromMe: boolean;
}

interface Props { eventId: string }
const props = defineProps<Props>();
defineEmits<{ (e: 'close'): void }>();

const messages = ref<ChatMsg[]>([
  { id: 'm1', text: 'Hi，我在屏幕前面，已经开场了吗？', fromMe: true },
  { id: 'm2', text: '我刚扫完码，期待！', fromMe: false },
]);
const draft = ref('');

const onSend = () => {
  const t = draft.value.trim();
  if (!t) return;
  messages.value.push({
    id: `m-${Date.now()}`,
    text: t,
    fromMe: true,
  });
  draft.value = '';
};
</script>

<style scoped>
.chat-overlay {
  display: flex;
  flex-direction: column;
  height: 70vh;
  background: linear-gradient(160deg, rgba(15, 15, 35, 0.95), rgba(8, 8, 24, 0.95));
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx;
  animation: slide-up 0.3s var(--fm-ease-smooth, ease);
}
@keyframes slide-up {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.chat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 4rpx 16rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}
.chat-title { font-size: 30rpx; font-weight: 700; }
.chat-close { font-size: 32rpx; color: rgba(255, 255, 255, 0.6); padding: 8rpx 16rpx; }
.chat-list { flex: 1; padding: 16rpx 0; }
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: rgba(255, 255, 255, 0.4);
}
.chat-empty-icon { font-size: 60rpx; margin-bottom: 16rpx; }
.chat-empty-text { font-size: 24rpx; }
.chat-bubble {
  max-width: 70%;
  padding: 14rpx 20rpx;
  margin-bottom: 16rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16rpx;
  font-size: 26rpx;
  line-height: 1.5;
}
.chat-bubble--mine {
  margin-left: auto;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
}
.chat-input {
  display: flex;
  gap: 12rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);
}
.chat-input-field {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  color: #fff;
}
.chat-send {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  padding: 16rpx 28rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
}
.chat-send-text { color: #fff; font-size: 26rpx; font-weight: 600; }
</style>
