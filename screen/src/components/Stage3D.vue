<!--
  Stage3D · v3.0 统一 3D 舞台
  ------------------------------------------------------------
  一个 Three.js 上下文 + 8 种活动模式（mode）
  - 基础：暗夜银河（继承自 CheckinGalaxy3D）
  - 模式：根据 current state 切换视觉：
    * standby    : 待机 — 银河缓慢呼吸，等候开场
    * checkin    : 签到 — 签到者头像飞入并形成轨道
    * icebreaker : 破冰 — 头像按标签聚类成 4 大色团
    * lottery_ready    : 抽奖准备 — 大奖图标悬浮核心
    * lottery_running  : 抽奖开奖 — 头像向核心聚拢 → 弹出
    * game_shake       : 摇一摇 — 全员高频抖
    * game_match       : 匹配 — 配对头像之间画发光连线
    * ended            : 结束 — 全员发亮成就卡
  - 共享相机 + 共享粒子 + 共享 Bloom 后处理
  - 不再有任何 2D 兜底逻辑
-->
<template>
  <div class="stage-container" ref="containerRef">
    <!-- 顶部数据条 -->
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-num">{{ (checkinUsers ?? []).length }}</span>
        <span class="stat-label">到场</span>
      </div>
      <div class="stat-divider" />
      <div class="stat">
        <span class="stat-num">{{ modeLabel }}</span>
      </div>
      <div class="stat-hint" v-if="event?.title">{{ event.title }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { EventStatus } from '../types/enums';

const props = defineProps<{
  event: any;
  checkinUsers?: any[];
  question?: any | null;
  starLitEvents?: any[];
  winners?: any[];
  leaderboard?: any[];
  pairs?: any[];
}>();

const containerRef = ref<HTMLDivElement>();
const currentState = ref<EventStatus>(EventStatus.STANDBY);

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
let composer: EffectComposer, bloomPass: UnrealBloomPass;
let animId = 0, clock: THREE.Clock;
let galaxyGroup: THREE.Group;
let bulgePoints: THREE.Points, diskPoints: THREE.Points, haloPoints: THREE.Points;
let coreGlow: THREE.Group, bgStars: THREE.Points;
let dustRings: THREE.Mesh[] = [];
let trailSys: THREE.Points;
let stageIcon: THREE.Mesh;            // 中心多面体
let stageIconWire: THREE.LineSegments; // 描边
let shockwave: THREE.Mesh;             // 模式切换冲击波
let shockwaveStartAt = 0;
let mode = 'standby';
let modeStartAt = 0;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const modeLabel = computed(() => {
  const m: Record<EventStatus, string> = {
    [EventStatus.STANDBY]: '待开场',
    [EventStatus.CHECKIN]: '签到中',
    [EventStatus.ICEBREAKER]: '破冰',
    [EventStatus.LOTTERY_READY]: '奖品展示',
    [EventStatus.LOTTERY_RUNNING]: '开奖中',
    [EventStatus.GAME_SHAKE]: '摇一摇',
    [EventStatus.GAME_MATCH]: '灵魂匹配',
    [EventStatus.ENDED]: '已结束',
  };
  return m[currentState.value] ?? '';
});

const stateToMode = (s: EventStatus) => {
  switch (s) {
    case EventStatus.CHECKIN: return 'checkin';
    case EventStatus.ICEBREAKER: return 'icebreaker';
    case EventStatus.LOTTERY_READY: return 'lottery_ready';
    case EventStatus.LOTTERY_RUNNING: return 'lottery_running';
    case EventStatus.GAME_SHAKE: return 'shake';
    case EventStatus.GAME_MATCH: return 'match';
    case EventStatus.ENDED: return 'ended';
    default: return 'standby';
  }
};

// ─── helpers ──────────────────────────────

const C = (w: number, h: number, fn: (c: CanvasRenderingContext2D) => void) => {
  const ca = document.createElement('canvas'); ca.width = w; ca.height = h;
  fn(ca.getContext('2d')!);
  const t = new THREE.CanvasTexture(ca); t.minFilter = t.magFilter = THREE.LinearFilter; return t;
};

const glowTex = (color: string) => C(256, 256, (ctx) => {
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, color); g.addColorStop(0.15, color);
  g.addColorStop(0.5, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'transparent');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
});

