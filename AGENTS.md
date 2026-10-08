# FINDine

MEVN restaurant finder: Vue 3 + Vite + Tailwind CSS v4 frontend, Express on Node.js
backend, and a Mongoose data layer. This project runs independently.

## Development

Use npm run dev to start the application on PORT (default 8443). Check for an
existing server before starting another. Vite mounts Express at /api for
development and local build previews. HOST defaults to 127.0.0.1.

Use npm and the Node version described in package.json. Keep package-lock.json
synchronized with dependency changes. Use npm ci for reproducible installs.

## Project Structure

Start with task-relevant files and follow imports when needed.

- src/main.js: Vue entrypoint, imports src/index.css and mounts App.vue.
- src/App.vue: primary page layout.
- src/components/: Vue single-file UI components.
- src/services/api.js: Express API client; errors are surfaced to the UI.
- src/composables/useRequest.js: loading, error, retry, and stale-response handling.
- src/index.css: Tailwind v4 import, fonts, and theme.
- server/app.js: Express middleware and routes.
- server/index.js: standalone API server.
- server/routes/, server/controllers/, server/models/: backend layers.
- server/config/db.js: MongoDB connection management.
- server/services/jsonStore.js: JSON fallback reader.
- server/data/restaurants.json: source dataset; do not reformat or replace casually.
- vite.config.ts: Vue, Tailwind, environment configuration, and Vite API bridge.
- index.html: page shell and metadata.
- public/: static assets copied into the frontend build.

## Conventions

Use Vue script setup and single-file components. Do not add React or JSX tooling.
Application files use JavaScript; build tooling uses TypeScript.
Use Tailwind utilities in Vue templates. Keep CSS imports first in src/index.css.
No Tailwind or PostCSS configuration file is needed.

Use four-space indentation with spaces, the checked-in formatter configuration,
and npm run format.
Use unique IDs for reusable form controls and maintain accessible labels.
Preserve existing page styling. Keep restaurant data on the server; do not add
browser sample-data fallbacks. Keep the server JSON fallback until MongoDB setup.
Keep credentials out of source; .env.example contains placeholders only.

## Verification

Run npm test, npm run build, npm run check:config, and npm run format:check after relevant changes.
check:config validates build tooling, not Vue component types.
For API changes, exercise affected endpoints without requiring a live database
unless the task specifically concerns MongoDB. Keep verification servers temporary.

See README.md for request flow, API endpoints, fallback behavior, and deployment
boundaries.
