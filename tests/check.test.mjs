import test from "node:test";
import assert from "node:assert/strict";
import {
  parseTrace,
  validIp,
  probe,
  runCheck,
  summarize,
  compareChecks,
  snapshotBrowser,
  MAX_BYTES,
  PROBE_URL,
} from "../src/check.js";
import {
  sanitizeCheck,
  loadChecks,
  saveChecks,
  exportReport,
  MAX_CHECKS,
  reconcileChecks,
} from "../src/storage.js";

const trace =
  "ip=203.0.113.10\nvisit_scheme=https\ntls=TLSv1.3\nsni=plaintext\nhttp=http/2\nuag=secret-user-agent\nloc=XX\n";
const ok = { ok: true, elapsedMs: 45, ...parseTrace(trace) };
const failed = { ok: false, reason: "Request timed out" };
const makeCheck = (samples = [ok, ok, ok]) => ({
  schema: 1,
  id: crypto.randomUUID(),
  timestamp: "2026-09-12T12:00:00.000Z",
  label: "Fictional lab",
  browser: { pageHttps: false, onlineHint: true, connectionType: "unknown" },
  samples,
  summary: summarize(samples),
});
const store = () => {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
  };
};

test("median handles partial checks and remains consistent after saving", () => {
  for (const [samples, expected] of [
    [[failed, failed, failed], null],
    [[ok, failed, failed], 45],
    [[{ ...ok, elapsedMs: 10 }, failed, { ...ok, elapsedMs: 101 }], 55.5],
    [[{ ...ok, elapsedMs: 101 }, ok, { ...ok, elapsedMs: 10 }], 45],
  ]) {
    assert.equal(summarize(samples).medianMs, expected);
    assert.equal(sanitizeCheck(makeCheck(samples)).summary.medianMs, expected);
  }
});

test("another tab's removal stays removed when a stale tab saves again", () => {
  const first = makeCheck(), removed = makeCheck(), added = makeCheck();
  const previous = [removed, first].map(sanitizeCheck);
  const latest = [sanitizeCheck(first)];
  const reconciled = reconcileChecks([removed, first], previous, latest);
  const storage = store();
  saveChecks(storage, [added, ...reconciled]);
  assert.deepEqual(loadChecks(storage).checks.map((check) => check.id), [added.id, first.id]);
  assert.equal(reconciled[0], first, "the originating tab keeps its own in-memory IP");
  assert.deepEqual(reconcileChecks([removed, first], previous, []), []);
});

test("tab synchronization preserves unsaved checks and does not import IPs", () => {
  const first = makeCheck(), unsaved = makeCheck(), remote = makeCheck();
  const next = reconcileChecks([unsaved, first], [sanitizeCheck(first)], [sanitizeCheck(remote), sanitizeCheck(first)]);
  assert.deepEqual(next.map((check) => check.id), [unsaved.id, remote.id, first.id]);
  assert.equal(next[0], unsaved);
  assert.equal(next[1].samples[0].ip, undefined);
  const changed = { ...sanitizeCheck(first), label: "Changed elsewhere" };
  assert.equal(reconcileChecks([first], [sanitizeCheck(first)], [changed])[0].samples[0].ip, undefined);
});

test("parses a valid response and discards unsolicited metadata", () => {
  assert.deepEqual(parseTrace(trace), {
    ip: "203.0.113.10",
    tls: "TLSv1.3",
    sni: "plaintext",
    http: "http/2",
  });
});
test("validates IPv4 and IPv6 without accepting URL input", () => {
  for (const ip of ["203.0.113.10", "2001:db8::1", "::1"])
    assert.equal(validIp(ip), true);
  for (const ip of [
    "999.2.3.4",
    "001.2.3.4",
    "https://example.com",
    "1.2.3.4/path",
    ":::",
    "host",
  ])
    assert.equal(validIp(ip), false);
});
test("does not accept a login portal, plaintext scheme, or missing encryption report", () => {
  for (const value of [
    "<html>Sign in</html>",
    trace.replace("https", "http"),
    trace.replace("TLSv1.3", "unknown"),
  ])
    assert.throws(() => parseTrace(value));
});
test("bounds the parser input", () =>
  assert.throws(() => parseTrace("x".repeat(MAX_BYTES + 1))));