const faceTx = (name: string, col: string) => C(512, 512, (ctx) => {
  const g = ctx.createRadialGradient(216, 216, 16, 256, 256, 240);
  g.addColorStop(0, col); g.addColorStop(0.5, '#1a1040'); g.addColorStop(1, '#060318');
  ctx.beginPath(); ctx.arc(256, 256, 236, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 220px -apple-system,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText((name || '?')[0].toUpperCase(), 256, 268);
});

const ringTx = () => C(256, 256, (ctx) => {
  ctx.beginPath(); ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath(); ctx.arc(128, 128, 100, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(160,210,255,0.22)'; ctx.lineWidth = 12; ctx.stroke();
});

const nameTx = (name: string, col: string) => C(1024, 256, (ctx) => {
  ctx.shadowColor = col; ctx.shadowBlur = 20;
  ctx.fillStyle = '#fff'; ctx.font = 'bold 56px -apple-system,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name, 512, 72);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '32px -apple-system,sans-serif';
  ctx.fillText('✦ SIGNED IN ✦', 512, 150);
});

const G_R = 17;

interface GalColors { r: number; g: number; b: number }
const makeCol = (r: number, g: number, b: number): GalColors => ({ r, g, b });
const lerpCol = (a: GalColors, b: GalColors, t: number): GalColors =>
  makeCol(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);

const CORE_WARM: GalColors   = makeCol(1.00, 0.97, 0.88);
const CORE_GOLD: GalColors   = makeCol(0.97, 0.84, 0.42);
const INNER_WHITE: GalColors = makeCol(0.90, 0.88, 0.92);
const MID_LAV: GalColors     = makeCol(0.82, 0.80, 0.95);
const OUTER_BLUE: GalColors  = makeCol(0.45, 0.55, 0.80);

const galaxyColor = (t: number, brightness = 1): GalColors => {
  t = clamp(t, 0, 1);
  let c: GalColors;
  if (t < 0.08)      c = CORE_WARM;
  else if (t < 0.20) c = lerpCol(CORE_WARM, CORE_GOLD, (t - 0.08) / 0.12);
  else if (t < 0.40) c = lerpCol(CORE_GOLD, INNER_WHITE, (t - 0.20) / 0.20);
  else if (t < 0.65) c = lerpCol(INNER_WHITE, MID_LAV, (t - 0.40) / 0.25);
  else               c = lerpCol(MID_LAV, OUTER_BLUE, (t - 0.65) / 0.35);
  return makeCol(clamp(c.r * brightness, 0, 1), clamp(c.g * brightness, 0, 1), clamp(c.b * brightness, 0, 1));
};

const createGalaxy = () => {
  galaxyGroup = new THREE.Group();
  scene.add(galaxyGroup);

  // bulge
  const B_N = 14000;
  const bPos = new Float32Array(B_N * 3), bCol = new Float32Array(B_N * 3);
  for (let i = 0; i < B_N; i++) {
    const phi = Math.acos(rand(-1, 1));
    const theta = rand(0, Math.PI * 2);
    const radius = Math.abs(gaussRandom()) * 3.5;
    bPos[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    bPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.6;
    bPos[i * 3 + 2] = Math.cos(phi) * radius;
    const c = galaxyColor(radius / G_R, 0.6 + 0.4 * Math.random());
    bCol[i * 3] = c.r; bCol[i * 3 + 1] = c.g; bCol[i * 3 + 2] = c.b;
  }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  bGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
  bulgePoints = new THREE.Points(bGeo, new THREE.PointsMaterial({
    size: 0.072, vertexColors: true, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true,
  }));
  bulgePoints.renderOrder = 3;
  galaxyGroup.add(bulgePoints);

  // disk + 4 spiral arms
  const D_N = 38000;
  const dPos = new Float32Array(D_N * 3), dCol = new Float32Array(D_N * 3);
  const TWIST = 6.5;
  const ARM_COUNT = 4;
  for (let i = 0; i < D_N; i++) {
    const t = Math.pow(Math.random(), 0.5);
    const radius = t * G_R + rand(-0.15, 0.15);
    const armIdx = Math.floor(Math.random() * ARM_COUNT);
    const baseAngle = (armIdx / ARM_COUNT) * Math.PI * 2;
    const armCenterAngle = baseAngle + TWIST * Math.log(1 + radius * 3.5);
    const spread = 0.15 + t * 0.55;
    const perpOffset = gaussRandom() * spread * 0.9;
    const angle = armCenterAngle + perpOffset;
    dPos[i * 3] = Math.cos(angle) * radius;
    dPos[i * 3 + 1] = gaussRandom() * 0.28 * (1 - t * 0.6);
    dPos[i * 3 + 2] = Math.sin(angle) * radius;
    const c = galaxyColor(radius / G_R, 0.5 + rand(0, 0.45));
    dCol[i * 3] = c.r; dCol[i * 3 + 1] = c.g; dCol[i * 3 + 2] = c.b;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  diskPoints = new THREE.Points(dGeo, new THREE.PointsMaterial({
    size: 0.04, vertexColors: true, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true,
  }));
  diskPoints.renderOrder = 2;
  galaxyGroup.add(diskPoints);

  // halo
  const H_N = 7000;
  const hPos = new Float32Array(H_N * 3), hCol = new Float32Array(H_N * 3);
  for (let i = 0; i < H_N; i++) {
    const phi = Math.acos(rand(-1, 1));
    const theta = rand(0, Math.PI * 2);
    const radius = rand(19, 60);
    hPos[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    hPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.4;
    hPos[i * 3 + 2] = Math.cos(phi) * radius;
    const hue = rand(0.58, 0.68); const sat = rand(0.1, 0.4); const lit = rand(0.3, 0.7);
    const c = new THREE.Color().setHSL(hue, sat, lit);
    hCol[i * 3] = c.r; hCol[i * 3 + 1] = c.g; hCol[i * 3 + 2] = c.b;
  }
  const hGeo = new THREE.BufferGeometry();
  hGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3));
  hGeo.setAttribute('color', new THREE.BufferAttribute(hCol, 3));
  haloPoints = new THREE.Points(hGeo, new THREE.PointsMaterial({
    size: 0.09, vertexColors: true, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true, opacity: 0.5,
  }));
  haloPoints.renderOrder = 0;
  galaxyGroup.add(haloPoints);
};

let gaussZ = 0, gaussReady = false;
const gaussRandom = (): number => {
  if (gaussReady) { gaussReady = false; return gaussZ; }
  let u = 0, v = 0, s = 0;
  while (s >= 1 || s === 0) { u = rand(-1, 1); v = rand(-1, 1); s = u * u + v * v; }
  const mul = Math.sqrt(-2 * Math.log(s) / s);
  gaussZ = v * mul; gaussReady = true; return u * mul;
};

const createCoreGlow = () => {
  coreGlow = new THREE.Group();
  const layers: [number, string, number][] = [
    [0.5, '#fffdf5', 0.9], [1.1, '#ffe082', 0.45],
    [2.3, '#ffb74d', 0.16], [4.5, '#ff8a00', 0.05], [8, '#bf360c', 0.012],
  ];
  layers.forEach(([r, col, op]) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex(col), blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: op,
    }));
    s.scale.set(r * 3, r * 3, 1); s.renderOrder = -1;
    coreGlow.add(s);
  });
  galaxyGroup.add(coreGlow);
};

