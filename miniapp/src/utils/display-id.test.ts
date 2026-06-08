/**
 * display_id 工具单测
 * 运行：
 *   node --experimental-strip-types --test src/utils/display-id.test.ts
 *
 * 覆盖：
 *  - 长度、字符集约束
 *  - 名字清洗（去空格/#、截前 4 字符、undefined fallback）
 *  - 冲突避免
 *  - 校验函数 isValidDisplayId
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDisplayId, isValidDisplayId } from './display-id.ts';

test('generateDisplayId: 阿明 + 4 位数字', () => {
  const id = generateDisplayId('阿明');
  assert.match(id, /^阿明#\d{4}$/);
});

test('generateDisplayId: undefined name 走 Star fallback', () => {
  const id = generateDisplayId(undefined);
  assert.match(id, /^Star#\d{4}$/);
});

test('generateDisplayId: 名字含空格和 # 时被清洗', () => {
  const id = generateDisplayId('阿 明 #');
  assert.equal(id.includes(' '), false);
  const hashCount = (id.match(/#/g) || []).length;
  assert.equal(hashCount, 1);
});

test('generateDisplayId: 名字只取前 4 个字符', () => {
  const id = generateDisplayId('abcdefghij');
  const namePart = id.split('#')[0];
  assert.ok(namePart.length <= 4, `namePart="${namePart}" length=${namePart.length}`);
});

test('generateDisplayId: 与已存在集合不冲突', () => {
  const taken = new Set<string>();
  for (let i = 0; i < 200; i++) {
    taken.add(`阿明#${i.toString().padStart(4, '0')}`);
  }
  const id = generateDisplayId('阿明', taken);
  assert.equal(taken.has(id), false);
});

test('generateDisplayId: 空集合正常', () => {
  const id = generateDisplayId('test', []);
  assert.equal(isValidDisplayId(id), true);
});

test('isValidDisplayId: 合法通过', () => {
  assert.equal(isValidDisplayId('阿明#7392'), true);
  assert.equal(isValidDisplayId('Star#0000'), true);
  assert.equal(isValidDisplayId('A#9999'), true);
});

test('isValidDisplayId: 非法拒绝', () => {
  assert.equal(isValidDisplayId(''), false);
  assert.equal(isValidDisplayId(undefined), false);
  assert.equal(isValidDisplayId(null), false);
  assert.equal(isValidDisplayId('7392'), false);
  assert.equal(isValidDisplayId('阿明#123'), false);
  assert.equal(isValidDisplayId('阿明#12345'), false);
  assert.equal(isValidDisplayId('a'.repeat(40)), false);
});
