import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from '../../common/enums/event-status.enum';
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
    const event = await this.findOne(eventId);
    if (event.host_id !== userId && !event.co_host_ids.includes(userId)) {
      throw new ForbiddenException('Only host or co-host can change scene');
    }

    // Update DB
    event.current_state = targetState;
    await this.eventRepo.save(event);

    // Update Redis
    await this.redis.set(EVENT_STATE_KEY(eventId), targetState);

    return targetState;
  }

  async findByHost(hostId: string): Promise<Event[]> {
    return this.eventRepo.find({ where: { host_id: hostId } });
  }
}
