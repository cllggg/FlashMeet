<template>
  <div class="match-scene">
    <!-- 顶部状态栏 -->
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-num">{{ matchedPairs.length }}</span> 组配对
      </div>
      <div class="stat-hint">{{ event?.title }}</div>
    </div>

    <!-- 连线画布 -->
    <div class="match-canvas" ref="canvasRef">
      <svg
        v-if="pairs.length > 0"
        class="match-svg"
        :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- 连线 -->
        <line
          v-for="(line, i) in lineData"
          :key="'l' + i"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="line.color"
          stroke-width="2"
          :stroke-dasharray="line.dashArray"
          :opacity="line.opacity"
          class="match-line"
        >
          <animate
            attributeName="stroke-dashoffset"
            :from="line.dashLen"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </line>

        <!-- 匹配节点 -->
        <g
          v-for="(node, i) in nodeData"
          :key="'n' + i"
          :transform="`translate(${node.x}, ${node.y})`"
          class="match-node"
        >
          <circle r="24" :fill="node.color" opacity="0.8">
            <animate attributeName="r" values="24;28;24" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="18" :fill="node.color" opacity="0.4">
            <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
          </circle>
          <text
            text-anchor="middle"
            dy="5"
            fill="#fff"
            font-size="11"
            font-weight="bold"
          >{{ node.displayId }}</text>
        </g>

        <!-- 共同标签显示 -->
        <g
          v-for="(tag, i) in tagData"
          :key="'t' + i"
          :transform="`translate(${tag.x}, ${tag.y})`"
          opacity="0"
        >
          <animate attributeName="opacity" from="0" to="1" dur="0.5s" :begin="`${tag.delay}s`" fill="freeze" />
          <rect
            :x="tag.width / -2"
            y="-12"
            :width="tag.width"
            height="24"
            rx="12"
            :fill="tag.color"
            opacity="0.3"
          />
          <text
            text-anchor="middle"
            dy="5"
            :fill="tag.color"
            font-size="10"
          >{{ tag.label }}</text>
        </g>
      </svg>

      <!-- 无匹配待机 -->
      <div v-if="pairs.length === 0" class="idle">
        <div class="big-text">🔮 等待主持人开启 CP 盲盒匹配</div>
        <div class="sub">基于标签相似度，为你匹配全场最相似的伙伴</div>
      </div>
    </div>

    <!-- 底部轮播 -->
    <div v-if="pairs.length > 0" class="pair-carousel">
      <div
        v-for="(pair, i) in matchedPairs"
        :key="'p' + i"
        class="pair-card"
        :class="{ active: activePair === i }"
      >
        <span class="pair-user">{{ pair.user_a.display_id }}</span>
        <span class="pair-connect">✦ {{ pair.score }}% ✦</span>
        <span class="pair-user">{{ pair.user_b.display_id }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  event?: { title?: string };
  pairs?: Array<{
    user_a: { user_id: string; display_id: string; name: string; tags: string[] };
    user_b: { user_id: string; display_id: string; name: string; tags: string[] };
    common_tags: string[];
    score: number;
  }>;
}>();

const pairs = computed<NonNullable<typeof props.pairs>>(() => props.pairs ?? []);

const canvasRef = ref<HTMLElement>();
const canvasWidth = ref(1200);
const canvasHeight = ref(700);
const activePair = ref(0);

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

const matchedPairs = computed(() => props.pairs || []);

// 计算节点位置（圆形排列）
const nodeData = computed(() => {
  const pairs = matchedPairs.value;
  if (pairs.length === 0) return [];

  const nodes: Array<{ x: number; y: number; displayId: string; color: string; userId: string }> = [];
  const centerX = canvasWidth.value / 2;
  const centerY = canvasHeight.value / 2;
  const radius = Math.min(canvasWidth.value, canvasHeight.value) * 0.35;

  const seen = new Set<string>();
  pairs.forEach((pair, i) => {
    [pair.user_a, pair.user_b].forEach((user, j) => {
      if (!seen.has(user.user_id)) {
        seen.add(user.user_id);
        const idx = nodes.length;
        const angle = (idx / (pairs.length * 2)) * Math.PI * 2 - Math.PI / 2;
        nodes.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          displayId: user.display_id,
          color: colors[i % colors.length],
          userId: user.user_id,
        });
      }
    });
  });
  return nodes;
});

