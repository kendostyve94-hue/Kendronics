import { Body, Controller, Get, NotFoundException, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  presign(@CurrentUser() user: AuthenticatedUser, @Body() dto: PresignUploadDto) {
    return this.uploadsService.createPresignedUpload(user.id, dto);
  }

  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmUploadDto) {
    return this.uploadsService.confirmDirectStorageUpload(user.id, dto.uploadId);
  }

  @Post('direct')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadDirect(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile()
    file?: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    return this.uploadsService.uploadFileThroughApi(user.id, file);
  }

  @Get(':uploadId/analysis')
  async analysis(@CurrentUser() user: AuthenticatedUser, @Param('uploadId') uploadId: string) {
    const analysis = await this.uploadsService.getAnalysis(user.id, uploadId);
    if (!analysis) {
      throw new NotFoundException('Gerber analysis not found for this upload.');
    }

    return analysis;
  }
}
