# Verification record

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

The clean application screenshot is `docs/safe-desktop.png`. Local visual captures are in the ignored `docs/evidence` folder. `design-qa.md` describes the template adaptation and visual checks.

Tests exercise several failure paths with deterministic fixtures, including timeout and cancellation. Those fixtures are not presented as live network measurements.

## Scope limits

Browser checks cannot certify router security, identify the WiFi owner or other users, establish surveillance, verify all-device VPN/DNS/ECH protection, or audit arbitrary apps. Diagnostic response availability is an external dependency.

Live testing used the local HTTP application page and HTTPS diagnostic requests. A hosted production HTTPS origin was not tested. Cross-browser Safari, Firefox, real iPhone/Android device behavior, and adverse real WiFi environments remain unverified. Narrow-screen checks are browser viewport tests, not physical device certification.

GitHub publication and CI are verified separately after the source commit is uploaded.
