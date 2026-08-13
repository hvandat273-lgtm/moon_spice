import { randomUUID } from "node:crypto";

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { scrubSentryRoute } from "@/lib/sentry-scrub";

import { AppError, asAppError } from "./errors";
import { getPublicSiteUrl } from "./env";

export interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string; fieldErrors?: unknown } | null;
  requestId: string;
}

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export function requestIdFrom(request: Request): string {
  const candidate = request.headers.get("x-request-id");
  return candidate && /^[a-zA-Z0-9._:-]{8,80}$/.test(candidate) ? candidate : randomUUID();
}

export function apiSuccess<T>(data: T, requestId: string, init?: { status?: number; private?: boolean }): NextResponse<ApiEnvelope<T>> {
  const response = NextResponse.json<ApiEnvelope<T>>({ data, error: null, requestId }, { status: init?.status ?? 200 });
  response.headers.set("X-Request-ID", requestId);
  if (init?.private !== false) {
    for (const [key, value] of Object.entries(PRIVATE_HEADERS)) response.headers.set(key, value);
  }
  return response;
}

export function apiFailure(error: unknown, requestId: string): NextResponse<ApiEnvelope<never>> {
  const appError = asAppError(error);
  const response = NextResponse.json<ApiEnvelope<never>>(
    {
      data: null,
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details === undefined ? {} : { fieldErrors: appError.details }),
      },
      requestId,
    },
    { status: appError.status },
  );
  response.headers.set("X-Request-ID", requestId);
  for (const [key, value] of Object.entries(PRIVATE_HEADERS)) response.headers.set(key, value);
  return response;
}

export async function parseJsonBody(request: Request, maximumBytes = 64 * 1024): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumBytes) throw new AppError(413, "PAYLOAD_TOO_LARGE", "Nội dung yêu cầu quá lớn");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maximumBytes) throw new AppError(413, "PAYLOAD_TOO_LARGE", "Nội dung yêu cầu quá lớn");
  if (!text) throw new AppError(400, "INVALID_JSON", "Nội dung JSON không hợp lệ");
  return JSON.parse(text) as unknown;
}

export function clientIpFrom(request: Request): string {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : getPublicSiteUrl().origin;
  if (origin !== expected && origin !== getPublicSiteUrl().origin) {
    throw new AppError(403, "INVALID_ORIGIN", "Nguồn yêu cầu không hợp lệ");
  }
}

export async function route<T>(request: Request, handler: (requestId: string) => Promise<NextResponse<ApiEnvelope<T>>>): Promise<NextResponse<ApiEnvelope<T> | never>> {
  const requestId = requestIdFrom(request);
  try {
    return await handler(requestId);
  } catch (error) {
    const appError = asAppError(error);
    if (appError.status >= 500) {
      console.error("API request failed", { requestId, errorName: error instanceof Error ? error.name : "UnknownError" });
      Sentry.withScope((scope) => {
        scope.setTag("request_id", requestId);
        scope.setTag("api_error_code", appError.code);
        scope.setTag("route", scrubSentryRoute(new URL(request.url).pathname));
        scope.setLevel("error");
        const diagnostic = new Error(`API request failed: ${appError.code}`);
        diagnostic.name = error instanceof Error ? error.name : "UnknownError";
        Sentry.captureException(diagnostic);
      });
    }
    return apiFailure(appError, requestId);
  }
}
