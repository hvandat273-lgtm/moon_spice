import { POST as canonicalPost } from "@/app/api/admin/auth/login/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compatibility alias; the canonical contract is /api/admin/auth/login.
export async function POST(request: Request) { return canonicalPost(request); }
