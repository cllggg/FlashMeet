import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Event } from '../../event/entities/event.entity';

/**
 * 单个破冰问题的预设选项
 * tag: 选中后写入用户 local_tags 的标签
 * color: 大屏"暗星"点亮后的星体颜色
 */
export interface IcebreakerOption {
  key: string; // 选项标识
  label: string; // 显示文本
  tag: string; // 写入 user.local_tags 的标签
  color: string; // 大屏暗星颜色（hex）
}

/**
 * 破冰问题
 * 主持人配置后，状态机切到 ICEBREAKER 时下发到用户端。
 * 用户点击选项 → 大屏对应暗星立即被点亮专属颜色。
 */
@Entity('icebreaker_questions')
export class IcebreakerQuestion {
  @PrimaryGeneratedColumn('uuid')
  question_id: string;

  @Index()
  @Column()
  event_id: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  prompt: string; // 问题正文："你是 I 人还是 E 人？"

  @Column({ type: 'simple-json' })
  options: IcebreakerOption[];

  @Column({ default: 0 })
  display_order: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
