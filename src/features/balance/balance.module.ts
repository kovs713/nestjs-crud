import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { BALANCE_QUEUE } from './balance.constants';
import { BalanceController } from './balance.controller';
import { BalanceCronService } from './balance.cron.service';
import { BalanceProcessor } from './balance.processor';
import { BalanceService } from './balance.service';
import { BalanceRepository } from './repositories/balance.repository';

@Module({
  imports: [BullModule.registerQueue({ name: BALANCE_QUEUE })],
  controllers: [BalanceController],
  providers: [
    BalanceService,
    BalanceCronService,
    BalanceProcessor,
    BalanceRepository,
  ],
})
export class BalanceModule {}
