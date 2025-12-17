import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { AdminJwtPayload } from '../../auth/strategies/admin-jwt.strategy';

/**
 * Combined admin authentication guard that accepts both:
 * 1. JWT token from Authorization: Bearer <token> (new method)
 * 2. Legacy X-Admin-Token header (backward compatibility)
 *
 * Tries JWT first, then falls back to legacy token if JWT is not present or invalid.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Try JWT authentication first (Authorization: Bearer <token>)
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (bearerToken && bearerToken !== authHeader) {
        // We have a Bearer token, try to validate it
        try {
          const secret = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
          const payload = this.jwtService.verify<AdminJwtPayload>(bearerToken, {
            secret,
          });

          // Verify this is an admin token (not a user token)
          if (payload.type !== 'admin') {
            throw new UnauthorizedException('Invalid token type');
          }

          // Verify admin user still exists
          const adminUser = await this.adminUsersService.findById(payload.sub);
          if (!adminUser) {
            throw new UnauthorizedException('Admin user not found');
          }

          // Set user info in request for compatibility with RolesGuard and other guards
          request.user = {
            id: adminUser._id.toString(),
            email: adminUser.email,
            role: adminUser.role,
            name: adminUser.name,
          };

          return true;
        } catch (error) {
          // JWT validation failed, fall through to legacy token check
          // Don't throw here, let it fall back to legacy token
        }
      }
    }

    // Fall back to legacy token authentication (X-Admin-Token)
    const headerToken =
      request.headers['x-admin-token'] || request.headers['X-Admin-Token'];
    const expected = process.env.ADMIN_TOKEN;

    const isProd = process.env.NODE_ENV === 'production';

    // Trim both values to handle any whitespace issues
    const trimmedHeader = headerToken ? String(headerToken).trim() : null;
    const trimmedExpected = expected ? String(expected).trim() : null;

    if (!trimmedExpected) {
      if (!isProd) {
        console.warn('[AdminAuthGuard] ADMIN_TOKEN is not set');
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

