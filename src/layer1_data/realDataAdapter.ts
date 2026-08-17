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

export async function fetchRealTelemetry(): Promise<RealDataResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch('http://localhost:5174/api/wlan/real-telemetry', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Endpoint HTTP ${response.status}`);
    }

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
    } else {
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
  } catch (err: any) {
    return {
      isAvailable: false,
      provenance: {
        mode: 'REAL',
        sourceIdentifier: 'Windows Native WLAN API (netsh wlan show interfaces)',
        lastUpdated: Date.now(),
        isDeterministic: false
      },
      devices: [],
      errorMessage: 'Local telemetry daemon (server/wlanScanner.cjs) is not currently running on port 5174.'
    };
  }
}
