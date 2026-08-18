/**
 * REAL WLAN TELEMETRY & NETWORK SCANNER (Node.js standalone backend daemon)
 * Directly interfaces with native WLAN API, ipconfig, arp -a, and ICMP probes.
 */

const http = require('http');
const { parseNetshWlanInterfaces, scanWholeNetwork, parseNearbyWlanNetworks, connectToWlanNetwork } = require('./scannerCore.cjs');

const DEFAULT_PORT = 5175;

const server = http.createServer((req, res) => {
  const rawUrl = req.url || '';
  const urlPath = rawUrl.split('?')[0].replace(/\/+$/, '');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (urlPath === '/api/wlan/real-telemetry') {
    try {
      const realData = parseNetshWlanInterfaces();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: realData ? 'SUCCESS' : 'NO_ACTIVE_INTERFACE',
        provenance: 'Windows Native WLAN API (netsh wlan show interfaces)',
        device: realData ? realData.device : null
      }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
    }
    return;
  }

  if (urlPath === '/api/scan-network') {
    try {
      const scanData = scanWholeNetwork();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'SUCCESS',
        result: scanData
      }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
    }
    return;
  }

  if (urlPath === '/api/wlan/nearby-networks') {
    try {
      const result = parseNearbyWlanNetworks();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message, networks: [] }));
    }
    return;
  }

  if (urlPath === '/api/wlan/connect-network' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = connectToWlanNetwork(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found', url: urlPath }));
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`[WaveScope Real Data & Network Scanner Daemon] Active on http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[WaveScope Scanner Daemon] Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[WaveScope Scanner Daemon] Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
