import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from '../../event/entities/event.entity';

export enum MatchStatus {
  PENDING = 'pending',
  /** 单方已同意，等待对方确认 */
  HALF_ACCEPTED = 'half_accepted',
  /** 双向同意，已交换名片 */
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('match_pairs')
export class MatchPair {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event_id: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  user_a_id: string;

  @Column()
  user_b_id: string;

  @Column({ type: 'float', default: 0 })
  similarity_score: number;

  @Column({ type: 'simple-json', nullable: true })
  common_tags: string[];

  @Column({ type: 'varchar', default: MatchStatus.PENDING })
  status: MatchStatus;

  /**
   * 先点击同意的用户 ID
   * - PENDING / REJECTED: null
   * - HALF_ACCEPTED: 先同意方的 user_id
   * - ACCEPTED: 先同意方的 user_id（保留追溯）
   */
  @Column({ nullable: true })
  accepted_by: string;

  @CreateDateColumn()
  created_at: Date;
}