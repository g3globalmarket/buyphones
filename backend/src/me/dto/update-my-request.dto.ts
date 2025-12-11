import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ValidateBankInfoGroup } from '../validators/bank-info-group.validator';
import { ValidateShippingInfoGroup } from '../validators/shipping-info-group.validator';

export class UpdateMyRequestDto {
  @IsOptional()
  @IsString()
  @ValidateBankInfoGroup()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  bankHolder?: string;

  @IsOptional()
  @IsString()
  @ValidateShippingInfoGroup()
  shippingMethod?: string;

  @IsOptional()
  @IsString()
  shippingTrackingCode?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: '유효한 URL을 입력해주세요.' })
  shippingTrackingUrl?: string;
}
