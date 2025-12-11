import { IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsString({ message: '아이디를 입력해주세요.' })
  email: string; // This now holds "login ID" (아이디), not necessarily a real email

  @IsString({ message: '비밀번호를 입력해주세요.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;
}
