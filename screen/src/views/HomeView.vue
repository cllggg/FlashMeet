<template>
  <div class="home-page">
    <div class="home-card">
      <h1 class="logo">聚闪耀</h1>
      <p class="subtitle">线下社交 · 大屏互动</p>

      <div class="input-group">
        <label class="input-label">请输入聚会 ID</label>
        <input
          v-model="eventId"
          class="event-input"
          :class="{ 'event-input--error': errorMsg }"
          placeholder="粘贴 event_id..."
          maxlength="64"
          @keyup.enter="goToEvent"
          @input="onInput"
        />
        <div v-if="errorMsg" class="error-tip">
          <span class="error-icon">⚠️</span>
          <span>{{ errorMsg }}</span>
        </div>
        <button
          class="go-btn"
          @click="goToEvent"
          :disabled="!eventId.trim() || checking"
        >
          {{ checking ? '正在进入…' : '进入聚会' }}
        </button>
      </div>

      <div class="hint">
        创建聚会后，在小程序「H5 端」中可以获取 event_id
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const eventId = ref('');
const errorMsg = ref('');
const checking = ref(false);

/** event_id 基本格式：字母/数字/_/-，6~64 位 */
const isValidId = (id: string) => /^[A-Za-z0-9_-]{6,64}$/.test(id);

const onInput = () => {
  if (errorMsg.value) errorMsg.value = '';
};

const goToEvent = async () => {
  const id = eventId.value.trim();
  if (!id) {
    errorMsg.value = '请输入聚会 ID';
    return;
  }
  if (!isValidId(id)) {
    errorMsg.value = 'ID 格式有误，应为 6~64 位字母/数字/-/_';
    return;
  }
  // 轻量预检：避免直接跳到 404 页面提升体验
  checking.value = true;
  errorMsg.value = '';
  try {
    const { data } = await api.get(`/screen/event/${id}`);
    if (!data) {
      errorMsg.value = '活动不存在或已结束';
      return;
    }
    router.push(`/e/${id}`);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      errorMsg.value = '活动不存在或已结束';
    } else if (status === 0 || !status) {
      errorMsg.value = '网络异常，请检查连接后重试';
    } else {
      errorMsg.value = '进入失败，请稍后再试';
    }
  } finally {
    checking.value = false;
  }
};
</script>

<style scoped>
.home-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #1a1a4e 0%, #0a0a2e 70%);
}

.home-card {
  text-align: center;
  padding: 60px 50px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  min-width: 420px;
}

.logo {
  font-size: 3rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 40px;
}

.input-group {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
}

.event-input {
  width: 100%;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: white;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  margin-bottom: 16px;
}

.event-input:focus {
  border-color: #667eea;
}

.event-input--error {
  border-color: #ff6b6b;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
}

.event-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.error-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
  font-size: 0.85rem;
  color: #ff6b6b;
  margin: -8px 0 14px 4px;
  animation: error-shake 0.32s ease-in-out;
}

.error-icon {
  font-size: 1rem;
}

@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}

.go-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.go-btn:hover {
  opacity: 0.9;
}

.go-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 20px;
  line-height: 1.6;
}
</style>