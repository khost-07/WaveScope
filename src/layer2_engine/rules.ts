/**
 * LAYER 2: DIAGNOSTIC SCORING RULES
 * Deterministic scoring engine rules for competing Wi-Fi root-cause hypotheses.
 * ZERO LLM calls - purely mathematical, auditable, and transparent.
 */

import { ClientDevice } from '../layer1_data/types';

export const HYPOTHESES = {
  HEALTHY: "Healthy / No significant issue",
  WEAK_SIGNAL: "Weak / Attenuated Signal",
  RF_INTERFERENCE: "Possible RF Interference",
  HARDWARE_LIMITED: "Hardware / Capability Limited",
  BAND_SELECTION: "Potential Band Selection / Configuration Issue"
} as const;

export type HypothesisKey = keyof typeof HYPOTHESES;

export interface RuleResult {
  score: number;
  evidence: string[];
  possibleCauses: string[];
}

/**
 * Evaluates Hypothesis: Weak / Attenuated Signal
 */
export function evaluateWeakSignal(device: ClientDevice): RuleResult {
  const { telemetry } = device;
  let score = 0;
  const evidence: string[] = [];

  // RSSI Evaluation
  if (telemetry.rssi_dBm <= -75) {
    score += 45;
    evidence.push(`RSSI = ${telemetry.rssi_dBm} dBm (Severe path attenuation, below -75 dBm threshold)`);
  } else if (telemetry.rssi_dBm <= -70) {
    score += 30;
    evidence.push(`RSSI = ${telemetry.rssi_dBm} dBm (Marginal signal strength, below -70 dBm target)`);
  } else if (telemetry.rssi_dBm <= -65) {
    score += 10;
  } else if (telemetry.rssi_dBm >= -55) {
    // Strong signal makes attenuation highly improbable
    score -= 40;
  }

  // SNR Evaluation
  if (telemetry.snr_dB <= 12) {
    score += 30;
    evidence.push(`SNR = ${telemetry.snr_dB} dB (Compressed link margin, nominal >= 25 dB)`);
  } else if (telemetry.snr_dB <= 18) {
    score += 15;
    evidence.push(`SNR = ${telemetry.snr_dB} dB (Sub-optimal link margin)`);
  }

  // Retransmission / Loss Evaluation
  if (telemetry.retryRatePct >= 15) {
    score += 25;
    evidence.push(`Retry rate = ${telemetry.retryRatePct.toFixed(1)}% (High retransmissions under degraded link)`);
  } else if (telemetry.retryRatePct >= 8) {
    score += 12;
    evidence.push(`Retry rate = ${telemetry.retryRatePct.toFixed(1)}% (Elevated retransmissions)`);
  }

  // Quiet noise floor confirms the low SNR is from weak received signal, not high external noise
  if (telemetry.noiseFloor_dBm <= -80 && telemetry.rssi_dBm <= -70) {
    score += 15;
  }

  const possibleCauses = [
    "Likely excessive physical distance or structural barrier path loss between client and AP",
    "Possible building material attenuation (e.g. concrete, reinforced glass, steel partitions)",
    "Suspected client positioning in an RF null or sub-optimal AP antenna coverage zone"
  ];

  return { score: Math.max(0, score), evidence, possibleCauses };
}

/**
 * Evaluates Hypothesis: Possible RF Interference
 */
