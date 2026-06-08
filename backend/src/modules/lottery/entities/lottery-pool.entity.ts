import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from '../../event/entities/event.entity';

@Entity('lottery_pools')
export class LotteryPool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event_id: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  name: string;

  @Column({ type: 'simple-json' })
  prizes: PrizeItem[];

  @Column({ default: false })
  is_completed: boolean;

  @CreateDateColumn()
  created_at: Date;
}

export interface PrizeItem {
  id: string;
  name: string;
  total_count: number;
  remaining_count: number;
  image_url?: string;
  /**
   * 奖品价值（用于前端分档：大奖/普通）
   *  - >= 100: 大奖（特殊动效）
   *  - 其余：普通
   */
  value?: number;
}
