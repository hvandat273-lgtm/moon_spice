export function scrubSentryUrl(rawUrl: string): string | undefined {
  try {
    const url = new URL(rawUrl);
    url.search = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

export function scrubSentryRoute(pathname: string): string {
  return pathname;
}
