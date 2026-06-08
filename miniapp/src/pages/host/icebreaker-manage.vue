<template>
  <view class="manage-page">
    <text class="title">破冰问题管理</text>
    <text class="event-id">活动ID: {{ eventId }}</text>

    <!-- 新增问题表单 -->
    <view class="form-card">
      <text class="form-label">问题内容</text>
      <input
        class="input"
        v-model="newPrompt"
        placeholder="例如：你是 I 人还是 E 人？"
        placeholder-style="color: rgba(255,255,255,0.3)"
      />

      <text class="form-label">选项 (2-4 个)</text>
      <view v-for="(opt, i) in newOptions" :key="i" class="option-input-row">
        <view class="opt-color" :style="{ background: opt.color }" @tap="pickColor(i)"></view>
        <input
          class="input opt-input"
          v-model="opt.label"
          placeholder="选项文字"
          placeholder-style="color: rgba(255,255,255,0.3)"
        />
        <view class="tag-input-wrap">
          <input
            class="input tag-input"
            v-model="opt.tag"
            placeholder="标签 (英文)"
            placeholder-style="color: rgba(255,255,255,0.3)"
          />
        </view>
      </view>
      <button class="add-opt-btn" @tap="addOption" v-if="newOptions.length < 4">+ 增加选项</button>

      <button class="create-btn" @tap="createQuestion">创建问题</button>
    </view>

    <!-- 已创建问题列表 -->
    <view class="questions-list">
      <text class="section-title">已创建的问题</text>
      <view v-if="questions.length === 0" class="empty">还没有问题</view>
      <view v-for="q in questions" :key="q.question_id" class="q-card">
        <text class="q-prompt">{{ q.prompt }}</text>
        <view class="q-options">
          <view
            v-for="opt in q.options"
            :key="opt.key"
            class="q-opt-tag"
            :style="{ borderColor: opt.color, color: opt.color }"
          >
            {{ opt.label }} · {{ opt.tag }}
          </view>
        </view>
        <button class="publish-btn" :disabled="publishingId === q.question_id" @tap="publishQuestion(q.question_id)">
          {{ publishingId === q.question_id ? '发布中…' : '立即发布' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { icebreakerApi } from '../../services/api';
import { httpErrorToMessage } from '../../services/request';

const eventId = ref('');
const questions = ref<any[]>([]);
let publishingId = ''; // 防止用户对同一问题快速点多次 publish

const COLOR_PALETTE = [
  '#667eea',
  '#f56565',
  '#48bb78',
  '#ed8936',
  '#9f7aea',
  '#38b2ac',
  '#ecc94b',
  '#ed64a6',
];

const newPrompt = ref('');
const newOptions = ref<Array<{ key: string; label: string; tag: string; color: string }>>([
  { key: 'A', label: '', tag: '', color: COLOR_PALETTE[0] },
  { key: 'B', label: '', tag: '', color: COLOR_PALETTE[1] },
]);

onLoad((options: any) => {
  eventId.value = options.eventId || '';
  if (eventId.value) {
    loadQuestions();
  }
});

const addOption = () => {
  const nextKey = String.fromCharCode(65 + newOptions.value.length);
  newOptions.value.push({
    key: nextKey,
    label: '',
    tag: '',
    color: COLOR_PALETTE[newOptions.value.length % COLOR_PALETTE.length],
  });
};

const pickColor = (i: number) => {
  newOptions.value[i].color =
    COLOR_PALETTE[(COLOR_PALETTE.indexOf(newOptions.value[i].color) + 1) % COLOR_PALETTE.length];
};

const loadQuestions = async () => {
  try {
    questions.value = await icebreakerApi.list(eventId.value);
  } catch {
    questions.value = [];
  }
};

const createQuestion = async () => {
  if (!newPrompt.value.trim()) {
    uni.showToast({ title: '请填写问题', icon: 'none' });
    return;
  }
  const validOpts = newOptions.value.filter((o) => o.label.trim() && o.tag.trim());
  if (validOpts.length < 2) {
    uni.showToast({ title: '至少 2 个有效选项', icon: 'none' });
    return;
  }
  // 检查标签唯一性（用于后端匹配，重复标签会导致匹配异常）
  const tags = validOpts.map((o) => o.tag.trim().toLowerCase());
  const dupTags = tags.filter((t, i) => tags.indexOf(t) !== i);
  if (dupTags.length > 0) {
    uni.showToast({ title: `标签「${dupTags.join('、')}」重复，请修改`, icon: 'none' });
    return;
  }

  try {
    await icebreakerApi.create({
      event_id: eventId.value,
      prompt: newPrompt.value.trim(),
      options: validOpts,
    });
    uni.showToast({ title: '已创建', icon: 'success' });
    newPrompt.value = '';
    newOptions.value = [
      { key: 'A', label: '', tag: '', color: COLOR_PALETTE[0] },
      { key: 'B', label: '', tag: '', color: COLOR_PALETTE[1] },
    ];
    await loadQuestions();
  } catch (err) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  }
};

const publishQuestion = async (qid: string) => {
  if (publishingId === qid) return;
  publishingId = qid;
  try {
    await icebreakerApi.publish(qid);
    uni.showToast({ title: '已发布到大屏', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  } finally {
    publishingId = '';
  }
};
</script>

<style scoped>
.manage-page {
  min-height: 100vh;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.title {
  font-size: 44rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 4rpx;
}

.event-id {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.45);
  display: block;
  margin-bottom: 32rpx;
  letter-spacing: 1rpx;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

.form-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.2);
}

.form-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin: 20rpx 0 14rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}
.form-label:first-child { margin-top: 0; }

.input {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 14rpx;
  padding: 22rpx;
  color: white;
  font-size: 28rpx;
  width: 100%;
  margin-bottom: 10rpx;
  letter-spacing: 0.5rpx;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.input:focus { border-color: rgba(102, 126, 234, 0.5); }

.option-input-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.opt-color {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 8rpx currentColor;
  transition: transform 0.2s;
}
.opt-color:active { transform: scale(0.9); }

.opt-input {
  flex: 1;
  margin-bottom: 0;
}

.tag-input-wrap {
  width: 200rpx;
}

.tag-input {
  margin-bottom: 0;
}

.add-opt-btn {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  font-size: 26rpx;
  font-weight: 600;
  border: 2rpx dashed rgba(255, 255, 255, 0.18);
  border-radius: 14rpx;
  margin-top: 14rpx;
  height: 80rpx;
  line-height: 80rpx;
  letter-spacing: 2rpx;
  transition: background 0.2s;
}
.add-opt-btn::after { border: none; }
.add-opt-btn:active { background: rgba(255, 255, 255, 0.1); }

.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 46rpx;
  font-size: 30rpx;
  font-weight: 700;
  border: none;
  margin-top: 28rpx;
  height: 88rpx;
  line-height: 88rpx;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
  transition: transform 0.2s, opacity 0.2s;
}
.create-btn::after { border: none; }
.create-btn:active { transform: scale(0.98); opacity: 0.92; }

.section-title {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 700;
  display: block;
  margin-bottom: 18rpx;
  letter-spacing: 1rpx;
}

.empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  padding: 60rpx 0;
  font-size: 26rpx;
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx dashed rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
}

.q-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.q-prompt {
  font-size: 30rpx;
  font-weight: 700;
  color: white;
  display: block;
  margin-bottom: 16rpx;
  line-height: 1.4;
  letter-spacing: 0.5rpx;
}

.q-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.q-opt-tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border: 2rpx solid;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.05);
  letter-spacing: 0.5rpx;
}

.publish-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 26rpx;
  border-radius: 999rpx;
  border: none;
  padding: 0 28rpx;
  height: 56rpx;
  line-height: 56rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  box-shadow: 0 4rpx 14rpx rgba(102, 126, 234, 0.35);
}
.publish-btn::after { border: none; }
.publish-btn:disabled {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  box-shadow: none;
}
</style>
