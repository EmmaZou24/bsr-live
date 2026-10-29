import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.SANITY_PROJECT_ID': JSON.stringify(env.SANITY_PROJECT_ID),
      'import.meta.env.SANITY_DATASET': JSON.stringify(env.SANITY_DATASET),
      'import.meta.env.SANITY_API_VERSION': JSON.stringify(env.SANITY_API_VERSION),
    },
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
          target: 'https://azuracast.bsrlive.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/stream/, '/listen/brown_student_radio/bsr'),
        },
      },
    },
  }
})
