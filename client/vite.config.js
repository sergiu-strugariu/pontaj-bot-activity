import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  server: {
	host: true,
    allowedHosts: [
      'confidence-medicaid-desert-presents.trycloudflare.com'
    ],
	proxy: {
	  '/api': {
		target: 'http://localhost:3001',
		changeOrigin: true,
		secure: false,
		ws: true,
	  },		
	},
	hmr: {
		protocol: 'wss', // <--- IMPORTANT: Folosește WebSocket securizat
		clientPort: 443,
		host: 'confidence-medicaid-desert-presents.trycloudflare.com',
	},
  },
});
