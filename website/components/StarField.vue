<template>
  <canvas
    ref="canvasRef"
    class="absolute inset-0 w-full h-full"
    :style="{ pointerEvents: 'auto' }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
/**
 * StarField - 沉浸式 Canvas 星空
 *
 * 特性：
 *  - 350+ 颗星粒子，双层视差（远景慢、近景快）
 *  - 鼠标移动时粒子产生轻微排斥/吸引，形成"互动星河"
 *  - 偶发流星划过
 *  - 自适应 DPR，高分屏不糊
 *  - requestAnimationFrame + 暂停节流（标签页不可见时）
 */
const canvasRef = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let raf = 0;
  let visible = true;
  let mouseX = -9999, mouseY = -9999;

  type Star = { x: number; y: number; z: number; r: number; a: number; vx: number; vy: number; hue: number };
  const farStars: Star[] = [];
  const nearStars: Star[] = [];

  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const buildStars = () => {
    farStars.length = 0;
    nearStars.length = 0;
    const count = Math.floor((W * H) / 6500);
    for (let i = 0; i < count; i++) {
      farStars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: rand(0.15, 0.45),
        r: rand(0.3, 0.9),
        a: rand(0.2, 0.7),
        vx: 0, vy: 0,
        hue: rand(200, 280),
      });
    }
    for (let i = 0; i < 80; i++) {
      nearStars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: rand(0.6, 1.0),
        r: rand(0.8, 1.8),
        a: rand(0.4, 0.9),
        vx: 0, vy: 0,
        hue: rand(180, 320),
      });
    }
  };

  // 流星
  type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };
  const meteors: Meteor[] = [];
  const maybeSpawnMeteor = () => {
    if (Math.random() > 0.012) return;
    meteors.push({
      x: rand(-100, W * 0.4),
      y: rand(-50, H * 0.3),
      vx: rand(4, 7),
      vy: rand(1.5, 3),
      life: 0,
      max: rand(40, 60),
    });
    if (meteors.length > 3) meteors.shift();
  };

  let t0 = performance.now();
  const loop = (t: number) => {
    if (!visible) {
      raf = requestAnimationFrame(loop);
      return;
    }
    const dt = Math.min(0.05, (t - t0) / 1000);
    t0 = t;

    // 背景渐变清屏
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#050516');
    grad.addColorStop(1, '#0a0a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 远景星
    for (const s of farStars) {
      s.a += Math.sin(t * 0.001 + s.x) * 0.005;
      const a = Math.max(0.1, Math.min(0.8, s.a));
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${a})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 近景星 + 鼠标交互
    for (const s of nearStars) {
      const dx = s.x - mouseX;
      const dy = s.y - mouseY;
      const dist = Math.hypot(dx, dy);
      const force = Math.max(0, 110 - dist) / 110;
      s.vx += dx * force * 0.02;
      s.vy += dy * force * 0.02;
      s.vx *= 0.92; s.vy *= 0.92;
      s.x += s.vx;
      s.y += s.vy;
      s.x += s.z * 0.15; // 视差漂移
      if (s.x > W + 5) s.x = -5;
      if (s.x < -5) s.x = W + 5;
      if (s.y > H + 5) s.y = -5;
      if (s.y < -5) s.y = H + 5;

      const glow = Math.max(0, 80 - dist) / 80 * 0.5;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue}, 90%, 80%, ${s.a + glow})`;
      ctx.arc(s.x, s.y, s.r + glow * 2, 0, Math.PI * 2);
      ctx.fill();

      if (glow > 0.05) {
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${s.hue}, 90%, 80%, ${glow * 0.4})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
        ctx.stroke();
      }
    }

    // 流星
    maybeSpawnMeteor();
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life++;
      const alpha = 1 - m.life / m.max;
      const tail = 60;
      const grd = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * tail / 5, m.y - m.vy * tail / 5);
      grd.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * tail / 5, m.y - m.vy * tail / 5);
      ctx.stroke();
      if (m.life > m.max) meteors.splice(i, 1);
    }

    raf = requestAnimationFrame(loop);
  };

  const onMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  };
  const onLeave = () => { mouseX = -9999; mouseY = -9999; };
  const onVis = () => { visible = !document.hidden; };

  resize();
  buildStars();
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', () => { resize(); buildStars(); });
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseleave', onLeave);
  document.addEventListener('visibilitychange', onVis);

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', () => { resize(); buildStars(); });
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
  });
});
</script>
