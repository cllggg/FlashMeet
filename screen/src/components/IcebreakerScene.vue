<template>
  <div class="icebreaker-scene">
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-num">{{ answeredCount }}</span> / {{ totalUsers }} 已点亮
      </div>
      <div class="stat-hint">{{ event?.title }}</div>
    </div>

    <!-- 未发布 -->
    <div v-if="!question" class="idle">
      <div class="big-text">⏳ 等待主持人发布破冰问题</div>
      <div class="sub">嘉宾扫码入场后，主持人将发布问题点亮暗星</div>
    </div>

    <!-- 展示问题 -->
    <div v-else class="question-wrap" :class="{ 'use-2d': !use3D }">
      <div class="q-prompt">{{ question.prompt }}</div>

      <!-- 实时柱状图 -->
      <div class="bars">
        <div
          v-for="opt in question.options"
          :key="opt.key"
          class="bar-row"
        >
          <div class="bar-label">
            <span class="opt-dot" :style="{ background: opt.color }"></span>
            <span>{{ opt.label }}</span>
          </div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{
                width: percentOf(opt.key) + '%',
                background: opt.color,
                boxShadow: `0 0 16px ${opt.color}`,
              }"
            >
              <span class="bar-count">{{ countOf(opt.key) }}</span>
            </div>
          </div>
          <div class="bar-percent">{{ percentOf(opt.key) }}%</div>
        </div>
      </div>

      <div class="hint" v-if="!use3D">2D 模式：使用 CSS 暗星点亮</div>
    </div>

    <!-- 2D 暗星阵列 -->
    <div v-if="!use3D && question" class="starfield-2d">
      <!-- 连线效果 -->
      <svg class="constellation-lines" v-if="litStars.length >= 2">
        <line
          v-for="(line, i) in starLines"
          :key="i"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="line.color"
          stroke-opacity="0.15"
          stroke-width="1"
        />
      </svg>
      <div
        v-for="(u, i) in darkStars"
        :key="u.user_id"
        class="dark-star"
        :class="{ lit: u.lit, bursting: u.bursting }"
        :style="{
          left: u.x + '%',
          top: u.y + '%',
          color: u.lit ? u.color : '#888',
          boxShadow: u.lit
            ? `0 0 24px ${u.color}, 0 0 48px ${u.color}, 0 0 72px ${u.color}`
            : 'none',
        }"
        @animationend="u.bursting = false"
      >
        <!-- 光晕环 -->
        <div v-if="u.lit" class="star-aura" :style="{ borderColor: u.color }" />
        {{ displayLabel(u) }}
      </div>
      <!-- 流星效果 -->
      <div v-if="showShootingStar" class="shooting-star" :style="shootingStarStyle" />
    </div>

    <!-- 3D 暗星 (Three.js 简版) -->
    <div v-else-if="use3D && question" ref="threeContainer" class="three-container"></div>

    <!-- 已点亮名单 ticker -->
    <TransitionGroup
      v-if="question && litTicker.length > 0"
      name="ticker"
      tag="div"
      class="lit-ticker"
    >
      <span class="ticker-label" key="label">最新点亮</span>
      <div
        v-for="(item, i) in litTicker"
        :key="`${item.user_id}-${i}`"
        class="ticker-chip"
        :style="{ color: item.color, borderColor: item.color }"
      >
        <span class="chip-dot" :style="{ background: item.color }"></span>
        <span class="chip-name">{{ item.display_id || item.name || '?' }}</span>
        <span class="chip-tag">{{ item.tag }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import * as THREE from 'three';

const props = defineProps<{
  event: any;
  question: any | null;
  starLitEvents: any[]; // 来自 WS 的 STARS_LIT_UP 流
  checkinUsers: any[]; // 用于初始化暗星位置
  use3D: boolean;
}>();

const emit = defineEmits<{
  (e: 'lit-burst', payload: { user_id: string; tag: string; color: string }): void;
}>();

const answeredCount = computed(() => props.starLitEvents.length);
const totalUsers = computed(() => props.checkinUsers.length);

interface DarkStar {
  user_id: string;
  nickname: string;
  display_id?: string | null;
  x: number; // %
  y: number; // %
  color: string;
  lit: boolean;
  bursting: boolean;
}

const darkStars = ref<DarkStar[]>([]);

/** 已点亮名单 ticker（最新 8 条） */
const litTicker = ref<any[]>([]);

/** 已点亮的星星 */
const litStars = computed(() => darkStars.value.filter((s) => s.lit));

/** 流星效果 */
const showShootingStar = ref(false);
const shootingStarStyle = ref<Record<string, string>>({});

/** 连线：最近2个点亮星星之间 */
const starLines = computed(() => {
  const lit = litStars.value;
  if (lit.length < 2) return [];
  const lines: any[] = [];
  for (let i = 0; i < lit.length - 1; i++) {
    const a = lit[i];
    const b = lit[i + 1];
    lines.push({
      x1: `${a.x}%`,
      y1: `${a.y}%`,
      x2: `${b.x}%`,
      y2: `${b.y}%`,
      color: a.color,
    });
  }
  return lines;
});

const generatePositions = (users: any[]): DarkStar[] => {
  return users.map((u) => ({
    user_id: u.user_id,
    nickname: u.nickname || '?',
    display_id: u.display_id || null,
    x: 10 + Math.random() * 80,
    y: 20 + Math.random() * 60,
    color: '#888',
    lit: false,
    bursting: false,
  }));
};

/** 暗星上展示的标签：优先 display_id（用户认知强），否则昵称首字 */
const displayLabel = (u: DarkStar): string => {
  if (u.display_id) return u.display_id;
  const n = (u.nickname || '?').trim();
  if (!n) return '?';
  // 中文取首字，英文取首字母
  return n.charAt(0).toUpperCase();
};

const initStars = () => {
  if (props.checkinUsers.length === 0) {
    darkStars.value = [];
    return;
  }
  darkStars.value = generatePositions(props.checkinUsers);
};

watch(
  () => props.checkinUsers,
  () => initStars(),
  { deep: true },
);

// 处理点亮事件
watch(
  () => props.starLitEvents.length,
  () => {
    const latest = props.starLitEvents[props.starLitEvents.length - 1];
    if (!latest) return;
    const star = darkStars.value.find((s) => s.user_id === latest.user_id);
    if (star && !star.lit) {
      star.lit = true;
      star.color = latest.color || star.color;
      star.bursting = true;
      // 触发流星
      triggerShootingStar(star);
    }
    // 推入 ticker（始终 append，新条目在左侧）
    litTicker.value = [latest, ...litTicker.value].slice(0, 8);
  },
);

const countOf = (key: string) => {
  // 通过 tag 计数
  return props.starLitEvents.filter((e: any) => e.tag === key).length;
};

/** 触发流星飞过 */
const triggerShootingStar = (star: DarkStar) => {
  shootingStarStyle.value = {
    left: '0%',
    top: `${star.y}%`,
    '--target-x': `${star.x}%`,
    '--target-y': `${star.y}%`,
  };
  showShootingStar.value = true;
  setTimeout(() => {
    showShootingStar.value = false;
  }, 1200);
};

const percentOf = (key: string) => {
  const total = answeredCount.value;
  if (total === 0) return 0;
  return Math.round((countOf(key) / total) * 100);
};

// ─── 3D 模式 (Three.js) ──────────────────
const threeContainer = ref<HTMLDivElement>();
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let sprites: Map<string, THREE.Sprite> = new Map();
let animId: number;
let clock: THREE.Clock;

const init3D = () => {
  if (!threeContainer.value) return;
  const w = threeContainer.value.clientWidth;
  const h = threeContainer.value.clientHeight;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
  camera.position.z = 18;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  threeContainer.value.appendChild(renderer.domElement);
  clock = new THREE.Clock();

  // 添加背景星点
  const bgGeo = new THREE.BufferGeometry();
  const bgPts: number[] = [];
  for (let i = 0; i < 1500; i++) {
    bgPts.push((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, -5 - Math.random() * 20);
  }
  bgGeo.setAttribute('position', new THREE.Float32BufferAttribute(bgPts, 3));
  const bgMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.6 });
  scene.add(new THREE.Points(bgGeo, bgMat));

  render3DStars();
  animate3D();
};

