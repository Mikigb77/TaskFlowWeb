# TaskFlow Web

TaskFlow’s marketing website and the foundation for a future browser app. Built with **Next.js 16, React 19, TypeScript, and Tailwind CSS 4**. This repository is independent of the Flutter/Django repository. Work in `dev`; `main` remains the release branch.

## Run locally

Root `scripts/` contains only two deployment commands, each in PowerShell and Bash:

| Operation | PowerShell 7.2+ | Bash / WSL |
| --- | --- | --- |
| Local Docker website | `./scripts/deploy-local.ps1` | `bash scripts/deploy-local.sh` |
| Website on Cloud Run | `./scripts/deploy-cloud.ps1` | `bash scripts/deploy-cloud.sh` |

Other helpers (edge publishing, voice setup, usage reports and legal checks) live in `scripts/dev/`. The cloud implementation is there too, behind the public `deploy-cloud` command. Paths resolve from the script location, so absolute script paths also work from another directory.

For a production-style local preview using Docker Desktop, with WSL integration enabled:

```bash
bash scripts/deploy-local.sh --plan  # Print the command; don't start containers
bash scripts/deploy-local.sh        # Build the current working tree and wait for health
```

The PowerShell equivalents are `./scripts/deploy-local.ps1 -Plan` and `./scripts/deploy-local.ps1`. Open **http://localhost:3000**. Set `TASKFLOW_WEB_PORT` in your shell to choose another port, for example `TASKFLOW_WEB_PORT=3001 bash scripts/deploy-local.sh`, or `$env:TASKFLOW_WEB_PORT = '3001'` before the PowerShell command. The container binds only to localhost, disables the paid live AI demo and requires no Cloud credentials. Stop it with `docker compose down` from this repository. Local deployment does not affect Cloud Run or the Cloudflare edge.

For development with hot reload, use the existing Node setup instead:

Use Node 22.12 or newer (the existing WSL installation uses Node 26). In WSL:

```bash
source ~/.nvm/nvm.sh
cd /mnt/c/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb
nvm use
npm ci
npm run dev
```

Open **http://localhost:3000** in Windows or WSL. The Django playground remains on port 8088.

```bash
npm run check   # Generate Next route types and check TypeScript
npm run build   # Build and prerender the public pages
npm run start   # Serve the production build on port 3000
```

Dependencies are local to this repository. If you switch between Windows and WSL Node, reinstall dependencies with the matching runtime; native dependencies are platform-specific. Files remain in the existing Windows checkout, so WSL dependency installs can take longer than they do on a Linux filesystem.

## What is included

- Responsive marketing page with calendar, voice capture, details, and offline feature sections.
- Real Android screenshots from TaskFlow, matched to the selected light/dark appearance.
- Theme selection saved in local storage; the initial default follows the operating system.
- An interactive, editable walkthrough with three sample tasks, completion, and reset.
- Accessible mobile navigation, keyboard focus styles, native FAQ accordions, reduced-motion support, and a custom 404.
- Page metadata, generated social preview image, robots.txt, and sitemap.
- Privacy, terms, company notice and account-deletion instructions in English, Spanish and Catalan, effective 16 October 2026.
- Locally bundled Manrope font; its SIL Open Font License is in `public/fonts/OFL.txt`.

The sample walkthrough remains a simulation with a fixed example week. A separate, optional live demo accepts up to 60 seconds of recorded audio or 1,500 characters of text and returns editable task drafts. It supports English, Spanish, and Catalan, multiple tasks, and optional dates/times. Preview edits stay in page memory; nothing syncs to an app account. There is no public app download or paid website plan.

## Legal pages

The current legal documents are at `/privacy/`, `/terms/`, `/legal/` and `/delete-account/`, or their `/es/` and `/ca/` equivalents. They use the supplied company details and an adults-only initial audience. General enquiries use `taskflow@garbar.tech`; support, privacy and account deletion use `taskflow.support@garbar.tech`. These Google Workspace aliases are configured and active. The deletion page explains the app's **Settings → Account → Delete account** flow and offers a translated email request for people who cannot access the app or need help with provider-held data. It describes shared-content handovers, file removal, separate store cancellation and retention exceptions. See [legal document maintenance](docs/LEGAL_RELEASE.md) for implementation evidence and publication instructions.

