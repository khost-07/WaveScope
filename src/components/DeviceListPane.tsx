import React, { useState, useMemo } from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { DeviceCard } from './DeviceCard';
import { IconSearch } from './SvgIcons';

interface DeviceListPaneProps {
  devices: ClientDevice[];
  diagnoses: Record<string, StructuredDiagnosis>;
  selectedDeviceId: string | null;
  onSelectDevice: (device: ClientDevice) => void;
  trends?: Record<string, { symbol: string; direction: 'IMPROVING' | 'STABLE' | 'DEGRADING' }>;
}

export const DeviceListPane: React.FC<DeviceListPaneProps> = ({
  devices,
  diagnoses,
  selectedDeviceId,
  onSelectDevice,
  trends
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'DEGRADED' | 'HEALTHY'>('ALL');

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const diag = diagnoses[d.id];
      const status = diag?.status || 'HEALTHY';

      if (quickFilter === 'DEGRADED' && status === 'HEALTHY') return false;
      if (quickFilter === 'HEALTHY' && status !== 'HEALTHY') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const diagText = diag?.primary_diagnosis?.toLowerCase() || '';

      return (
        d.hostname.toLowerCase().includes(q) ||
        d.vendor.toLowerCase().includes(q) ||
        d.macAddress.toLowerCase().includes(q) ||
        d.deviceType.toLowerCase().includes(q) ||
        diagText.includes(q)
      );
    });
  }, [devices, diagnoses, searchQuery, quickFilter]);

  return (
    <div className="bg-white border border-[#E2E5E9] flex flex-col h-full">
      {/* Search Header */}
      <div className="p-3 border-b border-[#E2E5E9] bg-[#F8F9FA] space-y-2">
        <div className="relative flex items-center">
          <IconSearch size={15} className="absolute left-2.5 text-[#6B7280]" />
          <input
            type="text"
            className="w-full bg-white border border-[#E2E5E9] py-1.5 pl-8 pr-7 font-mono text-[12px] text-black placeholder-[#6B7280] outline-none focus:border-black transition-colors"
            placeholder="Search MAC, IP, vendor, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 text-[#6B7280] hover:text-black font-bold text-[14px]"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Filter Bar */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold">
          <button
            type="button"
            className={`px-2 py-0.5 border transition-all ${
              quickFilter === 'ALL'
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#6B7280] border-[#E2E5E9] hover:border-black'
            }`}
            onClick={() => setQuickFilter('ALL')}
          >
            ALL ({devices.length})
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 border transition-all ${
              quickFilter === 'DEGRADED'
                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                : 'bg-white text-[#DC2626] border-[#E2E5E9] hover:border-[#DC2626]'
            }`}
            onClick={() => setQuickFilter('DEGRADED')}
          >
            ISSUES ({devices.filter(d => diagnoses[d.id]?.status !== 'HEALTHY').length})
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 border transition-all ${
              quickFilter === 'HEALTHY'
                ? 'bg-[#16A34A] text-white border-[#16A34A]'
                : 'bg-white text-[#16A34A] border-[#E2E5E9] hover:border-[#16A34A]'
            }`}
            onClick={() => setQuickFilter('HEALTHY')}
          >
            HEALTHY ({devices.filter(d => diagnoses[d.id]?.status === 'HEALTHY').length})
          </button>
        </div>
      </div>

      {/* Device List Scroll Area */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
        {filteredDevices.length > 0 ? (
          filteredDevices.map(device => {
            const diagnosis = diagnoses[device.id] || {
              primary_diagnosis: 'Healthy',
              severity: 'Low',
              status: 'HEALTHY',
              confidence: 90,
              evidence: [],
              possible_causes: [],
              secondary_factors: [],
              hypothesis_scores: {},
              evaluated_at: Date.now()
            };

            const devTrend = trends?.[device.id];

            return (
              <DeviceCard
                key={device.id}
                device={device}
                diagnosis={diagnosis}
                isSelected={selectedDeviceId === device.id}
                onSelect={onSelectDevice}
                trendSymbol={devTrend?.symbol}
                trendDirection={devTrend?.direction}
              />
            );
          })
        ) : (
          <div className="p-8 text-center text-[#6B7280] text-[13px] font-mono">
            No matching client endpoints found.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#E2E5E9] bg-[#F8F9FA] font-mono text-[11px] text-[#6B7280] flex justify-between">
        <span>Endpoints: <strong className="text-black">{devices.length}</strong></span>
        <span>Engine: <strong className="text-black">L2 Rule System</strong></span>
      </div>
    </div>
  );
};
