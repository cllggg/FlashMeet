import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from './entities/checkin.entity';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { Event } from '../event/entities/event.entity';
import { CheckInDto } from './dto/checkin.dto';

@Injectable()
export class CheckinService {
  constructor(
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(GlobalUser)
    private readonly userRepo: Repository<GlobalUser>,
  ) {}

  /**
   * Idempotent check-in: user_id + event_id is unique
   */
  async checkIn(userId: string, dto: CheckInDto): Promise<CheckIn> {
    const existing = await this.checkinRepo.findOne({
      where: { event_id: dto.event_id, user_id: userId },
    });

    if (existing) {
      if (dto.local_tags && dto.local_tags.length > 0) {
        existing.local_tags = [
          ...new Set([...existing.local_tags, ...dto.local_tags]),
        ];
        return this.checkinRepo.save(existing);
      }
      return existing;
    }

    const event = await this.eventRepo.findOne({
      where: { event_id: dto.event_id },
    });
    if (!event) throw new NotFoundException('Event not found');

    const checkin = this.checkinRepo.create({
      event_id: dto.event_id,
      user_id: userId,
      name: dto.name,
      local_tags: dto.local_tags || [],
      is_invisible: dto.is_invisible || false,
    });

    const saved = await this.checkinRepo.save(checkin);

    await this.userRepo.increment(
      { user_id: userId },
      'event_participated_count',
      1,
    );

    return saved;
  }

  /**
   * Guest check-in (no auth) — phone-based deduplication
   */
  async guestCheckIn(dto: CheckInDto): Promise<{ checkin: CheckIn; user: GlobalUser; isNew: boolean }> {
    const event = await this.eventRepo.findOne({
      where: { event_id: dto.event_id },
    });
    if (!event) throw new NotFoundException('Event not found');

    const phone = dto.phone?.trim();

    // Phone-based dedup: find existing user by phone
    let user: GlobalUser | null = null;
    let isNew = false;

    if (phone) {
      user = await this.userRepo.findOne({ where: { phone } });
    }

    if (!user) {
      user = this.userRepo.create({
        wechat_openid: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        nickname: dto.name || '暗星',
        avatar_url: dto.avatar_url || '',
        phone: phone || '',
        role: 'user',
      });
      user = await this.userRepo.save(user);
      isNew = true;
    } else {
      if (dto.name && dto.name !== user.nickname) {
        user.nickname = dto.name;
        await this.userRepo.save(user);
      }
      if (dto.avatar_url && dto.avatar_url !== user.avatar_url) {
        user.avatar_url = dto.avatar_url;
        await this.userRepo.save(user);
      }
    }

    // Check existing checkin
    const existing = await this.checkinRepo.findOne({
      where: { event_id: dto.event_id, user_id: user.user_id },
    });

    if (existing) {
      return { checkin: existing, user, isNew: false };
    }

    const checkin = this.checkinRepo.create({
      event_id: dto.event_id,
      user_id: user.user_id,
      name: dto.name || user.nickname,
      local_tags: dto.local_tags || [],
      is_invisible: false,
    });

    const saved = await this.checkinRepo.save(checkin);

    await this.userRepo.increment(
      { user_id: user.user_id },
      'event_participated_count',
      1,
    );

    return { checkin: saved, user, isNew };
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
