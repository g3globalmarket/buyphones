import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminAuthController } from './admin-auth.controller';
import { UsersModule } from '../users/users.module';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { EmailModule } from '../common/email/email.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { LoginCode, LoginCodeSchema } from './schemas/login-code.schema';

@Module({
  imports: [
    UsersModule,
    AdminUsersModule,
    EmailModule,
    PassportModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any, // Token valid for 1 hour
      },
    }),
    MongooseModule.forFeature([
      { name: LoginCode.name, schema: LoginCodeSchema },
    ]),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, JwtStrategy, AdminJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
