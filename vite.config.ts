import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const host = process.env.HOST || '127.0.0.1'
const port = Number.parseInt(process.env.PORT || '8443', 10)

export default defineConfig({
    plugins: [vue(), expressApi(), tailwindcss()],
    server: { host, port, strictPort: true },
    preview: { host, port, strictPort: true },
})

/** Keep /api on the same origin in development and local build previews. */
function expressApi(): Plugin {
    async function mountApi(server: ViteDevServer | PreviewServer) {
        const { default: app } = await import('./server/app.js')
        server.middlewares.use((req, res, next) => {
            const pathname = req.url?.split('?')[0]
            if (pathname !== '/api' && !pathname?.startsWith('/api/')) return next()
            app(req, res, next)
        })
    }

    return {
        name: 'findine-express-api',
        apply: 'serve',
        configureServer: mountApi,
        configurePreviewServer: mountApi,
    }
}
