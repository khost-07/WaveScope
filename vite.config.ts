import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function realNetworkScannerPlugin(): Plugin {
  const handleApiRequest = (req: any, res: any, next: any) => {
    const rawUrl = req.url || '';
    const urlPath = rawUrl.split('?')[0].replace(/\/+$/, '');

    // Allow CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (urlPath === '/api/scan-network') {
      try {
        const { scanWholeNetwork } = require('./server/scannerCore.cjs');
        const scanData = scanWholeNetwork();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'SUCCESS', result: scanData }));
        return;
      } catch (err: any) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
        return;
      }
    }

    if (urlPath === '/api/wlan/real-telemetry') {
      try {
        const { parseNetshWlanInterfaces } = require('./server/scannerCore.cjs');
        const realData = parseNetshWlanInterfaces();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: realData ? 'SUCCESS' : 'NO_ACTIVE_INTERFACE',
          provenance: 'Windows Native WLAN API (netsh wlan show interfaces)',
          device: realData ? realData.device : null
        }));
        return;
      } catch (err: any) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
        return;
      }
    }

    if (urlPath === '/api/wlan/nearby-networks') {
      try {
        const { parseNearbyWlanNetworks } = require('./server/scannerCore.cjs');
        const result = parseNearbyWlanNetworks();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return;
      } catch (err: any) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message, networks: [] }));
        return;
      }
    }

    if (urlPath === '/api/wlan/connect-network' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const { connectToWlanNetwork } = require('./server/scannerCore.cjs');
          const payload = JSON.parse(body || '{}');
          const result = connectToWlanNetwork(payload);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: err.message }));
        }
      });
      return;
    }

    next();
  };

  return {
    name: 'real-network-scanner-plugin',
    configureServer(server) {
      server.middlewares.use(handleApiRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApiRequest);
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
