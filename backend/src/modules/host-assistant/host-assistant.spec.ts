import { Test } from '@nestjs/testing';
import { HostAssistantService } from './host-assistant.service';
import { EventStatus } from '../../common/enums/event-status.enum';

/**
 * HostAssistantService 规则单元测试
 *
 * 覆盖关键业务规则：
 *  1. STANDBY → 建议开始签到
 *  2. CHECKIN 达到 8 人 → 建议发起破冰
 *  3. ICEBREAKER 超 10 分钟 → 建议进入抽奖
 *  4. LOTTERY_READY 超 3 分钟 → 建议开始开奖
 *  5. ENDED → 建议复用此活动
 *  6. 最多 3 条建议（信息不过载）
 */
describe('HostAssistantService (v2.0)', () => {
  let service: HostAssistantService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HostAssistantService],
    }).compile();
    service = moduleRef.get(HostAssistantService);
  });

  it('STANDBY 应建议开始签到', () => {
    const out = service.generate({
      eventId: 'e1',
      currentState: EventStatus.STANDBY,
      checkinCount: 0,
      interactionCount: 0,
      elapsedMs: 0,
      recentChangeMs: 0,
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].id).toBe('r-start-checkin');
    expect(out[0].action.type).toBe('change_scene');
    expect(out[0].action.target).toBe(EventStatus.CHECKIN);
  });

  it('CHECKIN 达 8 人且超过 3 分钟应建议破冰', () => {
    const out = service.generate({
      eventId: 'e2',
      currentState: EventStatus.CHECKIN,
      checkinCount: 10,
      interactionCount: 0,
      elapsedMs: 4 * 60_000,
      recentChangeMs: 0,
    });
    const ids = out.map((s) => s.id);
    expect(ids).toContain('r-checkin-to-icebreaker');
  });

  it('CHECKIN 3 人以下且超 5 分钟应警告主动邀请', () => {
    const out = service.generate({
      eventId: 'e3',
      currentState: EventStatus.CHECKIN,
      checkinCount: 1,
      interactionCount: 0,
      elapsedMs: 6 * 60_000,
      recentChangeMs: 0,
    });
    const ids = out.map((s) => s.id);
    expect(ids).toContain('r-checkin-no-arrival');
  });

  it('ICEBREAKER 超 10 分钟应建议进入抽奖', () => {
    const out = service.generate({
      eventId: 'e4',
      currentState: EventStatus.ICEBREAKER,
      checkinCount: 20,
      interactionCount: 5,
      elapsedMs: 11 * 60_000,
      recentChangeMs: 0,
    });
    const ids = out.map((s) => s.id);
    expect(ids).toContain('r-icebreaker-to-lottery');
  });

  it('LOTTERY_READY 超 3 分钟应建议开始开奖', () => {
    const out = service.generate({
      eventId: 'e5',
      currentState: EventStatus.LOTTERY_READY,
      checkinCount: 20,
      interactionCount: 0,
      elapsedMs: 4 * 60_000,
      recentChangeMs: 0,
    });
    const ids = out.map((s) => s.id);
    expect(ids).toContain('r-lottery-start-draw');
  });

  it('ENDED 状态应建议复用此活动', () => {
    const out = service.generate({
      eventId: 'e6',
      currentState: EventStatus.ENDED,
      checkinCount: 0,
      interactionCount: 0,
      elapsedMs: 0,
      recentChangeMs: 0,
    });
    const ids = out.map((s) => s.id);
    expect(ids).toContain('r-restart-event');
  });

  it('最多 3 条建议（信息不过载）', () => {
    const out = service.generate({
      eventId: 'e7',
      currentState: EventStatus.CHECKIN,
      checkinCount: 10,
      interactionCount: 0,
      elapsedMs: 6 * 60_000,
      recentChangeMs: 0,
    });
    expect(out.length).toBeLessThanOrEqual(3);
  });

  it('建议按优先级倒序', () => {
    const out = service.generate({
      eventId: 'e8',
      currentState: EventStatus.CHECKIN,
      checkinCount: 10,
      interactionCount: 0,
      elapsedMs: 6 * 60_000,
      recentChangeMs: 0,
    });
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].priority).toBeGreaterThanOrEqual(out[i].priority);
    }
  });
});
