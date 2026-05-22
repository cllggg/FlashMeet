import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GlobalUser } from '../../global-user/entities/global-user.entity';
import { EventStatus } from '../../../common/enums/event-status.enum';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  event_id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  host_id: string;

  @ManyToOne(() => GlobalUser)
  @JoinColumn({ name: 'host_id' })
  host: GlobalUser;

  @Column({ type: 'simple-json', nullable: true })
  co_host_ids: string[];

  @Column({ type: 'simple-json', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'varchar', default: EventStatus.STANDBY })
  current_state: EventStatus;

  @Column({ default: false })
  is_published: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'datetime', nullable: true })
  scheduled_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
