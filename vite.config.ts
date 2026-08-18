import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function realNetworkScannerPlugin(): Plugin {
  return {
    name: 'real-network-scanner-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/scan-network') {
          try {
            const { scanWholeNetwork } = require('./server/scannerCore.cjs');
            const scanData = scanWholeNetwork();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'SUCCESS', result: scanData }));
            return;
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
            return;
          }
        }
        if (req.url === '/api/wlan/real-telemetry') {
          try {
            const { parseNetshWlanInterfaces } = require('./server/scannerCore.cjs');
            const realData = parseNetshWlanInterfaces();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: realData ? 'SUCCESS' : 'NO_ACTIVE_INTERFACE',
              provenance: 'Windows Native WLAN API (netsh wlan show interfaces)',
              device: realData ? realData.device : null
            }));
            return;
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), realNetworkScannerPlugin()],
  css: {
    postcss: {
      plugins: []
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
