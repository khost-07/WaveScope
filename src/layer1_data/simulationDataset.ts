/**
 * LAYER 1: SIMULATION DATASET
 * Controlled, auditable dataset defining Scenarios A through E as specified in Section 2.
 * This acts as both the primary demo dataset and the deterministic test suite.
 */

import { ClientDevice, APCapabilities } from './types';

export const SIMULATED_AP: APCapabilities = {
  ssid: "Enterprise-Core-AP04",
  bssid: "74:83:C2:10:9B:40",
  apModel: "Cisco Catalyst 9130AX Series Tri-Band",
  operatingStandards: ["802.11n", "802.11ac", "802.11ax"],
  maxStandard: "802.11ax",
  enabledBands: ["2.4GHz", "5GHz", "6GHz"],
  supports6GHz: true,
  supports5GHz: true,
  maxChannelWidthMHz: 160,
  channelUtilizationPct: 24
};

export const SIMULATION_SCENARIOS: ClientDevice[] = [
  {
    id: "device-scenario-a",
    scenarioId: "A",
    scenarioName: "Scenario A: Baseline Nominal Performance",
    scenarioDescription: "Optimal RF channel conditions, Wi-Fi 6 operating on 5GHz band with clean SNR and negligible retransmissions.",
    macAddress: "3C:06:30:4F:1A:89",
    ipAddress: "192.168.10.142",
    hostname: "macbook-pro-m2.corp",
    deviceType: "Laptop / Workstation",
    vendor: "Apple Inc.",
    capabilities: {
      supportedStandards: ["802.11a", "802.11n", "802.11ac", "802.11ax"] as any,
      maxStandard: "802.11ax",
      supportedBands: ["2.4GHz", "5GHz", "6GHz"],
      supports6GHz: true,
      supports5GHz: true,
      maxChannelWidthMHz: 160,
      mimoStreams: "2x2",
      maxTheoreticalPhyMbps: 2402
    },
    apCapabilities: SIMULATED_AP,
    telemetry: {
      timestamp: Date.now(),
      bssid: "74:83:C2:10:9B:41",
      band: "5GHz",
      channel: 36,
      channelWidthMHz: 80,
      standard: "802.11ax",
      rssi_dBm: -45,
      noiseFloor_dBm: -80,
      snr_dB: 35,
      txLinkRate_Mbps: 1200,
      rxLinkRate_Mbps: 1200,
      maxSupportedPhy_Mbps: 1200,
      retryRatePct: 1.0,
      packetLossPct: 0.1,
      mcsIndex: 11,
      spatialStreams: 2
    }
  },
  {
    id: "device-scenario-b",
    scenarioId: "B",
    scenarioName: "Scenario B: Severe Path Attenuation",
    scenarioDescription: "Distance and structural barriers resulting in low received power (-76 dBm), compressed SNR (11 dB), and elevated retransmissions (18%).",
    macAddress: "78:28:CA:83:91:20",
    ipAddress: "192.168.10.158",
    hostname: "thinkpad-x1-field.corp",
    deviceType: "Laptop / Mobile",
    vendor: "Lenovo Corp.",
    capabilities: {
      supportedStandards: ["802.11a", "802.11n", "802.11ac", "802.11ax"] as any,
      maxStandard: "802.11ax",
      supportedBands: ["2.4GHz", "5GHz"],
      supports6GHz: false,
      supports5GHz: true,
      maxChannelWidthMHz: 80,
      mimoStreams: "2x2",
      maxTheoreticalPhyMbps: 1200
    },
    apCapabilities: SIMULATED_AP,
    telemetry: {
      timestamp: Date.now(),
      bssid: "74:83:C2:10:9B:41",
      band: "5GHz",
      channel: 44,
      channelWidthMHz: 80,
      standard: "802.11ac",
      rssi_dBm: -76,
      noiseFloor_dBm: -87,
      snr_dB: 11,
      txLinkRate_Mbps: 117,
      rxLinkRate_Mbps: 86,
      maxSupportedPhy_Mbps: 866,
      retryRatePct: 18.0,
      packetLossPct: 4.2,
      mcsIndex: 2,
      spatialStreams: 2
    }
  },
  {
    id: "device-scenario-c",
    scenarioId: "C",
    scenarioName: "Scenario C: In-Band RF Interference",
    scenarioDescription: "Strong received signal (-45 dBm) corrupted by severe co-channel interference / elevated noise floor (-55 dBm), crushing SNR to 10 dB with 20% retries.",
    macAddress: "94:E6:F7:22:B0:11",
    ipAddress: "192.168.10.180",
    hostname: "lab-workstation-03.corp",
    deviceType: "Desktop / Test Station",
    vendor: "Dell Technologies",
    capabilities: {
      supportedStandards: ["802.11b", "802.11g", "802.11n", "802.11ac", "802.11ax"] as any,
      maxStandard: "802.11ax",
      supportedBands: ["2.4GHz", "5GHz"],
      supports6GHz: false,
      supports5GHz: true,
      maxChannelWidthMHz: 40,
      mimoStreams: "2x2",
      maxTheoreticalPhyMbps: 574
    },
    apCapabilities: {
      ...SIMULATED_AP,
      channelUtilizationPct: 82 // heavy co-channel load
    },
    telemetry: {
      timestamp: Date.now(),
      bssid: "74:83:C2:10:9B:40",
      band: "2.4GHz",
      channel: 6,
      channelWidthMHz: 20,
      standard: "802.11ax",
      rssi_dBm: -45,
      noiseFloor_dBm: -55, // Elevated noise floor indicative of non-Wi-Fi / heavy co-channel RF
      snr_dB: 10,
      txLinkRate_Mbps: 54,
      rxLinkRate_Mbps: 48,
      maxSupportedPhy_Mbps: 287,
      retryRatePct: 20.0,
      packetLossPct: 5.8,
      mcsIndex: 3,
      spatialStreams: 1
    }
  },
  {
    id: "device-scenario-d",
    scenarioId: "D",
    scenarioName: "Scenario D: Legacy Hardware / Capability Bottleneck",
    scenarioDescription: "Single-band 2.4GHz legacy client (802.11n 1x1) constrained by physical radio limitations despite connected AP offering 802.11ax Tri-band.",
    macAddress: "00:1E:C0:92:44:A1",
    ipAddress: "192.168.10.201",
    hostname: "thermal-sensor-b4.iot",
    deviceType: "IoT / Sensor Hub",
    vendor: "Espressif Systems",
    capabilities: {
      supportedStandards: ["802.11b", "802.11g", "802.11n"] as any,
      maxStandard: "802.11n",
      supportedBands: ["2.4GHz"],
      supports6GHz: false,
      supports5GHz: false,
      maxChannelWidthMHz: 20,
      mimoStreams: "1x1",
      maxTheoreticalPhyMbps: 72
    },
    apCapabilities: SIMULATED_AP,
    telemetry: {
      timestamp: Date.now(),
      bssid: "74:83:C2:10:9B:40",
      band: "2.4GHz",
      channel: 1,
      channelWidthMHz: 20,
      standard: "802.11n",
      rssi_dBm: -50,
      noiseFloor_dBm: -80,
      snr_dB: 30,
      txLinkRate_Mbps: 65,
      rxLinkRate_Mbps: 65,
      maxSupportedPhy_Mbps: 72,
      retryRatePct: 2.0,
      packetLossPct: 0.2,
      mcsIndex: 7,
      spatialStreams: 1
    }
  },
  {
    id: "device-scenario-e",
    scenarioId: "E",
    scenarioName: "Scenario E: Sub-optimal Band Steering / Configuration",
    scenarioDescription: "High-tier Wi-Fi 6E capable device with strong signal (-48 dBm) attached to legacy 2.4GHz band instead of available 5GHz or 6GHz spectrum.",
    macAddress: "50:EB:71:0D:33:FF",
    ipAddress: "192.168.10.115",
    hostname: "pixel-8-pro.corp",
    deviceType: "Smartphone / Flagship",
    vendor: "Google LLC",
    capabilities: {
      supportedStandards: ["802.11a", "802.11n", "802.11ac", "802.11ax"] as any,
      maxStandard: "802.11ax",
      supportedBands: ["2.4GHz", "5GHz", "6GHz"],
      supports6GHz: true,
      supports5GHz: true,
      maxChannelWidthMHz: 160,
      mimoStreams: "2x2",
      maxTheoreticalPhyMbps: 2402
    },
    apCapabilities: SIMULATED_AP,
    telemetry: {
      timestamp: Date.now(),
      bssid: "74:83:C2:10:9B:40",
      band: "2.4GHz",
      channel: 11,
      channelWidthMHz: 20,
      standard: "802.11ax",
      rssi_dBm: -48,
      noiseFloor_dBm: -82,
      snr_dB: 34,
      txLinkRate_Mbps: 144,
      rxLinkRate_Mbps: 144,
      maxSupportedPhy_Mbps: 287,
      retryRatePct: 1.2,
      packetLossPct: 0.1,
      mcsIndex: 8,
      spatialStreams: 2
    }
  }
];
