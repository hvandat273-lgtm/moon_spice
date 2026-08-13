export async function readPassword(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    const password = Buffer.concat(chunks).toString("utf8").replace(/(?:\r\n|\n|\r)$/, "");
    if (!password) throw new Error("Password must be provided on stdin");
    return password;
  }

  const input = process.stdin;
  const wasRaw = input.isRaw;
  process.stderr.write(prompt);
  input.setRawMode(true);
  input.resume();
  input.setEncoding("utf8");

  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      input.off("data", onData);
      input.setRawMode(Boolean(wasRaw));
      input.pause();
      process.stderr.write("\n");
    };
    const finish = () => {
      cleanup();
      if (!value) reject(new Error("Password must not be empty"));
      else resolve(value);
    };
    const onData = (key: string) => {
      if (key.startsWith("\u001b")) return;
      for (const character of key) {
        if (character === "\u0003" || character === "\u0004") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = Array.from(value).slice(0, -1).join("");
          continue;
        }
        if (character >= " ") value += character;
      }
    };
    input.on("data", onData);
  });
}

export function assertPassword(password: string): void {
  const bytes = Buffer.byteLength(password, "utf8");
  if (bytes < 12 || bytes > 72) throw new Error("Password must contain 12 to 72 UTF-8 bytes");
}
