import { POST as canonicalPost } from "@/app/api/admin/auth/logout/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compatibility alias; the canonical contract is /api/admin/auth/logout.
export async function POST(request: Request) { return canonicalPost(request); }
