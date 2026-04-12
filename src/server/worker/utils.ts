import { format } from "util";

export function log(msg: string): void {
  const ts = new Date().toTimeString().slice(0, 8);
  process.stdout.write(`[${ts}] ${msg}\n`);
}

export async function fetchUrl(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15_000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "ibm-bob-tracker/2.0 (research tool; low-volume)",
        Accept: "application/json, application/xml, text/xml, */*",
        ...((options.headers as Record<string, string>) ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${body.slice(0, 400)}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
