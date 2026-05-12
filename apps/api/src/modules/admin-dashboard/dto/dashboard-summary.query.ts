import { IsEnum, IsString, Matches, ValidateIf } from 'class-validator';

export enum DashboardPreset {
  TODAY = 'today',
  SEVEN_D = '7d',
  THIRTY_D = '30d',
  CUSTOM = 'custom',
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export class DashboardSummaryQuery {
  @IsEnum(DashboardPreset)
  preset!: DashboardPreset;

  @ValidateIf((q) => q.preset === DashboardPreset.CUSTOM)
  @IsString()
  @Matches(YMD, { message: 'from deve ser YYYY-MM-DD' })
  from?: string;

  @ValidateIf((q) => q.preset === DashboardPreset.CUSTOM)
  @IsString()
  @Matches(YMD, { message: 'to deve ser YYYY-MM-DD' })
  to?: string;
}