const createBgStars = () => {
  const N = 8000;
  const p = new Float32Array(N * 3), c = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const theta = rand(0, Math.PI * 2), phi = rand(-0.7, 0.7);
    const r = rand(28, 120);
    p[i * 3] = Math.cos(theta) * Math.cos(phi) * r;
    p[i * 3 + 1] = Math.sin(phi) * r;
    p[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r;
    const cl = new THREE.Color().setHSL(rand(0.55, 0.75), rand(0.1, 0.5), rand(0.3, 1.0));
    c[i * 3] = cl.r; c[i * 3 + 1] = cl.g; c[i * 3 + 2] = cl.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  bgStars = new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.16, vertexColors: true, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true, opacity: 0.85,
  }));
  bgStars.renderOrder = -2;
  scene.add(bgStars);
};

const createDustRings = () => {
  for (let i = 0; i < 7; i++) {
    const rad = 5.5 + i * 2.9;
    const g = new THREE.TorusGeometry(rad, i < 2 ? 0.015 : 0.008, 10, 200);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.11 + i * 0.018, rand(0.35, 0.6), 0.3 + i * 0.08),
      blending: THREE.AdditiveBlending, depthWrite: false,
      transparent: true, opacity: 0.12 + i * 0.05,
    });
    const r = new THREE.Mesh(g, m);
    r.rotation.x = rand(0.5, 0.9) + i * 0.25;
    r.rotation.y = rand(0, Math.PI);
    r.renderOrder = 1;
    r.userData = { spin: rand(0.06, 0.15) * (i % 2 ? -1 : 1) };
    dustRings.push(r);
    galaxyGroup.add(r);
  }
};

