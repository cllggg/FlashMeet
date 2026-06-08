import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { IcebreakerQuestion } from './entities/icebreaker-question.entity';
import { IcebreakerAnswer } from './entities/icebreaker-answer.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Event } from '../event/entities/event.entity';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { CreateIcebreakerDto } from './dto/create-icebreaker.dto';
import { AnswerIcebreakerDto } from './dto/answer-icebreaker.dto';
import { EventStatus } from '../../common/enums/event-status.enum';
import { APP_EVENTS } from '../../common/constants/app-events';

export const CURRENT_QUESTION_KEY = (eventId: string) =>
  `event:${eventId}:icebreaker:current`;
const CURRENT_QUESTION_TTL_S = 3600;

@Injectable()
export class IcebreakerService {
  constructor(
    @InjectRepository(IcebreakerQuestion)
    private readonly questionRepo: Repository<IcebreakerQuestion>,
    @InjectRepository(IcebreakerAnswer)
    private readonly answerRepo: Repository<IcebreakerAnswer>,
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(GlobalUser)
    private readonly userRepo: Repository<GlobalUser>,
    private readonly emitter: EventEmitter2,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ── 主持人：创建问题 ──────────────────────

  async createQuestion(
    hostUserId: string,
    dto: CreateIcebreakerDto,
  ): Promise<IcebreakerQuestion> {
    const event = await this.eventRepo.findOne({
      where: { event_id: dto.event_id },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (
      event.host_id !== hostUserId &&
      !event.co_host_ids.includes(hostUserId)
    ) {
      throw new ForbiddenException(
        'Only host or co-host can create icebreaker',
      );
    }

    const question = this.questionRepo.create({
      event_id: dto.event_id,
      prompt: dto.prompt,
      options: dto.options,
      display_order: dto.display_order ?? 0,
    });
    return this.questionRepo.save(question);
  }

  // ── 主持人：发布问题到大屏与用户端 ──────────

  async publishQuestion(
    hostUserId: string,
    questionId: string,
  ): Promise<IcebreakerQuestion> {
    const question = await this.questionRepo.findOne({
      where: { question_id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    const event = await this.eventRepo.findOne({
      where: { event_id: question.event_id },
    });
    if (
      !event ||
      (event.host_id !== hostUserId &&
        !event.co_host_ids.includes(hostUserId))
    ) {
      throw new ForbiddenException(
        'Only host or co-host can publish icebreaker',
      );
    }

    // 大屏 & 用户端收到问题后立即渲染
    this.emitter.emit(APP_EVENTS.ICEBREAKER_PUBLISHED, {
      event_id: question.event_id,
      question: {
        question_id: question.question_id,
        prompt: question.prompt,
        options: question.options,
      },
    });

    // 写入"当前问题"快照：支持晚入场 / 断线重连
    try {
      await this.redis.set(
        CURRENT_QUESTION_KEY(question.event_id),
        JSON.stringify({
          question_id: question.question_id,
          prompt: question.prompt,
          options: question.options,
          published_at: Date.now(),
        }),
        'EX',
        CURRENT_QUESTION_TTL_S,
      );
    } catch {
      // 内存不可用时不影响主流程
    }

    return question;
  }

  // ── 主持人：关闭当前问题 ──────────────────

  async closeQuestion(
    hostUserId: string,
    eventId: string,
  ): Promise<void> {
    const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (
      event.host_id !== hostUserId &&
      !event.co_host_ids.includes(hostUserId)
    ) {
      throw new ForbiddenException(
        'Only host or co-host can close icebreaker',
      );
    }

    // 清理快照
    try {
      await this.redis.del(CURRENT_QUESTION_KEY(eventId));
    } catch {}

    this.emitter.emit(APP_EVENTS.ICEBREAKER_CLOSED, { event_id: eventId });
  }

  /**
   * 获取当前活动的问题快照（晚入场恢复用）
   * 若无快照返回 null
   */
  async getCurrentQuestion(eventId: string): Promise<any | null> {
    try {
      const v = await this.redis.get(CURRENT_QUESTION_KEY(eventId));
      if (v) return JSON.parse(v);
    } catch {}
    return null;
  }

  // ── 用户：作答 ───────────────────────────

  async answer(
    userId: string,
    dto: AnswerIcebreakerDto,
  ): Promise<IcebreakerAnswer> {
    // 状态校验：仅允许在 ICEBREAKER 状态下作答
    const event = await this.eventRepo.findOne({
      where: { event_id: dto.event_id },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.current_state !== EventStatus.ICEBREAKER) {
      throw new BadRequestException(
        `破冰环节未开启，当前活动状态为 ${event.current_state}`,
      );
    }

    const question = await this.questionRepo.findOne({
      where: { question_id: dto.question_id, event_id: dto.event_id },
    });
    if (!question) throw new NotFoundException('Question not found');

    const option = question.options.find((o) => o.key === dto.option_key);
    if (!option) throw new NotFoundException('Option not found');

    // 幂等：同一用户对同一问题只能作答一次
    const compositeId = `${dto.event_id}:${userId}:${dto.question_id}`;
    const existing = await this.answerRepo.findOne({
      where: { id: compositeId },
    });
    if (existing) {
      throw new ConflictException('Already answered this question');
    }

    const answer = this.answerRepo.create({
      id: compositeId,
      event_id: dto.event_id,
      user_id: userId,
      question_id: dto.question_id,
      option_key: dto.option_key,
      tag: option.tag,
      color: option.color,
    });
    const saved = await this.answerRepo.save(answer);

    // 把 tag 写回 checkin.local_tags
    await this.checkinRepo
      .createQueryBuilder()
      .update(CheckIn)
      .set({
        local_tags: () =>
          `CASE WHEN local_tags IS NULL THEN :tag
                WHEN local_tags LIKE :tagPattern THEN local_tags
                ELSE JSON_ARRAY_APPEND(COALESCE(local_tags, JSON_ARRAY()), '$.', JSON_QUOTE(:tag))
           END`,
      })
      .where('event_id = :eid AND user_id = :uid', {
        eid: dto.event_id,
        uid: userId,
        tag: option.tag,
        tagPattern: `%"${option.tag}"%`,
      })
      .setParameters({ tag: option.tag, tagPattern: `%"${option.tag}"%` })
      .execute();

    // 取本场该用户的 display_id（用于大屏定位到具体小圆点）
    const checkin = await this.checkinRepo.findOne({
      where: { event_id: dto.event_id, user_id: userId },
      select: ['display_id', 'name'],
    });

    // 抛事件：大屏接收后点亮暗星
    this.emitter.emit(APP_EVENTS.ICEBREAKER_ANSWERED, {
      event_id: dto.event_id,
      user_id: userId,
      display_id: checkin?.display_id || null,
      name: checkin?.name || null,
      option_key: dto.option_key,
      tag: option.tag,
      color: option.color,
    });

    return saved;
  }

  /**
   * Guest 答题（扫码用户无 JWT，通过 device/user_token 识别）
   */
  async answerGuest(
    deviceToken: string,
    userToken: string,
    dto: AnswerIcebreakerDto,
  ): Promise<IcebreakerAnswer> {
    // 用户召回：优先级 user_token > device_id
    let user: GlobalUser | null = null;

    if (userToken) {
      user = await this.userRepo.findOne({ where: { user_token: userToken } });
    }
    if (!user && deviceToken) {
      user = await this.userRepo.findOne({ where: { device_id: deviceToken } });
    }
    if (!user) {
      throw new NotFoundException('User not found. Please check in first.');
    }

    return this.answer(user.user_id, dto);
  }

  // ── 查询 ────────────────────────────────

  async listQuestions(eventId: string): Promise<IcebreakerQuestion[]> {
    return this.questionRepo.find({
      where: { event_id: eventId, is_active: true },
      order: { display_order: 'ASC', created_at: 'ASC' },
    });
  }

  /**
   * 大屏需要的"暗星颜色"快照
   * 答过题的人取最新作答颜色，未作答的为 null
   */
  async getStarColors(
    eventId: string,
  ): Promise<Array<{ user_id: string; color: string | null; tag: string | null }>> {
    const checkins = await this.checkinRepo.find({
      where: { event_id: eventId },
      relations: ['user'],
    });
    const answers = await this.answerRepo.find({ where: { event_id: eventId } });
    const lastByUser = new Map<string, IcebreakerAnswer>();
    for (const a of answers) {
      const prev = lastByUser.get(a.user_id);
      if (!prev || a.answered_at > prev.answered_at) {
        lastByUser.set(a.user_id, a);
      }
    }
    return checkins.map((c) => {
      const a = lastByUser.get(c.user_id);
      return {
        user_id: c.user_id,
        name: c.name,
        color: a?.color ?? null,
        tag: a?.tag ?? null,
      };
    });
  }

  /**
   * 获取活动破冰统计数据
   */
  async getStats(eventId: string) {
    const answers = await this.answerRepo.find({ where: { event_id: eventId } });
    const uniqueUsers = new Set(answers.map((a) => a.user_id));
    return {
      totalAnswers: answers.length,
      participantCount: uniqueUsers.size,
    };
  }
}
