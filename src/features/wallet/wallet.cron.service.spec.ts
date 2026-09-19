import { Test, TestingModule } from '@nestjs/testing';

import { WalletCronService } from './wallet.cron.service';

describe('WalletCronService', () => {
  let service: WalletCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletCronService],
    }).compile();

    service = module.get<WalletCronService>(WalletCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