const render3DStars = () => {
  // 清理旧 sprite
  sprites.forEach((s) => scene.remove(s));
  sprites.clear();

  const W = 24, H = 14;
  darkStars.value.forEach((s) => {
    const sprite = new THREE.Sprite(makeSpriteMaterial(s.lit ? s.color : '#555555', s.lit));
    const size = s.lit ? 1.4 : 0.9;
    sprite.scale.set(size, size, 1);
    sprite.position.set((s.x / 100) * W - W / 2, -((s.y / 100) * H - H / 2), 0);
    sprite.userData['userId'] = s.user_id;
    scene.add(sprite);
    sprites.set(s.user_id, sprite);
  });
};

const makeSpriteMaterial = (color: string, lit: boolean) => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (lit) {
    g.addColorStop(0, color);
    g.addColorStop(0.3, color);
    g.addColorStop(0.6, 'rgba(255,255,255,0.1)');
  } else {
    g.addColorStop(0, color);
    g.addColorStop(0.5, 'rgba(150,150,150,0.05)');
  }
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
};

const animate3D = () => {
  animId = requestAnimationFrame(animate3D);
  const t = clock.getElapsedTime();
  sprites.forEach((sp) => {
    sp.position.y += Math.sin(t * 0.8 + sp.position.x) * 0.002;
  });
  renderer.render(scene, camera);
};

