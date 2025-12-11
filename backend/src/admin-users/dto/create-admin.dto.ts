import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { AdminRole } from '../schemas/admin-user.schema';

export class CreateAdminDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;

  @IsEnum(['super_admin', 'admin'], {
    message: '역할은 super_admin 또는 admin이어야 합니다.',
  })
  role: AdminRole;

  @IsOptional()
  @IsString()
  name?: string;
}