const T_N = 250;
const trPos = new Float32Array(T_N * 3), trCol = new Float32Array(T_N * 3);
const trData: { life: number; dx: number; dy: number; dz: number }[] = Array.from({ length: T_N }, () =>
  ({ life: 0, dx: 0, dy: 0, dz: 0 }));

const createTrails = () => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(trPos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(trCol, 3));
  trailSys = new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.08, vertexColors: true, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true,
  }));
  trailSys.renderOrder = 8;
  scene.add(trailSys);
};

// 中心 PBR 多面体（v3.0 炫技核心）
const createStageIcon = () => {
  const geo = new THREE.IcosahedronGeometry(2.2, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x222a55,
    emissive: 0xffd54f,
    emissiveIntensity: 0.6,
    metalness: 0.7,
    roughness: 0.25,
    flatShading: true,
  });
  stageIcon = new THREE.Mesh(geo, mat);
  stageIcon.renderOrder = 5;
  galaxyGroup.add(stageIcon);

  // 描边
  const wireGeo = new THREE.WireframeGeometry(geo);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x80e1ff, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  stageIconWire = new THREE.LineSegments(wireGeo, wireMat);
  stageIconWire.renderOrder = 6;
  galaxyGroup.add(stageIconWire);
};

// 模式切换冲击波
const SHOCKWAVE_DUR_MS = 1400;
const createShockwave = () => {
  const g = new THREE.RingGeometry(0.5, 0.7, 96);
  const m = new THREE.MeshBasicMaterial({
    color: 0xffd54f, transparent: true, opacity: 0.9,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  shockwave = new THREE.Mesh(g, m);
  shockwave.rotation.x = Math.PI / 2;
  shockwave.visible = false;
  shockwave.renderOrder = 7;
  scene.add(shockwave);
};
const fireShockwave = () => {
  shockwaveStartAt = performance.now();
  shockwave.scale.setScalar(0.4);
  shockwave.visible = true;
};

const emitTrail = (pos: THREE.Vector3, color: THREE.Color) => {
  for (let i = 0; i < T_N; i++) {
    if (trData[i].life <= 0) {
      trPos[i * 3] = pos.x + rand(-0.5, 0.5);
      trPos[i * 3 + 1] = pos.y + rand(-0.5, 0.5);
      trPos[i * 3 + 2] = pos.z + rand(-0.5, 0.5);
      trCol[i * 3] = color.r; trCol[i * 3 + 1] = color.g; trCol[i * 3 + 2] = color.b;
      trData[i].life = rand(0.4, 1.2);
      trData[i].dx = rand(-0.18, 0.18); trData[i].dy = rand(-0.18, 0.18); trData[i].dz = rand(-0.18, 0.18);
      break;
    }
  }
  trailSys.geometry.attributes.position.needsUpdate = true;
  trailSys.geometry.attributes.color.needsUpdate = true;
};

// ═══════ USERS ════════════════════════════

const userCols = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b',
  '#845ef7','#20c997','#f06595','#339af0','#fcc419',
  '#ff8787','#748ffc','#69db7c','#f783ac','#a9e34b'];

const AV = 2.8;
interface UserE {
  group: THREE.Group; ringSp: THREE.Sprite; nameSp: THREE.Sprite;
  ang: number; rad: number; oY: number; speed: number;
  fDelay: number; fProg: number; fFrom: THREE.Vector3; fTo: THREE.Vector3;
  baseColor: string;
}
const userM = new Map<string, UserE>();

const loadAvatar = (url: string, mat: THREE.SpriteMaterial) => {
  const mc = document.createElement('canvas'); mc.width = mc.height = 512;
  const ctx = mc.getContext('2d')!;
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.beginPath(); ctx.arc(256, 256, 240, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img, 0, 0, 512, 512);
    const nt = new THREE.CanvasTexture(mc); nt.minFilter = nt.magFilter = THREE.LinearFilter;
    mat.map?.dispose(); mat.map = nt; mat.needsUpdate = true;
  };
  img.src = url;
};

