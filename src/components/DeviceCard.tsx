import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { BandBadge } from './StatusBadge';

interface DeviceCardProps {
  device: ClientDevice;
  diagnosis: StructuredDiagnosis;
  isSelected: boolean;
  onSelect: (device: ClientDevice) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  diagnosis,
  isSelected,
  onSelect
}) => {
  const { telemetry } = device;
  const status = diagnosis.status;

  return (
    <div
      className={`p-3 bg-surface border mb-2 cursor-pointer transition-colors ${
        isSelected ? 'border-primary bg-surface-offset' : 'border-border-subtle hover:bg-surface-offset'
      }`}
      style={{
        borderLeftWidth: isSelected ? '4px' : '1px',
        borderLeftColor: isSelected ? '#000000' : 'var(--border-subtle)'
      }}
      onClick={() => onSelect(device)}
    >
      {/* Top Row: Device Name & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-headline-md text-[14px] text-primary font-semibold leading-tight">
            {device.hostname}
          </div>
          <div className="font-data-sm text-muted text-[11px] mt-0.5">
            {device.vendor} • {device.macAddress}
          </div>
        </div>

        {status === 'HEALTHY' && (
          <span className="badge-status badge-status-healthy text-[9px] py-0 px-1.5">
            <span className="material-symbols-outlined text-[10px]">check_box</span>
            HEALTHY
          </span>
        )}
        {status === 'ATTENTION' && (
          <span className="badge-status badge-status-attention text-[9px] py-0 px-1.5">
            <span className="material-symbols-outlined text-[10px]">warning</span>
            ATTN
          </span>
        )}
        {status === 'CRITICAL' && (
          <span className="badge-status badge-status-critical text-[9px] py-0 px-1.5">
            <span className="material-symbols-outlined text-[10px]">error</span>
            CRIT
          </span>
        )}
      </div>

      {/* Diagnosis summary */}
      <div className="font-body-md text-[12px] text-secondary mb-2 line-clamp-1">
        {diagnosis.primary_diagnosis}
      </div>

      {/* Telemetry Metric Badges */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle font-data-sm text-[11px]">
        <div className="flex items-center gap-2">
          <BandBadge band={telemetry.band} />
          <span className="text-secondary font-medium">
            {telemetry.txLinkRate_Mbps} Mbps
          </span>
        </div>
        <div className="text-muted">
          <span style={{ color: telemetry.rssi_dBm <= -75 ? 'var(--status-critical)' : 'inherit', fontWeight: 600 }}>
            {telemetry.rssi_dBm} dBm
          </span>
          {' / '}
          <span>{telemetry.snr_dB} dB</span>
        </div>
      </div>
    </div>
  );
};
