import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Expose process.env.API_KEY to the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      // Increase warning limit slightly since 3D apps are naturally larger
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split third-party dependencies into separate chunks
            if (id.includes('node_modules')) {
              if (id.includes('three') || id.includes('@react-three')) {
                return 'vendor-three'; // Group all 3D related libs
              }
              if (id.includes('@mediapipe')) {
                return 'vendor-mediapipe'; // Separate gesture recognition
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai'; // Separate AI SDK
              }
              return 'vendor'; // Other small dependencies
            }
          }
        }
      }
    }
  }
})