import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { IconCheckBox, IconAlertTriangle, IconAlertCircle } from './SvgIcons';

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
  const status = diagnosis.status;

  return (
    <div
      className={`p-3 bg-white border mb-2 cursor-pointer transition-colors ${
        isSelected ? 'border-black bg-[#FAFAFA]' : 'border-[#E5E5E5] hover:bg-[#FAFAFA]'
      }`}
      style={{
        borderLeftWidth: isSelected ? '4px' : '1px',
        borderLeftColor: isSelected ? '#000000' : '#E5E5E5'
      }}
      onClick={() => onSelect(device)}
    >
      {/* Top Row: Device Name & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <div className="text-[14px] text-black font-bold leading-tight">
            {device.hostname}
          </div>
          <div className="font-mono text-[#747878] text-[11px] mt-0.5">
            {device.vendor} • {device.macAddress}
          </div>
        </div>

        {status === 'HEALTHY' && (
          <span className="badge-status badge-status-healthy text-[9px] py-0.5 px-1.5 flex items-center gap-1 flex-shrink-0">
            <IconCheckBox size={11} />
            HEALTHY
          </span>
        )}
        {status === 'ATTENTION' && (
          <span className="badge-status badge-status-attention text-[9px] py-0.5 px-1.5 flex items-center gap-1 flex-shrink-0">
            <IconAlertTriangle size={11} />
            ATTN
          </span>
        )}
        {status === 'CRITICAL' && (
          <span className="badge-status badge-status-critical text-[9px] py-0.5 px-1.5 flex items-center gap-1 flex-shrink-0">
            <IconAlertCircle size={11} />
            CRIT
          </span>
        )}
      </div>

      {/* Diagnosis summary prose (No redundant dBm/dB values) */}
      <div className="text-[12px] text-[#444748] line-clamp-2 mt-1">
        {diagnosis.primary_diagnosis}
      </div>
    </div>
  );
};
