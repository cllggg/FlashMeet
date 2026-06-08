import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from '../../common/enums/event-status.enum';
import { isTransitionAllowed } from '../../common/enums/state-transitions';
import { APP_EVENTS } from '../../common/constants/app-events';
import { HostPresenceService } from './host-presence.service';
import { Redis } from 'ioredis';
import { Inject } from '@nestjs/common';

export const EVENT_STATE_KEY = (eventId: string) =>
  `event:${eventId}:state`;

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly emitter: EventEmitter2,
    private readonly hostPresence: HostPresenceService,
  ) {}

  async create(hostId: string, dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepo.create({
      ...dto,
      host_id: hostId,
      current_state: EventStatus.STANDBY,
      settings: dto.settings || {},
    });
    const saved = await this.eventRepo.save(event);

    // Cache state in Redis
    await this.redis.set(
      EVENT_STATE_KEY(saved.event_id),
      EventStatus.STANDBY,
    );

    // Register primary host
    await this.hostPresence.setPrimary(saved.event_id, hostId);

    return saved;
  }

  async findOne(eventId: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { event_id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async getCurrentState(eventId: string): Promise<{ state: EventStatus }> {
    const cached = await this.redis.get(EVENT_STATE_KEY(eventId));
    if (cached) return { state: cached as EventStatus };

    // Fallback to DB
    const event = await this.findOne(eventId);
    await this.redis.set(EVENT_STATE_KEY(eventId), event.current_state);
    return { state: event.current_state };
  }

  async update(
    eventId: string,
    userId: string,
    dto: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.findOne(eventId);
    if (event.host_id !== userId) {
      // Check co-host
      if (!event.co_host_ids.includes(userId)) {
        throw new ForbiddenException('Only host or co-host can update event');
      }
    }
    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  async publish(eventId: string, userId: string): Promise<Event> {
    const event = await this.findOne(eventId);
    if (event.host_id !== userId) {
      throw new ForbiddenException('Only host can publish event');
    }
    event.is_published = true;
    return this.eventRepo.save(event);
  }

  async changeScene(
    eventId: string,
    targetState: EventStatus,
    userId: string,
  ): Promise<EventStatus> {
    // 分布式锁：防止多 co-host 同时切换导致状态竞态
    const lockKey = `event:${eventId}:change_scene:lock`;
    const lock = await this.redis.set(lockKey, userId, 'PX', 3000, 'NX');
    if (!lock) {
      throw new BadRequestException(
        'Another host is changing the scene, please wait.',
      );
    }

    try {
      const event = await this.findOne(eventId);
      if (event.host_id !== userId && !event.co_host_ids.includes(userId)) {
        throw new ForbiddenException('Only host or co-host can change scene');
      }

      // 状态机校验：拒绝非法跳转
      if (!isTransitionAllowed(event.current_state, targetState)) {
        throw new BadRequestException(
          `Illegal state transition: ${event.current_state} -> ${targetState}`,
        );
      }

      // Update DB
      const previousState = event.current_state;
      event.current_state = targetState;
      await this.eventRepo.save(event);

      // Update Redis
      await this.redis.set(EVENT_STATE_KEY(eventId), targetState);

      // 抛事件，Gateway 监听后广播
      this.emitter.emit(APP_EVENTS.SCENE_CHANGED, {
        event_id: eventId,
        state: targetState,
        previous_state: previousState,
        changed_by: userId,
        at: Date.now(),
      });

      return targetState;
    } finally {
      // 原子释放锁：仅当锁值匹配时才删除（Lua 脚本保证原子性）
      try {
        await this.redis.eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          1,
          lockKey,
          userId,
        );
      } catch {}
    }
  }

  async findByHost(hostId: string): Promise<Event[]> {
    return this.eventRepo.find({ where: { host_id: hostId } });
  }
}
