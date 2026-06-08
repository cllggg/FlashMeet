import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Event } from '../../event/entities/event.entity';
import { IcebreakerQuestion } from './icebreaker-question.entity';
import { GlobalUser } from '../../global-user/entities/global-user.entity';

/**
 * 用户的破冰作答记录
 * 联合主键 (event_id, user_id, question_id) 保证幂等
 */
@Entity('icebreaker_answers')
@Index(['event_id', 'user_id', 'question_id'], { unique: true })
export class IcebreakerAnswer {
  @PrimaryColumn('uuid')
  id: string; // 用 uuid 字段但本质由 service 拼装 (event|user|question)

  @Index()
  @Column()
  event_id: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Index()
  @Column()
  user_id: string;

  @ManyToOne(() => GlobalUser)
  @JoinColumn({ name: 'user_id' })
  user: GlobalUser;

  @Column()
  question_id: string;

  @ManyToOne(() => IcebreakerQuestion)
  @JoinColumn({ name: 'question_id' })
  question: IcebreakerQuestion;

  @Column()
  option_key: string; // 选中的选项 key

  @Column()
  tag: string; // 选中的选项写入的标签（冗余便于查询）

  @Column()
  color: string; // 选中的颜色（冗余）

  @CreateDateColumn()
  answered_at: Date;
}