const handleResize = () => {
  if (!threeContainer.value || !renderer) return;
  const w = threeContainer.value.clientWidth;
  const h = threeContainer.value.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
};

onMounted(() => {
  initStars();
  nextTick(() => {
    if (props.use3D) init3D();
  });
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  cancelAnimationFrame(animId);
  window.removeEventListener('resize', handleResize);
  renderer?.dispose();
});

// 当 use3D 变化时重建
watch(
  () => props.use3D,
  async (v) => {
    if (v) {
      await nextTick();
      init3D();
    } else {
      cancelAnimationFrame(animId);
      renderer?.dispose();
      renderer = undefined as any;
    }
  },
);

watch(
  () => darkStars.value.length,
  () => {
    if (props.use3D && scene) render3DStars();
  },
  { deep: true },
);
</script>

<style scoped>
.icebreaker-scene {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(ellipse at center, #0a0a2e 0%, #000 100%);
  overflow: hidden;
}

.stats-bar {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.stat {
  font-size: 28px;
  color: white;
  font-weight: bold;
}

.stat-num {
  color: #ffd700;
  font-size: 42px;
}

.stat-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 18px;
  margin-top: 4px;
}

.idle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.big-text {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 16px;
}

.sub {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.3);
}

.question-wrap {
  position: absolute;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  text-align: center;
  z-index: 5;
}

.q-prompt {
  font-size: 56px;
  color: white;
  font-weight: bold;
  text-shadow: 0 0 30px rgba(102, 126, 234, 0.6);
  margin-bottom: 20px;
}

.options-summary {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.opt-pill {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px 20px;
  border-radius: 999px;
  border: 2px solid;
  font-size: 22px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.opt-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 900px;
  margin: 0 auto;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 220px;
  font-size: 22px;
  color: white;
  font-weight: 500;
  justify-content: flex-end;
}

.bar-track {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  position: relative;
  height: 100%;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  min-width: 8px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.bar-count {
  color: white;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.bar-percent {
  width: 70px;
  text-align: right;
  font-size: 22px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
}

.hint {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 12px;
}

.starfield-2d {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.constellation-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.dark-star {
  position: absolute;
  min-width: 36px;
  min-height: 36px;
  padding: 0 8px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  font-weight: bold;
  transition: all 0.4s ease;
  white-space: nowrap;
  z-index: 1;
}

.dark-star.lit {
  background: radial-gradient(circle, currentColor 0%, transparent 70%);
  color: white !important;
  border-color: currentColor;
  transform: scale(1.2);
  font-size: 14px;
  z-index: 2;
}

.dark-star.bursting {
  animation: burst 0.8s ease-out;
}

@keyframes burst {
  0% { transform: scale(1); }
  50% { transform: scale(1.6); box-shadow: 0 0 60px currentColor; }
  100% { transform: scale(1.2); }
}

/* 星星光晕环 */
.star-aura {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px solid;
  animation: auraPulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes auraPulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.5); opacity: 0.6; }
}

/* 流星 */
.shooting-star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 6px 3px rgba(255, 215, 0, 0.6);
  z-index: 10;
  animation: shootingStar 1.2s ease-out forwards;
}

.shooting-star::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.6));
  transform: translateY(-50%);
}

@keyframes shootingStar {
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(calc(var(--target-x) * 1vw), 0); opacity: 0; }
}

.three-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.lit-ticker {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 90%;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 8px 18px;
  z-index: 10;
  animation: ticker-in 0.4s ease-out;
}

@keyframes ticker-in {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}

.ticker-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  flex-shrink: 0;
}

.ticker-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.ticker-leave-active {
  transition: all 0.2s ease-out;
}

.ticker-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.ticker-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.ticker-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.04);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chip-name {
  color: white;
}

.chip-tag {
  font-size: 12px;
  opacity: 0.7;
}
</style>
