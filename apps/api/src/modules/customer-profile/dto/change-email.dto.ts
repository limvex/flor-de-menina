import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  newEmail: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  currentPassword?: string;
}
