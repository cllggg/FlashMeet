import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * 请求追踪中间件
 *
 * - 优先采用上游 header（便于跨服务串联）
 * - 缺失则生成 UUID v4
 * - 回写到响应头，方便客户端排障
 * - 挂到 req.requestId 供控制器/服务使用
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming =
      (req.headers[REQUEST_ID_HEADER] as string | undefined)?.trim() || '';
    const requestId = incoming.length > 0 && incoming.length <= 128
      ? incoming
      : uuidv4();
    (req as any).requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