`npm run legal:check` deliberately fails while required facts or operational reviews are incomplete. Local builds remain available for review; Docker/deployment checks prevent accidentally replacing the public notice with unfinished policies. Passing this check is not legal certification.

## Browser verification

```bash
npx playwright install chromium
npm run build
npm test
```

Playwright starts the production server when needed. It checks desktop and phone layouts, theme persistence, the task walkthrough, navigation, FAQs, 404 recovery, JavaScript-free content, and WCAG checks through axe. Screenshots are written to the ignored `artifacts` directory; failures retain traces under `test-results`. Linux browser libraries may need `npx playwright install-deps chromium` on a fresh machine.

## Deploy the preview to Google Cloud Run

Run the deployment script from PowerShell **7.2+**, with Git, `tar` and the Google Cloud CLI installed. Docker does not need to run locally. Google builds the Linux container using `Dockerfile` and `cloudbuild.yaml`, then Cloud Run serves the standalone Next.js app as a non-root user.

```powershell
# One-time sign-in. Preserve your existing CLI account/project defaults.
gcloud auth login tech.garbar@gmail.com --no-activate

# Inspect the target and the exact main commit without creating cloud resources.
pwsh -File scripts/deploy-cloud.ps1 -Plan

# Build and deploy the latest origin/main, then check its public health endpoint.
pwsh -File scripts/deploy-cloud.ps1
```

From WSL, use the matching Bash entry point:

```bash
bash scripts/deploy-cloud.sh --help  # Offline help; no Cloud access
bash scripts/deploy-cloud.sh --plan # Fetch main and check Cloud access; no deployment
bash scripts/deploy-cloud.sh
```

The Bash command delegates to the same PowerShell implementation. In WSL it prefers Windows PowerShell 7 and its existing Git/Cloud SDK login, including the standard PowerShell installation when `pwsh.exe` is not on WSL's PATH. Keep Windows interoperability enabled. Native `pwsh` is also supported if Git, tar and the authenticated Cloud SDK are installed in that environment. Failures propagate as nonzero exit codes. Bash options include `--project`, `--account`, `--region`, `--service`, `--site-url`, `--disable-voice` and `--turnstile-site-key`; use `--help` for the full list.

Cloud deployment **enables the live voice demo by default**, using `https://taskflow.garbar.tech`, its configured public Turnstile site key and the existing Secret Manager references. No enable flag or extra options are needed. To intentionally disable the demo, use `./scripts/deploy-cloud.ps1 -DisableVoice` or `bash scripts/deploy-cloud.sh --disable-voice`. The plan prints the selected state before deploying. A different public origin requires explicitly disabling voice, so the protected demo cannot accidentally be exposed on an unprotected preview URL. Local Docker previews continue to keep live AI disabled.

The script always fetches **`origin/main`** and builds a temporary Git archive of that commit. It can be invoked from `dev`: local edits and other branches are never uploaded. Merge the website PR into `main` before deploying. Builds are tagged with the full commit, deployed by immutable image digest, and verified against `/health/`. A failure stops the script; a failed build does not replace the running service.

Defaults (override with `-ProjectId`, `-Account`, `-Region`, `-Service`):

| Setting        | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Project        | `taskflow-511107`                                             |
| Region         | `europe-southwest1` (Madrid)                                  |
| Service        | `taskflow-web`                                                |
| Public preview | `https://taskflow-web-177649734578.europe-southwest1.run.app` |
| Capacity       | 1 CPU, 512 MiB, concurrency 8                                |
| Scaling        | 0–1 instances, request-based CPU billing                      |
| Indexing       | Disabled for this provisional deployment                      |

The first run enables Cloud Run, Cloud Build, Artifact Registry and IAM APIs and creates the website's image repository, private build-source bucket and two keyless service accounts. Voice setup adds AI prediction, Firestore, and access to three named secrets to the runtime account. The builder can read only this source bucket, write this image repository and emit logs. The project must already have billing enabled. Scripts preserve account defaults and payment configuration; only the separate edge deployment connects the requested TaskFlow subdomain.

Scale-to-zero avoids keeping an idle instance running, but builds, image/source storage, logs and traffic can still incur usage charges. The instance limit controls scaling; it is not a hard spending cap. The first request after idle may take longer. Images remain available for rollback; review old build artifacts as usage grows.

To review a deployed instance with the browser suite (WSL):

```bash
PLAYWRIGHT_BASE_URL=https://taskflow-web-177649734578.europe-southwest1.run.app npm test
```

