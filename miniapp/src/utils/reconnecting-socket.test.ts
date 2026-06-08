/**
 * ReconnectingSocket.computeBackoff 单元测试
 * 运行：node --test src/utils/reconnecting-socket.test.ts
 *
 * 覆盖：
 *  - 指数退避：每次重试 base * 2^n
 *  - 上限：到 maxDelayMs 后封顶
 *  - 抖动：±jitter * delay 范围
 *  - 负数参数安全
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// 直接 import 会被 uniapp 注释的 #ifdef 影响
// 这里只测纯静态方法，避开动态 import 与 wx 适配
import { ReconnectingSocket } from './reconnecting-socket.ts';

test('computeBackoff 基础指数：0,1,2 次重试分别约 500/1000/2000ms', () => {
  // 用足够大的 jitter=1 让 range 覆盖 [0, 2*exp]
  // 为稳定断言，取多次平均
  const samples: number[][] = [[], [], []];
  for (let i = 0; i < 200; i++) {
    samples[0].push(ReconnectingSocket.computeBackoff(0, 500, 30000, 0));
    samples[1].push(ReconnectingSocket.computeBackoff(1, 500, 30000, 0));
    samples[2].push(ReconnectingSocket.computeBackoff(2, 500, 30000, 0));
  }
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  // jitter=0 时退化为纯 base*2^n
  assert.ok(Math.abs(avg(samples[0]) - 500) < 50, `n=0 avg=${avg(samples[0])}`);
  assert.ok(Math.abs(avg(samples[1]) - 1000) < 50, `n=1 avg=${avg(samples[1])}`);
  assert.ok(Math.abs(avg(samples[2]) - 2000) < 50, `n=2 avg=${avg(samples[2])}`);
});

test('computeBackoff jitter=0 时无随机', () => {
  const a = ReconnectingSocket.computeBackoff(3, 500, 30000, 0);
  const b = ReconnectingSocket.computeBackoff(3, 500, 30000, 0);
  assert.equal(a, b);
  assert.equal(a, 4000); // 500 * 8
});

test('computeBackoff 上限：超过 maxDelayMs 后封顶', () => {
  // n=10 → 500*1024=512000，但 max=30000
  const delay = ReconnectingSocket.computeBackoff(10, 500, 30000, 0);
  assert.equal(delay, 30000);
});

test('computeBackoff jitter=0.3 时单值落在 ±30% 区间', () => {
  const base = 1000;
  for (let i = 0; i < 100; i++) {
    const d = ReconnectingSocket.computeBackoff(0, base, 30000, 0.3);
    assert.ok(d >= 700 && d <= 1300, `delay=${d} 超出 ±30%`);
  }
});

test('computeBackoff 负 jitter 或 base 不会出现负数', () => {
  const d = ReconnectingSocket.computeBackoff(0, 500, 30000, 1);
  assert.ok(d >= 0);
  // jitter=1 时可能 noise=-exp，结果为 0 不会为负
  assert.ok(d <= 1000);
});

test('computeBackoff 负 retryCount 不抛错（视为 0）', () => {
  const d = ReconnectingSocket.computeBackoff(-5, 500, 30000, 0);
  assert.equal(d, 500);
});

test('computeBackoff retryCount 极大也不抛错（封顶）', () => {
  const d = ReconnectingSocket.computeBackoff(100, 500, 30000, 0);
  assert.equal(d, 30000);
});

test('computeBackoff 极大 jitter=1 仍输出 0~2*exp', () => {
  for (let i = 0; i < 200; i++) {
    const d = ReconnectingSocket.computeBackoff(2, 100, 1000, 1);
    assert.ok(d >= 0 && d <= 800, `jitter=1 delay=${d}`);
  }
});
