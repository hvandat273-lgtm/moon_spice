import { requireAdminApiSession } from "@/app/admin/_lib/auth";
import { readAdminDashboard } from "@/app/admin/_lib/data";
import { apiSuccess, route } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return route(request, async (requestId) => { await requireAdminApiSession(request); return apiSuccess(await readAdminDashboard(), requestId); }); }
