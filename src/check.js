export const PROBE_URL = "https://www.cloudflare.com/cdn-cgi/trace";
export const MAX_BYTES = 8192;
export const SAMPLE_COUNT = 3;
export const TIMEOUT_MS = 6000;

export function validIp(value) {
  if (typeof value !== "string" || value.length > 45) return false;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value))
    return value.split(".").every((x) => +x <= 255 && String(+x) === x);
  if (!/^[0-9a-f:]+$/i.test(value) || !value.includes(":")) return false;
  try {
    return new URL(`http://[${value}]/`).hostname.startsWith("[");
  } catch {
    return false;
  }
}

export function parseTrace(text) {
  if (typeof text !== "string" || text.length > MAX_BYTES)
    throw new Error("Unexpected response size");
  const fields = Object.create(null);
  for (const line of text.split("\n")) {
    const index = line.indexOf("=");
    if (index > 0) fields[line.slice(0, index)] = line.slice(index + 1).trim();
  }
  if (
    !validIp(fields.ip) ||
    fields.visit_scheme !== "https" ||
    !["TLSv1.2", "TLSv1.3"].includes(fields.tls)
  ) {
    throw new Error("Response was not the expected HTTPS diagnostic");
  }
  return {
    ip: fields.ip,
    tls: fields.tls,
    sni: ["plaintext", "encrypted", "off"].includes(fields.sni)
      ? fields.sni
      : "unknown",
    http: ["http/1.1", "http/2", "http/3"].includes(fields.http)
      ? fields.http
      : "unknown",
  };
}

async function limitedText(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming response unavailable");
  const parts = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error("Unexpected response size");
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.byteLength;
    }
    return new TextDecoder().decode(bytes);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function probe({
  fetchFn = fetch,
  signal,
  timeoutMs = TIMEOUT_MS,
  now = () => performance.now(),
} = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  const started = now();
  try {
    const response = await fetchFn(`${PROBE_URL}?safe=${crypto.randomUUID()}`, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Diagnostic service unavailable");
    const trace = parseTrace(await limitedText(response));
    if (controller.signal.aborted)
      throw new DOMException("Aborted", "AbortError");
    return {
      ok: true,
      elapsedMs: Math.max(0, Math.round(now() - started)),
      ...trace,
    };
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    return {
      ok: false,
      reason: controller.signal.aborted
        ? "Request timed out"
        : "Could not verify the diagnostic response",
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export function snapshotBrowser(nav, location) {
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;
  return {
    pageHttps: location.protocol === "https:",
    onlineHint: nav.onLine === true,
    connectionType: [
      "wifi",
      "ethernet",
      "cellular",
      "bluetooth",
      "none",
    ].includes(connection?.type)
      ? connection.type
      : "unknown",
  };
}

export function summarize(samples) {
  const successful = samples.filter((x) => x.ok);
  const times = successful.map((x) => x.elapsedMs).sort((a, b) => a - b);
  return {
    successful: successful.length,
    medianMs: times.length
      ? (times[Math.floor((times.length - 1) / 2)] +
          times[Math.floor(times.length / 2)]) / 2
      : null,
    ipChangedDuringCheck:
      new Set(successful.map((x) => x.ip).filter(Boolean)).size > 1,
  };
}

export async function runCheck({
  signal,
  onProgress = () => {},
  probeFn = probe,
  browser,
  label = "",
}) {
  const samples = [];
  for (let index = 0; index < SAMPLE_COUNT; index++) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    onProgress(index);
    samples.push(await probeFn({ signal }));
  }
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  onProgress(SAMPLE_COUNT);
  return {
    schema: 1,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    label: label.trim().slice(0, 60),
    browser,
    samples,
    summary: summarize(samples),
  };
}

export function compareChecks(before, after) {
  const ipFor = (check) =>
    check.summary.ipChangedDuringCheck
      ? null
      : check.samples.find((s) => s.ok && s.ip)?.ip;
  const a = ipFor(before),
    b = ipFor(after);
  return {
    ip: a && b ? (a === b ? "unchanged" : "changed") : "unavailable",
    elapsedDifference:
      before.summary.medianMs !== null && after.summary.medianMs !== null
        ? after.summary.medianMs - before.summary.medianMs
        : null,
  };
}