const addUser = (user: any, idx: number) => {
  if (userM.has(user.user_id)) return;
  const name = user.name || user.nickname || '暗星';
  const avUrl = user.avatar_url || '';
  const col = userCols[idx % userCols.length];
  const total = Math.max(userM.size + 1, 1);
  const layer = idx % 5;
  const rad = 8.5 + layer * 1.5;
  const ang = (idx / total) * Math.PI * 2 * 4.5 + layer * 1.1;
  const oY = rand(-1.8, 1.8);

  const grp = new THREE.Group();

  const fMat = new THREE.SpriteMaterial({
    map: faceTx(name, col), transparent: true, opacity: 0,
    depthTest: true, depthWrite: false,
  });
  const fSp = new THREE.Sprite(fMat); fSp.scale.set(AV, AV, 1); fSp.renderOrder = 20; grp.add(fSp);
  if (avUrl) loadAvatar(avUrl, fMat);

  const rMat = new THREE.SpriteMaterial({
    map: ringTx(), blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false,
  });
  const rSp = new THREE.Sprite(rMat); rSp.scale.set(AV * 1.7, AV * 1.7, 1); rSp.renderOrder = 19; grp.add(rSp);

  const gMat = new THREE.SpriteMaterial({
    map: glowTex(col), blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false,
  });
  const gSp = new THREE.Sprite(gMat); gSp.scale.set(AV * 3, AV * 3, 1); gSp.renderOrder = 18; grp.add(gSp);

  const nMat = new THREE.SpriteMaterial({
    map: nameTx(name, col), transparent: true, opacity: 0, depthTest: false, depthWrite: false,
  });
  const nSp = new THREE.Sprite(nMat); nSp.scale.set(AV * 3.4, AV * 0.82, 1); nSp.position.y = -AV * 1.12; nSp.renderOrder = 21; grp.add(nSp);

  const fAng = rand(0, Math.PI * 2);
  const fDist = G_R + rand(12, 20);
  grp.position.set(Math.cos(fAng) * fDist, rand(12, 18), Math.sin(fAng) * fDist);

  const entry: UserE = {
    group: grp, ringSp: rSp, nameSp: nSp,
    ang, rad, oY, speed: rand(0.06, 0.15) * ((idx % 3 ? 1 : -1)),
    fDelay: rand(0, 0.7), fProg: 0,
    fFrom: grp.position.clone(),
    fTo: new THREE.Vector3(Math.cos(ang) * rad, oY, Math.sin(ang) * rad),
    baseColor: col,
  };
  userM.set(user.user_id, entry);
  scene.add(grp);
};

// ═══════ MATCH LINES (game_match mode) ═══════

const matchLines: { line: THREE.Line; mat: THREE.LineBasicMaterial; from: string; to: string }[] = [];

const updateMatchLines = () => {
  // 清理
  while (matchLines.length) {
    const l = matchLines.pop()!;
    scene.remove(l.line);
    l.line.geometry.dispose();
    l.mat.dispose();
  }
  if (mode !== 'match') return;
  const pairs = props.pairs || [];
  for (const p of pairs) {
    const u1 = userM.get(p.user_id_a || p.from);
    const u2 = userM.get(p.user_id_b || p.to);
    if (!u1 || !u2) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffd700, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(g, mat); line.renderOrder = 10;
    scene.add(line);
    matchLines.push({ line, mat, from: p.user_id_a || p.from, to: p.user_id_b || p.to });
  }
};

// ═══════ INIT ═════════════════════════════

const init = () => {
  if (!containerRef.value) return;
  const w = containerRef.value.clientWidth, h = containerRef.value.clientHeight;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020210, 0.012);
  camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 250);
  camera.position.set(0, 26, 30);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2.5));
  renderer.setClearColor(0x020210, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  containerRef.value.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  createGalaxy();
  createCoreGlow();
  createBgStars();
  createDustRings();
  createTrails();
  createStageIcon();
  createShockwave();
  scene.add(new THREE.AmbientLight(0x222244, 1));
  const l = new THREE.PointLight(0xffcc80, 10, 50, 2); l.position.set(0, 0, 0); scene.add(l);
  const l2 = new THREE.PointLight(0x6680ff, 4, 80, 2); l2.position.set(30, 20, 30); scene.add(l2);

  // === Bloom 后处理（v3.0 炫技：让发光体/星云泛光） ===
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.05, 0.65, 0.15);
  bloomPass.threshold = 0.15;
  bloomPass.strength = 1.1;
  bloomPass.radius = 0.7;
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  (props.checkinUsers || []).forEach((u, i) => addUser(u, i));
  fireShockwave();
  animate();
};

