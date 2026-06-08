import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../event/entities/event.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { LotteryRecord } from '../lottery/entities/lottery-record.entity';
import { EventGateway } from '../gateway/event.gateway';

@Controller('screen')
export class ScreenController {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    @InjectRepository(LotteryRecord)
    private readonly lotteryRecordRepo: Repository<LotteryRecord>,
    private readonly config: ConfigService,
    private readonly gateway: EventGateway,
  ) {}

  @Get('event/:event_id')
  async getEvent(@Param('event_id') eventId: string) {
    const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
    if (!event) return null;
    // 扫码进小程序的短链：用于大屏生成二维码
    // v3.0 极简：所有用户功能收口在 `pages/live/index`（Live 容器），扫码后直达。
    // 注意：
    //   1. 后端不知道调用方（手机/大屏）的局域网 IP，所以只能返回路径部分，
    //      由大屏前端在自己 host 上拼出 miniapp 的完整 URL。
    //   2. 若硬要后端生成完整地址，可通过环境变量 SCREEN_JOIN_URL 注入（必须含 http(s)://）。
    //   3. query 参数名使用 `eventId`（不是 `event_id`），与 `pages/live/index` 内
    //      `onLoad((q) => { eventIdRef.value = q?.eventId || ... })` 保持一致。
    const joinUrl =
      this.config.get<string>('SCREEN_JOIN_URL') ||
      `/#/pages/live/index?eventId=${event.event_id}`;
    return {
      event_id: event.event_id,
      title: event.title,
      description: event.description,
      current_state: event.current_state,
      location: event.location,
      scheduled_at: event.scheduled_at,
      join_url: joinUrl,
    };
  }

  @Get('event/:event_id/checkins')
  async getCheckins(@Param('event_id') eventId: string) {
    const checkins = await this.checkinRepo.find({
      where: { event_id: eventId },
      relations: ['user'],
      order: { checked_in_at: 'ASC' },
    });
    return checkins.map((ci) => ({
      user_id: ci.user_id,
      name: ci.name || ci.user?.nickname || '暗星',
      nickname: ci.user?.nickname || '暗星',
      display_id: ci.display_id || null,
      avatar_url: ci.user?.avatar_url || '',
      phone: ci.user?.phone || '',
      local_tags: ci.local_tags || [],
      checked_in_at: ci.checked_in_at,
    }));
  }

  @Get('event/:event_id/winners')
  async getWinners(@Param('event_id') eventId: string) {
    const records = await this.lotteryRecordRepo.find({
      where: { event_id: eventId },
      relations: ['user'],
      order: { won_at: 'ASC' },
    });
    // 补充 display_id
    if (records.length > 0) {
      const userIds = [...new Set(records.map((r) => r.user_id))];
      const checkins = await this.checkinRepo
        .createQueryBuilder('c')
        .select(['c.user_id', 'c.display_id'])
        .where('c.event_id = :eid', { eid: eventId })
        .andWhere('c.user_id IN (:...uids)', { uids: userIds })
        .getRawMany<{ c_user_id: string; c_display_id: string | null }>();
      const map = new Map(checkins.map((c) => [c.c_user_id, c.c_display_id]));
      return records.map((r) => ({
        ...r,
        display_id: map.get(r.user_id) ?? null,
      }));
    }
    return records;
  }

  /**
   * 摇一摇会话状态：用于小程序晚入场时校准倒计时
   *  - active: 是否进行中
   *  - ends_at: 结束时间戳（ms）
   *  - server_now: 服务器当前时间戳（用于校准客户端时钟漂移）
   *  - 优先查内存，内存无则查 Redis（服务重启后恢复）
   */
  @Get('event/:event_id/shake-session')
  async getShakeSession(@Param('event_id') eventId: string) {
    const endsAt = this.gateway.getShakeSessionEndsAt(eventId);
    if (endsAt) {
      return { active: true, ends_at: endsAt, server_now: Date.now() };
    }
    // 内存无，检查 Redis 兜底（服务重启后恢复）
    const redisSession = await this.gateway.getShakeSessionRedis(eventId);
    if (redisSession) {
      return {
        active: redisSession.ends_at > Date.now(),
        ends_at: redisSession.ends_at,
        server_now: Date.now(),
      };
    }
    return { active: false, ends_at: null, server_now: Date.now() };
  }
}