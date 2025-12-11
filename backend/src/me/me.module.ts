import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { BuyRequestsModule } from '../buy-requests/buy-requests.module';

@Module({
  imports: [BuyRequestsModule],
  controllers: [MeController],
})
export class MeModule {}
