import { hash } from "bcryptjs";

import { assertPassword, readPassword } from "./_password";

const password = await readPassword("Admin password: ");
assertPassword(password);
const passwordHash = await hash(password, 12);

// Keep stdout machine-readable so it can be redirected directly to a secret manager.
process.stdout.write(`${passwordHash}\n`);
