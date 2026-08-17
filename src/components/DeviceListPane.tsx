import React, { useState, useMemo } from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { DeviceCard } from './DeviceCard';
import { IconSearch } from './SvgIcons';

interface DeviceListPaneProps {
  devices: ClientDevice[];
  diagnoses: Record<string, StructuredDiagnosis>;
  selectedDeviceId: string | null;
  onSelectDevice: (device: ClientDevice) => void;
}

export const DeviceListPane: React.FC<DeviceListPaneProps> = ({
  devices,
  diagnoses,
  selectedDeviceId,
  onSelectDevice
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const q = searchQuery.toLowerCase();
    return devices.filter(d => {
      const diag = diagnoses[d.id]?.primary_diagnosis?.toLowerCase() || '';
      return (
        d.hostname.toLowerCase().includes(q) ||
        d.vendor.toLowerCase().includes(q) ||
        d.macAddress.toLowerCase().includes(q) ||
        d.deviceType.toLowerCase().includes(q) ||
        diag.includes(q)
      );
    });
  }, [devices, diagnoses, searchQuery]);

  return (
    <div className="bg-white border border-[#E5E5E5] flex flex-col h-full">
      {/* Search Header */}
      <div className="p-3 border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="relative flex items-center">
          <IconSearch size={15} className="absolute left-2.5 text-[#747878]" />
          <input
            type="text"
            className="w-full bg-white border border-[#E5E5E5] py-1.5 pl-8 pr-7 font-mono text-[12px] text-black placeholder-[#747878] outline-none focus:border-black"
            placeholder="Search MAC, IP, vendor, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 text-[#747878] hover:text-black font-bold text-[14px]"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
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

            return (
              <DeviceCard
                key={device.id}
                device={device}
                diagnosis={diagnosis}
                isSelected={selectedDeviceId === device.id}
                onSelect={onSelectDevice}
              />
            );
          })
        ) : (
          <div className="p-6 text-center text-[#747878] text-[13px]">
            No matching client devices found.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#E5E5E5] bg-[#FAFAFA] font-mono text-[11px] text-[#747878] flex justify-between">
        <span>Clients: <strong className="text-black">{devices.length}</strong></span>
        <span>Engine: <strong className="text-black">L2 Deterministic</strong></span>
      </div>
    </div>
  );
};
