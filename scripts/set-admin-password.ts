import { hash } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";

import { admins, adminSessions, auditLogs } from "../db/schema";
import { withDirectDatabase } from "./_database";
import { assertPassword, readPassword } from "./_password";

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL)?.trim().toLowerCase();
if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Provide an admin email as the first argument or ADMIN_EMAIL");
const password = await readPassword("New password: ");
assertPassword(password);
const passwordHash = await hash(password, 12);

await withDirectDatabase(async (db) => {
  await db.transaction(async (tx) => {
    const [admin] = await tx
      .update(admins)
      .set({ passwordHash, passwordChangedAt: new Date(), updatedAt: new Date() })
      .where(eq(admins.email, email))
      .returning({ id: admins.id });
    if (!admin) throw new Error("Admin not found");
    await tx
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(adminSessions.adminId, admin.id), isNull(adminSessions.revokedAt)));
    await tx.insert(auditLogs).values({
      adminId: admin.id,
      action: "ADMIN_PASSWORD_CHANGED",
      entityType: "Admin",
      entityId: admin.id,
    });
  });
});

console.log(`Password updated and sessions revoked for ${email}.`);
