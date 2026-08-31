import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

// The backend has no CORS configuration, so the dev server proxies the API
// instead. Everything the browser requests is same-origin on :5173, which
// also keeps the SSE feed at /api/stream out of CORS territory.
const BACKEND = process.env.VITE_BACKEND_ORIGIN || 'http://localhost:8000'

// One table, shared by `vite dev` and `vite preview`, so a built app in dist/
// behaves exactly like the dev server rather than failing the moment it is
// served from anywhere else.
const proxy: Record<string, ProxyOptions> = {
  '/api': {
    target: BACKEND,
    changeOrigin: true,

    // /api/stream is Server-Sent Events. Anything that buffers the
    // response body turns a live feed into a long silence, so strip
    // the encodings that invite buffering and disable caching.
    configure: (server) => {
      server.on('proxyReq', (proxyReq, req) => {
        if (req.url?.startsWith('/api/stream')) {
          proxyReq.setHeader('Accept-Encoding', 'identity')
        }
      })

      server.on('proxyRes', (proxyRes, req) => {
        if (req.url?.startsWith('/api/stream')) {
          proxyRes.headers['cache-control'] = 'no-cache, no-transform'
          delete proxyRes.headers['content-encoding']
        }
      })
    },
  },

  '/actuator': {
    target: BACKEND,
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: { proxy },

  // Without this, `npm run build && npm run preview` serves the app on :4173
  // with no proxy: every /api call 404s against the preview server, and the
  // backend — which sends no CORS headers — cannot be reached directly either.
  preview: { proxy },
})
