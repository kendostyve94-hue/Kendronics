import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { GerberParserService } from './gerber-parser.service';
import { UploadRepository } from './repositories/upload.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UploadsController],
  providers: [UploadsService, UploadRepository, GerberParserService],
  exports: [UploadsService],
})
export class UploadsModule {}
