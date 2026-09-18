# Repository instructions

Safe is a browser connection diagnostic. Its tagline is Your WiFi welfare check. Use WiFi throughout user facing copy. Avoid hyphens and em dashes in prose where possible.

## Product boundaries

Keep Measured, Explained, and Unknown distinct. Never infer universal WiFi safety, VPN coverage, encrypted DNS, identity, or surveillance from browser probes. Do not add scans of other devices. Never commit real check results, IP addresses, credentials, or browser data.

## Source and documentation

The public repository is https://github.com/agammann/safe. Fetch current remote changes before editing and preserve unrelated work. Keep setup commands aligned with package.json, pnpm-lock.yaml, and the verification workflow. User instructions are in README.md and docs/user-guide.md; maintainer instructions are in docs/development.md and CONTRIBUTING.md.

Use the pinned pnpm version. Run pnpm build and pnpm test for application changes. For documentation changes, validate links and any changed setup commands. Preserve dated verification evidence and distinguish historical checks from new checks.

## Design

The interface adapts Tabler's sidebar dashboard. Preserve the existing visual direction unless a redesign is requested. For substantial visual changes without a clear reference, use the Product Design context workflow. Record durable product decisions here.

## Hosting

The user authorized public HTTPS hosting at https://safe.alx21.chatgpt.site. Reuse the project_id in .openai/hosting.json and preserve public access. Use the Sites hosting workflow for deployment requests and app changes intended for release. Documentation only repository maintenance does not change the live website.

Keep .openai/hosting.json, worker/index.js, scripts/prepare-sites-build.mjs, and tests/sites-worker.test.mjs compatible. Before a Sites handoff, run pnpm build and pnpm test:sites. The build must produce dist/client/index.html, dist/server/index.js, and dist/.openai/hosting.json. Never persist hosting credentials.
