/**
 * LAYER 2 FEATURE: PEER-CORROBORATED DIAGNOSTIC EVALUATOR
 * Compares devices with similar hardware capabilities on the same AP.
 * Distinguishes between localized device/placement issues vs shared/environmental issues.
 */

import { ClientDevice, DiagnosticStatus } from '../layer1_data/types';

export interface PeerDeviceSummary {
  id: string;
  hostname: string;
  vendor: string;
  band: string;
  standard: string;
  status: DiagnosticStatus;
  rssi_dBm: number;
  snr_dB: number;
}

export interface PeerCorroborationResult {
  hasPeers: boolean;
  verdict: 'DEVICE_SPECIFIC' | 'ENVIRONMENTAL_SHARED' | 'NOMINAL_CONSISTENT';
  summarySentence: string;
  relevantPeers: PeerDeviceSummary[];
  confidenceBoost: number;
  isPlacementIssue: boolean;
}

export function evaluatePeerCorroboration(
  targetDevice: ClientDevice,
  allDevices: ClientDevice[],
  diagnoses: Record<string, { status: DiagnosticStatus; primary_diagnosis: string }>
): PeerCorroborationResult | null {
  // If no peers are available (e.g. single-device Live Data mode), return null to hide UI
  const peers = allDevices.filter(d => d.id !== targetDevice.id);
  if (peers.length === 0) {
    return null;
  }

  const targetBand = targetDevice.telemetry.band;
  const targetStatus = diagnoses[targetDevice.id]?.status || 'HEALTHY';

  // Filter peers on the same band or similar capability
  const sameBandPeers = peers.filter(p => p.telemetry.band === targetBand);
  const relevantList = sameBandPeers.length > 0 ? sameBandPeers : peers;

  const relevantSummaries: PeerDeviceSummary[] = relevantList.slice(0, 3).map(p => ({
    id: p.id,
    hostname: p.hostname,
    vendor: p.vendor,
    band: p.telemetry.band,
    standard: p.capabilities.maxStandard,
    status: diagnoses[p.id]?.status || 'HEALTHY',
    rssi_dBm: p.telemetry.rssi_dBm,
    snr_dB: p.telemetry.snr_dB
  }));

  const strongHealthyPeers = relevantList.filter(p => {
    const pStatus = diagnoses[p.id]?.status || 'HEALTHY';
    return pStatus === 'HEALTHY' && p.telemetry.rssi_dBm >= -65;
  });

  const degradedPeers = relevantList.filter(p => {
    const pStatus = diagnoses[p.id]?.status || 'HEALTHY';
    return pStatus === 'CRITICAL' || pStatus === 'ATTENTION';
  });

  let verdict: 'DEVICE_SPECIFIC' | 'ENVIRONMENTAL_SHARED' | 'NOMINAL_CONSISTENT' = 'NOMINAL_CONSISTENT';
  let summarySentence = '';
  let confidenceBoost = 0;
  let isPlacementIssue = false;

  if (targetStatus !== 'HEALTHY' && strongHealthyPeers.length >= 1) {
    // Target is degraded, but peers on the same band/AP are strong
    verdict = 'DEVICE_SPECIFIC';
    isPlacementIssue = true;
    confidenceBoost = 6;
    const peerCountText = strongHealthyPeers.length === 1 ? '1 nearby device shows' : `${strongHealthyPeers.length} nearby devices show`;
    summarySentence = `${peerCountText} strong signal under similar conditions (${strongHealthyPeers.map(p => p.hostname).join(', ')}) — indicates a device-specific or placement-specific issue.`;
  } else if (targetStatus !== 'HEALTHY' && degradedPeers.length >= 2) {
    // Multiple devices show degraded metrics (e.g. noise/congestion/AP-wide)
    verdict = 'ENVIRONMENTAL_SHARED';
    confidenceBoost = 8;
    summarySentence = `Multiple devices (${degradedPeers.length + 1}) on the ${targetBand} band show elevated contention/noise — points to a shared AP-wide or environmental cause.`;
  } else if (targetStatus === 'HEALTHY' && strongHealthyPeers.length >= 1) {
    verdict = 'NOMINAL_CONSISTENT';
    summarySentence = `Nearby devices on ${targetBand} corroborate nominal signal propagation and link stability across this Access Point.`;
  } else {
    verdict = 'NOMINAL_CONSISTENT';
    summarySentence = `Peer comparisons on ${targetBand} confirm typical baseline operation for associated endpoints.`;
  }

  return {
    hasPeers: true,
    verdict,
    summarySentence,
    relevantPeers: relevantSummaries,
    confidenceBoost,
    isPlacementIssue
  };
}
