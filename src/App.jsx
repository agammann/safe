import { useEffect, useRef, useState } from "react";
import {
  IconWifi,
  IconActivityHeartbeat,
  IconHistory,
  IconArrowsDiff,
  IconBook2,
  IconShieldLock,
  IconArrowRight,
  IconArrowUpRight,
  IconCheck,
  IconLock,
  IconEye,
  IconQuestionMark,
  IconWorld,
  IconDownload,
  IconSun,
  IconMoon,
  IconMenu2,
  IconX,
  IconTrash,
  IconRefresh,
  IconInfoCircle,
} from "@tabler/icons-react";
import { runCheck, snapshotBrowser, compareChecks } from "./check.js";
import {
  loadChecks,
  saveChecks,
  exportReport,
  STORAGE_KEY,
  MAX_CHECKS,
} from "./storage.js";

const PAGES = [
  ["check", "WiFi check", IconActivityHeartbeat],
  ["history", "Your checks", IconHistory],
  ["compare", "Compare checks", IconArrowsDiff],
  ["guide", "What WiFi can see", IconBook2],
  ["privacy", "Privacy & data", IconShieldLock],
];
const SOURCES = [
  [
    "Encryption and metadata",
    "https://ssd.eff.org/module/what-should-i-know-about-encryption",
  ],
  ["What a VPN protects", "https://ssd.eff.org/module/vpn.html"],
  [
    "Encrypted Client Hello",
    "https://developers.cloudflare.com/ssl/edge-certificates/ech/",
  ],
  [
    "Browser connection information",
    "https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation",
  ],
  ["Cloudflare privacy policy", "https://www.cloudflare.com/privacypolicy/"],
];
const formatTime = (value) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
const startingPage = () =>
  PAGES.some(([id]) => id === location.hash.slice(1))
    ? location.hash.slice(1)
    : "check";
