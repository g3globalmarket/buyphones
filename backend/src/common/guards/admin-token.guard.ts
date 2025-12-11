import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Legacy admin authentication guard using X-Admin-Token header
 * TODO: deprecated, will be removed after admin JWT login is rolled out
 * For now, kept for backward compatibility
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Headers are lowercased by Express/NestJS, but check both cases for safety
    const headerToken =
      request.headers['x-admin-token'] || request.headers['X-Admin-Token'];
    const expected = process.env.ADMIN_TOKEN;

    const isProd = process.env.NODE_ENV === 'production';

    // Trim both values to handle any whitespace issues
    const trimmedHeader = headerToken ? String(headerToken).trim() : null;
    const trimmedExpected = expected ? String(expected).trim() : null;

    if (!trimmedExpected) {
      if (!isProd) {
        console.warn('[AdminTokenGuard] ADMIN_TOKEN is not set');
      }
      throw new UnauthorizedException('Admin token is not configured');
    }

    if (!trimmedHeader) {
      throw new UnauthorizedException('Invalid admin token');
    }

    if (trimmedHeader !== trimmedExpected) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}
