import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BuyRequestsService } from './buy-requests.service';
import { BuyRequestsController } from './buy-requests.controller';
import { BuyRequest, BuyRequestSchema } from './schemas/buy-request.schema';
import { ModelPricesModule } from '../model-prices/model-prices.module';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuyRequest.name, schema: BuyRequestSchema },
    ]),
    ModelPricesModule,
    AdminUsersModule, // Required for AdminJwtAuthGuard (AdminUsersService)
    AuthModule, // Provides shared JwtModule for AdminJwtAuthGuard
  ],
  controllers: [BuyRequestsController],
  providers: [BuyRequestsService],
  exports: [BuyRequestsService],
})
export class BuyRequestsModule {}
