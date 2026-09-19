import { BALANCE_RESET_JOBS } from '../balance.constants';

export type BalanceResetJobPayload = {
  [BALANCE_RESET_JOBS.RESET_ALL]: {
    triggeredBy: string;
    triggeredAt: string;
  };
};
