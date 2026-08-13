import { requireAdminApiSession } from "@/app/admin/_lib/auth";
import { apiSuccess, route } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return route(request, async (requestId) => apiSuccess(await requireAdminApiSession(request), requestId)); }
