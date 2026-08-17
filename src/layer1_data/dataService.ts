/**
 * LAYER 1: DATA SERVICE
 * Unified provider for simulation and real-world Wi-Fi telemetry.
 * Manages mode switching and ensures crystal-clear data provenance.
 */

import { ClientDevice, DataSourceMode, DataProvenance } from './types';
import { SIMULATION_SCENARIOS } from './simulationDataset';
import { fetchRealTelemetry, RealDataResult } from './realDataAdapter';

export interface DataServiceState {
  mode: DataSourceMode;
  devices: ClientDevice[];
  provenance: DataProvenance;
  selectedDeviceId: string | null;
  realProbeStatus?: RealDataResult;
}

export const INITIAL_SIMULATION_PROVENANCE: DataProvenance = {
  mode: 'SIMULATION',
  sourceIdentifier: 'Controlled RF Simulation Dataset (Scenarios A–E)',
  adapterName: 'Simulated Tri-Band 802.11ax AP Testbed',
  lastUpdated: Date.now(),
  isDeterministic: true
};

export async function loadDevices(
  mode: DataSourceMode,
  currentSimulatedDevices: ClientDevice[] = SIMULATION_SCENARIOS
): Promise<{ devices: ClientDevice[]; provenance: DataProvenance; realProbeStatus?: RealDataResult }> {
  if (mode === 'SIMULATION') {
    return {
      devices: currentSimulatedDevices,
      provenance: {
        ...INITIAL_SIMULATION_PROVENANCE,
        lastUpdated: Date.now()
      }
    };
  } else {
    const realResult = await fetchRealTelemetry();
    if (realResult.isAvailable && realResult.devices.length > 0) {
      return {
        devices: realResult.devices,
        provenance: realResult.provenance,
        realProbeStatus: realResult
      };
    } else {
      return {
        devices: [],
        provenance: realResult.provenance,
        realProbeStatus: realResult
      };
    }
  }
}
