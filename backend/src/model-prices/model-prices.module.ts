import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelPricesService } from './model-prices.service';
import { ModelPricesController } from './model-prices.controller';
import { ModelPrice, ModelPriceSchema } from './schemas/model-price.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelPrice.name, schema: ModelPriceSchema },
    ]),
  ],
  controllers: [ModelPricesController],
  providers: [ModelPricesService],
  exports: [ModelPricesService],
})
export class ModelPricesModule {}
