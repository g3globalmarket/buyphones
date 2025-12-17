import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelPricesService } from './model-prices.service';
import { ModelPricesController } from './model-prices.controller';
import { ModelPrice, ModelPriceSchema } from './schemas/model-price.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelPrice.name, schema: ModelPriceSchema },
    ]),
    AuthModule, // Required for AdminJwtAuthGuard
  ],
  controllers: [ModelPricesController],
  providers: [ModelPricesService],
  exports: [ModelPricesService],
})
export class ModelPricesModule {}
