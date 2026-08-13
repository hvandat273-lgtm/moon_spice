import { hash } from "bcryptjs";

import { admins } from "../db/schema";
import { withDirectDatabase } from "./_database";
import { assertPassword, readPassword } from "./_password";

const args = process.argv.slice(2);
const emailFlagIndex = args.indexOf("--email");
const email = (emailFlagIndex >= 0 ? args[emailFlagIndex + 1] : args[0] ?? process.env.ADMIN_EMAIL)?.trim().toLowerCase();
if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("ADMIN_EMAIL must be a valid email address");
const password = await readPassword("New owner password: ");
assertPassword(password);
const passwordHash = await hash(password, 12);

await withDirectDatabase(async (db) => {
  await db.insert(admins).values({
    email,
    displayName: email.split("@")[0] || "Owner",
    passwordHash,
    role: "OWNER",
  });
});

console.log(`Owner admin created for ${email}.`);
