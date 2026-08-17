import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { StatusBadge, BandBadge } from './StatusBadge';

interface ClientTableProps {
  devices: ClientDevice[];
  diagnoses: Record<string, StructuredDiagnosis>;
  selectedDeviceId: string | null;
  onSelectDevice: (device: ClientDevice) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  devices,
  diagnoses,
  selectedDeviceId,
  onSelectDevice
}) => {
  return (
    <div className="instrument-table-wrapper">
      <table className="instrument-table">
        <thead>
          <tr>
            <th>Device Identifier / Hostname</th>
            <th>Vendor / Class</th>
            <th>Band</th>
            <th>Standard</th>
            <th>RSSI (dBm)</th>
            <th>SNR (dB)</th>
            <th>PHY Rate (Tx/Rx)</th>
            <th>Retries (%)</th>
            <th>Diagnostic Status</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => {
            const isSelected = selectedDeviceId === device.id;
            const diagnosis = diagnoses[device.id];
            const status = diagnosis ? diagnosis.status : 'HEALTHY';
            const { telemetry } = device;

            return (
              <tr
                key={device.id}
                className={isSelected ? 'selected' : ''}
                onClick={() => onSelectDevice(device)}
              >
                <td>
                  <div style={{ fontWeight: 600 }}>{device.hostname}</div>
                  <div className="mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {device.macAddress} {device.scenarioId ? `[SCENARIO ${device.scenarioId}]` : ''}
                  </div>
                </td>
                <td>
                  <div style={{ color: 'var(--text-main)' }}>{device.vendor}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{device.deviceType}</div>
                </td>
                <td>
                  <BandBadge band={telemetry.band} />
                </td>
                <td className="mono" style={{ fontSize: '11px' }}>
                  {telemetry.standard}
                </td>
                <td className="mono" style={{ fontWeight: 600, color: telemetry.rssi_dBm <= -75 ? 'var(--rf-critical-text)' : telemetry.rssi_dBm <= -70 ? 'var(--rf-attention-text)' : 'var(--text-main)' }}>
                  {telemetry.rssi_dBm} dBm
                </td>
                <td className="mono" style={{ fontWeight: 600, color: telemetry.snr_dB <= 12 ? 'var(--rf-critical-text)' : telemetry.snr_dB <= 20 ? 'var(--rf-attention-text)' : 'var(--text-main)' }}>
                  {telemetry.snr_dB} dB
                </td>
                <td className="mono" style={{ fontSize: '11px' }}>
                  {telemetry.txLinkRate_Mbps} / {telemetry.rxLinkRate_Mbps} Mbps
                </td>
                <td className="mono" style={{ fontWeight: 600, color: telemetry.retryRatePct >= 15 ? 'var(--rf-critical-text)' : telemetry.retryRatePct >= 8 ? 'var(--rf-attention-text)' : 'var(--text-main)' }}>
                  {telemetry.retryRatePct.toFixed(1)}%
                </td>
                <td>
                  <StatusBadge status={status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
