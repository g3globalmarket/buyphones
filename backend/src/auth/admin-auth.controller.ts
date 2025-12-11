import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';

@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new AppLoggerService(AdminAuthController.name);

  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    const email = dto.email.trim().toLowerCase();

    // Find admin user
    const adminUser = await this.adminUsersService.findByEmail(email);
    if (!adminUser) {
      this.logger.warnWithReq(
        { requestId: 'system' },
        `Admin login attempt with non-existent email: ${email}`,
      );
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // Verify password
    const isPasswordValid = await this.adminUsersService.verifyPassword(
      adminUser,
      dto.password,
    );
    if (!isPasswordValid) {
      this.logger.warnWithReq(
        { requestId: 'system' },
        `Admin login attempt with invalid password for: ${email}`,
      );
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // Generate JWT with admin payload
    const payload = {
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role,
      type: 'admin', // Distinguish from user tokens
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.logWithReq(
      { requestId: 'system' },
      `Admin logged in successfully: ${email} (role: ${adminUser.role})`,
    );

    return {
      accessToken,
      admin: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
      },
    };
  }
}
