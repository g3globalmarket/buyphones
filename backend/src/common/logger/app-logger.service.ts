import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AppLoggerService extends Logger {
  logWithReq(
    req: Request | { requestId?: string },
    message: string,
    context?: string,
  ) {
    const requestId = (req as any).requestId || 'unknown';
    this.log(`[reqId=${requestId}] ${message}`, context);
  }

  errorWithReq(
    req: Request | { requestId?: string },
    message: string,
    trace?: string,
    context?: string,
  ) {
    const requestId = (req as any).requestId || 'unknown';
    this.error(`[reqId=${requestId}] ${message}`, trace, context);
  }

  warnWithReq(
    req: Request | { requestId?: string },
    message: string,
    context?: string,
  ) {
    const requestId = (req as any).requestId || 'unknown';
    this.warn(`[reqId=${requestId}] ${message}`, context);
  }
}
