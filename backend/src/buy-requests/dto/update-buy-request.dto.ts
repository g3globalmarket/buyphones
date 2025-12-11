import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { BuyRequestStatus } from '../schemas/buy-request.schema';

export class UpdateBuyRequestDto {
  @IsEnum(['pending', 'approved', 'rejected', 'paid', 'cancelled'])
  @IsOptional()
  status?: BuyRequestStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsNumber()
  @IsOptional()
  finalPrice?: number;
}
