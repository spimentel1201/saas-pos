import { Module } from '@nestjs/common';
import { CodeUseCases } from './application/use-cases/code.use-case.js';
import { CODE_REPOSITORY } from './codes.tokens.js';
import { CodeController } from './infrastructure/http/code.controller.js';
import { BwipJsCodeRepository } from './infrastructure/repositories/bwipjs-code.repository.js';

@Module({
  controllers: [CodeController],
  providers: [
    CodeUseCases,
    {
      provide: CODE_REPOSITORY,
      useClass: BwipJsCodeRepository,
    },
  ],
  exports: [CodeUseCases],
})
export class CodesModule {}
