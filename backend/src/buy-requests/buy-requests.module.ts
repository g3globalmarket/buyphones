import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BuyRequestsService } from './buy-requests.service';
import { BuyRequestsController } from './buy-requests.controller';
import { BuyRequest, BuyRequestSchema } from './schemas/buy-request.schema';
import { ModelPricesModule } from '../model-prices/model-prices.module';
import { AdminUsersModule } from '../admin-users/admin-users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuyRequest.name, schema: BuyRequestSchema },
    ]),
    ModelPricesModule,
    AdminUsersModule, // Required for AdminAuthGuard (AdminUsersService)
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    }), // Required for AdminAuthGuard (JwtService)
  ],
  controllers: [BuyRequestsController],
  providers: [BuyRequestsService],
  exports: [BuyRequestsService],
})
export class BuyRequestsModule {}