The temporary URL above is the configured target; a successful script run confirms it is online and also prints Google's alternate service URL. The health response identifies the actual deployed commit. Google Cloud's console provides revision history and traffic controls for rollback to a previous healthy revision.

## Live voice demo and custom domain

The custom origin is **https://taskflow.garbar.tech**. A Cloudflare Worker creates the subdomain/certificate and proxies the Madrid Cloud Run service while keeping that hostname in the address bar. It does not redirect the parent domain or modify other app subdomains. Cloudflare stays on the Free plan; its platform limits still apply. Indexing remains disabled pending a deliberate public launch.

```powershell
# One-time infrastructure and free Turnstile widget. Run Wrangler login in WSL first.
pwsh -File scripts/dev/setup-voice.ps1
pwsh -File scripts/dev/setup-ai-spend-cap.ps1

# Merge dev into main first. This builds only origin/main; voice is on by default.
pwsh -File scripts/deploy-cloud.ps1

# Clean checkout at the same main commit; publishes edge and syncs its secret.
pwsh -File scripts/dev/deploy-edge.ps1

# Owner-only usage report using your existing Google Cloud sign-in.
pwsh -File scripts/dev/voice-stats.ps1
```

The same Cloud Run deployment from WSL is:

```bash
bash scripts/deploy-cloud.sh
# Only when deliberately turning the demo off:
bash scripts/deploy-cloud.sh --disable-voice
```

The default public widget key is `0x4AAAAAAFSOD8PvA-Wh35pV`; override it with `-TurnstileSiteKey` / `--turnstile-site-key` if it changes. The private Turnstile secret stays in Secret Manager. Edge publishing and one-time infrastructure setup remain separate maintenance operations under `scripts/dev/` and are not run automatically by either deployment entry point. To invoke a PowerShell maintenance helper from WSL with the existing Windows login, use `bash scripts/dev/invoke-powershell.sh "$(pwd)/scripts/dev/<helper>.ps1"` followed by its PowerShell arguments.

The site key is public by design. **There is no Gemini API key**: the Node server uses its Cloud Run service identity with Google Application Default Credentials. The three private values (`VOICE_APP_SECRET`, `VOICE_EDGE_SECRET`, and `TURNSTILE_SECRET_KEY`) live in Google Secret Manager; only the origin secret is also stored as a Cloudflare Worker secret. Never put them in `NEXT_PUBLIC_*`, browser code, build arguments, Git, or deployment output.

The live demo is intentionally isolated from the account-bearing Django app. Next server routes provide only this bounded demonstration and reuse the task concepts (title, optional date/time, priority, notes, clarification). They do not create another account system or task database. One `gemini-3.5-flash-lite` request transcribes and extracts JSON, with no tools, search, paid fallback, or automatic retry. Keep the Android/Django API as the future signed-in web app's source of truth.

### Protections and their limits

- Three attempts per signed visitor cookie in a rolling 24 hours; twelve per network in that window. IPv6 addresses are grouped by /64. Shared networks can hit the network limit; clearing a cookie does not reset it.
- Turnstile server verification checks success, hostname, and action before parsing an upload. The edge allows six submissions and thirty API requests per IP per minute. These edge burst counters are approximate; the durable Firestore allowances and spending transactions are authoritative.
- Only same-origin submissions with the trusted edge secret can invoke AI. The generated Cloud Run URL rejects direct AI calls; forged forwarding headers cannot set the trusted IP. The Cloud Run service remains public for marketing, so direct traffic can still incur small request/hosting charges. This is not a promise of zero DDoS costs.
- Uploads are capped at 2.6 MB. The server checks actual mono 16 kHz PCM bytes, headers, and duration (maximum 60 seconds), never a claimed duration. Text is capped at 1,500 characters. The model output is capped at 2,048 tokens and validated before display. Dates, questions, and priorities remain suggestions.
- Each admitted attempt atomically reserves **€0.02** against a **€25 UTC-calendar-month** AI allowance before calling Google. Successful calls settle to a conservative token estimate; failed/unknown calls keep the reservation charged. Crashed/unsettled jobs also remain charged, favoring an early pause over overspending. There is no 50-submission sitewide daily cutoff. Neither cookies, concurrent requests, nor server restarts reset this counter.
- Cost estimates use the 9 October 2026 global rate of $0.30/million input tokens and $2.50/million output tokens, multiplied by €1.25/USD as a deliberate currency cushion. Rates are fixed alongside the model and need review when changing it. These estimates are **not invoices** and exclude hosting, Firestore, taxes, other project usage, and provider price changes.
- A separate Google Billing spend-cap budget pauses the TaskFlow AI service at €25/month and alerts project owners/billing administrators at 50%, 80%, and 100%. Google enforcement can lag; overages and infrastructure remain billable. The ordinary website/sample demo is outside that AI cap.
- A request UUID bound to the signed session prevents duplicate model charges. Encrypted retry results expire after 24 hours; quota records after 48 hours. Firestore TTL deletion is asynchronous. Audio is not persisted. Monthly aggregates contain no task content.

