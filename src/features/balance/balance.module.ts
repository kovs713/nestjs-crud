import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { BALANCE_QUQUE } from './balance.constants';
import { BalanceController } from './balance.controller';
import { BalanceRepository } from './repositories/balance.repository';
import { BalanceService } from './services/balance.service';

@Module({
  imports: [BullModule.registerQueue({ name: BALANCE_QUQUE })],
  controllers: [BalanceController],
  providers: [BalanceService, BalanceRepository],
  exports: [BalanceService],
})
export class BalanceModule {}
