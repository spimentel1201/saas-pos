import { Module } from '@nestjs/common';
import { StorageUseCases } from './application/use-cases/storage.use-case.js';
import { StorageController } from './infrastructure/http/storage.controller.js';
import { CloudinaryStorageRepository } from './infrastructure/repositories/cloudinary-storage.repository.js';
import { STORAGE_REPOSITORY } from './storage.tokens.js';

@Module({
  controllers: [StorageController],
  providers: [
    StorageUseCases,
    {
      provide: STORAGE_REPOSITORY,
      useClass: CloudinaryStorageRepository,
    },
  ],
  exports: [StorageUseCases],
})
export class StorageModule {}
