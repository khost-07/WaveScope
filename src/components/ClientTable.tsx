import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { BandBadge } from './StatusBadge';
import { IconCheckBox, IconAlertTriangle, IconAlertCircle } from './SvgIcons';

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
    <div className="border border-[#E2E5E9] rounded-2xl bg-white shadow-panel overflow-hidden">
      <div className="overflow-x-auto">
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
                  className={`transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#F0F2F5] font-medium' : 'hover:bg-[#F8F9FA]'
                  }`}
                  onClick={() => onSelectDevice(device)}
                >
                  <td>
                    {status === 'HEALTHY' && (
                      <div className="badge-status badge-status-healthy text-[9px] rounded-md">
                        <IconCheckBox size={11} />
                        <span>HEALTHY</span>
                      </div>
                    )}
                    {status === 'ATTENTION' && (
                      <div className="badge-status badge-status-attention text-[9px] rounded-md">
                        <IconAlertTriangle size={11} />
                        <span>ATTENTION</span>
                      </div>
                    )}
                    {status === 'CRITICAL' && (
                      <div className="badge-status badge-status-critical text-[9px] rounded-md">
                        <IconAlertCircle size={11} />
                        <span>CRITICAL</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{device.hostname}</div>
                    <div className="font-mono text-[11px] text-[#6B7280]">
                      {device.macAddress} {device.scenarioId ? `• [SCENARIO ${device.scenarioId}]` : ''}
                    </div>
                  </td>
                  <td className="font-mono text-[12px] text-[#3B4045]">
                    {device.vendor} ({device.deviceType})
                  </td>
                  <td>
                    <BandBadge band={telemetry.band} />
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: telemetry.rssi_dBm <= -75 ? 'var(--status-critical)' : telemetry.rssi_dBm <= -70 ? 'var(--status-attention)' : 'var(--text-main)'
                    }}
                  >
                    {telemetry.rssi_dBm} dBm
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: telemetry.snr_dB <= 12 ? 'var(--status-critical)' : telemetry.snr_dB <= 20 ? 'var(--status-attention)' : 'var(--text-main)'
                    }}
                  >
                    {telemetry.snr_dB} dB
                  </td>
                  <td style={{ textAlign: 'right' }} className="font-mono text-[12px]">
                    {telemetry.txLinkRate_Mbps} Mbps
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: telemetry.retryRatePct >= 15 ? 'var(--status-critical)' : telemetry.retryRatePct >= 8 ? 'var(--status-attention)' : 'var(--text-main)'
                    }}
                  >
                    {telemetry.retryRatePct.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-instrument-secondary text-[10.5px] py-1 px-3 rounded-md transition-all shadow-xs hover:shadow-subtle"
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
    </div>
  );
};

