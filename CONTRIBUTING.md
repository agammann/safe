# Contributing to Safe

Start with the [README](README.md) and [development guide](docs/development.md). Safe is a small browser connection diagnostic, with explicit limits on what it can establish.

## Report a problem

[Open an issue](https://github.com/agammann/safe/issues) with the browser and version, device type, steps to reproduce, expected behavior, and actual behavior. State whether you used the public website or a local copy. Use fictional labels and redact screenshots. Never post credentials, real IP addresses, browsing history, or private check results. Follow [SECURITY.md](SECURITY.md#reporting) for sensitive vulnerabilities.

## Prepare a change

1. Fetch the latest source and work on a branch in your fork or checkout.
2. Make a focused change and update the instructions if behavior changes.
3. Use pnpm 11.19.0 and preserve the single pnpm lockfile.
4. Run the checks below for application changes.
5. Open a pull request explaining the problem, the resulting behavior, how it was verified, and any remaining limits.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm audit --prod
```

For documentation only changes, check local links and verify commands that you change. UI changes should also be checked in a browser at desktop and narrow widths. Keep test data fictional, and record genuine live verification separately from controlled fixtures.

## Preserve these product rules

1. Keep Measured, Explained, and Unknown distinct.
2. Do not infer overall WiFi safety, operator logging, or complete VPN/DNS protection from a browser request.
3. Do not scan other devices or collect their traffic.
4. Keep public IPs out of persistence, exports, and committed evidence.
5. Keep request count, response size, timeouts, and history bounded.
6. Use WiFi consistently in product copy and preserve third party notices.

Generated builds, installed dependencies, private local captures, credentials, and real reports do not belong in commits. Publishing source to GitHub does not update the live website; see the [hosting instructions](docs/development.md#build-output-and-hosting).

No license has been selected for Safe's original application code. This guide does not grant additional rights or apply dependency licenses to the application.
