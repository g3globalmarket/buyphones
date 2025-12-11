import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { AdminRole } from '../../admin-users/schemas/admin-user.schema';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  type: 'admin';
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  'admin-jwt', // Strategy name to distinguish from user JWT strategy
) {
  constructor(private adminUsersService: AdminUsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    });
  }

  async validate(payload: AdminJwtPayload) {
    // Verify this is an admin token (not a user token)
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Verify admin user still exists
    const adminUser = await this.adminUsersService.findById(payload.sub);
    if (!adminUser) {
      throw new UnauthorizedException('Admin user not found');
    }

    // Return admin info with role
    return {
      id: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role,
      name: adminUser.name,
    };
  }
}
