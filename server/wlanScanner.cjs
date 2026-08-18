/**
 * REAL WLAN TELEMETRY & NETWORK SCANNER (Node.js standalone backend daemon)
 * Directly interfaces with native WLAN API, ipconfig, arp -a, and ICMP probes.
 */

const http = require('http');
const { parseNetshWlanInterfaces, scanWholeNetwork, parseNearbyWlanNetworks, connectToWlanNetwork } = require('./scannerCore.cjs');

const PORT = 5174;
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/wlan/real-telemetry') {
    const realData = parseNetshWlanInterfaces();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: realData ? 'SUCCESS' : 'NO_ACTIVE_INTERFACE',
      provenance: 'Windows Native WLAN API (netsh wlan show interfaces)',
      device: realData ? realData.device : null
    }));
    return;
  }

  if (req.url === '/api/scan-network') {
    const scanData = scanWholeNetwork();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'SUCCESS',
      result: scanData
    }));
    return;
  }

  if (req.url === '/api/wlan/nearby-networks') {
    const result = parseNearbyWlanNetworks();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.url === '/api/wlan/connect-network' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = connectToWlanNetwork(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[WaveScope Real Data & Network Scanner] Listening on http://localhost:${PORT}`);
});
