import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { DeviceCategory } from '../schemas/model-price.schema';

export class CreateModelPriceDto {
  @IsEnum(['iphone', 'ps5', 'switch'])
  category: DeviceCategory;

  @IsString()
  modelCode: string;

  @IsString()
  modelName: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  storageGb?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @Min(0)
  buyPrice: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
