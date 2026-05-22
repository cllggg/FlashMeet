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

  @CreateDateColumn()
  checked_in_at: Date;
}
