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
  positionPercent: number; // 0% (Strong) to 100% (Weak / Dead Zone)
  zone: CoverageZone;
  status: DiagnosticStatus;
  isSelected: boolean;
}

export interface CoverageMapResult {
  markers: DeviceCoverageMarker[];
  targetZone: CoverageZone;
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

  const markers: DeviceCoverageMarker[] = allDevices.map(d => {
    const rssi = d.telemetry.rssi_dBm;
    const snr = d.telemetry.snr_dB;
    return {
      id: d.id,
      hostname: d.hostname,
      rssi_dBm: rssi,
      snr_dB: snr,
      positionPercent: getPositionPercent(rssi),
      zone: getZone(rssi, snr),
      status: diagnoses[d.id]?.status || 'HEALTHY',
      isSelected: d.id === targetDevice.id
    };
  });

  // Sort so selected marker is drawn clearly
  markers.sort((a, b) => (a.isSelected ? 1 : 0) - (b.isSelected ? 1 : 0));

  const targetZone = getZone(targetDevice.telemetry.rssi_dBm, targetDevice.telemetry.snr_dB);
  let zoneDescription = '';
  if (targetZone === 'STRONG') {
    zoneDescription = 'Device is in optimal line-of-sight/near-field AP coverage (< 5m estimated relative path).';
  } else if (targetZone === 'MARGINAL') {
    zoneDescription = 'Device is in secondary perimeter coverage (5–12m estimated relative path).';
  } else {
    zoneDescription = 'Device is in an attenuated / dead zone (> 12m or high partition barrier loss).';
  }

  return {
    markers,
    targetZone,
    zoneDescription
  };
}
