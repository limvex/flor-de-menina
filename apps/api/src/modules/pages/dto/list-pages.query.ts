import { IsOptional, IsString, Matches } from 'class-validator';

export class ListPagesQuery {
  @IsOptional()
  @IsString()
  search?: string;

  /** Ex.: `title:asc`, `updatedAt:desc`, `sortOrder:asc` */
  @IsOptional()
  @IsString()
  @Matches(/^(title|slug|sortOrder|updatedAt):(asc|desc)$/, {
    message: 'sort deve ser no formato campo:asc ou campo:desc',
  })
  sort?: string;
}
