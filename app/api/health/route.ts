import { apiSuccess, route } from "@/lib/server/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return route(request, async (requestId) => {
    const response = apiSuccess(
      { status: "ok", version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? process.env.npm_package_version ?? "development" },
      requestId,
      { private: false },
    );
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return response;
  });
}