// 连线数据
const lineData = computed(() => {
  const nodeMap = new Map<string, { x: number; y: number }>();
  nodeData.value.forEach((n) => nodeMap.set(n.userId, { x: n.x, y: n.y }));

  return matchedPairs.value.map((pair, i) => {
    const a = nodeMap.get(pair.user_a.user_id);
    const b = nodeMap.get(pair.user_b.user_id);
    if (!a || !b) return null;
    const len = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    return {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      color: colors[i % colors.length],
      opacity: 0.6,
      dashArray: `${len * 2} ${len}`,
      dashLen: len * 3,
    };
  }).filter(Boolean) as any[];
});

// 标签展示
const tagData = computed(() => {
  const data: Array<{ x: number; y: number; label: string; color: string; width: number; delay: number }> = [];
  const nodeMap = new Map<string, { x: number; y: number }>();
  nodeData.value.forEach((n) => nodeMap.set(n.userId, { x: n.x, y: n.y }));

  matchedPairs.value.forEach((pair, i) => {
    const a = nodeMap.get(pair.user_a.user_id);
    const b = nodeMap.get(pair.user_b.user_id);
    if (!a || !b) return;
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    pair.common_tags.slice(0, 3).forEach((tag, j) => {
      const label = `#${tag}`;
      data.push({
        x: cx + (j - 1) * 60,
        y: cy,
        label,
        color: colors[i % colors.length],
        width: label.length * 10 + 20,
        delay: i * 0.3 + j * 0.2,
      });
    });
  });
  return data;
});

// 轮播
let carouselTimer: any = null;
const startCarousel = () => {
  if (matchedPairs.value.length <= 1) return;
  carouselTimer = setInterval(() => {
    activePair.value = (activePair.value + 1) % matchedPairs.value.length;
  }, 3000);
};

watch(matchedPairs, () => {
  activePair.value = 0;
  if (carouselTimer) clearInterval(carouselTimer);
  startCarousel();
}, { immediate: true });

onMounted(() => {
  if (canvasRef.value) {
    canvasWidth.value = canvasRef.value.clientWidth;
    canvasHeight.value = canvasRef.value.clientHeight;
  }
  startCarousel();
});

onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer);
});
</script>

<style scoped>
.match-scene {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(ellipse at center, #0a0a2e 0%, #000010 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  color: #fff;
  font-size: 16px;
  z-index: 2;
}

.stat-num {
  font-size: 28px;
  font-weight: bold;
  color: #ffd700;
}

.stat-hint {
  opacity: 0.6;
}

.match-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.match-svg {
  width: 100%;
  height: 100%;
}

.match-line {
  stroke-dasharray: inherit;
}

.match-node {
  cursor: pointer;
}

.match-node:hover circle {
  opacity: 1;
}

.idle {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  gap: 12px;
}

.big-text {
  font-size: 32px;
  opacity: 0.8;
}

.sub {
  font-size: 16px;
  opacity: 0.5;
}

.pair-carousel {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px 32px;
  overflow-x: auto;
  z-index: 2;
}

.pair-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  transition: all 0.3s;
  white-space: nowrap;
}

.pair-card.active {
  border-color: rgba(255, 215, 0, 0.5);
  background: rgba(255, 215, 0, 0.08);
  transform: scale(1.05);
}

.pair-user {
  font-weight: bold;
  font-size: 16px;
}

.pair-connect {
  color: #ffd700;
  font-size: 13px;
}
</style>