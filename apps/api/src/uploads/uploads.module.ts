import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { R2Service } from './r2.service';
import { ImageProcessorService } from './image-processor.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, R2Service, ImageProcessorService],
  exports: [R2Service, ImageProcessorService],
})
export class UploadsModule {}
