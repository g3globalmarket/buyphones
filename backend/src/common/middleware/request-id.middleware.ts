import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = randomBytes(16).toString('hex');
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
