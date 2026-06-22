import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ExplorerController } from './explorer.controller';
import { ExplorerService } from './explorer.service';
import { ProjectMediaProcessingWorker } from './project-media-processing.worker';

@Module({
  imports: [PrismaModule, AuthModule, UploadsModule],
  controllers: [ExplorerController],
  providers: [ExplorerService, ProjectMediaProcessingWorker],
})
export class ExplorerModule {}
