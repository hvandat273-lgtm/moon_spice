import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (!process.env.RENDER || process.env.SQLITE_PERSISTENCE_CONFIRMED !== "true") return new NextResponse(null, { status: 404 });
  const parts = (await context.params).path;
  if (!Array.isArray(parts) || parts.length !== 2 || !parts.every((part) => /^[a-z0-9-]{1,64}(?:\.webp)?$/i.test(part)) || !parts[1].endsWith(".webp")) return new NextResponse(null, { status: 404 });
  const root = path.resolve(process.env.UPLOADS_PATH?.trim() || "/var/data/uploads");
  const pathname = path.resolve(root, ...parts);
  if (!pathname.startsWith(`${root}${path.sep}`)) return new NextResponse(null, { status: 404 });
  try {
    const body = await readFile(pathname);
    return new NextResponse(body, { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
