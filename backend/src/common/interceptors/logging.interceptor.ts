import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

/**
 * 结构化访问日志拦截器
 *
 * 记录：方法 + URL + 状态码 + 耗时 + 请求 ID
 * 慢请求（> 500ms）单独打 warn 级别
 * 错误请求（>= 500）打 error
 *
 * 监听 res 'finish' 事件，确保读到的是最终状态码
 * （ExceptionFilter 会在 res.end 之前修改 statusCode）
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = Date.now();
    const reqId = (req as any).requestId || '-';

    res.once('finish', () => {
      const ms = Date.now() - start;
      const status = res.statusCode;
      const line = `${req.method} ${req.originalUrl || req.url} ${status} ${ms}ms rid=${reqId}`;
      if (status >= 500) {
        this.logger.error(line);
      } else if (status >= 400 || ms > 500) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    });

    return next.handle().pipe(
      tap({ error: () => undefined }),
    );
  }
}
