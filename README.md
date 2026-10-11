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
      config/db.js                  MongoDB connection
      services/jsonStore.js         Server-side JSON fallback
      data/restaurants.json         Existing restaurant dataset
    tests/                          Database connection, request, and error-handling checks
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
| npm run server       | Run the API alone on port 5000                           |
| npm test             | Test database connections, API client, and request state |
| npm run check:config | Type-check Vite configuration, not Vue components        |
| npm run format       | Format source and documentation                          |
| npm run format:check | Check formatting                                         |

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
