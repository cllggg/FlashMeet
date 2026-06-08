import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MatchPair, MatchStatus } from './entities/match-pair.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { APP_EVENTS } from '../../common/constants/app-events';

/**
 * CP盲盒匹配服务
 *
 * 设计文档 2.3：
 * 通过标签相似度算法，为每位参与者匹配全场最相似的另一人。
 * 匹配结果通过 WebSocket 推送到大屏（连线动画）和手机端（配对提示）。
 */

export interface MatchResult {
  user_a: { user_id: string; display_id: string; name: string; tags: string[] };
  user_b: { user_id: string; display_id: string; name: string; tags: string[] };
  common_tags: string[];
  score: number;
}

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    @InjectRepository(MatchPair)
    private readonly matchRepo: Repository<MatchPair>,
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    private readonly emitter: EventEmitter2,
  ) {}

  /**
   * 延时社交沉淀池：计算指定用户与同场其他参与者的标签相似度
   * 返回排名前 N 的最相似用户
   */
  async getTopMatches(eventId: string, userId: string, limit = 5): Promise<MatchResult[]> {
    const checkins = await this.checkinRepo.find({
      where: { event_id: eventId, is_invisible: false },
    });

    const users = checkins.map((c) => ({
      user_id: c.user_id,
      display_id: c.display_id || '?',
      name: c.name || '参与者',
      tags: c.local_tags || [],
    }));

    const me = users.find((u) => u.user_id === userId);
    if (!me || me.tags.length === 0) return [];

    const scores = users
      .filter((u) => u.user_id !== userId)
      .map((other) => {
        const common = me.tags.filter((t: string) => other.tags.includes(t));
        const union = new Set([...me.tags, ...other.tags]);
        const score = union.size > 0 ? common.length / union.size : 0;
        return {
          user_a: { user_id: me.user_id, display_id: me.display_id, name: me.name, tags: me.tags },
          user_b: { user_id: other.user_id, display_id: other.display_id, name: other.name, tags: other.tags },
          common_tags: common,
          score: Math.round(score * 100),
        };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scores;
  }

  /**
   * 算法：Jaccard 相似度 + 贪心配对（避免重复）
   */
  async generateMatches(eventId: string): Promise<MatchResult[]> {
    const checkins = await this.checkinRepo.find({
      where: { event_id: eventId, is_invisible: false },
    });

    if (checkins.length < 2) {
      this.logger.warn(`Event ${eventId} has fewer than 2 checkins, cannot match`);
      return [];
    }

    // 构建用户标签向量
    const users = checkins.map((c) => ({
      user_id: c.user_id,
      display_id: c.display_id || '?',
      name: c.name || '参与者',
      tags: c.local_tags || [],
    }));

    // 计算所有用户对的 Jaccard 相似度
    const pairs: Array<{ a: number; b: number; score: number; common: string[] }> = [];
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const common = users[i].tags.filter((t) => users[j].tags.includes(t));
        const union = new Set([...users[i].tags, ...users[j].tags]);
        const score = union.size > 0 ? common.length / union.size : 0;
        pairs.push({ a: i, b: j, score, common });
      }
    }

    // 按相似度降序排序
    pairs.sort((x, y) => y.score - x.score);

    // 贪心配对：每人只匹配一次
    const matched = new Set<number>();
    const results: MatchResult[] = [];

    for (const pair of pairs) {
      if (matched.has(pair.a) || matched.has(pair.b)) continue;
      if (pair.score < 0.1) continue; // 相似度太低不配对

      matched.add(pair.a);
      matched.add(pair.b);

      const result: MatchResult = {
        user_a: users[pair.a],
        user_b: users[pair.b],
        common_tags: pair.common,
        score: Math.round(pair.score * 100),
      };

      // 持久化
      const entity = this.matchRepo.create({
        event_id: eventId,
        user_a_id: result.user_a.user_id,
        user_b_id: result.user_b.user_id,
        similarity_score: pair.score,
        common_tags: pair.common,
        status: MatchStatus.PENDING,
      });
      await this.matchRepo.save(entity);

      results.push(result);
    }

    this.logger.log(`Generated ${results.length} match pairs for event ${eventId}`);

    // 发射事件：Gateway 监听后广播给大屏和手机端
    this.emitter.emit(APP_EVENTS.MATCH_GENERATED, {
      event_id: eventId,
      pairs: results,
      total: results.length,
    });

    return results;
  }

  /**
   * 获取某场活动的所有匹配对
   */
  async getMatches(eventId: string): Promise<MatchPair[]> {
    return this.matchRepo.find({
      where: { event_id: eventId },
      order: { similarity_score: 'DESC' },
    });
  }

  /**
   * 通过 matchId + userId 校验用户是否属于该匹配
   * - 用于 WebSocket 加入 match 房间前的鉴权（仅匹配的双方能加入）
   * - 返回 MatchPair（存在即合法）或 null
   */
  async getMatchesByUser(
    matchId: string,
    userId: string,
  ): Promise<MatchPair | null> {
    if (!matchId || !userId) return null;
    const pair = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!pair) return null;
    if (pair.user_a_id !== userId && pair.user_b_id !== userId) return null;
    return pair;
  }

  /**
   * 接受匹配（双向同意交换名片）
   * - 单方点击 → HALF_ACCEPTED，等待对方确认
   * - 双方都点击 → ACCEPTED，广播 MATCH_ACCEPTED
   */
  async acceptMatch(eventId: string, userId: string): Promise<{ status: 'half' | 'matched'; pair: MatchPair }> {
    // 查找该用户参与的 PENDING 或 HALF_ACCEPTED 配对
    const pair = await this.matchRepo.findOne({
      where: [
        { event_id: eventId, user_a_id: userId, status: MatchStatus.PENDING },
        { event_id: eventId, user_b_id: userId, status: MatchStatus.PENDING },
        { event_id: eventId, user_a_id: userId, status: MatchStatus.HALF_ACCEPTED },
        { event_id: eventId, user_b_id: userId, status: MatchStatus.HALF_ACCEPTED },
      ],
    });

    if (!pair) {
      throw new NotFoundException('No pending match found for this user');
    }

    if (pair.status === MatchStatus.HALF_ACCEPTED) {
      // 对方已同意，我方也同意 → 双向确认
      if (pair.accepted_by === userId) {
        throw new ConflictException('You have already accepted this match');
      }
      pair.status = MatchStatus.ACCEPTED;
      await this.matchRepo.save(pair);

      this.emitter.emit(APP_EVENTS.MATCH_ACCEPTED, {
        event_id: eventId,
        pair,
      });
      return { status: 'matched', pair };
    }

    // PENDING → 单方同意，进入 HALF_ACCEPTED
    pair.status = MatchStatus.HALF_ACCEPTED;
    pair.accepted_by = userId;
    await this.matchRepo.save(pair);
    return { status: 'half', pair };
  }

  /**
   * 拒绝匹配
   * - PENDING / HALF_ACCEPTED 均可拒绝
   * - 一方拒绝则整个配对视为 REJECTED
   */
  async rejectMatch(eventId: string, userId: string): Promise<void> {
    const pair = await this.matchRepo.findOne({
      where: [
        { event_id: eventId, user_a_id: userId, status: MatchStatus.PENDING },
        { event_id: eventId, user_b_id: userId, status: MatchStatus.PENDING },
        { event_id: eventId, user_a_id: userId, status: MatchStatus.HALF_ACCEPTED },
        { event_id: eventId, user_b_id: userId, status: MatchStatus.HALF_ACCEPTED },
      ],
    });

    if (pair) {
      pair.status = MatchStatus.REJECTED;
      await this.matchRepo.save(pair);

      this.emitter.emit(APP_EVENTS.MATCH_REJECTED, {
        event_id: eventId,
        pair,
      });
    }
  }
}