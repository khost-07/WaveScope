import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { BandBadge } from './StatusBadge';

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
    <div className="border border-border-subtle bg-surface overflow-x-auto">
      <table className="instrument-table">
        <thead>
          <tr>
            <th style={{ width: '130px' }}>STATUS</th>
            <th>DEVICE / HOSTNAME</th>
            <th>VENDOR</th>
            <th>BAND</th>
            <th style={{ textAlign: 'right' }}>RSSI</th>
            <th style={{ textAlign: 'right' }}>SNR</th>
            <th style={{ textAlign: 'right' }}>LINK RATE</th>
            <th style={{ textAlign: 'right' }}>RETRIES</th>
            <th style={{ textAlign: 'center', width: '90px' }}>ACTION</th>
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
                className={isSelected ? 'selected-row' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectDevice(device)}
              >
                <td>
                  {status === 'HEALTHY' && (
                    <div className="badge-status badge-status-healthy">
                      <span className="material-symbols-outlined text-[12px]">check_box</span>
                      <span>HEALTHY</span>
                    </div>
                  )}
                  {status === 'ATTENTION' && (
                    <div className="badge-status badge-status-attention">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      <span>ATTENTION</span>
                    </div>
                  )}
                  {status === 'CRITICAL' && (
                    <div className="badge-status badge-status-critical">
                      <span className="material-symbols-outlined text-[12px]">error</span>
                      <span>CRITICAL</span>
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{device.hostname}</div>
                  <div className="font-data-sm text-muted">
                    {device.macAddress} {device.scenarioId ? `• [SCENARIO ${device.scenarioId}]` : ''}
                  </div>
                </td>
                <td className="font-data-sm text-secondary">
                  {device.vendor} ({device.deviceType})
                </td>
                <td>
                  <BandBadge band={telemetry.band} />
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: telemetry.rssi_dBm <= -75 ? 'var(--status-critical)' : telemetry.rssi_dBm <= -70 ? 'var(--status-attention)' : 'var(--text-main)'
                  }}
                >
                  {telemetry.rssi_dBm} dBm
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: telemetry.snr_dB <= 12 ? 'var(--status-critical)' : telemetry.snr_dB <= 20 ? 'var(--status-attention)' : 'var(--text-main)'
                  }}
                >
                  {telemetry.snr_dB} dB
                </td>
                <td style={{ textAlign: 'right' }}>
                  {telemetry.txLinkRate_Mbps} Mbps
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: telemetry.retryRatePct >= 15 ? 'var(--status-critical)' : telemetry.retryRatePct >= 8 ? 'var(--status-attention)' : 'var(--text-main)'
                  }}
                >
                  {telemetry.retryRatePct.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn-instrument-secondary text-[11px] py-0.5 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDevice(device);
                    }}
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
