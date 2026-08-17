/**
 * LAYER 1: DATA DEFINITIONS
 * WaveScope Wi-Fi Band Analyzer & Root-Cause Diagnostic Tool
 * Strictly typed telemetry, physical capabilities, and diagnostic data structures.
 */

export type WiFiStandard = '802.11b' | '802.11g' | '802.11n' | '802.11ac' | '802.11ax' | '802.11be';
export type WiFiBand = '2.4GHz' | '5GHz' | '6GHz';
export type ChannelWidthMHz = 20 | 40 | 80 | 160 | 320;
export type MimoConfig = '1x1' | '2x2' | '3x3' | '4x4';

export interface DeviceCapabilities {
  supportedStandards: WiFiStandard[];
  maxStandard: WiFiStandard;
  supportedBands: WiFiBand[];
  supports6GHz: boolean;
  supports5GHz: boolean;
  maxChannelWidthMHz: ChannelWidthMHz;
  mimoStreams: MimoConfig;
  maxTheoreticalPhyMbps: number;
}

export interface APCapabilities {
  ssid: string;
  bssid: string;
  apModel: string;
  operatingStandards: WiFiStandard[];
  maxStandard: WiFiStandard;
  enabledBands: WiFiBand[];
  supports6GHz: boolean;
  supports5GHz: boolean;
  maxChannelWidthMHz: ChannelWidthMHz;
  channelUtilizationPct: number; // 0 - 100%
}

export interface TelemetryRecord {
  timestamp: number;
  bssid: string;
  band: WiFiBand;
  channel: number;
  channelWidthMHz: ChannelWidthMHz;
  standard: WiFiStandard;
  rssi_dBm: number;          // e.g. -45 dBm
  noiseFloor_dBm: number;    // e.g. -90 dBm
  snr_dB: number;            // e.g. 45 dB (Calculated or measured: RSSI - NoiseFloor)
  txLinkRate_Mbps: number;   // Current transmit link rate
  rxLinkRate_Mbps: number;   // Current receive link rate
  maxSupportedPhy_Mbps: number;
  retryRatePct: number;      // 0 - 100%
  packetLossPct: number;     // 0 - 100%
  mcsIndex: number;          // Modulation and Coding Scheme (0-11 for ax)
  spatialStreams: number;    // 1, 2, 4
}

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type DiagnosticStatus = 'HEALTHY' | 'ATTENTION' | 'CRITICAL';

export interface StructuredDiagnosis {
  primary_diagnosis: string;
  severity: SeverityLevel;
  status: DiagnosticStatus;
  confidence: number; // 0 - 100 integer
  evidence: string[];
  possible_causes: string[];
  secondary_factors: string[];
  hypothesis_scores: Record<string, number>;
  evaluated_at: number;
}

export interface ClientDevice {
  id: string;
  macAddress: string;
  ipAddress: string;
  hostname: string;
  deviceType: string;
  vendor: string;
  capabilities: DeviceCapabilities;
  apCapabilities: APCapabilities;
  telemetry: TelemetryRecord;
  scenarioId?: 'A' | 'B' | 'C' | 'D' | 'E' | 'CUSTOM';
  scenarioName?: string;
  scenarioDescription?: string;
}

export type DataSourceMode = 'SIMULATION' | 'REAL';

export interface DataProvenance {
  mode: DataSourceMode;
  sourceIdentifier: string; // e.g. "Simulation Engine [Fixed Scenario Dataset]" or "Windows Native WLAN API (netsh wlan)"
  adapterName?: string;
  lastUpdated: number;
  isDeterministic: boolean;
}
