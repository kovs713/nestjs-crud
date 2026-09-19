import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '@/auth/guards';
import { WalletService } from './wallet.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly service: WalletService) {}
}
