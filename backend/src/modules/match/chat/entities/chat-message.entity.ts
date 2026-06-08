import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MatchPair } from '../../entities/match-pair.entity';

@Entity('blind_chat_messages')
export class BlindChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  match_id: string;

  @ManyToOne(() => MatchPair)
  @JoinColumn({ name: 'match_id' })
  match: MatchPair;

  @Column()
  sender_id: string;

  @Column()
  content: string;

  @Column({ default: false })
  is_system: boolean;

  @CreateDateColumn()
  created_at: Date;
}