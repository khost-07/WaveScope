/**
 * NETWORK SCAN SERVICE
 * Executes whole-network discovery sweeps (both real local probe and high-fidelity simulation testbeds).
 */

import { NetworkScanResult } from './networkScannerTypes';

const REAL_SCAN_ENDPOINTS = [
  '/api/scan-network',
  'http://localhost:5174/api/scan-network'
];

export const SIMULATED_NETWORK_SCAN: NetworkScanResult = {
  timestamp: Date.now(),
  scanDurationMs: 840,
  isReal: false,
  subnet: '192.168.1.0/24',
  router: {
    ip: '192.168.1.1',
    bssid: '2C:30:33:4F:1A:80',
    ssid: 'Enterprise-Core-AP04',
    band: '5GHz',
    channel: 36,
    channelWidthMHz: 80,
    standard: '802.11ax (Wi-Fi 6)',
    signalPct: 92,
    rssi_dBm: -45,
    gatewayPingMs: 3,
    dnsLatencyMs: 11,
    totalBssidsInArea: 8,
    security: 'WPA3-Enterprise / WPA2-PSK'
  },
  devices: [
    {
      id: 'dev-192-168-1-1',
      ip: '192.168.1.1',
      mac: '2C:30:33:4F:1A:80',
      hostname: 'gateway-cisco-catalyst.corp',
      vendor: 'Cisco Systems Inc.',
      deviceType: 'Router / Gateway',
      isGateway: true,
      pingMs: 2,
      band: '5GHz',
      status: 'ACTIVE'
    },
    {
      id: 'dev-192-168-1-102',
      ip: '192.168.1.102',
      mac: 'F4:F5:DB:41:2B:99',
      hostname: 'macbook-pro-m2.corp',
      vendor: 'Apple Inc.',
      deviceType: 'Laptop / PC',
      isGateway: false,
      pingMs: 4,
      band: '5GHz',
      status: 'ACTIVE'
    },
    {
      id: 'dev-192-168-1-108',
      ip: '192.168.1.108',
      mac: 'AC:DE:48:88:12:04',
      hostname: 'iphone-15-pro.corp',
      vendor: 'Apple Inc.',
      deviceType: 'Smartphone / Tablet',
      isGateway: false,
      pingMs: 7,
      band: '5GHz',
      status: 'ACTIVE'
    },
    {
      id: 'dev-192-168-1-115',
      ip: '192.168.1.115',
      mac: '50:82:C5:11:33:77',
      hostname: 'samsung-qled-tv.media',
      vendor: 'Samsung Electronics',
      deviceType: 'Smart TV / Streaming',
      isGateway: false,
      pingMs: 8,
      band: '5GHz',
      status: 'ACTIVE'
    },
    {
      id: 'dev-192-168-1-120',
      ip: '192.168.1.120',
      mac: '00:24:E8:90:54:12',
      hostname: 'thinkpad-x1-field.corp',
      vendor: 'Lenovo / Intel NIC',
      deviceType: 'Laptop / PC',
      isGateway: false,
      pingMs: 38,
      band: '5GHz',
      status: 'LAGGY'
    },
    {
      id: 'dev-192-168-1-140',
      ip: '192.168.1.140',
      mac: '84:F3:EB:21:49:01',
      hostname: 'thermal-sensor-b4.iot',
      vendor: 'Espressif (IoT Module)',
      deviceType: 'IoT / Smart Home',
      isGateway: false,
      pingMs: 9,
      band: '2.4GHz',
      status: 'ACTIVE'
    },
    {
      id: 'dev-192-168-1-141',
      ip: '192.168.1.141',
      mac: '84:F3:EB:77:90:12',
      hostname: 'smart-plug-livingroom.iot',
      vendor: 'Espressif (IoT Module)',
      deviceType: 'IoT / Smart Home',
      isGateway: false,
      pingMs: 11,
      band: '2.4GHz',
      status: 'ACTIVE'
    },
    {
      id: 'dev-192-168-1-155',
      ip: '192.168.1.155',
      mac: 'D8:96:85:33:AA:BB',
      hostname: 'office-laserjet-pro.lan',
      vendor: 'HP Inc.',
      deviceType: 'Network Printer',
      isGateway: false,
      pingMs: 5,
      band: 'Ethernet / LAN',
      status: 'ACTIVE'
    },
    {
      id: 'dev-192-168-1-180',
      ip: '192.168.1.180',
      mac: '98:E7:F4:55:66:77',
      hostname: 'playstation-5.lan',
      vendor: 'Sony Interactive Ent.',
      deviceType: 'Smart TV / Streaming',
      isGateway: false,
      pingMs: 6,
      band: '5GHz',
      status: 'ACTIVE'
    },
    {
      id: 'dev-192-168-1-205',
      ip: '192.168.1.205',
      mac: 'F0:D5:BF:99:88:77',
      hostname: 'amazon-echo-dot.lan',
      vendor: 'Amazon Technologies',
      deviceType: 'IoT / Smart Home',
      isGateway: false,
      pingMs: 14,
      band: '2.4GHz',
      status: 'ACTIVE'
    }
  ]
};

export async function scanLocalNetwork(mode: 'SIMULATION' | 'REAL' = 'REAL'): Promise<NetworkScanResult> {
  if (mode === 'SIMULATION') {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      ...SIMULATED_NETWORK_SCAN,
      timestamp: Date.now()
    };
  }

  // Strictly REAL mode: Query local live network scanner
  let lastError = 'Failed to connect to local network probe.';
  for (const endpoint of REAL_SCAN_ENDPOINTS) {
    try {
      const resp = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'SUCCESS' && data.result) {
          return {
            ...data.result,
            isReal: true
          };
        }
      } else {
        lastError = `Probe responded with HTTP ${resp.status}`;
      }
    } catch (err: any) {
      lastError = err.message || 'Probe timeout / connection refused';
    }
  }

  throw new Error(`Real network audit probe failed: ${lastError}. Make sure the WaveScope backend daemon is running.`);
}
