import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/spinitron': {
          target: 'https://spinitron.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/spinitron/, '/api'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const token = env.VITE_SPINITRON_API_TOKEN
              if (token) {
                proxyReq.setHeader('Authorization', `Bearer ${token}`)
              }
            })
          },
        },
        '/api/stream': {
          target: 'https://listen.bsrlive.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/stream/, '/bsrmp3'),
        },
      },
    },
  }
})