test("successful probe only uses the fixed HTTPS destination, omits cookies and referrer", async () => {
  let captured;
  const result = await probe({
    fetchFn: async (url, options) => {
      captured = { url, options };
      return new Response(trace);
    },
  });
  assert.equal(result.ok, true);
  assert.ok(captured.url.startsWith(PROBE_URL + "?safe="));
  assert.equal(captured.options.credentials, "omit");
  assert.equal(captured.options.referrerPolicy, "no-referrer");
  assert.equal(captured.options.redirect, "error");
  assert.equal(captured.options.cache, "no-store");
});
test("oversize streamed responses are rejected", async () => {
  const result = await probe({
    fetchFn: async () => new Response(trace + "x".repeat(MAX_BYTES)),
  });
  assert.equal(result.ok, false);
});
test("HTTP failures, network failures and malformed bodies stay inconclusive", async () => {
  for (const fetchFn of [
    async () => new Response("no", { status: 503 }),
    async () => {
      throw Error("network");
    },
    async () => new Response("<html>Login</html>"),
  ]) {
    const result = await probe({ fetchFn });
    assert.equal(result.ok, false);
    assert.equal(result.tls, undefined);
    assert.equal(result.ip, undefined);
  }
});
test("timeout aborts a request and produces a bounded failure", async () => {
  const result = await probe({
    timeoutMs: 10,
    fetchFn: (_, o) =>
      new Promise((resolve, reject) =>
        o.signal.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        ),
      ),
  });
  assert.deepEqual(result, { ok: false, reason: "Request timed out" });
});
test("user cancellation propagates without a saved report", async () => {
  const controller = new AbortController();
  let count = 0;
  await assert.rejects(
    runCheck({
      signal: controller.signal,
      browser: {},
      probeFn: async () => {
        count++;
        controller.abort();
        return ok;
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(count, 1);
});
test("a pre-cancelled probe never makes a request", async () => {
  const controller = new AbortController();
  controller.abort();
  let called = false;
  await assert.rejects(
    probe({
      signal: controller.signal,
      fetchFn: () => {
        called = true;
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(called, false);
});
test("a check always has three bounded samples and preserves partial failure", async () => {
  let count = 0;
  const updates = [];
  const result = await runCheck({
    browser: {},
    label: " x ",
    onProgress: (x) => updates.push(x),
    probeFn: async () => (++count === 2 ? failed : ok),
  });
  assert.equal(result.samples.length, 3);
  assert.equal(result.summary.successful, 2);
  assert.equal(result.label, "x");
  assert.deepEqual(updates, [0, 1, 2, 3]);
});
test("all failures have no misleading latency value", () =>
  assert.equal(summarize([failed, failed, failed]).medianMs, null));
test("connection estimates such as 4g do not become a WiFi identity", () => {
  const snapshot = snapshotBrowser(
    { onLine: true, connection: { effectiveType: "4g" } },
    { protocol: "http:" },
  );
  assert.equal(snapshot.connectionType, "unknown");
  assert.equal(snapshot.pageHttps, false);
});
test("compares IP observations without inferring VPN status", () => {
  const a = makeCheck(),
    b = makeCheck([
      { ...ok, ip: "203.0.113.11" },
      { ...ok, ip: "203.0.113.11" },
      { ...ok, ip: "203.0.113.11" },
    ]);
  assert.equal(compareChecks(a, b).ip, "changed");
  assert.equal(compareChecks(a, a).ip, "unchanged");
  assert.equal(compareChecks(a, b).vpn, undefined);
});
test("does not compare addresses when route changes within a check", () => {
  const b = makeCheck([ok, { ...ok, ip: "203.0.113.11" }, ok]);
  assert.equal(b.summary.ipChangedDuringCheck, true);
  assert.equal(compareChecks(makeCheck(), b).ip, "unavailable");
});
test("persistence and exports remove addresses and any extra fields", () => {
  const check = makeCheck();
  check.password = "should-not-persist";
  check.samples[0] = { ...ok, uag: "should-not-persist" };
  const serialized = JSON.stringify(sanitizeCheck(check));
  assert.ok(!serialized.includes("203.0.113.10"));
  assert.ok(!serialized.includes("should-not-persist"));
  const exported = exportReport(check);
  assert.ok(!exported.includes("203.0.113.10"));
  assert.ok(!exported.includes("should-not-persist"));
  assert.equal(compareChecks(sanitizeCheck(check), check).ip, "unavailable");
});
test("history is bounded and recovered after reload", () => {
  const storage = store();
  saveChecks(
    storage,
    Array.from({ length: 30 }, () => makeCheck()),
  );
  const restored = loadChecks(storage);
  assert.equal(restored.checks.length, MAX_CHECKS);
  assert.equal(restored.error, null);
  assert.equal(restored.checks[0].samples[0].ip, undefined);
});
test("bad local data is rejected and forged summaries are recalculated", () => {
  const storage = { getItem: () => "{bad" };
  assert.equal(loadChecks(storage).checks.length, 0);
  assert.ok(loadChecks(storage).error);
  assert.equal(sanitizeCheck({ ...makeCheck(), samples: [ok] }), null);
  assert.equal(
    sanitizeCheck({ ...makeCheck(), summary: { successful: 999 } }).summary
      .successful,
    3,
  );
});
test("blocked or exhausted local storage is reported without crashing", () => {
  const storage = {
    getItem: () => {
      throw Error("blocked");
    },
    setItem: () => {
      throw Error("quota");
    },
  };
  assert.ok(loadChecks(storage).error);
  assert.ok(saveChecks(storage, [makeCheck()]));
});
test("oversize saved data is refused before JSON parsing", () =>
  assert.ok(loadChecks({ getItem: () => "x".repeat(100001) }).error));
