import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { hashPassword } from '@/common/utils';
import { usersEntity } from '@/features/users/entities';

const ADMIN_LOGIN = process.env.ADMIN_LOGIN ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null;

async function seed() {
  const pool = new Pool({ connectionString: process.env.DB_URL });
  const db = drizzle({ client: pool });

  try {
    const [admin] = await db
      .insert(usersEntity)
      .values({
        login: ADMIN_LOGIN,
        passwordHash: await hashPassword(ADMIN_PASSWORD),
        role: 'admin',
        email: ADMIN_EMAIL,
      })
      .onConflictDoNothing({ target: usersEntity.login })
      .returning();

    if (admin) {
      console.log(`admin user "${admin.login}" created`);
    } else {
      console.log(`admin user "${ADMIN_LOGIN}" already exists, skipping`);
    }
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('seed failed:', error);
  process.exit(1);
});
