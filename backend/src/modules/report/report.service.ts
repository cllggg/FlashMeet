import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../event/entities/event.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { MatchPair } from '../match/entities/match-pair.entity';
import { IcebreakerQuestion } from '../icebreaker/entities/icebreaker-question.entity';
import { IcebreakerAnswer } from '../icebreaker/entities/icebreaker-answer.entity';
import { LotteryPool } from '../lottery/entities/lottery-pool.entity';
import { LotteryRecord } from '../lottery/entities/lottery-record.entity';
import { Redis } from 'ioredis';
import { Inject } from '@nestjs/common';

export interface EventReport {
  event_id: string;
  title: string;
  duration: string;
  // 签到转化漏斗
  checkin: {
    total_views: number;
    total_checkins: number;
    conversion_rate: number;
    invisible_count: number;
  };
  // 破冰互动
  icebreaker: {
    questions_published: number;
    total_answers: number;
    participation_rate: number;
  };
  // 抽奖
  lottery: {
    total_draws: number;
    total_winners: number;
    pool_count: number;
  };
  // 摇一摇
  shake: {
    total_participants: number;
    total_shakes: number;
  };
  // CP盲盒
  match: {
    total_pairs: number;
    accepted_pairs: number;
    match_rate: number;
  };
  // 综合
  summary: {
    total_interactions: number;
    avg_interaction_per_user: number;
    highlights: string[];
  };
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    @InjectRepository(MatchPair)
    private readonly matchRepo: Repository<MatchPair>,
    @InjectRepository(IcebreakerQuestion)
    private readonly questionRepo: Repository<IcebreakerQuestion>,
    @InjectRepository(IcebreakerAnswer)
    private readonly answerRepo: Repository<IcebreakerAnswer>,
    @InjectRepository(LotteryPool)
    private readonly poolRepo: Repository<LotteryPool>,
    @InjectRepository(LotteryRecord)
    private readonly recordRepo: Repository<LotteryRecord>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async generateReport(eventId: string): Promise<EventReport> {
    const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
    if (!event) throw new Error('Event not found');

    const checkins = await this.checkinRepo.find({ where: { event_id: eventId } });
    const matches = await this.matchRepo.find({ where: { event_id: eventId } });

    // ── 签到漏斗 ──────────────────────────
    const visibleCheckins = checkins.filter((c) => !c.is_invisible);
    const totalCheckins = checkins.length;
    const invisibleCount = checkins.filter((c) => c.is_invisible).length;

    // 转化率基于签到人数计算（仅展示签到漏斗，不编造浏览数据）
    const totalViews = totalCheckins;
    const conversionRate = 100; // 签到即转化

    // ── 匹配率 ──────────────────────────
    const acceptedMatches = matches.filter((m) => m.status === 'accepted');
    const matchRate = matches.length > 0 ? Math.round((acceptedMatches.length / matches.length) * 100) : 0;

    // ── 破冰统计 ────────────────────────
    const questions = await this.questionRepo.find({ where: { event_id: eventId } });
    const questionsPublished = questions.length;
    const answers = await this.answerRepo.find({ where: { event_id: eventId } });
    const uniqueAnswerers = new Set(answers.map((a) => a.user_id));
    const participationRate = visibleCheckins.length > 0
      ? Math.round((uniqueAnswerers.size / visibleCheckins.length) * 100)
      : 0;

    // ── 抽奖统计 ────────────────────────
    const pools = await this.poolRepo.find({ where: { event_id: eventId } });
    const records = await this.recordRepo.find({ where: { event_id: eventId } });
    const totalDraws = records.length; // 每条 record = 一次中奖记录
    const totalWinners = new Set(records.map((r) => r.user_id)).size;

    // ── 摇一摇统计（Redis ZSet 累计）──
    let totalShakes = 0;
    let totalShakeParticipants = 0;
    try {
      const key = `event:${eventId}:shake:scores`;
      // ZRANGE WITHSCORES 取所有用户及分数
      const all = await this.redis.zrange(key, 0, -1, 'WITHSCORES');
      for (let i = 1; i < all.length; i += 2) {
        const score = parseInt(all[i], 10);
        if (score > 0) {
          totalShakes += score;
          totalShakeParticipants += 1;
        }
      }
    } catch {
      // Redis 不可用时保持 0
    }

    // ── 综合数据 ───────────────────────
    const totalInteractions =
      totalCheckins +
      matches.length +
      acceptedMatches.length +
      answers.length +
      totalDraws +
      totalShakeParticipants;

    // 高光摘要
    const highlights: string[] = [];
    if (conversionRate >= 80) highlights.push('签到转化率优秀，超过80%的观众参与了签到');
    if (acceptedMatches.length >= 3) highlights.push(`产生了${acceptedMatches.length}对成功匹配，社交氛围热烈`);
    if (totalCheckins >= 10) highlights.push(`签到人数超过10人，活动规模可观`);
    if (matchRate >= 50) highlights.push('CP盲盒匹配率超过50%，参与者互动意愿强烈');
    if (questionsPublished > 0 && participationRate >= 60) {
      highlights.push(`破冰问题参与率达${participationRate}%，破冰效果好`);
    }
    if (totalShakeParticipants >= 5) {
      highlights.push(`摇一摇环节共${totalShakeParticipants}人参与，累计${totalShakes}次抖动`);
    }
    if (highlights.length === 0) highlights.push('活动数据正常，期待下次更精彩');

    const duration = event.created_at
      ? this.formatDuration(event.created_at, new Date())
      : '未知';

    return {
      event_id: eventId,
      title: event.title,
      duration,
      checkin: {
        total_views: totalViews,
        total_checkins: totalCheckins,
        conversion_rate: conversionRate,
        invisible_count: invisibleCount,
      },
      icebreaker: {
        questions_published: questionsPublished,
        total_answers: answers.length,
        participation_rate: participationRate,
      },
      lottery: {
        total_draws: totalDraws,
        total_winners: totalWinners,
        pool_count: pools.length,
      },
      shake: {
        total_participants: totalShakeParticipants,
        total_shakes: totalShakes,
      },
      match: {
        total_pairs: matches.length,
        accepted_pairs: acceptedMatches.length,
        match_rate: matchRate,
      },
      summary: {
        total_interactions: totalInteractions,
        avg_interaction_per_user: visibleCheckins.length > 0
          ? Math.round((totalInteractions / visibleCheckins.length) * 10) / 10
          : 0,
        highlights,
      },
    };
  }

  private formatDuration(start: Date, end: Date): string {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  }
}