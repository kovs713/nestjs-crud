import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { getQueueToken } from '@nestjs/bullmq';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';

import { UserNotFoundException } from '@/features/users/exceptions';
import { BALANCE_JOBS, BALANCE_QUEUE } from './balance.constants';
import { BalanceService } from './balance.service';
import { TransferDto } from './dto';
import {
  BalanceOverflowException,
  InsufficientFundsException,
} from './exceptions';
import { BalanceRepository } from './repositories';

describe('BalanceService', () => {
  let service: BalanceService;
  let repository: DeepMocked<BalanceRepository>;
  let queue: DeepMocked<Queue>;

  const transferDto: TransferDto = {
    from: 'user_from',
    to: 'user_to',
    amount: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: BalanceRepository,
          useValue: createMock<BalanceRepository>(),
        },
        {
          provide: getQueueToken(BALANCE_QUEUE),
          useValue: createMock<Queue>(),
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
    repository = module.get<DeepMocked<BalanceRepository>>(BalanceRepository);
    queue = module.get<DeepMocked<Queue>>(getQueueToken(BALANCE_QUEUE));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resetAllBalances', () => {
    it('should enqueue reset job and return jobId', async () => {
      // given
      queue.add.mockResolvedValue({ id: 'job-id-123' } as any);

      // when
      const result = await service.resetAllBalances('admin_001');

      // then
      expect(result).toEqual({ jobId: 'job-id-123' });
      expect(queue.add).toHaveBeenCalledWith(
        BALANCE_JOBS.RESET_ALL,
        expect.objectContaining({ triggeredBy: 'admin_001' }),
        expect.objectContaining({
          jobId: expect.stringContaining(`${BALANCE_JOBS.RESET_ALL}:`),
        }),
      );
    });

    it.each([undefined, null])(
      'should throw INTERNAL_ERROR when job id is %s',
      async (jobId) => {
        // given
        queue.add.mockResolvedValue({ id: jobId } as any);

        // when & then
        await expect(
          service.resetAllBalances('admin_001'),
        ).rejects.toBeInstanceOf(InternalServerErrorException);
      },
    );
  });

  describe('transferBalance', () => {
    it('should delegate transfer to repository', async () => {
      // given
      repository.transferBalance.mockResolvedValue(undefined);

      // when
      await service.transferBalance(transferDto);

      // then
      expect(repository.transferBalance).toHaveBeenCalledWith(transferDto);
    });

    it('should map InsufficientFunds to BadRequest preserving message', async () => {
      // given
      const cause = new InsufficientFundsException(50, 100);
      repository.transferBalance.mockRejectedValue(cause);

      // when & then
      await expect(service.transferBalance(transferDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.transferBalance(transferDto)).rejects.toThrow(
        cause.message,
      );
    });

    it('should map BalanceOverflow to BadRequest preserving message', async () => {
      // given
      const cause = new BalanceOverflowException();
      repository.transferBalance.mockRejectedValue(cause);

      // when & then
      await expect(service.transferBalance(transferDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.transferBalance(transferDto)).rejects.toThrow(
        cause.message,
      );
    });

    it('should map UserNotFound to NotFound preserving message', async () => {
      // given
      const cause = new UserNotFoundException('user_from');
      repository.transferBalance.mockRejectedValue(cause);

      // when & then
      await expect(service.transferBalance(transferDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.transferBalance(transferDto)).rejects.toThrow(
        cause.message,
      );
    });

    it('should rethrow unknown errors as-is', async () => {
      // given
      const cause = new Error('db down');
      repository.transferBalance.mockRejectedValue(cause);

      // when & then
      await expect(service.transferBalance(transferDto)).rejects.toBe(cause);
    });
  });
});
