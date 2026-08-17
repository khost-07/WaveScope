import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { IconCheckBox, IconAlertTriangle, IconAlertCircle } from './SvgIcons';

interface DeviceCardProps {
  device: ClientDevice;
  diagnosis: StructuredDiagnosis;
  isSelected: boolean;
  onSelect: (device: ClientDevice) => void;
  trendSymbol?: string;
  trendDirection?: 'IMPROVING' | 'STABLE' | 'DEGRADING';
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  diagnosis,
  isSelected,
  onSelect,
  trendSymbol,
  trendDirection
}) => {
  const status = diagnosis.status;

  return (
    <div
      className={`p-3.5 bg-white border mb-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#0F1113] bg-[#F8F9FA] shadow-sm'
          : 'border-[#E2E5E9] hover:border-[#CBD0D6] hover:bg-[#F8F9FA]'
      }`}
      style={{
        borderLeftWidth: isSelected ? '4px' : '1px',
        borderLeftColor: isSelected ? '#0F1113' : '#E2E5E9'
      }}
      onClick={() => onSelect(device)}
    >
      {/* Top Row: Device Name & Status Badge with Trend Arrow */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="text-[14px] text-black font-bold leading-tight truncate">
            {device.hostname}
          </div>
          <div className="font-mono text-[#6B7280] text-[11px] mt-0.5 truncate">
            {device.vendor} &bull; {device.macAddress}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {status === 'HEALTHY' && (
            <span className="badge-status badge-status-healthy text-[9px] py-0.5 px-1.5 flex items-center gap-1">
              <IconCheckBox size={11} />
              HEALTHY
              {trendSymbol && <span className="font-bold ml-0.5">{trendSymbol}</span>}
            </span>
          )}
          {status === 'ATTENTION' && (
            <span className="badge-status badge-status-attention text-[9px] py-0.5 px-1.5 flex items-center gap-1">
              <IconAlertTriangle size={11} />
              ATTN
              {trendSymbol && <span className="font-bold ml-0.5">{trendSymbol}</span>}
            </span>
          )}
          {status === 'CRITICAL' && (
            <span className="badge-status badge-status-critical text-[9px] py-0.5 px-1.5 flex items-center gap-1">
              <IconAlertCircle size={11} />
              CRIT
              {trendSymbol && <span className="font-bold ml-0.5">{trendSymbol}</span>}
            </span>
          )}
        </div>
      </div>

      {/* Diagnosis summary prose with trend qualifier if present */}
      <div className="text-[12px] text-[#3B4045] line-clamp-2 mt-1 leading-snug">
        {diagnosis.primary_diagnosis}
        {trendDirection && trendDirection !== 'STABLE' && (
          <span className="font-mono text-[11px] text-[#6B7280] ml-1">
            ({trendDirection.toLowerCase()})
          </span>
        )}
      </div>
    </div>
  );
};
