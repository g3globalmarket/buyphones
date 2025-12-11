import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminRole } from '../schemas/admin-user.schema';

export class UpdateAdminDto {
  @IsOptional()
  @IsEnum(['super_admin', 'admin'], {
    message: '역할은 super_admin 또는 admin이어야 합니다.',
  })
  role?: AdminRole;

  @IsOptional()
  @IsString()
  name?: string;
}
