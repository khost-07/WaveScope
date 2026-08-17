/**
 * LAYER 2 FEATURE: TREND / DRIFT DETECTION ENGINE
 * Maintains an in-memory rolling buffer of telemetry readings (10-15 samples per device)
 * and computes signal direction (improving / stable / degrading) with sparkline geometry.
 */

import { SIMULATION_SCENARIOS } from '../layer1_data/simulationDataset';

export interface TelemetrySample {
  timestamp: number;
  rssi_dBm: number;
  snr_dB: number;
  retryRatePct: number;
}

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DEGRADING';

export interface DeviceTrend {
  direction: TrendDirection;
  symbol: string;       // '↑' | '↓' | '→'
  label: string;        // 'improving' | 'stable' | 'degrading'
  qualifier: string;    // '(improving)' | '(stable)' | '(degrading)'
  color: string;        // hex color matching existing palette
  recentSamples: TelemetrySample[];
  sparklinePoints: number[]; // normalized 0-1 values for sparkline
  hasEnoughData: boolean;
}

const MAX_BUFFER_SIZE = 20;

// In-memory rolling store
const sampleBufferStore: Record<string, TelemetrySample[]> = {};

/**
 * Pre-populates synthetic history curves for the simulation dataset
 * ensuring realistic drift profiles for demo scenarios.
 */
function initializeSyntheticHistory(deviceId: string, currentRssi: number, currentSnr: number, currentRetries: number): TelemetrySample[] {
  const now = Date.now();
  const stepMs = 3000;
  const samples: TelemetrySample[] = [];

  if (deviceId === 'device-scenario-b' || deviceId === 'device-scenario-c') {
    // Clearly DEGRADING trend: starts healthy/moderate, deteriorates over 12 readings
    const startRssi = currentRssi + 6;
    const startSnr = currentSnr + 8;
    const startRetries = Math.max(1, currentRetries - 12);
    for (let i = 12; i >= 0; i--) {
      const progress = (12 - i) / 12;
      const t = now - (i * stepMs);
      const rssi = Math.round(startRssi + (currentRssi - startRssi) * progress);
      const snr = Math.round(startSnr + (currentSnr - startSnr) * progress);
      const retries = +(startRetries + (currentRetries - startRetries) * progress).toFixed(1);
      samples.push({ timestamp: t, rssi_dBm: rssi, snr_dB: snr, retryRatePct: retries });
    }
  } else if (deviceId === 'device-peer-5g') {
    // Clearly IMPROVING trend: starts attenuated, improves as client roams/wakes
    const startRssi = currentRssi - 8;
    const startSnr = currentSnr - 9;
    const startRetries = currentRetries + 4.5;
    for (let i = 12; i >= 0; i--) {
      const progress = (12 - i) / 12;
      const t = now - (i * stepMs);
      const rssi = Math.round(startRssi + (currentRssi - startRssi) * progress);
      const snr = Math.round(startSnr + (currentSnr - startSnr) * progress);
      const retries = +(startRetries + (currentRetries - startRetries) * progress).toFixed(1);
      samples.push({ timestamp: t, rssi_dBm: rssi, snr_dB: snr, retryRatePct: retries });
    }
  } else {
    // Flat / STABLE baseline with gentle natural RF micro-jitter (+- 0.5 dBm)
    for (let i = 12; i >= 0; i--) {
      const t = now - (i * stepMs);
      const jitter = (Math.sin(i * 1.2) * 0.5);
      samples.push({
        timestamp: t,
        rssi_dBm: Math.round(currentRssi + jitter),
        snr_dB: currentSnr,
        retryRatePct: currentRetries
      });
    }
  }

  return samples;
}

/**
 * Appends a new reading to the in-memory rolling buffer for a device.
 */
export function recordDeviceSample(
  deviceId: string,
  rssi_dBm: number,
  snr_dB: number,
  retryRatePct: number
): void {
  if (!sampleBufferStore[deviceId] || sampleBufferStore[deviceId].length === 0) {
    sampleBufferStore[deviceId] = initializeSyntheticHistory(deviceId, rssi_dBm, snr_dB, retryRatePct);
  } else {
    sampleBufferStore[deviceId].push({
      timestamp: Date.now(),
      rssi_dBm,
      snr_dB,
      retryRatePct
    });
    if (sampleBufferStore[deviceId].length > MAX_BUFFER_SIZE) {
      sampleBufferStore[deviceId].shift();
    }
  }
}

/**
 * Analyzes the rolling buffer for drift/trend direction and sparkline geometry.
 */
export function evaluateDeviceTrend(deviceId: string): DeviceTrend {
  if (!sampleBufferStore[deviceId] || sampleBufferStore[deviceId].length === 0) {
    const simDev = SIMULATION_SCENARIOS.find(d => d.id === deviceId);
    if (simDev) {
      sampleBufferStore[deviceId] = initializeSyntheticHistory(
        deviceId,
        simDev.telemetry.rssi_dBm,
        simDev.telemetry.snr_dB,
        simDev.telemetry.retryRatePct
      );
    }
  }

  const samples = sampleBufferStore[deviceId] || [];

  if (samples.length < 3) {
    return {
      direction: 'STABLE',
      symbol: '→',
      label: 'stable',
      qualifier: '(stable)',
      color: '#747878',
      recentSamples: samples,
      sparklinePoints: [],
      hasEnoughData: false
    };
  }

  // Compare recent window against baseline
  const recentCount = Math.min(4, Math.floor(samples.length / 2));
  const earliest = samples.slice(0, recentCount);
  const latest = samples.slice(-recentCount);

  const avgEarliestRssi = earliest.reduce((s, x) => s + x.rssi_dBm, 0) / earliest.length;
  const avgLatestRssi = latest.reduce((s, x) => s + x.rssi_dBm, 0) / latest.length;

  const avgEarliestRetries = earliest.reduce((s, x) => s + x.retryRatePct, 0) / earliest.length;
  const avgLatestRetries = latest.reduce((s, x) => s + x.retryRatePct, 0) / latest.length;

  const rssiDelta = avgLatestRssi - avgEarliestRssi;
  const retryDelta = avgLatestRetries - avgEarliestRetries;

  let direction: TrendDirection = 'STABLE';
  let symbol = '→';
  let label = 'stable';
  let qualifier = '(stable)';
  let color = '#747878';

  if (rssiDelta >= 1.5 && retryDelta <= 1.0) {
    direction = 'IMPROVING';
    symbol = '↑';
    label = 'improving';
    qualifier = '(improving)';
    color = '#2E7D32';
  } else if (rssiDelta <= -1.5 || retryDelta >= 2.5) {
    direction = 'DEGRADING';
    symbol = '↓';
    label = 'degrading';
    qualifier = '(degrading)';
    color = '#D32F2F';
  }

  // Generate normalized sparkline points (0 to 1) from sample RSSIs
  const rssiValues = samples.map(s => s.rssi_dBm);
  const minVal = Math.min(...rssiValues) - 1.5;
  const maxVal = Math.max(...rssiValues) + 1.5;
  const valRange = maxVal - minVal || 1;

  const sparklinePoints = rssiValues.map(v => (v - minVal) / valRange);

  return {
    direction,
    symbol,
    label,
    qualifier,
    color,
    recentSamples: samples,
    sparklinePoints,
    hasEnoughData: true
  };
}
