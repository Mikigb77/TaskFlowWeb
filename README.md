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

## Before publishing

Set `SITE_URL` to the final HTTPS origin in the hosting environment (see `.env.example`) and rebuild. Until it is set, robots.txt asks crawlers not to index the preview and the sitemap is empty. Connect a verified download or waitlist URL only when it actually exists. The default configuration runs on a Next.js-compatible Node host. No website has been published by this initial setup.

The public routes are prerendered and do not require the Django backend to display. React client components handle only interaction and appearance. The screenshots are copied assets, so deploying this repository does not require access to the app repository.

## Adding the web app later

Keep marketing routes public and introduce signed-in pages in a separate route group. Use the existing Django API for accounts, tasks, sync, and AI; do not create a second user database or put the Google API key in browser code. Authentication, microphone permissions, API integration, and production hosting will be implemented when we build those app features. The website’s current Permissions-Policy disables microphone access because the marketing walkthrough never records audio; scope that policy appropriately when a real capture route is added.

Useful references: [Next.js setup](https://nextjs.org/docs/app/getting-started/installation), [server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components), and [Tailwind CSS](https://tailwindcss.com/docs/installation/using-postcss).