function readSaved() {
  try {
    return loadChecks(localStorage);
  } catch {
    return {
      checks: [],
      error: "Local storage is unavailable. Checks work for this session.",
    };
  }
}
function initialTheme() {
  try {
    return localStorage.getItem("safe.theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function Evidence({ kind = "Explained" }) {
  return (
    <span className={`evidence evidence-${kind.toLowerCase()}`}>
      {kind === "Measured" ? (
        <IconActivityHeartbeat size={13} />
      ) : kind === "Unknown" ? (
        <IconQuestionMark size={13} />
      ) : (
        <IconBook2 size={13} />
      )}{" "}
      {kind}
    </span>
  );
}
function External({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
      <IconArrowUpRight size={14} />
    </a>
  );
}
function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty-state">
      <Icon size={42} stroke={1.4} />
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
function Finding({ icon: Icon, title, kind = "Explained", summary, children }) {
  return (
    <div className="finding">
      <span className="finding-icon">
        <Icon size={22} />
      </span>
      <div className="finding-body">
        <div className="finding-title">
          <h3>{title}</h3>
          <Evidence kind={kind} />
        </div>
        <p>{summary}</p>
        {children ? (
          <details>
            <summary>Why this matters</summary>
            <div className="detail-copy">{children}</div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
function Unknowns() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">What this check cannot verify</h2>
        <Evidence kind="Unknown" />
      </div>
      <div className="unknown-list">
        <p>
          <IconQuestionMark size={18} />
          <span>Who operates this WiFi or what they record</span>
        </p>
        <p>
          <IconQuestionMark size={18} />
          <span>WiFi password strength and router settings</span>
        </p>
        <p>
          <IconQuestionMark size={18} />
          <span>VPN coverage or DNS privacy across your device</span>
        </p>
        <p>
          <IconQuestionMark size={18} />
          <span>Other devices, their owners, or their activity</span>
        </p>
      </div>
      <div className="card-footer text-secondary">
        A successful check is not a security certificate.
      </div>
    </div>
  );
}
function Guide() {
  return (
    <>
      <div className="section-intro">
        <span className="eyebrow">A LITTLE CLARITY</span>
        <h2>Your content and your connection tell different stories.</h2>
        <p>
          These are explanations of how networks work. They are not findings
          that someone is watching you.
        </p>
      </div>
      <div className="card finding-list">
        <Finding
          icon={IconLock}
          title="Messages, passwords, and page contents"
          summary="HTTPS protects content in transit from ordinary network eavesdropping."
        >
          This assumes a properly secured connection and a trusted device. The
          website itself still receives what you send. Safe tests only its own
          browser requests. It cannot inspect the encryption of every app or
          certify your device.
        </Finding>
        <Finding
          icon={IconWorld}
          title="Which websites you visit"
          summary="A WiFi operator may learn destination domains from DNS or connection setup."
        >
          Encrypted DNS and Encrypted Client Hello can reduce domain exposure
          when supported. Destination IP addresses and traffic patterns can
          still reveal clues. Safe cannot establish DNS privacy or domain
          protection across your browsing from these probes.{" "}
          <External href={SOURCES[2][1]}>Learn about ECH</External>
        </Finding>
        <Finding
          icon={IconActivityHeartbeat}
          title="When you connect and how much data moves"
          summary="Traffic timing and volume can remain visible even when contents are encrypted."
        >
          A WiFi operator can observe your connection and the amount of traffic
          it carries. These patterns do not directly reveal message contents,
          but can support inferences about activity.
        </Finding>
        <Finding
          icon={IconShieldLock}
          title="What changes with a VPN"
          summary="A working VPN shields the traffic routed through it from the local WiFi operator."
        >
          The WiFi operator can still observe the VPN connection. The VPN
          provider becomes another party you trust. Split routing and device
          settings affect coverage. A changed public IP alone does not prove
          that every app is protected.{" "}
          <External href={SOURCES[1][1]}>Read EFF’s VPN guide</External>
        </Finding>
        <Finding
          icon={IconEye}
          title="Whether the WiFi knows your name"
          summary="A device address is not a verified identity, but a WiFi login may identify you."
        >
          Details you provide to a WiFi sign in page, such as an email address
          or hotel room number, can link a session to you. Private device
          addresses reduce some tracking but do not hide information you submit.
        </Finding>
      </div>
      <div className="source-links">
        Read the sources
        {SOURCES.slice(0, 4).map(([label, href]) => (
          <External href={href} key={href}>
            {label}
          </External>
        ))}
      </div>
    </>
  );
}

export function App() {
  const [initial] = useState(readSaved);
  const [checks, setChecks] = useState(initial.checks);
  const checksRef = useRef(initial.checks);
  const [page, setPage] = useState(startingPage);
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useState(initialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState(initial.error);
  const [undo, setUndo] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const controller = useRef(null);
  const runningLock = useRef(false);
  useEffect(() => {
    const handle = () => {
      if (location.hash === "#main") return;
      setPage(startingPage());
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
    try {
      localStorage.setItem("safe.theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const go = (id) => {
    location.hash = id;
    setPage(id);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };
  const commit = (next) => {
    checksRef.current = next;
    setChecks(next);
    try {
      const error = saveChecks(localStorage, next);
      if (error) setNotice(error);
    } catch {
      setNotice(
        "Results could not be saved. They remain available for this session.",
      );
    }
  };
  async function start() {
    if (runningLock.current) return;
    runningLock.current = true;
    setRunning(true);
    setSelected(null);
    setProgress(0);
    setRevealed(false);
    setNotice(null);
    setUndo(null);
    go("check");
    controller.current = new AbortController();
    try {
      const result = await runCheck({
        signal: controller.current.signal,
        onProgress: setProgress,
        browser: snapshotBrowser(navigator, location),
        label,
      });
      commit([result, ...checksRef.current].slice(0, MAX_CHECKS));
      setSelected(result);
      setLabel("");
      go("check");
    } catch (error) {
      setNotice(
        error.name === "AbortError"
          ? "Check cancelled. No result was saved."
          : "The check could not finish. Please try again.",
      );
    } finally {
      setRunning(false);
      runningLock.current = false;
      controller.current = null;
    }
  }
  function showReport(check) {
    setSelected(check);
    setRevealed(false);
    go("check");
  }
  function removeCheck(id) {
    setUndo(checks);
    commit(checks.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
    setNotice("Check removed. You can undo this below.");
  }
  function clearChecks() {
    setUndo(checks);
    commit([]);
    setSelected(null);
    setBeforeId("");
    setAfterId("");
    setNotice(
      "Saved checks cleared. You can undo this until you leave this page.",
    );
  }
  function restore() {
    commit(undo);
    setUndo(null);
    setNotice("Your checks were restored.");
  }
  function download(check) {
    const url = URL.createObjectURL(
      new Blob([exportReport(check)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `safe-check-${check.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function beginCompare() {
    setBeforeId(checks[1]?.id || "");
    setAfterId(selected?.id || checks[0]?.id || "");
    go("compare");
  }
  const before = checks.find((c) => c.id === (beforeId || checks[1]?.id));
  const after = checks.find((c) => c.id === (afterId || checks[0]?.id));
  const comparison =
    before && after && before.id !== after.id
      ? compareChecks(before, after)
      : null;
  const currentTitle = PAGES.find(([id]) => id === page)?.[1] || "WiFi check";
  const firstSuccess = selected?.samples.find((s) => s.ok);
  const tlsValues = [
    ...new Set(selected?.samples.filter((s) => s.ok).map((s) => s.tls) || []),
  ];

  return (
    <div className="page safe-app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside
        className={`safe-sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <a
          className="safe-brand"
          href="#check"
          onClick={() => {
            setSelected(null);
            setMenuOpen(false);
          }}
        >
          <IconWifi size={29} stroke={2.3} />
          <span>
            Safe<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="sidebar-caption">YOUR WIFI WELFARE CHECK</div>
        <nav>
          <div className="nav-section">WORKSPACE</div>
          {PAGES.slice(0, 3).map(([id, title, Icon]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={page === id ? "page" : undefined}
              className={`side-link ${page === id ? "active" : ""}`}
            >
              <Icon size={21} />
              <span>{title}</span>
              {id === "history" && checks.length > 0 ? (
                <span className="nav-count">{checks.length}</span>
              ) : null}
            </a>
          ))}
          <div className="nav-section nav-section-second">UNDERSTAND</div>
          {PAGES.slice(3).map(([id, title, Icon]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={page === id ? "page" : undefined}
              className={`side-link ${page === id ? "active" : ""}`}
            >
              <Icon size={21} />
              <span>{title}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <IconShieldLock size={24} />
          <p>
            Clarity, wherever you connect.
            <span>Home. Work. Everywhere WiFi.</span>
          </p>
          <span className="version">Safe 0.1</span>
        </div>
      </aside>
      {menuOpen ? (
        <button
          className="menu-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="safe-main">
        <header className="safe-topbar">
          <div className="topbar-left">
            <button
              className="btn btn-icon mobile-menu"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <IconX /> : <IconMenu2 />}
            </button>
            <span className="breadcrumb-label">Your workspace</span>
            <span className="breadcrumb-separator">/</span>
            <span>{currentTitle}</span>
          </div>
          <div className="topbar-actions">
            <span className="local-label">
              <IconDeviceStorage /> Saved on this device
            </span>
            <button
              className="btn btn-icon theme-toggle"
              aria-label={
                theme === "dark" ? "Use light theme" : "Use dark theme"
              }
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <IconSun size={20} />
              ) : (
                <IconMoon size={20} />
              )}
            </button>
          </div>
        </header>
        <main id="main" className="safe-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR CONNECTION, EXPLAINED</div>
              <h1>
                {page === "check"
                  ? selected
                    ? "Your WiFi check"
                    : "WiFi welfare check"
                  : currentTitle}
              </h1>
            </div>
            {page !== "check" || selected ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelected(null);
                  go("check");
                }}
                disabled={running}
              >
                <IconWifi size={19} /> New check
              </button>
            ) : null}
          </div>
          {notice ? (
            <div className="notice" role="status">
              <IconInfoCircle size={19} />
              <span>{notice}</span>
              {undo ? (
                <button className="btn btn-sm" onClick={restore}>
                  Undo
                </button>
              ) : null}
              <button
                className="btn btn-icon btn-sm"
                aria-label="Dismiss message"
                onClick={() => {
                  setNotice(null);
                  setUndo(null);
                }}
              >
                <IconX size={16} />
              </button>
            </div>
          ) : null}

          {page === "check" && !selected ? (
            <>
              <div className="welcome-grid">
                <section className="card check-hero">
                  <div className="hero-eyebrow">
                    <IconWifi size={20} /> A CHECK IN FOR YOUR WIFI
                  </div>
                  <h2>
                    What can this WiFi
                    <br className="desktop-break" /> see about me?
                  </h2>
                  <p>
                    Understand your connection, what it could reveal,
                    <br className="desktop-break" /> and the small changes that
                    can help.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      start();
                    }}
                  >
                    <label className="form-label" htmlFor="check-label">
                      Label this check{" "}
                      <span className="text-secondary">(optional)</span>
                    </label>
                    <input
                      id="check-label"
                      className="form-control"
                      maxLength={60}
                      placeholder="For example, home or after a VPN change"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      disabled={running}
                    />
                    <div className="start-actions">
                      <button
                        className="btn btn-primary btn-lg"
                        type="submit"
                        disabled={running}
                      >
                        {running ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : (
                          <IconActivityHeartbeat size={21} />
                        )}{" "}
                        {running
                          ? "Checking your connection…"
                          : "Check my WiFi"}
                        {!running ? <IconArrowRight size={18} /> : null}
                      </button>
                      {running ? (
                        <button
                          className="btn"
                          type="button"
                          onClick={() => controller.current?.abort()}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </form>
                  <div className="probe-disclosure">
                    <IconInfoCircle size={16} />
                    <span>
                      Runs 3 small HTTPS requests to Cloudflare. Cloudflare
                      receives your IP address and standard request information.{" "}
                      <button
                        onClick={() => go("privacy")}
                        className="inline-button"
                      >
                        How your data is handled
                      </button>
                    </span>
                  </div>
                  {running ? (
                    <div
                      className="check-progress"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="progress progress-sm">
                        <div
                          className="progress-bar"
                          style={{ width: `${(progress / 3) * 100}%` }}
                        />
                      </div>
                      <span>
                        {progress} of 3 requests completed. Each request has a 6
                        second timeout.
                      </span>
                    </div>
                  ) : null}
                </section>
                <aside className="card how-card">
                  <div className="card-body">
                    <span className="icon-tile">
                      <IconShieldLock size={27} />
                    </span>
                    <h2>
                      A little clarity. <br />
                      No guesswork.
                    </h2>
                    <p>Every result tells you what it is based on.</p>
                    <div className="evidence-explanation">
                      <Evidence kind="Measured" />
                      <span>Observed during this check</span>
                    </div>
                    <div className="evidence-explanation">
                      <Evidence kind="Explained" />
                      <span>How WiFi privacy works</span>
                    </div>
                    <div className="evidence-explanation">
                      <Evidence kind="Unknown" />
                      <span>Outside this browser’s view</span>
                    </div>
                    <div className="how-footer">
                      Safe checks your browser connection. It cannot certify an
                      entire WiFi network.
                    </div>
                  </div>
                </aside>
              </div>
              <div className="section-heading">
                <h2>What you’ll learn</h2>
                <button className="inline-button" onClick={() => go("guide")}>
                  Explore the guide <IconArrowRight size={16} />
                </button>
              </div>
              <div className="learn-grid">
                {[
                  [
                    IconLock,
                    "Connection protection",
                    "The encryption reported for our test requests.",
                  ],
                  [
                    IconWorld,
                    "What is visible",
                    "How network activity and content differ.",
                  ],
                  [
                    IconArrowsDiff,
                    "What changed",
                    "Compare checks after changing a setting.",
                  ],
                ].map(([Icon, title, copy]) => (
                  <div className="card learn-card" key={title}>
                    <Icon size={25} />
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                ))}
              </div>
              <div className="bottom-note">
                <IconInfoCircle size={18} />
                <span>
                  Your browser may not reveal whether it is using WiFi,
                  Ethernet, or mobile data. The report will say when that
                  information is unavailable.
                </span>
              </div>
              {checks.length ? (
                <div className="recent-strip">
                  <div>
                    <span className="eyebrow">LAST CHECK</span>
                    <p>
                      {checks[0].label || "Unlabelled check"}{" "}
                      <span className="text-secondary">
                        · {formatTime(checks[0].timestamp)}
                      </span>
                    </p>
                  </div>
                  <button className="btn" onClick={() => showReport(checks[0])}>
                    View report <IconArrowRight size={17} />
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {page === "check" && selected ? (
            <>
              <div className="report-meta">
                <span>
                  {selected.label || "Unlabelled check"} ·{" "}
                  {formatTime(selected.timestamp)}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => download(selected)}
                >
                  <IconDownload size={17} /> Export report
                </button>
              </div>
              <div className="report-summary card">
                <div>
                  <span className="eyebrow">CONNECTION CHECK</span>
                  <h2>
                    {selected.summary.successful === 3
                      ? "All 3 test requests completed"
                      : selected.summary.successful
                        ? `${selected.summary.successful} of 3 test requests completed`
                        : "We couldn’t complete the test requests"}
                  </h2>
                  <p>
                    {selected.summary.successful
                      ? "The findings below apply to these browser requests. Other apps and destinations may behave differently."
                      : "This can happen because of connectivity, filtering, browser settings, or service availability. It does not establish an attack."}
                  </p>
                </div>
                <span
                  className={`summary-icon ${selected.summary.successful ? "" : "incomplete"}`}
                >
                  {selected.summary.successful ? (
                    <IconActivityHeartbeat size={38} />
                  ) : (
                    <IconQuestionMark size={38} />
                  )}
                </span>
              </div>
              <div className="stats-grid">
                <div className="card stat-card">
                  <span className="eyebrow">HTTPS RESPONSES</span>
                  <strong>
                    {selected.summary.successful}
                    <small> / 3</small>
                  </strong>
                  <span>From Cloudflare’s diagnostic</span>
                </div>
                <div className="card stat-card">
                  <span className="eyebrow">MEDIAN REQUEST TIME</span>
                  <strong>
                    {selected.summary.medianMs === null
                      ? "Unavailable"
                      : `${selected.summary.medianMs}`}
                    <small>
                      {selected.summary.medianMs === null ? "" : " ms"}
                    </small>
                  </strong>
                  <span>Includes browser and service overhead</span>
                </div>
                <div className="card stat-card">
                  <span className="eyebrow">CONNECTION TYPE</span>
                  <strong className="text-capitalize">
                    {selected.browser.connectionType === "unknown"
                      ? "Unavailable"
                      : selected.browser.connectionType === "wifi"
                        ? "WiFi"
                        : selected.browser.connectionType}
                  </strong>
                  <span>What this browser reported</span>
                </div>
              </div>
              {selected.summary.ipChangedDuringCheck ? (
                <div className="notice">
                  <IconInfoCircle size={19} />
                  The public IP changed during this check. These requests may
                  have used different routes.
                </div>
              ) : null}
              <div className="report-grid">
                <div className="card finding-list">
                  <div className="card-header">
                    <h2 className="card-title">
                      Your connection, in plain language
                    </h2>
                  </div>
                  <Finding
                    icon={IconLock}
                    title="Encryption for the test requests"
                    kind={firstSuccess ? "Measured" : "Unknown"}
                    summary={
                      firstSuccess
                        ? `Cloudflare reported ${tlsValues.join(" and ")} on the successful requests.`
                        : "We did not receive a valid encryption report."
                    }
                  >
                    Your browser connected to an HTTPS endpoint using its normal
                    certificate trust. This protects content in transit on those
                    requests. It does not test every application, detect trusted
                    interception certificates, or verify router settings.
                  </Finding>
                  <Finding
                    icon={IconWorld}
                    title="The address our test destination saw"
                    kind={firstSuccess ? "Measured" : "Unknown"}
                    summary={
                      firstSuccess?.ip
                        ? revealed
                          ? firstSuccess.ip
                          : "Public IP observed. Hidden for your privacy."
                        : firstSuccess
                          ? "The public IP was not retained in this saved check."
                          : "No public IP was verified."
                    }
                  >
                    {firstSuccess?.ip ? (
                      <>
                        <button
                          className="btn btn-sm mb-2"
                          onClick={() => setRevealed(!revealed)}
                        >
                          {revealed ? "Hide address" : "Reveal address"}
                        </button>
                        <br />
                      </>
                    ) : null}
                    This address can belong to your internet provider, a VPN, or
                    another proxy. It does not identify a person or establish
                    who owns the WiFi. IP addresses stay in memory only and are
                    omitted from saved checks and exports.
                  </Finding>
                  <Finding
                    icon={IconEye}
                    title="Website names and DNS privacy"
                    kind="Unknown"
                    summary="This check cannot verify whether all your destination names are hidden."
                  >
                    Cloudflare’s SNI response describes only these requests.
                    Encrypted DNS and ECH support vary by browser and
                    destination. A protected test connection does not prove that
                    other domains are hidden.
                  </Finding>
                  <Finding
                    icon={IconShieldLock}
                    title="Protection for this app’s page"
                    kind="Measured"
                    summary={
                      selected.browser.pageHttps
                        ? "Safe was loaded over HTTPS for this check."
                        : "Safe was not loaded over HTTPS for this check."
                    }
                  >
                    Local development may run over HTTP on your own device.
                    Production hosting should serve Safe over HTTPS. The
                    diagnostic requests themselves always use HTTPS. A browser’s
                    secure context flag is not used as a substitute for HTTPS.
                  </Finding>
                </div>
                <div className="report-aside">
                  <div className="card">
                    <div className="card-body">
                      <span className="icon-tile">
                        <IconArrowsDiff size={26} />
                      </span>
                      <h2 className="mt-3">
                        Make a change.
                        <br />
                        See the difference.
                      </h2>
                      <p className="text-secondary">
                        Change your existing VPN or connection setting, then run
                        another check.
                      </p>
                      <button
                        className="btn btn-primary w-100"
                        onClick={() => {
                          setSelected(null);
                          setLabel("After a change");
                        }}
                      >
                        Run another check <IconArrowRight size={17} />
                      </button>
                      <button
                        className="btn w-100 mt-2"
                        disabled={checks.length < 2}
                        onClick={beginCompare}
                      >
                        Compare saved checks
                      </button>
                      <p className="small text-secondary mt-3 mb-0">
                        A different IP alone does not prove VPN protection.
                      </p>
                    </div>
                  </div>
                  <Unknowns />
                </div>
              </div>
              <details className="card evidence-detail">
                <summary>View the measured evidence</summary>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Result</th>
                        <th>Elapsed</th>
                        <th>TLS</th>
                        <th>HTTP</th>
                        <th>SNI report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.samples.map((s, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{s.ok ? "Completed" : s.reason}</td>
                          <td>{s.ok ? `${s.elapsedMs} ms` : "Unavailable"}</td>
                          <td>{s.tls || "Unavailable"}</td>
                          <td>{s.http || "Unavailable"}</td>
                          <td>{s.sni || "Unavailable"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="small text-secondary px-3">
                  SNI values are reported by the test endpoint and describe
                  these requests only. Request time is not a speed test or a
                  measurement of WiFi signal strength.
                </p>
              </details>
            </>
          ) : null}

          {page === "history" ? (
            <>
              <p className="page-description">
                Your latest 20 checks, stored in this browser. Public IP
                addresses are never saved.
              </p>
              <div className="card">
                {!checks.length ? (
                  <Empty icon={IconHistory} title="A fresh start">
                    Your completed checks will appear here.
                    <button
                      className="btn btn-primary mt-3"
                      onClick={() => go("check")}
                    >
                      Check my WiFi <IconArrowRight size={17} />
                    </button>
                  </Empty>
                ) : (
                  <div className="history-list">
                    {checks.map((check) => (
                      <div className="history-row" key={check.id}>
                        <span className="finding-icon">
                          <IconWifi size={23} />
                        </span>
                        <div className="history-name">
                          <h3>{check.label || "Unlabelled check"}</h3>
                          <span>
                            {formatTime(check.timestamp)} ·{" "}
                            {check.summary.successful} of 3 requests completed
                          </span>
                        </div>
                        <button
                          className="btn btn-sm"
                          onClick={() => showReport(check)}
                        >
                          View report <IconArrowRight size={16} />
                        </button>
                        <button
                          className="btn btn-icon btn-sm"
                          aria-label={`Remove ${check.label || "check"} from ${formatTime(check.timestamp)}`}
                          onClick={() => removeCheck(check.id)}
                        >
                          <IconTrash size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
          {page === "compare" ? (
            <>
              <p className="page-description">
                Compare what changed between two checks. Differences are
                observations, not proof that a protection is enabled.
              </p>
              {checks.length < 2 ? (
                <div className="card">
                  <Empty
                    icon={IconArrowsDiff}
                    title="It takes two checks to compare"
                  >
                    Run a check, make a change, then run another.
                    <button
                      className="btn btn-primary mt-3"
                      onClick={() => go("check")}
                    >
                      Start a check <IconArrowRight size={17} />
                    </button>
                  </Empty>
                </div>
              ) : (
                <>
                  <div className="compare-selectors">
                    <label className="card card-body">
                      Before
                      <select
                        className="form-select mt-2"
                        value={before?.id || ""}
                        onChange={(e) => setBeforeId(e.target.value)}
                      >
                        {checks.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label || "Unlabelled"} ·{" "}
                            {formatTime(c.timestamp)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="card card-body">
                      After
                      <select
                        className="form-select mt-2"
                        value={after?.id || ""}
                        onChange={(e) => setAfterId(e.target.value)}
                      >
                        {checks.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label || "Unlabelled"} ·{" "}
                            {formatTime(c.timestamp)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {comparison ? (
                    <div className="card finding-list">
                      <Finding
                        icon={IconWorld}
                        title="Public IP"
                        kind={
                          comparison.ip === "unavailable"
                            ? "Unknown"
                            : "Measured"
                        }
                        summary={
                          comparison.ip === "changed"
                            ? "The test destination saw a different public IP."
                            : comparison.ip === "unchanged"
                              ? "The test destination saw the same public IP."
                              : "IP comparison is unavailable for these checks."
                        }
                      >
                        Addresses are retained only in memory until reload.
                        Saved checks and exports omit them. This comparison is
                        also unavailable if the address changed within a check.
                        An unchanged address does not prove a VPN is off, and a
                        changed address does not prove coverage.
                      </Finding>
                      <Finding
                        icon={IconActivityHeartbeat}
                        title="Median request time"
                        kind={
                          comparison.elapsedDifference === null
                            ? "Unknown"
                            : "Measured"
                        }
                        summary={
                          comparison.elapsedDifference === null
                            ? "Both checks need a successful request to compare timing."
                            : `${before.summary.medianMs} ms before · ${after.summary.medianMs} ms after`
                        }
                      >
                        Browser scheduling, connection setup, server load, and
                        routing can all affect these small samples. This is not
                        a WiFi speed benchmark.
                      </Finding>
                      <Finding
                        icon={IconLock}
                        title="Completed HTTPS requests"
                        kind="Measured"
                        summary={`${before.summary.successful} of 3 before · ${after.summary.successful} of 3 after`}
                      >
                        Only successfully validated diagnostic responses count.
                        Failures can result from network or service conditions
                        and do not establish malicious activity.
                      </Finding>
                    </div>
                  ) : (
                    <div className="notice">
                      Choose two different checks to compare.
                    </div>
                  )}
                  <div className="bottom-note">
                    <IconInfoCircle size={18} />
                    Safe does not change your WiFi or VPN settings. Make any
                    changes in your existing device or VPN controls.
                  </div>
                </>
              )}
            </>
          ) : null}
          {page === "guide" ? <Guide /> : null}
          {page === "privacy" ? (
            <>
              <div className="section-intro">
                <span className="eyebrow">YOUR CHECK. YOUR CONTROL.</span>
                <h2>
                  Useful information.
                  <br />A small data footprint.
                </h2>
                <p>
                  No account, advertising, or analytics in Safe’s application
                  code.
                </p>
              </div>
              <div className="card finding-list">
                <Finding
                  icon={IconWorld}
                  title="Who receives the test requests"
                  summary="Cloudflare receives three small HTTPS requests when you start a check."
                >
                  Cloudflare can see your public IP and the request information
                  your browser normally sends, including its user agent. Safe
                  omits credentials and referrer information. The website
                  hosting Safe also receives ordinary page and asset requests.
                  Their infrastructure may log requests under their own
                  policies.{" "}
                  <External href={SOURCES[4][1]}>
                    Cloudflare’s privacy policy
                  </External>
                </Finding>
                <Finding
                  icon={IconHistory}
                  title="What stays on this device"
                  summary="Up to 20 reports are stored in this browser, together with your theme preference."
                >
                  Saved reports include the time, optional label, browser
                  connection hints, and selected diagnostic results. Safe
                  discards the public IP before saving or exporting. The address
                  is available in memory for the current session. No browsing
                  history, DNS history, WiFi name, passwords, or other devices
                  are collected.
                </Finding>
                <Finding
                  icon={IconDownload}
                  title="What an exported report contains"
                  summary="Exports contain the selected check and its evidence. Public IP addresses are omitted."
                >
                  Your optional check label is included. Review it before
                  sharing. Exported files are under your control and remain
                  separate from the saved browser history.
                </Finding>
                <Finding
                  icon={IconQuestionMark}
                  title="What Safe cannot promise"
                  summary="A check cannot tell whether your WiFi operator is recording traffic."
                >
                  Safe cannot verify every app’s encryption, identify other
                  users, certify a VPN, or inspect router settings from a
                  browser. Unknown results remain unknown. A failed test is not
                  proof of an attack.
                </Finding>
              </div>
              <div className="privacy-controls card card-body">
                <div>
                  <h3>Saved checks on this device</h3>
                  <p className="text-secondary mb-0">
                    {checks.length} of 20 slots used. Clearing here does not
                    remove exported files.
                  </p>
                </div>
                <button
                  className="btn btn-outline-danger"
                  disabled={!checks.length || running}
                  onClick={clearChecks}
                >
                  <IconTrash size={18} /> Clear saved checks
                </button>
              </div>
              <p className="text-secondary small">
                Safe uses the MIT licensed{" "}
                <External href="https://tabler.io/admin-template">
                  Tabler dashboard template
                </External>{" "}
                and Tabler Icons.{" "}
                <External href="https://github.com/agammann/safe">
                  View the source on GitHub
                </External>
              </p>
            </>
          ) : null}
        </main>
        <footer className="safe-footer">
          <span>
            Safe <span className="footer-separator">·</span> Your WiFi welfare
            check
          </span>
          <button className="inline-button" onClick={() => go("privacy")}>
            Privacy & data <IconArrowUpRight size={14} />
          </button>
        </footer>
      </div>
    </div>
  );
}

function IconDeviceStorage() {
  return <IconShieldLock size={15} />;
}
