import {
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

function trimOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export class UpdateHomeContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  bannerImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  bannerTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  bannerSubtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  bannerButtonText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  bannerButtonUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  aboutTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  aboutText?: string | null;

  @IsOptional()
  @Matches(/^\d{10,15}$/, {
    message: 'whatsappNumber deve conter entre 10 e 15 dígitos',
  })
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  whatsappNumber?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'instagramUrl deve ser uma URL válida' })
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  instagramUrl?: string | null;
}
