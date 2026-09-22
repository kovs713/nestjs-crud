import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

import { UserNotFoundException } from '../users/exceptions';
import { BALANCE_JOBS, BALANCE_QUEUE } from './balance.constants';
import { ResetAllResponseDto, TransferDto } from './dto';
import {
  BalanceOverflowException,
  InsufficientFundsException,
} from './exceptions';
import { BalanceRepository } from './repositories';

@Injectable()
export class BalanceService {
  private readonly logger: Logger = new Logger(BalanceService.name);

  constructor(
    @InjectQueue(BALANCE_QUEUE) private readonly queue: Queue,
    private readonly repository: BalanceRepository,
  ) {}

  async resetAllBalances(triggeredBy: string): Promise<ResetAllResponseDto> {
    const job = await this.queue.add(
      BALANCE_JOBS.RESET_ALL,
      { triggeredBy, triggeredAt: new Date() },
      { jobId: `${BALANCE_JOBS.RESET_ALL}:${randomUUID()}` },
    );

    if (!job.id) {
      throw new InternalServerErrorException(
        'Failed to enqueue job: no ID returned',
      );
    }

    this.logger.log(`Successfully enqueued job: ${job.id}`);

    const result: ResetAllResponseDto = {
      jobId: job.id,
    };

    return result;
  }

  async transferBalance(dto: TransferDto): Promise<void> {
    try {
      await this.repository.transferBalance(dto);
    } catch (error: unknown) {
      if (error instanceof InsufficientFundsException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof BalanceOverflowException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
