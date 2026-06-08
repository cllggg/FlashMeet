import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FpsDetector } from './fps-detector';

describe('FpsDetector (双向 + reset)', () => {
  let nowSpy: any;
  let now = 0;

  beforeEach(() => {
    now = 0;
    nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('初始状态：未降级 / 无样本', () => {
    const d = new FpsDetector();
    expect(d.isDegraded()).toBe(false);
    expect(d.currentAvg()).toBeNull();
  });

  it('默认值：degradeBelow=24, recoverAbove=36, degradeStreak=3, recoverStreak=5', () => {
    const d = new FpsDetector();
    expect((d as any).degradeBelow).toBe(24);
    expect((d as any).recoverAbove).toBe(36);
    expect((d as any).degradeStreak).toBe(3);
    expect((d as any).recoverStreak).toBe(5);
    expect((d as any).windowSize).toBe(5);
    expect((d as any).sampleIntervalMs).toBe(1000);
    expect((d as any).changeCooldownMs).toBe(5000);
  });

  it('initialDegraded 可指定初始降级状态', () => {
    const d = new FpsDetector({ initialDegraded: true });
    expect(d.isDegraded()).toBe(true);
  });

  it('forceDegrade 立即触发降级', () => {
    const events: Array<{ avg: number; degraded: boolean }> = [];
    const d = new FpsDetector();
    d.onChange((avg, degraded) => events.push({ avg, degraded }));

    d.forceDegrade();

    expect(d.isDegraded()).toBe(true);
    expect(events.length).toBe(1);
    expect(events[0].degraded).toBe(true);
  });

  it('forceDegrade 幂等', () => {
    const events: number[] = [];
    const d = new FpsDetector();
    d.onChange((degraded) => events.push(degraded ? 1 : 0));

    d.forceDegrade();
    d.forceDegrade();
    d.forceDegrade();

    expect(events.length).toBe(1);
  });

  it('订阅可被 unsubscribe 取消', () => {
    const events: number[] = [];
    const d = new FpsDetector();
    const off = d.onChange((degraded) => events.push(degraded ? 1 : 0));

    d.forceDegrade();
    expect(events.length).toBe(1);
    off();
    d.forceDegrade();
    expect(events.length).toBe(1);
  });

  it('订阅者抛错不影响主流程', () => {
    const d = new FpsDetector();
    d.onChange(() => {
      throw new Error('boom');
    });
    expect(() => d.forceDegrade()).not.toThrow();
    expect(d.isDegraded()).toBe(true);
  });

  it('多个订阅者各自收到事件', () => {
    const a: number[] = [];
    const b: number[] = [];
    const d = new FpsDetector();
    d.onChange((d) => a.push(d ? 1 : 0));
    d.onChange((d) => b.push(d ? 1 : 0));

    d.forceDegrade();
    expect(a.length).toBe(1);
    expect(b.length).toBe(1);
  });

  it('start() 后 running=true；stop() 后 running=false', () => {
    const d = new FpsDetector();
    expect((d as any).running).toBe(false);
    d.start();
    expect((d as any).running).toBe(true);
    d.stop();
    expect((d as any).running).toBe(false);
    expect((d as any).timer).toBeNull();
  });

  it('start() 重复调用幂等', () => {
    const d = new FpsDetector();
    d.start();
    const timer1 = (d as any).timer;
    d.start();
    expect((d as any).timer).toBe(timer1);
    d.stop();
  });

  it('currentAvg 返回样本平均', () => {
    const d = new FpsDetector({ windowSize: 3 });
    (d as any).samples.push(60, 50, 40);
    expect(d.currentAvg()).toBe(50);
  });

  it('reset 清空样本和 streak，解除冷却', () => {
    const d = new FpsDetector();
    (d as any).samples.push(10, 20);
    (d as any).streak = 2;
    (d as any).lastChangeAt = Date.now();

    d.reset();

    expect((d as any).samples.length).toBe(0);
    expect((d as any).streak).toBe(0);
    expect((d as any).lastChangeAt).toBe(0);
    expect(d.isDegraded()).toBe(false); // 不改 degraded
  });

  it('reset 不改 degraded 状态', () => {
    const d = new FpsDetector({ initialDegraded: true });
    d.reset();
    expect(d.isDegraded()).toBe(true);
  });

  it('tryChange 在冷却期内不会改变状态', () => {
    const d = new FpsDetector({ changeCooldownMs: 5000 });
    (d as any).lastChangeAt = Date.now();
    (d as any).tryChange(true, 30);
    expect(d.isDegraded()).toBe(false); // 仍在冷却
  });

  it('tryChange 越过冷却后允许变化', () => {
    const d = new FpsDetector({ changeCooldownMs: 100 });
    (d as any).lastChangeAt = Date.now() - 200;
    (d as any).tryChange(true, 30);
    expect(d.isDegraded()).toBe(true);
  });

  it('降级 → 恢复：双向切换', () => {
    const d = new FpsDetector();
    d.forceDegrade();
    expect(d.isDegraded()).toBe(true);
    (d as any).lastChangeAt = 0; // 解除冷却
    (d as any).tryChange(false, 60);
    expect(d.isDegraded()).toBe(false);
  });

  it('同向 tryChange 不会触发 emit', () => {
    const events: number[] = [];
    const d = new FpsDetector();
    d.onChange((degraded) => events.push(degraded ? 1 : 0));
    d.forceDegrade(); // emit
    (d as any).tryChange(true, 20); // 同向，不应 emit
    expect(events.length).toBe(1);
  });
});
