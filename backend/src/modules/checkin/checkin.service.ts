import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CheckIn } from './entities/checkin.entity';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { Event } from '../event/entities/event.entity';
import { CheckInDto } from './dto/checkin.dto';
import { EventStatus } from '../../common/enums/event-status.enum';
import { APP_EVENTS } from '../../common/constants/app-events';
import { generateDisplayId } from '../../common/utils/display-id';
import { generateUserToken } from '../../common/utils/user-token';

export interface ResolveResult {
  found: boolean;
  user_id?: string;
  user_token?: string;
  display_id?: string;
  name?: string;
  nickname?: string;
  phone?: string;
  avatar_url?: string;
  checked_in_at?: Date;
  local_tags?: string[];
  event_id?: string;
  is_repeat?: boolean;
  /** 服务端用来召回该用户的最佳身份 key（前端应当回写以便丢失后可恢复） */
  recall_key?: 'user_token' | 'device_id' | 'wechat_openid' | 'phone';
}

@Injectable()
export class CheckinService {
  constructor(
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(GlobalUser)
    private readonly userRepo: Repository<GlobalUser>,
    private readonly emitter: EventEmitter2,
  ) {}

  /**
   * Idempotent check-in: user_id + event_id is unique
   */
  async checkIn(userId: string, dto: CheckInDto): Promise<CheckIn> {
    // 状态校验：仅允许在 CHECKIN / STANDBY 状态下签到
    const event = await this.eventRepo.findOne({
      where: { event_id: dto.event_id },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (
      event.current_state !== EventStatus.CHECKIN &&
      event.current_state !== EventStatus.STANDBY
    ) {
      throw new BadRequestException(
        `签到已关闭，当前活动状态为 ${event.current_state}`,
      );
    }

    const existing = await this.checkinRepo.findOne({
      where: { event_id: dto.event_id, user_id: userId },
    });

    if (existing) {
      // 幂等补登：若客户端传了 display_id 且当前为空，则补充
      if (dto.display_id && !existing.display_id) {
        existing.display_id = dto.display_id;
        await this.checkinRepo.save(existing);
      }
      if (dto.local_tags && dto.local_tags.length > 0) {
        existing.local_tags = [
          ...new Set([...existing.local_tags, ...dto.local_tags]),
        ];
        return this.checkinRepo.save(existing);
      }
      return existing;
    }

    // 为本场新签到生成 display_id（去重以免与已有冲突）
    const display_id = dto.display_id
      ? dto.display_id
      : await this.allocateDisplayId(dto.event_id, dto.name);

    const checkin = this.checkinRepo.create({
      event_id: dto.event_id,
      user_id: userId,
      name: dto.name,
      display_id,
      local_tags: dto.local_tags || [],
      is_invisible: dto.is_invisible || false,
    });

    const saved = await this.checkinRepo.save(checkin);

    await this.userRepo.increment(
      { user_id: userId },
      'event_participated_count',
      1,
    );

    // 抛事件，Gateway 监听后通过 WS 通知大屏
    this.emitter.emit(APP_EVENTS.CHECKIN_CREATED, {
      event_id: dto.event_id,
      user: {
        user_id: saved.user_id,
        name: saved.name,
        display_id: saved.display_id,
        local_tags: saved.local_tags,
      },
    });

    return saved;
  }

  /**
   * Guest check-in (no auth) — phone-based deduplication
   * - 召回优先级：user_token > device_id > wechat_openid(device:xxx) > phone
   * - 都没有则创建新用户，同时签发 user_token（一次性、永久）
   * - 返回体一定包含 user_token，前端必须持久化
   */
  async guestCheckIn(
    dto: CheckInDto,
    deviceToken?: string,
  ): Promise<{ checkin: CheckIn; user: GlobalUser; isNew: boolean; recall_key: string }> {
    const event = await this.eventRepo.findOne({
      where: { event_id: dto.event_id },
    });
    if (!event) throw new NotFoundException('Event not found');

    // 状态校验：仅允许在 CHECKIN / STANDBY 状态下签到
    if (
      event.current_state !== EventStatus.CHECKIN &&
      event.current_state !== EventStatus.STANDBY
    ) {
      throw new BadRequestException(
        `签到已关闭，当前活动状态为 ${event.current_state}`,
      );
    }

    const phone = dto.phone?.trim();
    const token = deviceToken?.trim();
    const userToken = (dto as any).user_token?.trim();

    // 用户召回：按优先级依次尝试
    let user: GlobalUser | null = null;
    let recall_key: 'user_token' | 'device_id' | 'wechat_openid' | 'phone' | 'new' = 'new';

    // 1) user_token 最强（服务端签发）
    if (userToken) {
      user = await this.userRepo.findOne({ where: { user_token: userToken } });
      if (user) recall_key = 'user_token';
    }
    // 2) device_id
    if (!user && token) {
      user = await this.userRepo.findOne({ where: { device_id: token } });
      if (user) recall_key = 'device_id';
    }
    // 3) wechat_openid（带 device: 前缀的 guest 用户）
    if (!user && token) {
      user = await this.userRepo.findOne({
        where: { wechat_openid: `device:${token}` },
      });
      if (user) recall_key = 'wechat_openid';
    }
    // 4) phone
    if (!user && phone) {
      user = await this.userRepo.findOne({ where: { phone } });
      if (user) recall_key = 'phone';
    }

    let isNew = false;

    if (!user) {
      const newUser: Partial<GlobalUser> = {
        wechat_openid: token
          ? `device:${token}`
          : `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        nickname: dto.name || '暗星',
        avatar_url: dto.avatar_url || '',
        phone: phone || '',
        user_token: generateUserToken(),
        role: 'user',
      };
      if (token) newUser.device_id = token;
      user = this.userRepo.create(newUser);
      user = await this.userRepo.save(user);
      isNew = true;
    } else {
      // 既有用户：补绑 user_token / device_id / 信息合并
      if (!user.user_token) {
        user.user_token = generateUserToken();
      }
      if (token && !user.device_id) {
        user.device_id = token;
      }
      if (dto.name && dto.name !== user.nickname) {
        user.nickname = dto.name;
      }
      if (dto.avatar_url && dto.avatar_url !== user.avatar_url) {
        user.avatar_url = dto.avatar_url;
      }
      if (phone && !user.phone) {
        user.phone = phone;
      }
      user = await this.userRepo.save(user);
    }

    // Check existing checkin
    let existing = await this.checkinRepo.findOne({
      where: { event_id: dto.event_id, user_id: user.user_id },
    });

    if (existing) {
      if (dto.display_id && !existing.display_id) {
        existing.display_id = dto.display_id;
        existing = await this.checkinRepo.save(existing);
      }
      return { checkin: existing, user, isNew: false, recall_key };
    }

    const display_id = dto.display_id
      ? dto.display_id
      : await this.allocateDisplayId(dto.event_id, dto.name || user.nickname);

    const checkin = this.checkinRepo.create({
      event_id: dto.event_id,
      user_id: user.user_id,
      name: dto.name || user.nickname,
      display_id,
      local_tags: dto.local_tags || [],
      is_invisible: false,
    });

    const saved = await this.checkinRepo.save(checkin);

    await this.userRepo.increment(
      { user_id: user.user_id },
      'event_participated_count',
      1,
    );

    // 抛事件，Gateway 监听后通过 WS 通知大屏
    this.emitter.emit(APP_EVENTS.CHECKIN_CREATED, {
      event_id: dto.event_id,
      user: {
        user_id: saved.user_id,
        name: saved.name,
        display_id: saved.display_id,
        local_tags: saved.local_tags,
        avatar_url: user.avatar_url,
      },
    });

    return { checkin: saved, user, isNew, recall_key };
  }

  /**
   * 扫码静默召回：根据多种身份 + event_id 查询历史签到
   * - 用于"再次扫码直接进入"的 UX
   * - 召回优先级：user_token > device_id > wechat_openid(device:xxx) > phone
   * - 返回 found=false 时前端应展示录入表单
   */
  async resolve(
    eventId: string,
    deviceToken?: string,
    userToken?: string,
    phone?: string,
  ): Promise<ResolveResult> {
    if (!eventId) {
      throw new BadRequestException('Missing event_id');
    }
    const token = deviceToken?.trim();
    const ut = userToken?.trim();
    const ph = phone?.trim();

    if (!token && !ut && !ph) {
      return { found: false, event_id: eventId };
    }

    // 按优先级召回用户
    let user: GlobalUser | null = null;
    let recall_key: ResolveResult['recall_key'];

    if (ut) {
      user = await this.userRepo.findOne({ where: { user_token: ut } });
      if (user) recall_key = 'user_token';
    }
    if (!user && token) {
      user = await this.userRepo.findOne({ where: { device_id: token } });
      if (user) recall_key = 'device_id';
    }
    if (!user && token) {
      user = await this.userRepo.findOne({
        where: { wechat_openid: `device:${token}` },
      });
      if (user) recall_key = 'wechat_openid';
    }
    if (!user && ph) {
      user = await this.userRepo.findOne({ where: { phone: ph } });
      if (user) recall_key = 'phone';
    }

    if (!user) {
      return { found: false, event_id: eventId };
    }

    // 找该用户在本场的签到
    const checkin = await this.checkinRepo.findOne({
      where: { event_id: eventId, user_id: user.user_id },
    });
    if (!checkin) {
      // 设备已识别，但本场没签到 — 前端可以预填昵称/手机号
      return {
        found: false,
        event_id: eventId,
        user_id: user.user_id,
        user_token: user.user_token,
        name: user.nickname,
        nickname: user.nickname,
        phone: user.phone,
        avatar_url: user.avatar_url,
        is_repeat: false, // 跨场识别但本场未签到，不算重复
        recall_key,
      };
    }

    return {
      found: true,
      event_id: eventId,
      user_id: user.user_id,
      user_token: user.user_token,
      display_id: checkin.display_id,
      name: checkin.name,
      avatar_url: user.avatar_url,
      checked_in_at: checkin.checked_in_at,
      local_tags: checkin.local_tags,
      is_repeat: true,
      recall_key,
    };
  }


  /**
   * 为某场活动分配一个不冲突的 display_id
   * 优先复用客户端传入的，否则基于 name 生成
   */
  private async allocateDisplayId(
    eventId: string,
    name: string | undefined,
  ): Promise<string> {
    const existing = await this.checkinRepo.find({
      where: { event_id: eventId },
      select: ['display_id'],
    });
    const taken = new Set<string>(
      existing
        .map((c) => c.display_id)
        .filter((x): x is string => !!x),
    );
    return generateDisplayId(name, taken);
  }

  async getCheckins(eventId: string): Promise<CheckIn[]> {
    return this.checkinRepo.find({
      where: { event_id: eventId },
      relations: ['user'],
      order: { checked_in_at: 'ASC' },
    });
  }

  async getCheckinCount(eventId: string): Promise<number> {
    return this.checkinRepo.count({ where: { event_id: eventId } });
  }

  async updateTags(userId: string, eventId: string, tags: string[]): Promise<CheckIn> {
    const checkin = await this.checkinRepo.findOne({
      where: { event_id: eventId, user_id: userId },
    });
    if (!checkin) throw new NotFoundException('Check-in not found');

    checkin.local_tags = [...new Set([...checkin.local_tags, ...tags])];
    return this.checkinRepo.save(checkin);
  }
}
