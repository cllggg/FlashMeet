/**
 * 埋点接收服务
 *
 * 设计原则：
 *  - 异步、零阻塞：不写数据库（避免 hot path 卡住）
 *  - 简单聚合：FPS 与 latency 走滚动窗口（每 metric 保留最近 1000 条）
 *  - 错误上报写日志（warn/error 级），便于云端日志收集
 *  - 提供 /telemetry/summary 查询接口（仅本机/管理员可访问）
 *
 * 后续可替换为：Kafka / 阿里云 SLS / Prometheus push gateway
 */
import { Injectable, Logger } from '@nestjs/common';
import { TelemetryReportDto } from './dto/telemetry-report.dto';

interface RollingStat {
  samples: number[]; // 数值样本
  count: number;
  sum: number;
  min: number;
  max: number;
}

const RING_MAX = 1000;

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  // metric:event_id:role → 滚动统计
  private stats = new Map<string, RollingStat>();

  // 最近 200 条原始样本（按 metric 分类），供调试
  private recent: Array<{
    ts: number;
    metric: string;
    event_id?: string;
    role?: string;
    data: Record<string, any>;
  }> = [];

  /** 主入口：接收一条埋点 */
  report(dto: TelemetryReportDto): { ok: true; queued: number } {
    const ts = Date.now();
    this.pushRecent({
      ts,
      metric: dto.metric,
      event_id: dto.event_id,
      role: dto.role,
      data: dto.data,
    });

    if (dto.metric === 'fps' || dto.metric === 'latency') {
      const value = Number(dto.data?.value);
      if (Number.isFinite(value)) {
        this.addSample(dto.metric, dto.event_id, dto.role, value);
      }
    } else if (dto.metric === 'error') {
      // 错误必须落日志，便于云端收集
      this.logger.warn(
        `[telemetry/error] event=${dto.event_id} role=${dto.role} ` +
          `session=${dto.session_id} data=${JSON.stringify(dto.data)}`,
      );
    } else if (dto.metric === 'event') {
      this.logger.log(
        `[telemetry/event] ${dto.data?.name || 'unknown'} ` +
          `event=${dto.event_id} role=${dto.role}`,
      );
    }
    return { ok: true, queued: this.recent.length };
  }

  private addSample(
    metric: string,
    eventId?: string,
    role?: string,
    v: number = 0,
  ) {
    const k = `${metric}:${eventId || ''}:${role || ''}`;
    let s = this.stats.get(k);
    if (!s) {
      s = { samples: [], count: 0, sum: 0, min: Infinity, max: -Infinity };
      this.stats.set(k, s);
    }
    s.samples.push(v);
    s.count++;
    s.sum += v;
    if (v < s.min) s.min = v;
    if (v > s.max) s.max = v;
    if (s.samples.length > RING_MAX) {
      const drop = s.samples.shift()!;
      s.sum -= drop;
      s.count--;
    }
  }

  private pushRecent(entry: (typeof this.recent)[number]) {
    this.recent.push(entry);
    if (this.recent.length > 200) this.recent.shift();
  }

  /** 聚合查询（按 metric 给出 P50/P95/max/count） */
  summary() {
    const out: Array<{
      metric: string;
      event_id?: string;
      role?: string;
      count: number;
      avg: number;
      p50: number;
      p95: number;
      min: number;
      max: number;
    }> = [];
    for (const [k, s] of this.stats.entries()) {
      const [metric, event_id, role] = k.split(':');
      const sorted = [...s.samples].sort((a, b) => a - b);
      const p = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
      out.push({
        metric,
        event_id: event_id || undefined,
        role: role || undefined,
        count: s.count,
        avg: s.count ? +(s.sum / s.count).toFixed(2) : 0,
        p50: +p(0.5).toFixed(2),
        p95: +p(0.95).toFixed(2),
        min: s.min === Infinity ? 0 : s.min,
        max: s.max === -Infinity ? 0 : s.max,
      });
    }
    return out;
  }

  recentErrors(limit = 20) {
    return this.recent
      .filter((r) => r.metric === 'error')
      .slice(-limit)
      .reverse();
  }
}
