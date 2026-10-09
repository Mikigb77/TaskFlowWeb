# TaskFlow Web

TaskFlow’s marketing website and the foundation for a future browser app. Built with **Next.js 16, React 19, TypeScript, and Tailwind CSS 4**. This repository is independent of the Flutter/Django repository. Work in `dev`; `main` remains the release branch.

## Run locally

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
- Page metadata, generated social preview image, privacy notice for this website, robots.txt, and sitemap.
- Locally bundled Manrope font; its SIL Open Font License is in `public/fonts/OFL.txt`.

The demo is explicitly a simulation. It makes no AI or backend requests, records no audio, and stores no tasks or personal data. Edits exist only in page memory and reset on reload. Dates intentionally use the sample week of 21 September 2026. The primary buttons point to this demo. There is no public app download, pricing, waitlist, or email service configured, and the page says so.

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
pwsh -File scripts/deploy-cloud-run.ps1 -Plan

# Build and deploy the latest origin/main, then check its public health endpoint.
pwsh -File scripts/deploy-cloud-run.ps1
```

The script always fetches **`origin/main`** and builds a temporary Git archive of that commit. It can be invoked from `dev`: local edits and other branches are never uploaded. Merge the website PR into `main` before deploying. Builds are tagged with the full commit, deployed by immutable image digest, and verified against `/health/`. A failure stops the script; a failed build does not replace the running service.

Defaults (override with `-ProjectId`, `-Account`, `-Region`, `-Service`):

| Setting        | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Project        | `taskflow-511107`                                             |
| Region         | `europe-southwest1` (Madrid)                                  |
| Service        | `taskflow-web`                                                |
| Public preview | `https://taskflow-web-177649734578.europe-southwest1.run.app` |
| Capacity       | 1 CPU, 512 MiB, concurrency 40                                |
| Scaling        | 0–1 instances, request-based CPU billing                      |
| Indexing       | Disabled for this provisional deployment                      |

The first run enables Cloud Run, Cloud Build, Artifact Registry and IAM APIs and creates the website's image repository, private build-source bucket and two keyless service accounts. The runtime account has no project roles. The builder can read only this source bucket, write this image repository and emit logs. The project must already have billing enabled, and the deploying user needs permission to create these resources and assign those roles (the project owner can). The script never changes account defaults, payment configuration, custom domains or DNS.

Scale-to-zero avoids keeping an idle instance running, but builds, image/source storage, logs and traffic can still incur usage charges. The instance limit controls scaling; it is not a hard spending cap. The first request after idle may take longer. Images remain available for rollback; review old build artifacts as usage grows.

To review a deployed instance with the browser suite (WSL):

```bash
PLAYWRIGHT_BASE_URL=https://taskflow-web-177649734578.europe-southwest1.run.app npm test
```

The temporary URL above is the configured target; a successful script run confirms it is online and also prints Google's alternate service URL. The health response identifies the actual deployed commit. Google Cloud's console provides revision history and traffic controls for rollback to a previous healthy revision.

## Before launching on a custom domain

Set the build-time `SITE_URL` to the final HTTPS origin (see `.env.example`) and explicitly set `SITE_INDEXABLE=true` when you want search indexing, then rebuild. The deployment script intentionally keeps the provisional Cloud Run origin and `SITE_INDEXABLE=false`; update that configuration as part of a future domain launch. Until indexing is enabled, metadata and robots.txt ask crawlers not to index the preview and the sitemap is empty. Connect a verified download or waitlist URL only when it actually exists.

The public routes are prerendered and do not require the Django backend to display. React client components handle only interaction and appearance. The screenshots are copied assets, so deploying this repository does not require access to the app repository.

## Adding the web app later

Keep marketing routes public and introduce signed-in pages in a separate route group. Use the existing Django API for accounts, tasks, sync, and AI; do not create a second user database or put the Google API key in browser code. Authentication, microphone permissions, and API integration will be implemented when we build those app features. The website’s current Permissions-Policy disables microphone access because the marketing walkthrough never records audio; scope that policy appropriately when a real capture route is added.

Useful references: [Next.js setup](https://nextjs.org/docs/app/getting-started/installation), [server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components), and [Tailwind CSS](https://tailwindcss.com/docs/installation/using-postcss).
