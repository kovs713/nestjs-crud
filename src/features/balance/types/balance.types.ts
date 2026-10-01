import { BALANCE_JOBS } from '../balance.constants';

export type BalanceJobPayload = {
  [BALANCE_JOBS.RESET_ALL]: {
    triggeredBy: string;
    triggeredAt: string;
  };
};
