import type { NodeOptions } from "@sentry/node";
import { scrubSentryUrl } from "@/lib/sentry-scrub";

const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie", "x-forwarded-for", "x-real-ip"]);

export function sentryServerOptions(): NodeOptions {
  return {
    dsn: process.env.SENTRY_DSN,
    enabled: Boolean(process.env.SENTRY_DSN),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    sendDefaultPii: false,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.headers) {
          event.request.headers = Object.fromEntries(
            Object.entries(event.request.headers).filter(([key]) => !SENSITIVE_HEADERS.has(key.toLowerCase()))
          );
        }
        if (event.request.url) event.request.url = scrubSentryUrl(event.request.url);
      }
      return event;
    }
  };
}
