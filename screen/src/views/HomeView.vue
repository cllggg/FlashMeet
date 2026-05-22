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
          placeholder="粘贴 event_id..."
          @keyup.enter="goToEvent"
        />
        <button class="go-btn" @click="goToEvent" :disabled="!eventId.trim()">
          进入聚会
        </button>
      </div>

      <div class="hint">
        创建聚会后，在小程序"H5端”中可以获取 event_id
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const eventId = ref('');

const goToEvent = () => {
  const id = eventId.value.trim();
  if (!id) return;
  router.push(`/e/${id}`);
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

.event-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
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