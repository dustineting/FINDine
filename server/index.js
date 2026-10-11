import { createApp } from './app.js'

const PORT = process.env.PORT || 5000
const app = createApp({ serveFrontend: true })
app.listen(PORT, () => console.log(`[api] FINDine API listening on http://localhost:${PORT}`))
