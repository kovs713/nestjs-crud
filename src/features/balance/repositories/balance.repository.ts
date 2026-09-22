import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { users } from '@/features/users/entities';
import { UserNotFoundException } from '@/features/users/exceptions';
import { DATABASE_CLIENT } from '@/providers/database/database.constants';
import { MAX_BALANCE } from '../balance.constants';
import { TransferDto } from '../dto';
import {
  BalanceOverflowException,
  InsufficientFundsException,
} from '../exceptions';

@Injectable()
export class BalanceRepository {
  private readonly logger: Logger = new Logger(BalanceRepository.name);

  constructor(@Inject(DATABASE_CLIENT) private readonly db: NodePgDatabase) {}

  async resetAllBalances(): Promise<number> {
    const result = await this.db
      .update(users)
      .set({ balance: '0.00', updatedAt: new Date() })
      .where(sql`${users.balance} IS DISTINCT FROM '0.00'`)
      .returning({ id: users.id });

    this.logger.log(`Reset balances for ${result.length} users`);

    return result.length;
  }

  async transferBalance(dto: TransferDto) {
    await this.db.transaction(async (tx) => {
      const [sender] = await tx
        .select()
        .from(users)
        .where(eq(users.id, dto.from))
        .for('update'); // lock sender writes

      if (!sender) {
        throw new UserNotFoundException(dto.from);
      }

      const senderBalance = parseFloat(sender.balance);

      // business invariant check
      if (senderBalance < dto.amount) {
        throw new InsufficientFundsException(senderBalance, dto.amount);
      }

      const [receiver] = await tx
        .select()
        .from(users)
        .where(eq(users.id, dto.to))
        .for('update'); // lock receiver writes

      if (!receiver) throw new UserNotFoundException(dto.to);

      const receiverBalance = parseFloat(receiver.balance);

      // business invariant check
      if (receiverBalance + dto.amount > MAX_BALANCE) {
        throw new BalanceOverflowException();
      }

      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} - ${dto.amount.toString()}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, dto.from));

      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} + ${dto.amount.toString()}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, dto.to));
    });
  }
}
