import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { BALANCE_JOBS } from './balance.constants';
import { BalanceRepository } from './repositories';

@Injectable()
export class BalanceProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(BalanceProcessor.name);

  constructor(private readonly repository: BalanceRepository) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case BALANCE_JOBS.RESET_ALL: {
        const resetCount = await this.repository.resetAllBalances();

        this.logger.log(`Successfully reset balances for ${resetCount} users`);

        break;
      }

      default: {
        this.logger.warn(`Unknown job name: ${job.name}`);
      }
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `Job "${job?.name}" (id: ${job?.id}) failed after ${job?.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(
      `Job "${job.name}" (id: ${job.id}) completed successfully`,
    );
  }
}
