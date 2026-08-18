/**
 * REAL DATA ADAPTER
 * Interfaces with the local host's real Wi-Fi subsystem.
 * Strictly verifies and documents the source provenance.
 */

import { ClientDevice, DataProvenance } from './types';

export interface RealDataResult {
  isAvailable: boolean;
  provenance: DataProvenance;
  devices: ClientDevice[];
  errorMessage?: string;
}

const REAL_TELEMETRY_ENDPOINTS = [
  '/api/wlan/real-telemetry',
  'http://localhost:5175/api/wlan/real-telemetry',
  'http://localhost:5174/api/wlan/real-telemetry'
];

export async function fetchRealTelemetry(): Promise<RealDataResult> {
  for (const endpoint of REAL_TELEMETRY_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(endpoint, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();

      if (data.status === 'SUCCESS' && data.device) {
        return {
          isAvailable: true,
          provenance: {
            mode: 'REAL',
            sourceIdentifier: data.provenance || 'Windows Native WLAN API (netsh wlan show interfaces)',
            adapterName: data.device.vendor || 'Host Wi-Fi Interface',
            lastUpdated: Date.now(),
            isDeterministic: false
          },
          devices: [data.device]
        };
      } else if (data.status === 'NO_ACTIVE_INTERFACE') {
        return {
          isAvailable: false,
          provenance: {
            mode: 'REAL',
            sourceIdentifier: 'Windows Native WLAN API (netsh wlan show interfaces)',
            lastUpdated: Date.now(),
            isDeterministic: false
          },
          devices: [],
          errorMessage: 'WLAN interface is currently disconnected or not associated with any BSS.'
        };
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    isAvailable: false,
    provenance: {
      mode: 'REAL',
      sourceIdentifier: 'Windows Native WLAN API (netsh wlan show interfaces)',
      lastUpdated: Date.now(),
      isDeterministic: false
    },
    devices: [],
    errorMessage: 'Local WLAN scanner is not reachable. Ensure the dev server is active.'
  };
}
