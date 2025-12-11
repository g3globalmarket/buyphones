import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ModelPricesModule } from './model-prices/model-prices.module';
import { BuyRequestsModule } from './buy-requests/buy-requests.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { HealthModule } from './health/health.module';
import { FilesModule } from './files/files.module';
import { AdminUsersModule } from './admin-users/admin-users.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/electronics-buy',
    ),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: (Number(process.env.THROTTLE_TTL) || 60) * 1000, // Time window in milliseconds
          limit: Number(process.env.THROTTLE_LIMIT) || 20, // Default max requests per window per IP
        },
      ],
    }),
    ModelPricesModule,
    BuyRequestsModule,
    UsersModule,
    AuthModule,
    MeModule,
    HealthModule,
    FilesModule,
    AdminUsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
