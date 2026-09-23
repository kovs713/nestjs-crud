import { defineRelations } from 'drizzle-orm';

import { avatars } from './avatars.entity';
import { users } from './users.entity';

export const relations = defineRelations({ users, avatars }, (r) => ({
  avatars: {
    user: r.one.users({
      from: r.avatars.userId,
      to: r.users.id,
    }),
  },
  users: {
    avatars: r.many.avatars(),
  },
}));
