# FINDine

A restaurant finder built with **MongoDB, Express, Vue 3, and Node.js (MEVN)**.
Vite compiles and serves Vue during development. Tailwind CSS styles the interface.

## Run in VS Code

Use Node.js 22.12+ in the Node 22 line, or Node 24+, with npm.
This project was verified with npm 11.16.0. In the terminal:

    npm ci

Copy `.env.example` to `.env` and set `MONGODB_URI` to your Atlas connection URI,
including `/restaurants_db` as the database. Keep credentials in `.env`, which Git
ignores. The database must contain the `restaurants` collection; the application
does not import the JSON dataset into MongoDB automatically. Then start the app:

    npm run dev

On Windows PowerShell, use npm.cmd if script execution is blocked.
Open http://localhost:8443. One development command serves Vue and Express.

## Project Structure

    src/
      App.vue                       Page layout
      components/                   Vue interface
      composables/useRequest.js     Shared request state and stale-response handling
      directives/                   Scroll reveal directive
      services/api.js               Calls the Express API
      utils/                        Shared visibility observer
      index.css                     Fonts and Tailwind theme
      main.js                       Vue entrypoint
    public/
      images/                       Local AVIF images
      fonts/                        Local fonts and license files
      robots.txt                    Search crawler instructions
    server/
      index.js                      Starts the standalone Express server
      app.js                        Middleware and route registration
      routes/                       API endpoint definitions
      controllers/                  Request handling and restaurant queries
      models/                       Mongoose schemas
      middleware/                   API query validation
      config/db.js                  MongoDB connection
      services/jsonStore.js         Server-side JSON fallback
      data/restaurants.json         Existing restaurant dataset
    tests/                          Database connection, request, and error-handling checks
    scripts/setup-admin.js          Interactive local admin credential setup
    api/index.js                    Vercel Function entry point for the Express API
    vercel.json                     Vercel build, API routing, and function configuration
    vite.config.ts                  Vue build configuration and local API integration

AGENTS.md provides project instructions for Codex.
Application code uses JavaScript; Vite configuration uses TypeScript.

## Data Flow

    Vue -> Express API -> Mongoose -> MongoDB

Express reads the `restaurants` collection in the database selected by `MONGODB_URI`.
If MongoDB is unavailable, Express can serve the bundled restaurant JSON.
The browser always calls Express. API failures show an error and retry option;
there is no browser sample-data generator.

The API's X-Data-Source header reports mongodb or json. GET /api/health also
reports the selected source. A working interface alone does not verify MongoDB.
Restart the development server after changing the URI.

If Atlas SRV lookups fail with `querySrv` DNS errors, optionally set
`MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8` in `.env`. This configures DNS for the Node.js
process without changing Windows network settings. Leave it unset to use system DNS.

The browser timeout is 20 seconds. MongoDB server selection and connection timeouts
are 5 seconds, and queries use an 8-second execution limit. DNS resolution can take
longer than the connection timeout, so these settings do not guarantee that every
server request finishes within 20 seconds.

## Commands

| Command              | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| npm run dev          | Vue and Express together on port 8443                    |
| npm run build        | Build frontend assets into dist/                         |
| npm run preview      | Check the built frontend and API locally on port 8443    |
| npm run server       | Serve the built frontend and API together on port 5000   |
| npm start            | Serve the built frontend and API together on port 5000   |
| npm run admin:setup  | Generate local admin credentials and a session secret    |
| npm test             | Test database connections, API client, and request state |
| npm run check:config | Type-check Vite configuration, not Vue components        |
| npm run format       | Format source and documentation                          |
| npm run format:check | Check formatting                                         |

PORT overrides the port. Set HOST in the shell to override Vite's default
127.0.0.1 bind address. Do not run dev and preview on the same port.

## API

Public endpoints are read-only. Restaurant writes require an authenticated admin
session and a same-origin request.

Search accepts one string of up to 200 characters; borough accepts one string of
up to 100 characters. Limits and directory page numbers must be positive safe
integers. Limits are capped at 100 for the directory and 200 for Best Quality.
Malformed or repeated values for these supported parameters return HTTP 400.

