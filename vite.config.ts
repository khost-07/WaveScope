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
        if (req.url === '/api/wlan/nearby-networks') {
          try {
            const { parseNearbyWlanNetworks } = require('./server/scannerCore.cjs');
            const result = parseNearbyWlanNetworks();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
            return;
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message, networks: [] }));
            return;
          }
        }
        if (req.url === '/api/wlan/connect-network' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { connectToWlanNetwork } = require('./server/scannerCore.cjs');
              const payload = JSON.parse(body || '{}');
              const result = connectToWlanNetwork(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
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
