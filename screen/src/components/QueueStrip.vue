<!--
  QueueStrip · 大屏底部活动进度条
  ------------------------------------------------------------
  横向展示当前活动的进度，类似 Conductor 视图的时间线。
  让观众也能"看到节奏"——在活动进行中可视化整体进度。
  这是 v2.0 体验驱动重构的一部分：让信息从"操作界面"扩散到"观众界面"。
-->
<template>
  <view v-if="visible" class="queue-strip" :class="{ 'queue-strip--hidden': hidden }">
    <view
      v-for="(node, i) in nodes"
      :key="node.type"
      class="node"
      :class="nodeCls(node, i)"
    >
      <view class="node-dot">
        <text v-if="node.status === 'done'" class="node-mark">✓</text>
        <text v-else-if="node.status === 'current'" class="node-icon">{{ node.icon }}</text>
      </view>
      <text class="node-label">{{ node.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ACTIVITY_META, ACTIVITY_TIMELINE, type ActivityMeta } from '../utils/activity-meta';
import { EventStatus } from '../types/enums';

interface Props {
  currentState: string;
  /** 当场景持续 5s 后自动隐藏 strip，避免长时间占屏 */
  hideAfterMs?: number;
}
const props = withDefaults(defineProps<Props>(), { hideAfterMs: 5000 });

interface StripNode {
  type: string;
  label: string;
  icon: string;
  status: 'done' | 'current' | 'upcoming';
  meta: ActivityMeta;
}

const nodes = computed<StripNode[]>(() => {
  const curIdx = ACTIVITY_TIMELINE.indexOf(props.currentState);
  return ACTIVITY_TIMELINE.map((t, i) => {
    const meta = ACTIVITY_META[t] || ACTIVITY_META[EventStatus.STANDBY];
    let status: StripNode['status'] = 'upcoming';
    if (curIdx > i) status = 'done';
    else if (curIdx === i) status = 'current';
    return {
      type: t,
      label: meta.label,
      icon: meta.icon,
      status,
      meta,
    };
  });
});

const visible = computed(() => props.currentState !== EventStatus.ENDED);
const hidden = computed(() => false); // 占位：未来按 hideAfterMs 衰减

function nodeCls(node: StripNode, _i: number) {
  return `node--${node.status}`;
}
</script>

<style scoped>
.queue-strip {
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: rgba(10, 10, 46, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 500;
  animation: strip-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 90vw;
  overflow-x: auto;
  scrollbar-width: none;
}
.queue-strip::-webkit-scrollbar { display: none; }
@keyframes strip-in {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
.queue-strip--hidden { opacity: 0.4; }

.node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.node-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.node-mark { color: white; }
.node-icon { line-height: 1; }

.node-label {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.45);
}

/* 已完成 */
.node--done .node-dot {
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.5);
  color: #4ade80;
}
.node--done .node-label {
  color: rgba(74, 222, 128, 0.7);
}

/* 当前 */
.node--current .node-dot {
  background: linear-gradient(135deg, #ffd700, #ff6b6b);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.6);
  animation: pulse-dot 2s ease-in-out infinite;
}
.node--current .node-label {
  color: #ffd700;
  font-weight: 700;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 24px rgba(255, 215, 0, 0.8); }
}

/* 即将进行 */
.node--upcoming .node-dot {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
