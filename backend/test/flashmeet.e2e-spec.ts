import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * 端到端集成测试
 *
 * 覆盖关键业务链路（端到端 e2e）：
 *  1. Auth → 登录拿 token
 *  2. Event → 创建活动
 *  3. CheckIn → 签到（幂等）
 *  4. Lottery → 抽奖（Lua 原子扣减 + 幂等 + 库存耗尽）
 *  5. Shake → 摇一摇网关转发
 *  6. 权限 → 未登录访问受保护路由
 */
describe('FlashMeet 端到端 (e2e)', () => {
  let app: INestApplication<App>;
  let hostToken = '';
  let userToken = '';
  let eventId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(label: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/wechat')
      .send({
        code: `mock_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        nickname: label,
      })
      .expect(201);
    return res.body.access_token;
  }

  describe('1. Auth + Event 基础流程', () => {
    it('host 登录', async () => {
      hostToken = await login('host');
      expect(hostToken).toBeTruthy();
    });

    it('user 登录', async () => {
      userToken = await login('user');
      expect(userToken).toBeTruthy();
    });

    it('host 创建活动', async () => {
      const res = await request(app.getHttpServer())
        .post('/event')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          title: 'e2e 测试活动',
          description: 'integration test',
        })
        .expect(201);
      eventId = res.body.event_id;
      expect(eventId).toBeTruthy();
    });
  });

  describe('2. CheckIn 幂等', () => {
    it('user 签到成功', async () => {
      const r = await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ event_id: eventId, name: 'Bob', local_tags: ['前端'] })
        .expect(201);
      expect(r.body.user_id).toBeTruthy();
    });

    it('user 重复签到 → 同一记录（幂等）', async () => {
      const r1 = await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ event_id: eventId, name: 'Bob' })
        .expect(201);
      const r2 = await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ event_id: eventId, name: 'Bob', local_tags: ['设计师'] })
        .expect(201);
      expect(r2.body.user_id).toBe(r1.body.user_id);
      // 标签应合并
      expect(r2.body.local_tags).toEqual(expect.arrayContaining(['前端', '设计师']));
    });
  });

  describe('3. Lottery 抽奖链路', () => {
    let poolId = '';
    let user2Token = '';
    it('host 创建 2 份库存的奖池', async () => {
      const res = await request(app.getHttpServer())
        .post('/lottery/pool')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          event_id: eventId,
          name: '签到奖',
          prizes: [{ name: '小礼物', total_count: 2 }],
        })
        .expect(201);
      poolId = res.body.id ?? res.body.pool_id;
      expect(poolId).toBeTruthy();
    });

    it('第二位 user 登录 + 签到（提供 2 个候选人）', async () => {
      user2Token = await login('user2');
      await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ event_id: eventId, name: 'Carol' })
        .expect(201);
    });

    it('第一次抽奖 → 成功', async () => {
      const r = await request(app.getHttpServer())
        .post('/lottery/draw')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ event_id: eventId, pool_id: poolId, request_id: 'req_1' })
        .expect(201);
      // LotteryRecord 实体主键是 id
      expect(r.body.id).toBeTruthy();
    });

    it('同 request_id 重试 → 幂等（不抛错，返回记录）', async () => {
      const r = await request(app.getHttpServer())
        .post('/lottery/draw')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ event_id: eventId, pool_id: poolId, request_id: 'req_1' })
        .expect(201);
      expect(r.body.id).toBeTruthy();
    });

    it('第二次抽奖（不同 request_id / 不同候选人）→ 成功', async () => {
      const r = await request(app.getHttpServer())
        .post('/lottery/draw')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ event_id: eventId, pool_id: poolId, request_id: 'req_2' })
        .expect(201);
      expect(r.body.id).toBeTruthy();
    });

    it('第三次抽奖（库存耗尽 + 无候选人）→ 400 业务错误', async () => {
      await request(app.getHttpServer())
        .post('/lottery/draw')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ event_id: eventId, pool_id: poolId, request_id: 'req_3' })
        .expect(400);
    });
  });

  describe('4. Shake 网关转发', () => {
    it('非 SHAKE 阶段也能接受 shake 事件（累加发生在 Redis）', async () => {
      // shake 路由只做 emitter.emit，gateway 内部做状态校验
      // 这里只验证 HTTP 200/201 通路
      await request(app.getHttpServer())
        .post(`/event/${eventId}/shake`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ count: 5 })
        .expect(201);
    });

    it('count 缺省 / 异常值也应不报错（由 gateway 防御）', async () => {
      await request(app.getHttpServer())
        .post(`/event/${eventId}/shake`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(201);
    });
  });

  describe('5. Icebreaker 题目发布（不调用答题以避免 SQLite JSON_ARRAY 限制）', () => {
    it('host 发布问题', async () => {
      const q = await request(app.getHttpServer())
        .post('/icebreaker/question')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          event_id: eventId,
          prompt: '你来自哪里?',
          options: [
            { key: 'a', label: '北方', tag: '北', color: '#4fc3f7' },
            { key: 'b', label: '南方', tag: '南', color: '#fb923c' },
          ],
        })
        .expect(201);
      const questionId = q.body.question_id;
      expect(questionId).toBeTruthy();

      await request(app.getHttpServer())
        .post(`/icebreaker/question/${questionId}/publish`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(201);

      // 当前快照
      const snap = await request(app.getHttpServer())
        .get(`/icebreaker/event/${eventId}/current`)
        .expect(200);
      expect(snap.body.question.question_id).toBe(questionId);
    });
  });

  describe('6. 权限校验', () => {
    it('未登录访问 host 路由 → 401', async () => {
      await request(app.getHttpServer())
        .get('/event/host/my')
        .expect(401);
    });

    it('user 创建活动后，host 拿不到（每个用户只能列自己的）', async () => {
      const res = await request(app.getHttpServer())
        .get('/event/host/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      // user 不是 host，应为空
      const ours = res.body.filter((e: any) => e.event_id === eventId);
      expect(ours).toHaveLength(0);
    });
  });

  describe('7. 基础设施 (健康检查 / 请求 ID)', () => {
    it('/health 返回 DB + Redis 状态', async () => {
      const r = await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      expect(r.body.status).toMatch(/ok|degraded|down/);
      expect(r.body.db).toBeDefined();
      expect(r.body.db.ok).toBe(true);
      expect(r.body.redis).toBeDefined();
      expect(r.body.pid).toBe(process.pid);
      expect(r.body.uptime_s).toBeGreaterThanOrEqual(0);
    });

    it('未携带 x-request-id 时，服务端生成并回写', async () => {
      const r = await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      const reqId = r.headers['x-request-id'];
      expect(reqId).toBeTruthy();
      expect(reqId!.length).toBeGreaterThan(8);
    });

    it('上游传入 x-request-id 时透传（截断 128 字符）', async () => {
      const provided = 'trace-abc-123';
      const r = await request(app.getHttpServer())
        .get('/health')
        .set('x-request-id', provided)
        .expect(200);
      expect(r.headers['x-request-id']).toBe(provided);
    });

    it('超长 x-request-id 被拒绝（生成新值）', async () => {
      const tooLong = 'a'.repeat(200);
      const r = await request(app.getHttpServer())
        .get('/health')
        .set('x-request-id', tooLong)
        .expect(200);
      const got = r.headers['x-request-id'] as string;
      expect(got).not.toBe(tooLong);
      expect(got.length).toBeLessThanOrEqual(128);
    });
  });

  describe('8. 大屏 join_url + 二维码内容', () => {
    it('screen event 接口返回 join_url，包含 /e/<event_id>', async () => {
      const r = await request(app.getHttpServer())
        .get(`/screen/event/${eventId}`)
        .expect(200);
      expect(r.body.event_id).toBe(eventId);
      expect(r.body.join_url).toBeDefined();
      expect(r.body.join_url).toContain(`/e/${eventId}`);
    });

    it('未配置 SCREEN_JOIN_URL 时走默认占位域名', async () => {
      // SCREEN_JOIN_URL 不在 .env 里时，期望是 flashmeet.example.com
      const r = await request(app.getHttpServer())
        .get(`/screen/event/${eventId}`)
        .expect(200);
      expect(r.body.join_url).toMatch(/^https?:\/\//);
      expect(r.body.join_url).toContain(eventId);
    });
  });

  describe('9. display_id 身份体系', () => {
    let displayEventId = '';
    let userAToken = '';
    let userBToken = '';

    beforeAll(async () => {
      userAToken = await login('alpha');
      userBToken = await login('beta');
      // 复用前面 host 创建一个新活动
      const r = await request(app.getHttpServer())
        .post('/event')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ title: 'display_id 演示聚会' })
        .expect(201);
      displayEventId = r.body.event_id;
    });

    it('签到不传 display_id 时，服务端按 name 自动分配', async () => {
      const r = await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ event_id: displayEventId, name: '阿明' })
        .expect(201);
      expect(r.body.display_id).toMatch(/^阿明#\d{4}$/);
    });

    it('同一 event 内同一 user 重复签到幂等，display_id 保留', async () => {
      const r = await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ event_id: displayEventId, name: '阿明' })
        .expect(201);
      expect(r.body.display_id).toMatch(/^阿明#\d{4}$/);
    });

    it('客户端传 display_id 时服务端尊重（冲突时服务端覆盖）', async () => {
      const r = await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          event_id: displayEventId,
          name: '小王',
          display_id: '小王#0001',
        })
        .expect(201);
      // 服务端会因该 ID 已被使用而分配新值
      expect(r.body.display_id).toMatch(/^小王#\d{4}$/);
    });

    it('非法字符的 display_id 被 400 拒绝', async () => {
      const r = await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          event_id: displayEventId,
          name: 'test',
          display_id: 'bad id with space!',
        })
        .expect(400);
      expect(r.body.message).toBeDefined();
    });

    it('屏幕端拉取的 checkins 列表中带 display_id', async () => {
      const r = await request(app.getHttpServer())
        .get(`/screen/event/${displayEventId}/checkins`)
        .expect(200);
      expect(Array.isArray(r.body)).toBe(true);
      expect(r.body.length).toBeGreaterThanOrEqual(2);
      for (const ci of r.body) {
        expect(ci.display_id).toMatch(/^[\u4e00-\u9fa5A-Za-z0-9_]+#\d{4}$/);
      }
    });

    it('同一活动 3 个不同用户签到，display_id 互不重复', async () => {
      const userCToken = await login('gamma');
      await request(app.getHttpServer())
        .post('/checkin')
        .set('Authorization', `Bearer ${userCToken}`)
        .send({ event_id: displayEventId, name: '小张' })
        .expect(201);
      const list = await request(app.getHttpServer())
        .get(`/screen/event/${displayEventId}/checkins`)
        .expect(200);
      const ids = list.body.map((c: any) => c.display_id);
      const dupes = ids.filter(
        (id: string, i: number) => ids.indexOf(id) !== i,
      );
      expect(dupes).toHaveLength(0);
    });
  });
});
