import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { BALANCE_QUQUE } from './balance.constants';
import { BalanceController } from './balance.controller';
import { BalanceProcessor } from './balance.processor';
import { BalanceRepository } from './repositories/balance.repository';
import { BalanceCronService, BalanceQueueService } from './services';
import { BalanceService } from './services/balance.service';

@Module({
  imports: [BullModule.registerQueue({ name: BALANCE_QUQUE })],
  controllers: [BalanceController],
  providers: [
    BalanceService,
    BalanceQueueService,
    BalanceCronService,
    BalanceProcessor,
    BalanceRepository,
  ],
})
export class BalanceModule {}
