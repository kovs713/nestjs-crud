import { createMock } from '@golevelup/ts-jest';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';

import { BALANCE_QUEUE } from './balance.constants';
import { BalanceService } from './balance.service';
import { BalanceRepository } from './repositories';

describe('BalanceService', () => {
  let service: BalanceService;
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-id-123' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: BalanceRepository,
          useValue: createMock<BalanceRepository>(),
        },
        {
          provide: getQueueToken(BALANCE_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
