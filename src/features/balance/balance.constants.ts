export const BALANCE_QUQUE = 'balance-quque' as const;

export const BALANCE_RESET_JOBS = {
  RESET_ALL: 'reset-all-balances',
} as const;

export type BalanceResetJobName =
  (typeof BALANCE_RESET_JOBS)[keyof typeof BALANCE_RESET_JOBS];
