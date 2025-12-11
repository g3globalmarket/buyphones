import {
  IsString,
  IsEmail,
  IsOptional,
  IsMongoId,
  IsBoolean,
  IsArray,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { NoBase64PhotoUrls } from './validators/no-base64-photo-urls.validator';

export class CreateBuyRequestDto {
  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsEmail()
  customerEmail: string;

  @IsMongoId()
  modelPriceId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsString({
    message: 'IMEI/시리얼 번호는 문자열이어야 합니다.',
  })
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'IMEI/시리얼 번호는 영문자와 숫자만 사용할 수 있습니다.',
  })
  imeiSerial?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  hasReceipt?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @NoBase64PhotoUrls({
    message:
      '사진은 파일 업로드를 통해 전송해주세요. (base64 데이터 URL은 지원하지 않습니다.)',
  })
  photoUrls?: string[];
}