const easeBack = (t: number) => { const c1 = 1.70158; return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2; };

// ═══════ ANIMATE ══════════════════════════

const animate = () => {
  animId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  const T = performance.now() * 0.00015;
  const elapsedModeSec = (performance.now() - modeStartAt) / 1000;

  if (galaxyGroup) galaxyGroup.rotation.y += dt * 0.035;
  if (coreGlow) {
    // 模式相关呼吸：shake 时呼吸加快
    const breathSpeed = mode === 'shake' ? 0.012 : 0.002;
    const breathAmp = mode === 'shake' ? 0.15 : 0.05;
    coreGlow.scale.setScalar(1 + Math.sin(performance.now() * breathSpeed) * breathAmp);
  }
  if (bgStars) bgStars.rotation.y += dt * 0.012;
  dustRings.forEach((r) => { r.rotation.z += (r.userData.spin as number) * dt; });

  // 中心多面体：自转 + 模式相关脉动
  if (stageIcon) {
    stageIcon.rotation.x += dt * 0.4;
    stageIcon.rotation.y += dt * 0.6;
    const pulse = 1 + Math.sin(performance.now() * 0.003) * 0.08;
    stageIcon.scale.setScalar(pulse);
  }
  if (stageIconWire) {
    stageIconWire.rotation.x = stageIcon?.rotation.x ?? 0;
    stageIconWire.rotation.y = stageIcon?.rotation.y ?? 0;
    stageIconWire.rotation.z += dt * 0.2;
  }

  // 冲击波动画
  if (shockwave && shockwave.visible) {
    const elapsed = performance.now() - shockwaveStartAt;
    const t = elapsed / SHOCKWAVE_DUR_MS;
    if (t >= 1) {
      shockwave.visible = false;
    } else {
      const easedT = 1 - Math.pow(1 - t, 3);
      shockwave.scale.setScalar(0.4 + easedT * 60);
      (shockwave.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
    }
  }

  // trails
  for (let i = 0; i < T_N; i++) {
    if (trData[i].life > 0) {
      trData[i].life -= dt;
      trPos[i * 3] += trData[i].dx * dt; trPos[i * 3 + 1] += trData[i].dy * dt; trPos[i * 3 + 2] += trData[i].dz * dt;
      trCol[i * 3] *= 0.95; trCol[i * 3 + 1] *= 0.95; trCol[i * 3 + 2] *= 0.95;
      if (trData[i].life <= 0) { trCol[i * 3] = trCol[i * 3 + 1] = trCol[i * 3 + 2] = 0; }
    }
  }
  trailSys.geometry.attributes.position.needsUpdate = true;
  trailSys.geometry.attributes.color.needsUpdate = true;

  // 模式相关相机轨迹
  let camX = Math.sin(T * 0.3) * 9;
  let camY = 22 + Math.sin(T * 0.22) * 3;
  let camZ = 28 + Math.cos(T * 0.25) * 5;
  if (mode === 'lottery_running') {
    // 拉近，核心感
    camX *= 0.4; camY = 8; camZ = 22;
  } else if (mode === 'match') {
    camY = 35;
  } else if (mode === 'ended') {
    camZ = 38 + Math.cos(T * 0.15) * 3;
  }
  camera.position.lerp(new THREE.Vector3(camX, camY, camZ), dt * 0.4);
  camera.lookAt(0, mode === 'match' ? 0 : 0, 0);

  // 用户：基础轨道
  userM.forEach((e, uid) => {
    if (e.fDelay > 0) { e.fDelay -= dt; return; }
    if (e.fProg < 1) {
      e.fProg = Math.min(1, e.fProg + dt * 1.3);
      const t = easeBack(e.fProg);
      e.group.position.lerpVectors(e.fFrom, e.fTo, t);
      const o = clamp(e.fProg * 1.5, 0, 1);
      e.group.children.forEach((ch) => { if ((ch as THREE.Sprite).material) (ch as THREE.Sprite).material.opacity = o; });
      if (e.fProg < 0.75 && Math.random() < 0.25) {
        emitTrail(e.group.position.clone(), new THREE.Color(userCols[[...userM.keys()].indexOf(uid) % userCols.length]));
      }
    } else {
      e.ang += e.speed * dt;
      let ox = Math.cos(e.ang) * e.rad;
      let oz = Math.sin(e.ang) * e.rad;
      let oy = e.oY + Math.sin(T * 3.5 + ox) * 0.2;

      // shake 模式：高频抖动
      if (mode === 'shake') {
        ox += (Math.random() - 0.5) * 1.5;
        oy += (Math.random() - 0.5) * 1.5;
        oz += (Math.random() - 0.5) * 1.5;
      }
      // lottery_running：向中心收缩
      if (mode === 'lottery_running') {
        const pull = Math.min(1, elapsedModeSec * 0.3);
        ox *= (1 - pull * 0.5);
        oz *= (1 - pull * 0.5);
      }
      e.group.position.lerp(new THREE.Vector3(ox, oy, oz), dt * 1.5);
    }
    const p = 1 + Math.sin(performance.now() * 0.004 + e.group.position.x) * 0.025;
    (e.group.children[0] as THREE.Sprite).scale.setScalar(AV * p);
    (e.group.children[1] as THREE.Sprite).scale.setScalar(AV * 1.7 * (1 + Math.sin(performance.now() * 0.004) * 0.04));
    e.ringSp.material.rotation += dt * 1.1;
  });

  // match 连线：每帧更新位置
  if (matchLines.length > 0) {
    matchLines.forEach((ml) => {
      const u1 = userM.get(ml.from);
      const u2 = userM.get(ml.to);
      if (!u1 || !u2) return;
      const pos = ml.line.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      arr[0] = u1.group.position.x; arr[1] = u1.group.position.y; arr[2] = u1.group.position.z;
      arr[3] = u2.group.position.x; arr[4] = u2.group.position.y; arr[5] = u2.group.position.z;
      pos.needsUpdate = true;
    });
  }

  composer.render();
};

const onResize = () => {
  if (!containerRef.value || !renderer || !composer) return;
  const w = containerRef.value.clientWidth, h = containerRef.value.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  if (bloomPass) bloomPass.setSize(w, h);
};

// 接受外部 currentState（来自 EventScreen.vue 通过 ref 即可）
// 这里通过 watcher 接 props.event.current_state 也能拿到，但更清晰的是直接暴露 setState
const setState = (s: EventStatus) => {
  if (currentState.value === s) return;
  currentState.value = s;
  const newMode = stateToMode(s);
  if (newMode !== mode) {
    mode = newMode;
    modeStartAt = performance.now();
    fireShockwave();
    updateMatchLines();
  }
};
defineExpose({ setState });

watch(() => props.checkinUsers, (us) => { us?.forEach((u, i) => addUser(u, i)); }, { deep: true });
watch(() => props.pairs, () => updateMatchLines(), { deep: true });

onMounted(() => { nextTick(init); window.addEventListener('resize', onResize); });
onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  cancelAnimationFrame(animId);
  matchLines.forEach((ml) => { ml.line.geometry.dispose(); ml.mat.dispose(); });
  shockwave?.geometry.dispose();
  (shockwave?.material as THREE.Material | undefined)?.dispose();
  bloomPass?.dispose();
  composer?.dispose();
  scene?.traverse((o) => {
    if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
    const m = (o as THREE.Mesh).material || (o as THREE.Sprite).material;
    if (m) { if (Array.isArray(m)) m.forEach((x: any) => { x.map?.dispose(); x.dispose(); }); else { (m as any).map?.dispose(); (m as any).dispose(); } }
  });
  renderer?.dispose();
});
</script>

<style scoped>
.stage-container { width: 100%; height: 100%; position: absolute; inset: 0; z-index: 1; }
.stats-bar {
  position: absolute; top: 30px; left: 50%; transform: translateX(-50%); z-index: 10;
  display: flex; gap: 30px; align-items: center;
  background: rgba(0,0,0,0.42); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.09); border-radius: 50px; padding: 14px 36px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.stat { font-size: 18px; color: rgba(255,255,255,0.82); font-weight: 500; display: flex; align-items: center; gap: 6px; }
.stat-num { font-size: 32px; font-weight: 700; color: #ffd54f; font-variant-numeric: tabular-nums; }
.stat-label { font-size: 16px; color: rgba(255,255,255,0.6); }
.stat-divider { width: 1px; height: 18px; background: rgba(255,255,255,0.15); }
.stat-hint { font-size: 14px; color: rgba(255,255,255,0.35); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
