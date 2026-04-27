import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UploadRepository } from './repositories/upload.repository';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, UploadRepository],
  exports: [UploadsService],
})
export class UploadsModule {}
