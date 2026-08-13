import { POST as canonicalPost } from "@/app/api/admin/uploads/images/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compatibility alias; the canonical contract is /api/admin/uploads/images.
export async function POST(request: Request) { return canonicalPost(request); }
