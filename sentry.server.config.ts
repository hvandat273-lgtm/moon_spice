import * as Sentry from "@sentry/nextjs";
import { sentryServerOptions } from "@/lib/server/sentry-options";

Sentry.init(sentryServerOptions());
