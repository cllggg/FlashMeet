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

  /**
   * 设备级稳定身份（前端生成的 UUID，永久不变）
   * - 扫码匿名签到的用户，通过 X-Device-Token 关联
   * - 用于"再次扫码直接进入" 的召回机制
   * - 与 wechat_openid 解耦：真实微信用户可同时绑定自己的设备
   */
  @Column({ nullable: true, unique: true })
  device_id: string;

  /**
   * 服务端签发的稳定身份 Token
   * - 签到时由服务端生成（48 字节 base64url），写入 user 行
   * - 每次签到/查询响应均回传，前端持久化到 localStorage
   * - 优先级：user_token > device_id > wechat_openid > phone
   * - 即便 localStorage 全部清空，只要客户端仍持有 user_token 就能召回
   * - 同一 user 的 user_token 永不变更（不轮换，方便追溯）
   */
  @Column({ nullable: true, unique: true, length: 80 })
  user_token: string;

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
