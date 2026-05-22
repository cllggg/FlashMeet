import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../event/entities/event.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { LotteryRecord } from '../lottery/entities/lottery-record.entity';

@Controller('screen')
export class ScreenController {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    @InjectRepository(LotteryRecord)
    private readonly lotteryRecordRepo: Repository<LotteryRecord>,
  ) {}

  @Get('event/:event_id')
  async getEvent(@Param('event_id') eventId: string) {
    const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
    if (!event) return null;
    return {
      event_id: event.event_id,
      title: event.title,
      description: event.description,
      current_state: event.current_state,
      location: event.location,
      scheduled_at: event.scheduled_at,
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
      avatar_url: ci.user?.avatar_url || '',
      phone: ci.user?.phone || '',
      local_tags: ci.local_tags || [],
      checked_in_at: ci.checked_in_at,
    }));
  }

  @Get('event/:event_id/winners')
  async getWinners(@Param('event_id') eventId: string) {
    return this.lotteryRecordRepo.find({ where: { event_id: eventId } });
  }
}