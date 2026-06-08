import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { GlobalUser } from '../../global-user/entities/global-user.entity';
import { Event } from '../../event/entities/event.entity';

@Entity('check_ins')
@Unique(['event_id', 'user_id'])
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event_id: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  user_id: string;

  @ManyToOne(() => GlobalUser)
  @JoinColumn({ name: 'user_id' })
  user: GlobalUser;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'simple-json', nullable: true })
  local_tags: string[];

  @Column({ default: false })
  is_invisible: boolean;

  /**
   * 大屏可读的短标识
   * - 形式：{name}#{4位数字}，如 "阿明#7392"
   * - 在同一 event_id 内唯一
   * - 用于大屏 CheckinScene 把暗星定位到具体小圆点
   * - 也作为用户端"我被点亮在屏幕哪个位置"的身份锚点
   */
  @Column({ length: 32, nullable: true })
  display_id: string;

  @CreateDateColumn()
  checked_in_at: Date;
}
