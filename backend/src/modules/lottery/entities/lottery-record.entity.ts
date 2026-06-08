import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GlobalUser } from '../../global-user/entities/global-user.entity';
import { Event } from '../../event/entities/event.entity';
import { LotteryPool } from './lottery-pool.entity';

@Entity('lottery_records')
export class LotteryRecord {
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

  @Column()
  pool_id: string;

  @ManyToOne(() => LotteryPool)
  @JoinColumn({ name: 'pool_id' })
  pool: LotteryPool;

  @Column()
  prize_name: string;

  @Column({ nullable: true })
  prize_image_url: string;

  @Column({ type: 'int', default: 0 })
  prize_value: number;

  @CreateDateColumn()
  won_at: Date;
}
