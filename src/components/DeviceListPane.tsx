import React, { useState, useMemo } from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { DeviceCard } from './DeviceCard';

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
    <div className="bg-surface border border-border-subtle flex flex-col h-full">
      {/* Search Header */}
      <div className="p-3 border-b border-border-subtle bg-surface-offset">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-surface border border-border-subtle p-2 pl-8 font-data-sm text-primary placeholder-muted outline-none focus:border-primary"
            placeholder="Search MAC, IP, vendor, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="material-symbols-outlined absolute left-2 top-2 text-[16px] text-muted">
            search
          </span>
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-2 text-muted hover:text-primary font-bold"
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
          <div className="p-6 text-center text-muted font-body-md text-[13px]">
            No matching client devices found.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-border-subtle bg-surface-offset font-data-sm text-[11px] text-muted flex justify-between">
        <span>Clients: <strong>{devices.length}</strong></span>
        <span>Engine: <strong>L2 Deterministic</strong></span>
      </div>
    </div>
  );
};
