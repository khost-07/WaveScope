/**
 * NETWORK SCANNER & AUDIT TYPES
 * Types for whole-network discovery and AI diagnostic reporting.
 */

export interface DiscoveredEndpoint {
  id: string;
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  deviceType: 'Router / Gateway' | 'Host Laptop / PC' | 'Laptop / PC' | 'Smartphone / Tablet' | 'Smart TV / Streaming' | 'IoT / Smart Home' | 'Network Printer' | 'Virtual NIC / Host Switch' | 'AP Sub-Gateway / Extender' | 'Endpoint Client' | 'Unknown Device';
  isGateway: boolean;
  pingMs: number;
  band?: '2.4GHz' | '5GHz' | '6GHz' | 'Ethernet / LAN';
  status: 'ACTIVE' | 'LAGGY' | 'SUSPICIOUS';
}

export interface RouterProbeData {
  ip: string;
  bssid: string;
  ssid: string;
  band: string;
  channel: number;
  channelWidthMHz: number;
  standard: string;
  signalPct: number;
  rssi_dBm: number;
  gatewayPingMs: number;
  dnsLatencyMs: number;
  totalBssidsInArea: number;
  security: string;
}

export interface NetworkScanResult {
  timestamp: number;
  scanDurationMs: number;
  router: RouterProbeData;
  devices: DiscoveredEndpoint[];
  isReal: boolean;
  clientIsolationActive?: boolean;
  subnet: string;
}

export interface NetworkAuditReport {
  overallHealthScore: number;
  healthGrade: string; // 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  executiveSummary: string;
  routerAssessment: {
    status: 'Optimal' | 'Warning' | 'Critical';
    channelCongestionVerdict: string;
    bandEfficiencyVerdict: string;
    gatewayLatencyVerdict: string;
  };
  deviceBreakdown: {
    totalActive: number;
    categories: Record<string, number>;
    highBandwidthDevices: string[];
    suspiciousOrUnknown: string[];
  };
  keyBottlenecks: string[];
  actionablePlan: Array<{
    priority: 'High' | 'Medium' | 'Low';
    action: string;
    simpleWhy: string;
    targetComponent: 'Router Settings' | 'Device Placement' | 'Band Migration' | 'Security';
  }>;
  generatedAt: number;
  sourceModel: string;
}
