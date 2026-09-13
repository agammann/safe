import { summarize } from "./check.js";
export const STORAGE_KEY = "safe.checks.v1";
export const MAX_CHECKS = 20;
const MAX_STORAGE_BYTES = 100000;

export function sanitizeCheck(check) {
  if (
    !check ||
    check.schema !== 1 ||
    typeof check.id !== "string" ||
    !/^[a-z0-9-]{1,64}$/i.test(check.id) ||
    typeof check.timestamp !== "string" ||
    !Number.isFinite(Date.parse(check.timestamp)) ||
    !Array.isArray(check.samples) ||
    check.samples.length !== 3 ||
    !check.browser
  )
    return null;
  const samples = [];
  for (const sample of check.samples) {
    if (
      sample?.ok === true &&
      Number.isFinite(sample.elapsedMs) &&
      sample.elapsedMs >= 0 &&
      sample.elapsedMs < 60000 &&
      ["TLSv1.2", "TLSv1.3"].includes(sample.tls)
    ) {
      samples.push({
        ok: true,
        elapsedMs: Math.round(sample.elapsedMs),
        tls: sample.tls,
        sni: ["plaintext", "encrypted", "off"].includes(sample.sni)
          ? sample.sni
          : "unknown",
        http: ["http/1.1", "http/2", "http/3"].includes(sample.http)
          ? sample.http
          : "unknown",
      });
    } else if (sample?.ok === false) {
      samples.push({
        ok: false,
        reason:
          sample.reason === "Request timed out"
            ? sample.reason
            : "Could not verify the diagnostic response",
      });
    } else return null;
  }
  return {
    schema: 1,
    id: check.id,
    timestamp: new Date(check.timestamp).toISOString(),
    label: typeof check.label === "string" ? check.label.slice(0, 60) : "",
    browser: {
      pageHttps: check.browser.pageHttps === true,
      onlineHint: check.browser.onlineHint === true,
      connectionType: [
        "wifi",
        "ethernet",
        "cellular",
        "bluetooth",
        "none",
      ].includes(check.browser.connectionType)
        ? check.browser.connectionType
        : "unknown",
    },
    samples,
    summary: {
      ...summarize(samples),
      ipChangedDuringCheck: check.summary?.ipChangedDuringCheck === true,
    },
  };
}

export function loadChecks(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { checks: [], error: null };
    if (raw.length > MAX_STORAGE_BYTES)
      return {
        checks: [],
        error: "Saved data is too large to load. You can clear it in Privacy.",
      };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    const checks = parsed
      .slice(0, MAX_CHECKS)
      .map(sanitizeCheck)
      .filter(Boolean);
    return {
      checks,
      error:
        checks.length !== Math.min(parsed.length, MAX_CHECKS)
          ? "Some saved checks could not be read."
          : null,
    };
  } catch {
    return {
      checks: [],
      error: "Saved checks are unavailable. New checks can still run.",
    };
  }
}

export function saveChecks(storage, checks) {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        checks.slice(0, MAX_CHECKS).map(sanitizeCheck).filter(Boolean),
      ),
    );
    return null;
  } catch {
    return "This browser could not save your results. They remain available until you reload.";
  }
}

export function exportReport(check) {
  return JSON.stringify(
    {
      product: "Safe",
      version: "0.1.0",
      scope: "Browser connection check, not a WiFi security certification",
      provider: "Cloudflare diagnostic endpoint",
      publicIp: "Not included",
      check: sanitizeCheck(check),
    },
    null,
    2,
  );
}
