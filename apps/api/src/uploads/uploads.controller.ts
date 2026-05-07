import {
  Controller,
  Post,
  Delete,
  Param,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadsService } from './uploads.service';
import { UserRole } from '@flor/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('product-image/:productId')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Tipo de arquivo não suportado'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadProductImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.uploadsService.uploadProductImage(productId, file.buffer);
  }

  @Delete('product-image/:imageId')
  async deleteProductImage(@Param('imageId') imageId: string) {
    await this.uploadsService.deleteProductImage(imageId);
    return { ok: true };
  }

  @Put('product-image/:productId/reorder')
  async reorderImages(
    @Param('productId') productId: string,
    @Body() body: { imageIds: string[] },
  ) {
    await this.uploadsService.reorderImages(productId, body.imageIds);
    return { ok: true };
  }
}
