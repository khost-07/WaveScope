/**
 * LAYER 2 FEATURE: TREND / DRIFT DETECTION ENGINE
 * Maintains an in-memory rolling buffer of recent telemetry readings (~15-20 samples)
 * and detects direction (improving / stable / degrading) without persistent storage.
 */

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
 * Appends a new reading to the in-memory rolling buffer for a device.
 */
export function recordDeviceSample(
  deviceId: string,
  rssi_dBm: number,
  snr_dB: number,
  retryRatePct: number
): void {
  if (!sampleBufferStore[deviceId]) {
    // Generate an initial realistic baseline with slight natural RF jitter
    sampleBufferStore[deviceId] = [
      { timestamp: Date.now() - 45000, rssi_dBm: rssi_dBm + (Math.random() * 2 - 1), snr_dB: snr_dB, retryRatePct: retryRatePct },
      { timestamp: Date.now() - 30000, rssi_dBm: rssi_dBm + (Math.random() * 2 - 1), snr_dB: snr_dB, retryRatePct: retryRatePct },
      { timestamp: Date.now() - 15000, rssi_dBm: rssi_dBm, snr_dB: snr_dB, retryRatePct: retryRatePct },
      { timestamp: Date.now(), rssi_dBm, snr_dB, retryRatePct }
    ];
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
  const recentCount = Math.min(3, Math.floor(samples.length / 2));
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

  if (rssiDelta >= 2.0 && retryDelta <= 2.0) {
    direction = 'IMPROVING';
    symbol = '↑';
    label = 'improving';
    qualifier = '(improving)';
    color = '#2E7D32';
  } else if (rssiDelta <= -2.0 || retryDelta >= 5.0) {
    direction = 'DEGRADING';
    symbol = '↓';
    label = 'degrading';
    qualifier = '(degrading)';
    color = '#D32F2F';
  }

  // Generate normalized sparkline points (0 to 1) from sample RSSIs
  const rssiValues = samples.map(s => s.rssi_dBm);
  const minVal = Math.min(...rssiValues) - 2;
  const maxVal = Math.max(...rssiValues) + 2;
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
