import { Module } from '@nestjs/common';

import { WalletController } from './wallet.controller';
import { WalletCronService } from './wallet.cron.service';
import { WalletRepotitory } from './wallet.repository';
import { WalletService } from './wallet.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletRepotitory, WalletCronService],
  exports: [WalletService],
})
export class WalletModule {}