- GET /api/health
- GET /api/restaurants?search=&borough=&page=&limit=
- GET /api/restaurants/best?search=&limit=
- GET /api/restaurants/boroughs
- GET /api/restaurants/stats
- POST /api/restaurants (admin)
- PATCH /api/restaurants/:id (admin; MongoDB document `_id`)
- DELETE /api/restaurants/:id (admin; MongoDB document `_id`)

The existing "best" query selects summed inspection scores greater than 90,
descending. This is the existing query rule, not a validated quality rating.

## Restaurant Management

Run this command in your own interactive terminal:

    npm run admin:setup

Enter your chosen admin username and password. Password input is hidden. The command
preserves the existing MongoDB configuration and saves `ADMIN_USERNAME`,
`ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` in the Git-ignored `.env` file.
Passwords must contain 12 to 256 characters. Only a salted scrypt password hash is
stored; the original password is not saved. Restart the local server afterward.

Open the site's Admin link in the footer or visit `/#admin`. Sign in to search,
add, edit, and delete restaurants. The same form handles creation and editing,
including optional inspection records. Deletion requires confirmation. Partial
edits preserve untouched fields and coordinates. Returning to the public site
reloads the directory, Best Quality results, and About totals.

Admin reads and writes require MongoDB and never use or modify the JSON fallback.
MongoDB generates each document's `_id`; if no restaurant identifier is provided
for a new record, the server generates one. The management endpoints are:

- GET /api/admin/session
- POST /api/admin/login
- POST /api/admin/logout
- GET /api/admin/restaurants?search=&borough=&page=&limit=

Sessions use signed, HttpOnly, SameSite cookies and expire after one hour. HTTPS
deployments use Secure cookies. Sign out clears this browser's cookie. Rotating the
session secret or changing the configured password hash invalidates all existing
sessions. Login attempts are limited per server instance; on Vercel, limits are
not shared between function instances. Vercel Firewall rate limiting can supplement
this for larger public deployments.

For Vercel Preview, add the three generated `ADMIN_` values under Project Settings
Environment Variables and redeploy. Use Production too when ready to release CRUD
on `main`. Do not use a `VITE_` prefix or commit these values. Preview and Production
modify the same collection if they use the same `MONGODB_URI`.

## Production

Build the frontend and start the standalone Express server:

    npm ci
    npm run build
    npm start

Express serves `dist/` and `/api` from the same origin. `npm run server` starts
the same server. The default port is 5000; hosting can set `PORT`. Configure
`MONGODB_URI` and, if necessary, `MONGODB_DNS_SERVERS` in the hosting environment.
Keep `dist/` in the deployed build output; it remains ignored by Git.

Vite dev and preview are for development and local verification. If frontend and
backend hosting are separate, forward `/api` requests to the Express server.

Site metadata is in index.html. Its robots meta tag and public/robots.txt allow
search indexing.

## Vercel

Import the GitHub repository as a Vercel project with the repository root (`.`)
as its Root Directory. Use the Vite framework preset and Node.js 24.x. The checked-in
`vercel.json` sets the install command to `npm ci`, the build command to
`npm run build`, and the output directory to `dist`. No start command is needed
on Vercel; `npm start` remains available for standalone hosting.

Vercel serves the frontend as static assets and forwards `/api/*` requests to
`api/index.js`, which exports the existing Express app. The function includes
`server/data/restaurants.json` to preserve the server-side fallback. The API uses
the existing shared MongoDB connection within each function instance.

In Vercel Project Settings, configure environment variables for Production and
Preview deployments:

- `MONGODB_URI`: your Atlas URI pointing to `restaurants_db`.
- `MONGODB_DNS_SERVERS`: optional; use only if Atlas DNS lookups fail.

These variables belong to the backend and must not use a `VITE_` prefix. The local
`.env` file is not uploaded. In Atlas Network Access, allow connections from the
deployment environment; access granted to your local computer does not cover Vercel.
Redeploy after changing environment variables.

After deploying, open `/api/health` on the deployment URL and confirm that it reports
`"source": "mongodb"`. Test the Directory filters and Best Quality search. A healthy
page alone does not confirm MongoDB because the JSON fallback remains available.

See [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
and [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json).
