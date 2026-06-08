<template>
  <view class="chat-page">
    <view class="chat-header">
      <view class="chat-header-content">
        <text class="chat-title-icon">💫</text>
        <text class="chat-title">双盲聊天</text>
        <text class="chat-status-dot" />
      </view>
      <text class="chat-subtitle">匿名匹配 · 等待双方都接受后开启</text>
    </view>

    <scroll-view class="chat-list" scroll-y :scroll-top="scrollTop" :enhanced="true" :show-scrollbar="false">
      <view v-if="messages.length === 0" class="empty-chat">
        <text class="empty-icon">💬</text>
        <text class="empty-text">等待系统破冰提示...</text>
        <text class="empty-hint">匹配成功后，主持人会推送破冰话题</text>
      </view>

      <view
        v-for="(msg, i) in messages"
        :key="'m' + i"
        class="msg-row"
        :class="msg.is_system ? 'system' : msg.sender_id === userId ? 'self' : 'other'"
      >
        <view v-if="msg.is_system" class="msg-system">
          <text class="msg-system-icon">🤖</text>
          <text class="msg-system-text">{{ msg.content }}</text>
        </view>

        <view v-else class="msg-bubble" :class="msg.sender_id === userId ? 'bubble-self' : 'bubble-other'">
          <text class="msg-sender">{{ msg.sender_id === userId ? '我' : '对方' }}</text>
          <text class="msg-content">{{ msg.content }}</text>
          <text class="msg-time">{{ formatTime(msg.created_at) }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="chat-input-bar">
      <view class="chat-input-wrap">
        <input
          class="chat-input"
          v-model="inputText"
          placeholder="说点什么吧..."
          placeholder-style="color: rgba(255,255,255,0.35)"
          :disabled="chatDisabled"
          confirm-type="send"
          @confirm="sendMessage"
          @focus="scrollToBottom"
        />
      </view>
      <view
        class="send-btn"
        :class="{ disabled: !inputText.trim() || sending }"
        :hover-class="inputText.trim() && !sending ? 'send-btn--active' : ''"
        @tap="sendMessage"
      >
        <text v-if="sending" class="send-btn-loading">···</text>
        <text v-else>发送</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { matchApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { WsEvent } from '../../services/ws-events';
import { httpErrorToMessage } from '../../services/request';

const API_BASE = import.meta.env?.VITE_API_BASE || '';

const matchId = ref('');
const userId = ref('');
const messages = ref<Array<{ id: string; sender_id: string; content: string; is_system: boolean; created_at?: number }>>([]);
const inputText = ref('');
const scrollTop = ref(0);
const chatDisabled = ref(false);
const sending = ref(false);

let unbindChat: (() => void) | null = null;

onLoad((options: any) => {
  matchId.value = options.matchId || '';
  const userInfo = JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
  userId.value = options.userId || userInfo?.user_id || '';
  loadMessages();
  connectSocket();
});

const loadMessages = async () => {
  try {
    const res: any = await matchApi.getMessages(matchId.value);
    messages.value = res.data || res || [];
    scrollToBottom();
  } catch (e) {
    console.warn('Load messages failed:', e);
  }
};

const connectSocket = () => {
  if (!matchId.value) return;
  // 复用全局 socket，加入房间
  const eventInfo = JSON.parse(uni.getStorageSync('flashmeet_event') || '{}');
  const eid = eventInfo?.event_id || matchId.value;
  socketService.connect(eid, { role: 'user' });

  // 加入盲聊房间（仅匹配的双方能加入），用于接收实时消息
  let joinTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  const joinMatchRoom = () => {
    if (disposed) return;
    if (socketService.connected && matchId.value && userId.value) {
      socketService.emit(WsEvent.JOIN_MATCH_ROOM, {
        match_id: matchId.value,
        user_id: userId.value,
      });
    } else {
      joinTimer = setTimeout(joinMatchRoom, 200);
    }
  };
  joinMatchRoom();

  unbindChat = () => {
    disposed = true;
    if (joinTimer) {
      clearTimeout(joinTimer);
      joinTimer = null;
    }
  };
  const offReal = socketService.onBlindChatMessage((data: any) => {
    if (data.match_id && data.match_id !== matchId.value) return;
    const m = data.message;
    if (m) {
      // 按 id 去重，避免本地+推送双倍展示
      if (m.id && messages.value.some((x) => x.id === m.id)) return;
      messages.value.push(m);
      scrollToBottom();
    }
  });
  // 合成一次性 unbind
  const prev = unbindChat;
  unbindChat = () => {
    prev?.();
    offReal?.();
  };
};

const scrollToBottom = () => {
  nextTick(() => {
    scrollTop.value = 99999;
  });
};

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || sending.value) return;
  sending.value = true;
  try {
    await matchApi.sendMessage(matchId.value, userId.value, text);
    inputText.value = '';
  } catch (e) {
    uni.showToast({ title: httpErrorToMessage(e), icon: 'none' });
  } finally {
    sending.value = false;
  }
};

