import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { BlindChatMessage } from './entities/chat-message.entity';
import { MatchPair, MatchStatus } from '../entities/match-pair.entity';
import { APP_EVENTS } from '../../../common/constants/app-events';

/**
 * 双盲破冰聊天服务
 *
 * 设计文档 2.4：
 * 在 CP 盲盒匹配后，配对双方可匿名聊天。
 * 系统预设破冰语引导对话，双向同意后交换名片。
 */

const ICEBREAKER_PROMPTS = [
  '你好！我们的标签好像很相似，共同标签有{tags}，你觉得最准的是哪个？',
  '哈喽！系统说我们很合拍，你平时最喜欢做什么？',
  'Hi~ 看到你的标签里有{tags}，我也是！你是做什么的？',
  '你好呀！没想到在这里遇到同好，{tags}这个领域你也喜欢？',
  '缘分！我们居然有{tags}这几个共同标签，最近有在关注什么吗？',
  'Hey！猜猜我们为什么被匹配到一起？提示：{tags}',
];

@Injectable()
export class BlindChatService {
  private readonly logger = new Logger(BlindChatService.name);

  constructor(
    @InjectRepository(BlindChatMessage)
    private readonly chatRepo: Repository<BlindChatMessage>,
    @InjectRepository(MatchPair)
    private readonly matchRepo: Repository<MatchPair>,
    private readonly emitter: EventEmitter2,
  ) {}

  /**
   * 监听匹配接受事件，自动发送破冰提示
   */
  @OnEvent(APP_EVENTS.MATCH_ACCEPTED, { async: true })
  async onMatchAccepted(payload: { event_id: string; pair: MatchPair }) {
    const pair = payload.pair;
    if (!pair) return;
    const tags = pair.common_tags || [];
    await this.sendIcebreakerPrompt(pair.id, tags);
  }

  /**
   * 获取配对双方的聊天记录
   */
  async getMessages(matchId: string): Promise<BlindChatMessage[]> {
    return this.chatRepo.find({
      where: { match_id: matchId },
      order: { created_at: 'ASC' },
    });
  }

  /**
   * 发送盲聊消息
   */
  async sendMessage(
    matchId: string,
    senderId: string,
    content: string,
  ): Promise<BlindChatMessage> {
    const pair = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!pair || pair.status !== MatchStatus.ACCEPTED) {
      throw new Error('Match not accepted');
    }

    const msg = this.chatRepo.create({
      match_id: matchId,
      sender_id: senderId,
      content,
      is_system: false,
    });
    await this.chatRepo.save(msg);

    this.emitter.emit(APP_EVENTS.MATCH_BLIND_CHAT, {
      match_id: matchId,
      message: msg,
    });

    return msg;
  }

  /**
   * 发送系统预设破冰语
   */
  async sendIcebreakerPrompt(matchId: string, commonTags: string[]): Promise<BlindChatMessage> {
    const template = ICEBREAKER_PROMPTS[Math.floor(Math.random() * ICEBREAKER_PROMPTS.length)];
    const tagStr = commonTags.slice(0, 3).join('、');
    const content = template.replace('{tags}', tagStr || '共同兴趣');

    const msg = this.chatRepo.create({
      match_id: matchId,
      sender_id: 'system',
      content,
      is_system: true,
    });
    await this.chatRepo.save(msg);
    return msg;
  }
}