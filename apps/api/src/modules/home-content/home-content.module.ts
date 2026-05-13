import { Module } from '@nestjs/common';
import { HomeContentController } from './home-content.controller';
import { HomeContentService } from './home-content.service';
import { UploadsModule } from '../../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [HomeContentController],
  providers: [HomeContentService],
})
export class HomeContentModule {}
