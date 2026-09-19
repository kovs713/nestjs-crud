import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '@/auth/guards';
import { BalanceService } from './balance.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('balance')
export class BalanceController {
  constructor(private readonly service: BalanceService) {}
}
