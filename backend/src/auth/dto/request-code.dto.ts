import { IsEmail, IsString } from 'class-validator';

export class RequestCodeDto {
  @IsEmail()
  @IsString()
  email: string;
}
