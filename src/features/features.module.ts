import { Module } from '@nestjs/common';

import { BalanceModule } from './balance/balance.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, BalanceModule],
})
export class FeaturesModule {}
