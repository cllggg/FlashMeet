/**
 * 性能/异常埋点接口
 *
 * 客户端（miniapp / screen）通过 POST /telemetry/report 上报：
 *  - metric:    'fps' | 'latency' | 'error' | 'event'
 *  - data:      { ... }   任意键值
 *  - event_id:  string?   关联的活动 ID
 *  - role:      'user' | 'host' | 'screen' | 'guest'
 *  - app_ver:   string?
 *  - client_ts: number    客户端时间戳（ms）
 *  - session_id:string    客户端会话 ID（首次启动生成）
 */
import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';

export class TelemetryReportDto {
  @IsString()
  @IsIn(['fps', 'latency', 'error', 'event'])
  metric!: 'fps' | 'latency' | 'error' | 'event';

  @IsObject()
  data!: Record<string, any>;

  @IsString()
  @IsOptional()
  event_id?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  app_ver?: string;

  @IsOptional()
  client_ts?: number;

  @IsString()
  @IsOptional()
  session_id?: string;
}
