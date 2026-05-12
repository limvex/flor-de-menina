import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReviewStatus } from '@flor/database';

export class ModerateReviewDto {
  @IsIn([ReviewStatus.APPROVED, ReviewStatus.REJECTED])
  status!: ReviewStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rejectionReason?: string;
}
