import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('global_users')
export class GlobalUser {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  wechat_openid: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ type: 'simple-json', nullable: true })
  global_tags: string[];

  @Column({ default: 0 })
  event_participated_count: number;

  @Column({ default: 'user' })
  role: string; // 'user' | 'host'

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
