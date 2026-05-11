import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Senha deve ter pelo menos 1 letra e 1 número',
  })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
