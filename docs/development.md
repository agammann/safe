# Development and deployment

[Back to the README](../README.md) · [Contributing](../CONTRIBUTING.md)

## Prerequisites and setup

Use Node.js 24 and pnpm 11.19.0 to match the verification workflow. package.json declares Node.js 22.12.0 as the minimum. Install Git to clone the repository. On a standard Node.js installation, `npm install --global pnpm@11.19.0` installs the pinned package manager. Reopen the terminal if newly installed commands are not found.

```sh
git clone https://github.com/agammann/safe.git
cd safe
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://127.0.0.1:5173/**. The development server stays in the foreground; stop it with **Ctrl+C**. These commands also work in PowerShell when the tools are installed. If PowerShell blocks a package manager's script shim, use `pnpm.cmd` for the same commands instead of changing your execution policy.

No account, API key, database, or `.env` file is required. Live checks require access to Cloudflare's diagnostic endpoint. Automated tests use controlled responses and do not need to probe your real connection.

Keep pnpm-lock.yaml. Do not create a second lockfile with a different package manager. A frozen install failing because package.json and the lockfile disagree should be investigated rather than fixed by deleting the lockfile.

## Commands

Run commands from the repository root.

| Command | Purpose |
| --- | --- |
| `pnpm dev --host 127.0.0.1 --port 5173 --strictPort` | Start local development at http://127.0.0.1:5173/. |
| `pnpm build` | Build the static client and prepare Sites packaging. |
| `pnpm test` | Run all diagnostic, storage, and Worker tests. |
| `pnpm test:sites` | Run only the static Worker and packaging tests. |
| `pnpm audit --prod` | Check installed dependencies against the advisory service. Requires network access. |
| `pnpm preview --host 127.0.0.1 --port 4173 --strictPort` | Serve the existing production build at http://127.0.0.1:4173/. Run build first. |

Build before running the tests because the Sites tests inspect generated files. The preview does not rebuild automatically after edits. Stop it, rebuild, and restart it when testing a changed production build.

## Project layout

| Path | Responsibility |
| --- | --- |
| `src/App.jsx` | Navigation, reports, history, comparisons, guide, and privacy controls. |
| `src/check.js` | Fixed diagnostic endpoint, validation, timeouts, summaries, and comparisons. |
| `src/storage.js` | Local history validation and export; strips IP addresses. |
| `src/styles.css` | Safe's styles layered over Tabler. |
| `src/main.jsx` | React entry point, local fonts, and Tabler imports. |
| `tests/` | Controlled diagnostic cases, storage behavior, and Worker routing. |
| `worker/index.js` | Optional asset Worker with HTML route fallback. |
| `scripts/prepare-sites-build.mjs` | Copies the Worker and hosting manifest into the build output. |
| `.openai/hosting.json` | Existing Sites identity and binding configuration. Contains no credentials. |
| `.github/workflows/verify.yml` | GitHub installation, build, test, and dependency audit checks. |
| `docs/` | User instructions, developer instructions, and dated evidence. |
| `third-party/` | Attribution and license notices for bundled components. |

## How a check works

The browser makes three sequential requests to `https://www.cloudflare.com/cdn-cgi/trace`, with a six second timeout and 8 KiB streaming response limit per request. Requests omit credentials and referrers, reject redirects, and request uncached responses. The parser requires a valid IP, the HTTPS scheme, and TLS 1.2 or 1.3. It keeps only selected fields.

Public IPs remain in page memory. The storage layer removes them before saving or export, validates report fields, and recalculates summaries. It limits loading to 100,000 characters and keeps at most 20 reports. Local storage and exported files are not encrypted.

The reported median uses the middle successful duration for odd sample counts and the average of the two middle durations for even counts. Saved reports recompute the statistic from their samples. Unsupported connection information stays Unknown; do not treat an estimated `4g` connection speed as proof of mobile transport.

## Build output and hosting

`pnpm build` produces:

```text
dist/
  client/                Static HTML, JavaScript, CSS, and fonts
  server/index.js        Optional Sites asset Worker
  .openai/hosting.json   Sites build metadata
```

The public application is https://safe.alx21.chatgpt.site. GitHub contains the source; its verification workflow does not deploy the website. Documentation only changes do not require a live app redeployment.

For another static host, publish **the contents of `dist/client`** over HTTPS. Do not upload the repository root, node_modules, or the entire dist folder as the static web root. Serve index.html at `/` and retain the assets directory and generated license notices. Navigation uses URL fragments, so the main views do not require server routes. Any Content Security Policy added by the host must permit the existing Cloudflare diagnostic connection. Hosting provider setup is outside the local preview commands.

For the existing Sites deployment, authorized maintainers must reuse the project identity in `.openai/hosting.json`, build and test, push the exact source through the Sites workflow, save the matching packaged version, and verify deployment success. Do not create another Site to update this one or commit short lived hosting credentials. A fork intended for a separate Site needs its own project registration; the included identity belongs to Safe's existing deployment.

## Common setup problems

| Problem | Resolution |
| --- | --- |
| `node`, `git`, or `pnpm` not found | Install the missing tool and reopen the terminal. Check versions before installing dependencies. |
| A port is already in use | Stop the old server or choose a free port, such as `--port 5174`, and open that port in the browser. `--strictPort` prevents an unnoticed fallback. |
| Preview is missing or outdated | Run `pnpm build` successfully, then start preview from the repository root. |
| Sites tests report missing build files | Run `pnpm build` before `pnpm test`. |
| Diagnostic requests fail | Read the [user troubleshooting guide](user-guide.md#troubleshooting). Do not substitute fixture values for a failed live check. |

See [verification](verification.md) for what has actually been checked. Other browsers and physical devices require their own testing.