const formatTime = (ts?: number) => {
  if (!ts) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

onUnload(() => {
  if (unbindChat) {
    unbindChat();
    unbindChat = null;
  }
});
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0a0a2e 100%);
}

.chat-header {
  padding: calc(24rpx + env(safe-area-inset-top)) 32rpx 24rpx;
  text-align: center;
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.12), transparent);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.chat-header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.chat-title-icon {
  font-size: 32rpx;
  filter: drop-shadow(0 0 8rpx rgba(255, 215, 0, 0.6));
}

.chat-title {
  font-size: 36rpx;
  color: #fff;
  font-weight: 700;
  letter-spacing: 4rpx;
}

.chat-status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #4caf50;
  box-shadow: 0 0 8rpx rgba(76, 175, 80, 0.7);
  animation: status-blink 2s ease-in-out infinite;
}
@keyframes status-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.chat-subtitle {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 6rpx;
  letter-spacing: 1rpx;
}

.chat-list {
  flex: 1;
  padding: 24rpx 24rpx 24rpx;
  overflow-y: auto;
  box-sizing: border-box;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 200rpx;
  gap: 12rpx;
  padding: 0 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  line-height: 1;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  letter-spacing: 1rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 1rpx;
  text-align: center;
  line-height: 1.6;
}

.msg-row {
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  animation: msg-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes msg-in {
  0% { transform: translateY(20rpx); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.msg-system {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(102, 126, 234, 0.06));
  border: 1rpx solid rgba(255, 215, 0, 0.2);
  border-radius: 16rpx;
  margin: 0 auto;
  max-width: 80%;
}

.msg-system-icon { font-size: 28rpx; }

.msg-system-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  letter-spacing: 0.5rpx;
}

.msg-bubble {
  max-width: 75%;
  padding: 16rpx 24rpx 12rpx;
  border-radius: 20rpx;
  position: relative;
  word-break: break-word;
}

.bubble-self {
  margin-left: auto;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-bottom-right-radius: 6rpx;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
}

.bubble-other {
  margin-right: auto;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  border-bottom-left-radius: 6rpx;
}

.msg-sender {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 4rpx;
  letter-spacing: 1rpx;
}

.msg-content {
  font-size: 28rpx;
  color: #fff;
  line-height: 1.5;
  letter-spacing: 0.5rpx;
}

.msg-time {
  display: block;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 6rpx;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

.chat-input-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  gap: 16rpx;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

.chat-input-wrap {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  border-radius: 36rpx;
  padding: 0 4rpx;
  transition: border-color 0.2s, background 0.2s;
}
.chat-input-wrap:focus-within {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(102, 126, 234, 0.4);
}

.chat-input {
  width: 100%;
  height: 72rpx;
  padding: 0 24rpx;
  background: transparent;
  font-size: 28rpx;
  color: #fff;
  letter-spacing: 0.5rpx;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 96rpx;
  height: 72rpx;
  padding: 0 28rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #fff;
  font-weight: 700;
  letter-spacing: 2rpx;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.35);
  transition: transform 0.2s var(--fm-ease-smooth, ease), opacity 0.2s;
}
.send-btn:active { transform: scale(0.95); }
.send-btn--active { opacity: 0.85; }

.send-btn.disabled {
  opacity: 0.4;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.send-btn-loading {
  font-size: 32rpx;
  letter-spacing: 2rpx;
  animation: dot-pulse 1.2s linear infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.chat-input[disabled] {
  opacity: 0.5;
}
</style>