import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BuyRequestStatus } from '../schemas/buy-request.schema';

export class ListBuyRequestsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'paid', 'cancelled'], {
    message:
      'status must be one of: pending, approved, rejected, paid, cancelled',
  })
  status?: BuyRequestStatus;
}
