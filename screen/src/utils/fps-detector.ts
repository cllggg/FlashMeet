/**
 * FPS Detector — 持续运行 + 双向自适应
 *
 * 设计要点：
 * 1. 双向：低帧降级（3D → 2D），高帧恢复（2D → 3D）
 * 2. Hysteresis：降级阈值 < 恢复阈值，避免在临界点反复抖动
 * 3. 场景切换 reset：reset() 清空窗口和 streak，重新评估
 * 4. 变更冷却：两次状态变化至少间隔 changeCooldownMs，避免闪烁
 */
export interface FpsDetectorOptions {
  /** 滑窗大小（最近 N 个采样） */
  windowSize?: number;
  /** 采样间隔 ms */
  sampleIntervalMs?: number;
  /** 触发降级的 FPS 阈值（avg < degradeBelow） */
  degradeBelow?: number;
  /** 触发恢复的 FPS 阈值（avg >= recoverAbove） */
  recoverAbove?: number;
  /** 触发降级需要连续低帧的次数 */
  degradeStreak?: number;
  /** 触发恢复需要连续高帧的次数 */
  recoverStreak?: number;
  /** 两次状态变化最小间隔 ms */
  changeCooldownMs?: number;
  /** 初始 degraded 状态（场景如冰屏场景默认 2D） */
  initialDegraded?: boolean;
}

export class FpsDetector {
  private samples: number[] = [];
  private timer: number | null = null;
  private streak = 0;
  private running = false;
  private degraded: boolean;
  private lastChangeAt = 0;
  private listeners: Array<(avg: number, degraded: boolean) => void> = [];

  private readonly windowSize: number;
  private readonly sampleIntervalMs: number;
  private readonly degradeBelow: number;
  private readonly recoverAbove: number;
  private readonly degradeStreak: number;
  private readonly recoverStreak: number;
  private readonly changeCooldownMs: number;

  constructor(opts: FpsDetectorOptions = {}) {
    this.windowSize = opts.windowSize ?? 5;
    this.sampleIntervalMs = opts.sampleIntervalMs ?? 1000;
    this.degradeBelow = opts.degradeBelow ?? 24;
    this.recoverAbove = opts.recoverAbove ?? 36;
    this.degradeStreak = opts.degradeStreak ?? 3;
    this.recoverStreak = opts.recoverStreak ?? 5;
    this.changeCooldownMs = opts.changeCooldownMs ?? 5000;
    this.degraded = opts.initialDegraded ?? false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    let last = performance.now();
    const tick = () => {
      if (!this.running) return;
      const now = performance.now();
      const delta = now - last;
      last = now;
      if (delta > 0) {
        const fps = 1000 / delta;
        this.samples.push(fps);
        if (this.samples.length > this.windowSize) {
          this.samples.shift();
        }
        const avg =
          this.samples.reduce((a, b) => a + b, 0) / this.samples.length;

        if (!this.degraded) {
          // 监测降级
          if (avg < this.degradeBelow) {
            this.streak += 1;
            if (this.streak >= this.degradeStreak) {
              this.tryChange(true, avg);
            }
          } else {
            this.streak = 0;
          }
        } else {
          // 监测恢复
          if (avg >= this.recoverAbove) {
            this.streak += 1;
            if (this.streak >= this.recoverStreak) {
              this.tryChange(false, avg);
            }
          } else {
            this.streak = 0;
          }
        }
      }
      this.timer = window.setTimeout(tick, this.sampleIntervalMs);
    };
    tick();
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * 场景切换时调用：清空窗口和 streak，让新场景独立评估
   * 不改 degraded 状态，但下次采样立即重置累加
   */
  reset() {
    this.samples = [];
    this.streak = 0;
    this.lastChangeAt = 0; // 解除冷却，新场景可立即触发首次变化
  }

  /** 主动强制降级（一般用于检测到 WebGL 不支持时） */
  forceDegrade() {
    if (this.degraded) return;
    this.degraded = true;
    this.lastChangeAt = Date.now();
    this.emit(this.currentAvg() ?? 0, true);
  }

  currentAvg(): number | null {
    if (this.samples.length === 0) return null;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  isDegraded(): boolean {
    return this.degraded;
  }

  /** 订阅降级/恢复事件 */
  onChange(cb: (avg: number, degraded: boolean) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private tryChange(nextDegraded: boolean, avg: number) {
    if (this.degraded === nextDegraded) return;
    const now = Date.now();
    if (now - this.lastChangeAt < this.changeCooldownMs) return;
    this.degraded = nextDegraded;
    this.streak = 0;
    this.lastChangeAt = now;
    this.emit(avg, nextDegraded);
  }

  private emit(avg: number, degraded: boolean) {
    for (const l of this.listeners) {
      try {
        l(avg, degraded);
      } catch {
        // 忽略订阅者错误
      }
    }
  }
}
