// Queue
export const BALANCE_QUEUE = 'balance-queue' as const;

export const BALANCE_JOBS = {
  RESET_ALL: 'reset-all-balances',
} as const;

export const BALANCE_SCHEDULERS = {
  TEN_MINUTE_RESET: 'balance-reset-ten-minute-scheduler',
} as const;

export type BalanceJobName = (typeof BALANCE_JOBS)[keyof typeof BALANCE_JOBS];

export const CRON_PATTERNS = {
  EVERY_TEN_MINUTE: '*/10 * * * *',
};

// Business invariants
export const MAX_BALANCE = 1_000_000_000;
export const MAX_TRANSFER_AMOUNT = 500_000_000;
