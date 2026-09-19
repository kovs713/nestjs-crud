export const BALANCE_QUEUE = 'balance:queue' as const;

export const BALANCE_JOBS = {
  RESET_ALL: 'reset-all-balances',
} as const;

export type BalanceJobName = (typeof BALANCE_JOBS)[keyof typeof BALANCE_JOBS];
