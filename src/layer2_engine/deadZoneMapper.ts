/**
 * LAYER 2 FEATURE: INFERRED DEAD-ZONE & COVERAGE ESTIMATOR
 * Clusters associated devices into relative signal zones (Strong / Marginal / Weak Dead-Zone)
 * using calibrated path-loss estimation along a 1-D signal continuum.
 */

import { ClientDevice, DiagnosticStatus } from '../layer1_data/types';

export type CoverageZone = 'STRONG' | 'MARGINAL' | 'DEAD_ZONE';

export interface DeviceCoverageMarker {
  id: string;
  hostname: string;
  rssi_dBm: number;
  snr_dB: number;
  estimatedDistanceMeters: number;
  positionPercent: number; // 0% (Strong / Near) to 100% (Weak / Dead Zone)
  zone: CoverageZone;
  status: DiagnosticStatus;
  isSelected: boolean;
}

export interface CoverageMapResult {
  markers: DeviceCoverageMarker[];
  targetZone: CoverageZone;
  targetDistanceMeters: number;
  environmentNote?: string;
  zoneDescription: string;
}

export function computeEstimatedCoverage(
  targetDevice: ClientDevice,
  allDevices: ClientDevice[],
  diagnoses: Record<string, { status: DiagnosticStatus }>
): CoverageMapResult {
  const minRssi = -90;
  const maxRssi = -30;
  const range = maxRssi - minRssi;

  const getPositionPercent = (rssi: number) => {
    // 0% is Strong (-30 dBm), 100% is Weak / Dead Zone (-90 dBm)
    const clamped = Math.max(minRssi, Math.min(maxRssi, rssi));
    return ((maxRssi - clamped) / range) * 100;
  };

  const getZone = (rssi: number, snr: number): CoverageZone => {
    if (rssi >= -60 && snr >= 25) return 'STRONG';
    if (rssi <= -75 || snr <= 12) return 'DEAD_ZONE';
    return 'MARGINAL';
  };

  const inferDistanceMeters = (device: ClientDevice): number => {
    if (device.location?.estimatedDistanceMeters) {
      return device.location.estimatedDistanceMeters;
    }
    // Standard indoor log-distance path loss approximation: PL(d) = 40 + 30*log10(d)
    const pl = Math.abs(device.telemetry.rssi_dBm);
    const exp = Math.max(0, (pl - 40) / 30);
    return Math.round(Math.pow(10, exp) * 10) / 10;
  };

  const markers: DeviceCoverageMarker[] = allDevices.map(d => {
    const rssi = d.telemetry.rssi_dBm;
    const snr = d.telemetry.snr_dB;
    return {
      id: d.id,
      hostname: d.hostname,
      rssi_dBm: rssi,
      snr_dB: snr,
      estimatedDistanceMeters: inferDistanceMeters(d),
      positionPercent: getPositionPercent(rssi),
      zone: getZone(rssi, snr),
      status: diagnoses[d.id]?.status || 'HEALTHY',
      isSelected: d.id === targetDevice.id
    };
  });

  // Sort so selected marker renders on top
  markers.sort((a, b) => (a.isSelected ? 1 : 0) - (b.isSelected ? 1 : 0));

  const targetZone = getZone(targetDevice.telemetry.rssi_dBm, targetDevice.telemetry.snr_dB);
  const targetDistanceMeters = inferDistanceMeters(targetDevice);
  let zoneDescription = '';

  if (targetZone === 'STRONG') {
    zoneDescription = `Optimal near-field AP coverage (~${targetDistanceMeters}m path loss). High SNR margin and direct radio propagation.`;
  } else if (targetZone === 'MARGINAL') {
    zoneDescription = `Secondary perimeter coverage (~${targetDistanceMeters}m path loss). Usable link margin with slight attenuation.`;
  } else {
    zoneDescription = `Attenuated / Dead Zone (~${targetDistanceMeters}m path loss or severe partition shielding). Significant RF margin compression.`;
  }

  return {
    markers,
    targetZone,
    targetDistanceMeters,
    environmentNote: targetDevice.location?.environmentNote,
    zoneDescription
  };
}
