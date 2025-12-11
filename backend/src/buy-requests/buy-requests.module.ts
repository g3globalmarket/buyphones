import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BuyRequestsService } from './buy-requests.service';
import { BuyRequestsController } from './buy-requests.controller';
import { BuyRequest, BuyRequestSchema } from './schemas/buy-request.schema';
import { ModelPricesModule } from '../model-prices/model-prices.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuyRequest.name, schema: BuyRequestSchema },
    ]),
    ModelPricesModule,
  ],
  controllers: [BuyRequestsController],
  providers: [BuyRequestsService],
  exports: [BuyRequestsService],
})
export class BuyRequestsModule {}
