import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { Roles } from '@/auth/decorators';
import { RolesGuard } from '@/auth/guards';
import { JwtPayloadType } from '@/auth/types';
import type { RequestWithUser } from '@/common/types';
import { BalanceService } from './balance.service';
import { TransferAmountDto, TransferDto } from './dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('balance')
export class BalanceController {
  constructor(private readonly service: BalanceService) {}

  @Post('/reset')
  @Roles('admin')
  @ApiOperation({
    summary: 'Reset all users balances (Manual trigger by admin)',
  })
  @ApiResponse({ status: 202, description: 'Reset job enqueued' })
  async resetAll() {
    return await this.service.resetAllBalances('admin');
  }

  @Post('/transfer/:userId')
  @ApiOperation({ summary: 'Transfer balance to another user' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Balance transferred successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient funds or overflow' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async transferBalance(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: RequestWithUser<JwtPayloadType>,
    @Body() dto: TransferAmountDto,
  ): Promise<void> {
    return await this.service.transferBalance({
      from: req.user.id,
      to: userId,
      amount: dto.amount,
    } satisfies TransferDto);
  }
}
