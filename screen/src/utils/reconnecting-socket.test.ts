/**
 * ReconnectingSocket.computeBackoff 单测（vitest）
 */
import { describe, it, expect } from 'vitest';
import { ReconnectingSocket } from './reconnecting-socket';

describe('ReconnectingSocket.computeBackoff', () => {
  it('0 次重试 0.5s（jitter 0）', () => {
    const rs = new ReconnectingSocket({ baseDelayMs: 500, jitter: 0 });
    expect(rs.computeBackoff(0)).toBe(500);
  });

  it('1 次重试 1s', () => {
    const rs = new ReconnectingSocket({ baseDelayMs: 500, jitter: 0 });
    expect(rs.computeBackoff(1)).toBe(1000);
  });

  it('2 次重试 2s', () => {
    const rs = new ReconnectingSocket({ baseDelayMs: 500, jitter: 0 });
    expect(rs.computeBackoff(2)).toBe(2000);
  });

  it('上限封顶 30s', () => {
    const rs = new ReconnectingSocket({ baseDelayMs: 500, maxDelayMs: 30_000, jitter: 0 });
    expect(rs.computeBackoff(20)).toBe(30_000);
  });

  it('jitter=0.3 范围 [0.7d, 1.3d]', () => {
    const rs = new ReconnectingSocket({ baseDelayMs: 1000, jitter: 0.3 });
    for (let i = 0; i < 50; i++) {
      const v = rs.computeBackoff(0);
      expect(v).toBeGreaterThanOrEqual(700);
      expect(v).toBeLessThanOrEqual(1300);
    }
  });

  it('jitter=0 时无随机', () => {
    const rs = new ReconnectingSocket({ baseDelayMs: 500, jitter: 0 });
    expect(rs.computeBackoff(3)).toBe(rs.computeBackoff(3));
  });

  it('负 retryCount 不抛错（输出 ≥ 0）', () => {
    const rs = new ReconnectingSocket({ baseDelayMs: 500, jitter: 0 });
    const v = rs.computeBackoff(-5);
    expect(v).toBeGreaterThanOrEqual(0);
  });
});