export function evaluateRFInterference(device: ClientDevice): RuleResult {
  const { telemetry, apCapabilities } = device;
  let score = 0;
  const evidence: string[] = [];

  // Strong received power but degraded SNR is the textbook signature of elevated noise/interference
  const hasStrongSignal = telemetry.rssi_dBm >= -65;
  const hasLowSNR = telemetry.snr_dB <= 15;
  const hasElevatedNoise = telemetry.noiseFloor_dBm >= -75;

  if (hasStrongSignal && hasLowSNR) {
    score += 50;
    evidence.push(`High RSSI (${telemetry.rssi_dBm} dBm) paired with poor SNR (${telemetry.snr_dB} dB) indicates high background noise rather than path loss`);
  }

  if (hasElevatedNoise) {
    score += 30;
    evidence.push(`Elevated noise floor = ${telemetry.noiseFloor_dBm} dBm (Nominal floor <= -85 dBm)`);
  }

  if (telemetry.retryRatePct >= 15) {
    score += 25;
    evidence.push(`Frame retry rate = ${telemetry.retryRatePct.toFixed(1)}% caused by channel contention or collision`);
  } else if (telemetry.retryRatePct >= 8) {
    score += 12;
  }

  if (apCapabilities.channelUtilizationPct >= 70) {
    score += 20;
    evidence.push(`Channel utilization = ${apCapabilities.channelUtilizationPct}% (Heavy channel load / BSS congestion)`);
  }

  if (telemetry.band === '2.4GHz') {
    score += 10;
  }

  // If signal is weak and noise floor is low, it is attenuation, not interference
  if (telemetry.rssi_dBm <= -75 && telemetry.noiseFloor_dBm <= -85) {
    score -= 40;
  }

  const possibleCauses = [
    `Suspected elevated in-band RF noise or co-channel interference on ${telemetry.band} Channel ${telemetry.channel}`,
    "Likely non-Wi-Fi ISM band emissions (e.g. legacy Bluetooth, microwave leakage, cordless RF systems)",
    `Possible high BSS channel load with ${apCapabilities.channelUtilizationPct}% channel utilization reported by AP`
  ];

  return { score: Math.max(0, score), evidence, possibleCauses };
}

/**
 * Evaluates Hypothesis: Hardware / Capability Limited
 */
export function evaluateHardwareLimited(device: ClientDevice): RuleResult {
  const { capabilities, apCapabilities, telemetry } = device;
  let score = 0;
  const evidence: string[] = [];

  const isClient24Only = capabilities.supportedBands.length === 1 && capabilities.supportedBands[0] === '2.4GHz';
  const apHasHigherBands = apCapabilities.enabledBands.includes('5GHz') || apCapabilities.enabledBands.includes('6GHz');

  if (isClient24Only && apHasHigherBands) {
    score += 50;
    evidence.push(`Client hardware is single-band 2.4GHz only, unable to utilize AP's 5GHz or 6GHz radios`);
  }

  const standardRank: Record<string, number> = {
    '802.11b': 1, '802.11g': 2, '802.11n': 3, '802.11ac': 4, '802.11ax': 5, '802.11be': 6
  };

  const devRank = standardRank[capabilities.maxStandard] || 1;
  const apRank = standardRank[apCapabilities.maxStandard] || 5;

  if (devRank < apRank) {
    score += 35;
    evidence.push(`Client max protocol standard is ${capabilities.maxStandard} vs AP operating at ${apCapabilities.maxStandard}`);
  }

  if (capabilities.maxChannelWidthMHz < apCapabilities.maxChannelWidthMHz) {
    score += 15;
    evidence.push(`Client max channel width is ${capabilities.maxChannelWidthMHz} MHz vs AP capability of ${apCapabilities.maxChannelWidthMHz} MHz`);
  }

  if (capabilities.mimoStreams === '1x1' && (telemetry.spatialStreams === 1)) {
    score += 15;
    evidence.push(`Single spatial stream (1x1 SISO) physical radio configuration`);
  }

  // If RF conditions are healthy (clean SNR, low retries), it confirms the bottleneck is purely hardware capability
  if (telemetry.snr_dB >= 25 && telemetry.retryRatePct <= 5) {
    score += 20;
    evidence.push(`RF link is stable (SNR = ${telemetry.snr_dB} dB, Retry = ${telemetry.retryRatePct.toFixed(1)}%), confirming hardware constraint is the limiting factor`);
  }

  const possibleCauses = [
    `Physical radio hardware design: Client is constrained to ${capabilities.maxStandard} (${capabilities.mimoStreams}, ${capabilities.maxChannelWidthMHz}MHz)`,
    "Client lacks 5GHz / 6GHz radio architecture and cannot negotiate high-throughput MCS indices",
    "Throughput bounds are dictated by device PHY specifications rather than RF environment degradation"
  ];

  return { score: Math.max(0, score), evidence, possibleCauses };
}

/**
 * Evaluates Hypothesis: Potential Band Selection / Configuration Issue
 */
