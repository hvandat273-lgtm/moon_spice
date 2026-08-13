import * as Sentry from "@sentry/nextjs";
import { scrubSentryUrl } from "@/lib/sentry-scrub";

const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie", "x-forwarded-for", "x-real-ip"]);

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  sendDefaultPii: false,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.02),
  beforeSend(event) {
    delete event.user;
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
      if (event.request.headers) {
        event.request.headers = Object.fromEntries(
          Object.entries(event.request.headers).filter(([key]) => !SENSITIVE_HEADERS.has(key.toLowerCase())),
        );
      }
      if (event.request.url) event.request.url = scrubSentryUrl(event.request.url);
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
