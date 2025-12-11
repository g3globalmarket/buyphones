import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginCode, LoginCodeDocument } from './schemas/login-code.schema';
import { RequestCodeDto } from './dto/request-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new AppLoggerService(AuthService.name);
  private readonly CODE_SECRET =
    process.env.CODE_SECRET || 'default-secret-change-in-production';
  private readonly CODE_EXPIRY_MINUTES = 10;
  private readonly REQUEST_CODE_COOLDOWN_SECONDS = process.env
    .AUTH_REQUEST_CODE_COOLDOWN_SECONDS
    ? parseInt(process.env.AUTH_REQUEST_CODE_COOLDOWN_SECONDS, 10)
    : 60;

  constructor(
    @InjectModel(LoginCode.name)
    private loginCodeModel: Model<LoginCodeDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private hashCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code + this.CODE_SECRET)
      .digest('hex');
  }

  private generateCode(): string {
    // Generate 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestCode(dto: RequestCodeDto): Promise<{ ok: boolean }> {
    const email = dto.email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Check cooldown: prevent requesting a new code too frequently
    const now = new Date();
    const cooldownThreshold = new Date(
      now.getTime() - this.REQUEST_CODE_COOLDOWN_SECONDS * 1000,
    );

    const recentCode = await this.loginCodeModel
      .findOne({ email })
      .sort({ createdAt: -1 })
      .exec();

    if (recentCode) {
      // createdAt is added by Mongoose timestamps, cast to access it
      const createdAt = (recentCode as any).createdAt as Date;
      if (createdAt && createdAt > cooldownThreshold) {
        const secondsRemaining = Math.ceil(
          (createdAt.getTime() +
            this.REQUEST_CODE_COOLDOWN_SECONDS * 1000 -
            now.getTime()) /
            1000,
        );
        throw new HttpException(
          `You can request a new login code after ${secondsRemaining} seconds.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Find or create user
    await this.usersService.findOrCreateByEmail(email);

    // Generate code
    const code = this.generateCode();
    const codeHash = this.hashCode(code);

    // Create login code document
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

    await this.loginCodeModel.create({
      email,
      codeHash,
      expiresAt,
      used: false,
    });

    // Send login code via email (or log to console if EMAIL_MODE=console)
    await this.emailService.sendLoginCodeEmail(email, code);

    this.logger.logWithReq(
      { requestId: 'system' },
      `Login code requested for ${email}`,
    );

    return { ok: true };
  }

  async verifyCode(dto: VerifyCodeDto): Promise<{
    accessToken: string;
    user: { id: string; email: string };
  }> {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code;
    const codeHash = this.hashCode(code);

    // Find valid, unused code
    const loginCode = await this.loginCodeModel
      .findOne({
        email,
        codeHash,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!loginCode) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    // Mark code as used
    loginCode.used = true;
    await loginCode.save();

    // Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate JWT
    const payload = { sub: user._id.toString(), email: user.email };
    const accessToken = this.jwtService.sign(payload);

    this.logger.logWithReq(
      { requestId: 'system' },
      `Login code verified successfully for ${email}`,
    );

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    };
  }
}
