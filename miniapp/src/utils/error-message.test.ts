/**
 * error-message 工具单测
 * 运行：node --experimental-strip-types --test src/utils/error-message.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapErrorToMessage } from './error-message.ts';

test('网络层 status=0 默认文案', () => {
  assert.equal(mapErrorToMessage({ status: 0 }), '网络不太通畅，请检查 Wi-Fi 或移动数据');
});

test('网络层 status=0 + timeout 文案', () => {
  assert.equal(mapErrorToMessage({ status: 0, message: 'request timeout' }), '请求超时，请稍后重试');
});

test('业务码命中', () => {
  assert.equal(mapErrorToMessage({ code: 'EVENT_NOT_FOUND' }), '活动不存在或已结束');
  assert.equal(mapErrorToMessage({ code: 'LOTTERY_OUT_OF_STOCK' }), '奖品已被抽完');
  assert.equal(mapErrorToMessage({ code: 'ALREADY_CHECKED_IN' }), '你已经签到过啦');
});

test('userMessage 优先于业务码', () => {
  assert.equal(
    mapErrorToMessage({ code: 'INVALID_PARAMS', userMessage: '名字不能为空' }),
    '名字不能为空',
  );
});

test('HTTP 状态码兜底', () => {
  assert.equal(mapErrorToMessage({ status: 401 }), '请先登录');
  assert.equal(mapErrorToMessage({ status: 403 }), '无权操作');
  assert.equal(mapErrorToMessage({ status: 404 }), '资源不存在');
  assert.equal(mapErrorToMessage({ status: 429 }), '操作太频繁，请稍后再试');
  assert.equal(mapErrorToMessage({ status: 500 }), '服务暂时不可用，请稍后再试');
  assert.equal(mapErrorToMessage({ status: 503 }), '服务暂时不可用，请稍后再试');
});

test('完全空对象走默认服务端文案', () => {
  assert.equal(mapErrorToMessage({}), '服务暂时不可用，请稍后再试');
  assert.equal(mapErrorToMessage(null), '服务暂时不可用，请稍后再试');
  assert.equal(mapErrorToMessage(undefined), '服务暂时不可用，请稍后再试');
});

test('message 兜底', () => {
  assert.equal(
    mapErrorToMessage({ status: 400, message: 'bad request' }),
    'bad request',
  );
});
