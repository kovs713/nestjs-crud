import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { WalletController } from './wallet.controller';
import { WalletCronService } from './wallet.cron.service';
import { WalletRepotitory } from './wallet.repository';
import { WalletService } from './wallet.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [WalletController],
  providers: [WalletService, WalletRepotitory, WalletCronService],
  exports: [WalletService],
})
export class WalletModule {}
