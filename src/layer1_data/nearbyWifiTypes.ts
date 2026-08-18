/**
 * NEARBY WI-FI NETWORK TYPES & DATA STRUCTURES
 */

export interface NearbyNetwork {
  ssid: string;
  bssid: string;
  signalPct: number;
  rssi_dBm: number;
  band: '2.4GHz' | '5GHz' | '6GHz';
  channel: number;
  radioType: string; // e.g. '802.11ax', '802.11ac', '802.11n', '802.11be'
  authentication: string; // e.g. 'WPA2-Personal', 'WPA3-Personal', 'Open', 'WPA2-Enterprise'
  encryption: string;
  channelUtilizationPct: number;
  connectedStationsCount: number;
  isSavedProfile: boolean;
  isConnected: boolean;
  vendor?: string;
}

export interface WifiQualityScore {
  totalScore: number; // 0 - 100
  signalScore: number; // max 35
  bandScore: number; // max 25
  congestionScore: number; // max 20
  standardScore: number; // max 12
  securityScore: number; // max 8
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  isBest: boolean;
  recommendationReasons: string[];
  throughputMultiplier: number; // e.g. 1.8x faster
}

export interface ScoredNetwork extends NearbyNetwork {
  score: WifiQualityScore;
  rank: number;
}

export interface NearbyNetworksScanResult {
  timestamp: number;
  isReal: boolean;
  currentConnectedSsid: string | null;
  networks: ScoredNetwork[];
  bestNetwork: ScoredNetwork | null;
  comparisonSummary: string;
}

export interface ConnectNetworkRequest {
  ssid: string;
  password?: string;
  bssid?: string;
}

export interface ConnectNetworkResponse {
  success: boolean;
  message: string;
  connectedSsid?: string;
}