export function evaluateBandSelection(device: ClientDevice): RuleResult {
  const { capabilities, apCapabilities, telemetry } = device;
  let score = 0;
  const evidence: string[] = [];

  const clientSupportsHigherBands = capabilities.supports5GHz || capabilities.supports6GHz;
  const apSupportsHigherBands = apCapabilities.supports5GHz || apCapabilities.supports6GHz;
  const isConnectedOn24 = telemetry.band === '2.4GHz';

  if (clientSupportsHigherBands && apSupportsHigherBands && isConnectedOn24) {
    score += 50;
    evidence.push(`Client supports ${capabilities.supportedBands.join('/')} and AP broadcasts 5GHz/6GHz, but client is associated on 2.4GHz`);

    // Strong 2.4GHz signal implies client is well within coverage range where 5GHz/6GHz is viable
    if (telemetry.rssi_dBm >= -60) {
      score += 40;
      evidence.push(`Strong 2.4GHz RSSI (${telemetry.rssi_dBm} dBm) indicates sufficient proximity for 5GHz or 6GHz association`);
    } else if (telemetry.rssi_dBm >= -68) {
      score += 20;
      evidence.push(`Moderate 2.4GHz RSSI (${telemetry.rssi_dBm} dBm) suggests potential 5GHz availability`);
    }

    if (telemetry.snr_dB >= 28 && telemetry.retryRatePct <= 3) {
      score += 15;
    }
  } else {
    // If device is already on 5GHz/6GHz or incapable of higher bands, this hypothesis does not apply
    score = 0;
  }

  const possibleCauses = [
    "Client roaming and association algorithm chose 2.4GHz band during initial association or wake cycle",
    "Possible combined SSID band-steering threshold on the AP did not aggressively steer the client to 5GHz/6GHz",
    "Client Wi-Fi driver roaming aggressiveness or 5GHz preference setting may be disabled in OS profile"
  ];

  return { score: Math.max(0, score), evidence, possibleCauses };
}

/**
 * Evaluates Hypothesis: Healthy / No Significant Issue
 */
export function evaluateHealthy(device: ClientDevice): RuleResult {
  const { telemetry } = device;
  let score = 0;
  const evidence: string[] = [];

  // RSSI
  if (telemetry.rssi_dBm >= -55) {
    score += 35;
    evidence.push(`RSSI = ${telemetry.rssi_dBm} dBm (Excellent signal level, well above -65 dBm nominal)`);
  } else if (telemetry.rssi_dBm >= -65) {
    score += 25;
    evidence.push(`RSSI = ${telemetry.rssi_dBm} dBm (Good signal level)`);
  } else {
    score -= 40;
  }

  // SNR
  if (telemetry.snr_dB >= 30) {
    score += 35;
    evidence.push(`SNR = ${telemetry.snr_dB} dB (Optimal signal-to-noise ratio, nominal >= 25 dB)`);
  } else if (telemetry.snr_dB >= 22) {
    score += 20;
    evidence.push(`SNR = ${telemetry.snr_dB} dB (Sufficient signal-to-noise ratio)`);
  } else {
    score -= 40;
  }

  // Retries & Loss
  if (telemetry.retryRatePct <= 2.0 && telemetry.packetLossPct <= 0.5) {
    score += 30;
    evidence.push(`Frame retry rate = ${telemetry.retryRatePct.toFixed(1)}%, Packet loss = ${telemetry.packetLossPct.toFixed(1)}% (Negligible airtime retransmissions)`);
  } else if (telemetry.retryRatePct <= 5.0) {
    score += 15;
  } else {
    score -= 40;
  }

  // Band efficiency
  if (telemetry.band === '5GHz' || telemetry.band === '6GHz') {
    score += 15;
    evidence.push(`Operating on clean ${telemetry.band} band (${telemetry.channelWidthMHz} MHz channel width)`);
  }

  const possibleCauses = [
    "Optimal RF propagation path with high link budget and negligible frame collision",
    "Clean channel allocation and high-efficiency PHY modulation active"
  ];

  return { score: Math.max(0, score), evidence, possibleCauses };
}