The owner report shows attempts, success/failure, task count, audio minutes, estimated costs, pending reservations, and remaining budget. It is deliberately not a public cost/admin endpoint. Use Google Billing for actual invoices and Cloudflare analytics for traffic. For future paid plans, compare the report's mean AI cost per attempt with net subscription revenue and hosting costs; the demo does not currently collect revenue.

To pause only the live demo immediately:

```powershell
gcloud run services update taskflow-web --region=europe-southwest1 `
  --project=taskflow-511107 --account=tech.garbar@gmail.com `
  --update-env-vars=VOICE_DEMO_ENABLED=false
```

### Temporary developer testing

The public demo stays at **three AI submissions per signed browser per rolling 24 hours**. Each submission can generate several task drafts. Starting, stopping, listening to, rerecording, or editing a recording uses no allowance; pressing **Create drafts** submits it. Replaying an existing request does not call the model or consume another attempt. A request that ends without a result (an AI error, a timeout, or an answer that can’t be read) gives the visitor’s try back but keeps its budget reservation and its network count; a result with no task still uses the try (WD30).

To test beyond those daily limits, open **https://taskflow.garbar.tech/?developer=1#voice**, open the live demo, and expand **Developer testing** to get that browser's testing code. From an account with Firestore write access in this project:

```powershell
pwsh -File scripts/dev/voice-dev-window.ps1 -BrowserCode <browser-testing-code> -Minutes 30
# End a window early:
pwsh -File scripts/dev/voice-dev-window.ps1 -BrowserCode <browser-testing-code> -Revoke
```

Click **Check developer access** in that browser. Its countdown shows the active window. The grant is bound to the signed browser cookie and expires on the server automatically (maximum one hour); changing the URL or knowing the code does not grant access. An owner can grant another browser separately, including a friend's, if needed. The public link requires no developer parameter.

Only the daily browser/network allowances are waived during the window. Turnstile, same-origin verification, per-minute burst limits, upload/recording limits and the €25 AI budget remain enforced. Developer calls are included in spending reports and counted separately as `developerAttempts`; they do not use the public browser/network allowance. When the window ends, the browser resumes its previous rolling allowance rather than receiving a reset. Grants share the existing quota-record TTL; expiry does not depend on TTL deletion or a scheduled agent action.

### Security and concurrency verification

```bash
npm run test:unit
# Start the official Firestore emulator locally on port 8686, then:
FIRESTORE_EMULATOR_HOST=127.0.0.1:8686 npm run test:quota
npm run build && npm test
```

Quota tests refuse to use a real database and create an isolated emulator project. They test simultaneous admissions, shared-network limits, idempotent settlement and replay, encrypted storage, expiring developer grants, and concurrent monthly reservations. UI tests mock only the external widget/API at the browser boundary; production contains no fake-model or challenge bypass. Live text/audio smoke tests still need to be checked against the deployed service.

References: [Google service identity](https://docs.cloud.google.com/run/docs/securing/service-identity), [model pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing), [Google spend caps and latency](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Cloudflare custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

The marketing pages are prerendered; only the live-demo API routes run dynamically. The screenshots are copied assets, so deploying this repository does not require access to the app repository.

## Adding the web app later

Keep marketing routes public and introduce signed-in pages in a separate route group. Use the existing Django API for accounts, tasks, sync, and authenticated AI; do not create a second user database or put private credentials in browser code. Permissions-Policy allows only this site's microphone use, and capture requires an explicit visitor action and browser permission.

Useful references: [Next.js setup](https://nextjs.org/docs/app/getting-started/installation), [server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components), and [Tailwind CSS](https://tailwindcss.com/docs/installation/using-postcss).
