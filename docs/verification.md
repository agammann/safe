# Verification record

[Back to the README](../README.md)

This page preserves dated release evidence. Historical results are not continuous monitoring or a claim that every browser and network has been tested.

## Real-world workflow review on September 19, 2026

The existing public HTTPS site completed live diagnostic checks and comparison in the Codex in-app Chromium browser. A two-tab test reproduced a defect: deleting a report in one tab and completing a check in a stale tab restored the deleted report. The corrected build synchronizes saved history, reads current saved data before a change, preserves unsaved session reports, and keeps public IPs confined to the originating tab's memory.

Two other corrections came from this review: a check with two successful requests now reports their average as its median, and browsers with blocked storage show **Session only** instead of claiming reports are saved.

Validation of the corrected build:

- Production build passed on Windows with Node 24.19.0 and pnpm 11.19.0; all 27 automated tests passed, including regressions for partial-check medians, stale-tab removal, unsaved reports, and IP boundaries.
- In two local browser tabs, removing a report updated the second tab. A subsequent check and reload did not restore the removed report. Removal and undo also worked.
- A local-only test harness supplied partial and failed diagnostic responses and delayed requests for cancellation. Partial results reported two successful requests; all failures stayed inconclusive with unavailable timing; cancellation saved no report. These are controlled fixtures, not adverse real WiFi measurements.
- With local storage deliberately blocked in the local test harness, an actual network check completed three requests. The app warned that results were session-only. Export created a real JSON download with three samples and no IP fields.
- A 390 by 844 CSS viewport showed a readable report, working navigation that closed after selection, and no page-wide horizontal overflow. Console inspection returned no warnings or errors.

No participants were recruited for this review. This is functional browser testing on the available connection, not evidence of usability across a user population. Physical phones, Safari, Firefox, captive portals, and actual network/VPN transitions still need independent testing. Open tabs should be reloaded after an update so that they all run the corrected application.

## Documentation review on September 17, 2026

The README, user guide, developer guide, and contributor instructions were checked against the application and package scripts. All 31 local documentation links and heading references passed validation. The application source, dependencies, and hosting configuration were unchanged.

A fresh GitHub clone installed successfully with `pnpm install --frozen-lockfile` using pnpm 11.19.0 and Node 24.19.0. The local Windows build then stopped at Vite's configuration loading with `spawn EPERM` in the restricted execution environment. This attempt does not count as a passed local build or a fresh local preview check. The [Verify Safe workflow](https://github.com/agammann/safe/actions/workflows/verify.yml) runs the full installation, production build, tests, and dependency audit independently on GitHub.

## Public release on September 12, 2026

Safe was published at [safe.alx21.chatgpt.site](https://safe.alx21.chatgpt.site) with public audience access. The deployment reported success, and a browser check from the hosted HTTPS page completed all three diagnostic requests with TLS 1.3. The report correctly identified that Safe itself loaded over HTTPS.

The synchronized GitHub source was commit `4d0b501f0229d2e29558abd68fe853df121b0aa6`. Its [verification workflow](https://github.com/agammann/safe/actions/runs/34740153636) passed installation, build, tests, and dependency audit. The hosted source had the same file tree, with a separate commit identity in the hosting service.

## Original local verification

Version: 0.1.0. Date: 2026-09-12. Environment: Windows, Node 24.19.0, pnpm 11.19.0, Codex in-app Chromium browser.

## Completed locally

1. Production build passed and generated the static client plus compatible Worker packaging.
2. All 24 automated tests passed. These cover parser validation, fictional IPv4 and IPv6 inputs, response and storage bounds, redirect policy, credentials/referrer omission, timeouts, cancellation, partial failure, malformed responses, summary calculations, IP comparison limits, IP removal before saving and export, history reload, storage failure, and static Worker behavior.
3. `pnpm audit --prod` reported no known vulnerabilities in the installed dependency tree. This is not an exhaustive source security audit.
4. The actual browser completed three live check runs with three valid HTTPS diagnostic responses in each. The endpoint reported TLS 1.3. Real addresses and full check payloads are not retained in this repository.
5. Two same-session checks showed an unchanged public IP. No device, VPN, or network settings were changed. An actual VPN transition was not tested.
6. After reload, reports remained available and IP comparison correctly became unavailable because addresses were not saved.
7. History view, report reopening, removal, undo, clearing generated verification reports, and empty history states worked in the browser.
8. Export produced a real JSON file in the browser's download directory. The file was inspected and had three samples with no IP field. The browser automation download event timed out even though the file was successfully downloaded; filesystem verification established the result.
9. Dark and light desktop layouts were visually checked. Mobile home and report layouts and mobile navigation were checked at a 390 by 844 CSS viewport. Closed mobile navigation was removed from the accessibility tree.
10. No browser warnings or errors were returned by the final console inspection.

## Evidence

The [application screenshot](safe-desktop.png) is included in the repository. Local visual captures remain in the ignored `docs/evidence` folder and are not distributed. The [design review](design-review.md) describes the template adaptation and visual checks.

Tests exercise several failure paths with deterministic fixtures, including timeout and cancellation. Those fixtures are not presented as live network measurements.

## Scope limits

Browser checks cannot certify router security, identify the WiFi owner or other users, establish surveillance, verify all-device VPN/DNS/ECH protection, or audit arbitrary apps. Diagnostic response availability is an external dependency.

The initial local tests used an HTTP app page with HTTPS diagnostic requests. The later hosted HTTPS check is recorded above. Safari, Firefox, real iPhone/Android device behavior, and adverse real WiFi environments remain unverified. Narrow screen checks are browser viewport tests, not physical device certification.
