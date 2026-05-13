import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { HomeContentService } from './home-content.service';
import { UpdateHomeContentDto } from './dto/update-home-content.dto';

@Controller('home-content')
export class HomeContentController {
  constructor(private readonly service: HomeContentService) {}

  @Get()
  get() {
    return this.service.getContent();
  }

  @Put('admin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(@Body() dto: UpdateHomeContentDto) {
    return this.service.updateContent(dto);
  }

  @Post('admin/banner-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException({ error: 'INVALID_FORMAT' }),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadBannerImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException({ error: 'FILE_TOO_LARGE', maxMb: 5 });
    }
    return this.service.uploadBannerImage(file.buffer, file.mimetype);
  }
}
