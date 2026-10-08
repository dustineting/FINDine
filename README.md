# FINDine

A restaurant finder built with **MongoDB, Express, Vue 3, and Node.js (MEVN)**.
Vite compiles and serves Vue during development. Tailwind CSS styles the interface.

## Run in VS Code

Use Node.js 22.12+ in the Node 22 line, or Node 24+, with npm.
This project was verified with npm 11.16.0. In the terminal:

    npm ci
    npm run dev

On Windows PowerShell, use npm.cmd if script execution is blocked.
Open http://localhost:8443. One development command serves Vue and Express.

## Project Structure

    src/
      App.vue                 Page layout
      components/             Vue interface
      composables/useRequest.js  Shared request state and stale-response handling
      services/api.js         Calls the Express API
      index.css               Fonts and Tailwind theme
      main.js                 Vue entrypoint
    server/
      index.js                Starts the standalone Express server
      app.js                  Middleware and route registration
      routes/                 API endpoint definitions
      controllers/            Request handling and restaurant queries
      models/                 Mongoose schemas
      config/db.js            MongoDB connection
      services/jsonStore.js   Temporary server-side fallback
      data/restaurants.json   Existing restaurant dataset
    tests/                    Request and error-handling checks
    vite.config.ts            Vue build configuration and local API integration

AGENTS.md provides project instructions for Codex.
Application code uses JavaScript; Vite configuration uses TypeScript.

## Data Flow

    Vue -> Express API -> Mongoose -> MongoDB

Until MongoDB is configured, Express can serve the bundled restaurant JSON.
The browser always calls Express. API failures show an error and retry option;
there is no browser sample-data generator.

The API's X-Data-Source header reports mongodb or json. GET /api/health also
reports the selected source. A working interface alone does not verify MongoDB.
MongoDB setup remains a separate step; optional variables are in .env.example.

The browser timeout is 20 seconds, allowing time for the existing server's
5-second connection and 8-second query budgets.

## Commands

| Command              | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| npm run dev          | Vue and Express together on port 8443                 |
| npm run build        | Build frontend assets into dist/                      |
| npm run preview      | Check the built frontend and API locally on port 8443 |
| npm run server       | Run the API alone on port 5000                        |
| npm test             | Test API-client and request-state behavior            |
| npm run check:config | Type-check Vite configuration, not Vue components     |
| npm run format       | Format source and documentation                       |
| npm run format:check | Check formatting                                      |

PORT overrides the port. Set HOST in the shell to override Vite's default
127.0.0.1 bind address. Do not run dev and preview on the same port.

## API

All endpoints are read-only.

- GET /api/health
- GET /api/restaurants?search=&borough=&page=&limit=
- GET /api/restaurants/best?search=&limit=
- GET /api/restaurants/boroughs
- GET /api/restaurants/stats

The existing "best" query selects summed inspection scores greater than 90,
descending. This is the existing query rule, not a validated quality rating.

## Production

Vite preview is for local verification. The frontend build alone does not
deploy Express. Hosting must serve dist/ and forward /api to the standalone
Express server, with MONGODB_URI configured on the backend.

Site metadata is in index.html. The existing search-indexing restriction is
preserved in its robots meta tag and public/robots.txt.
