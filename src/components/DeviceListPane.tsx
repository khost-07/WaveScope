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
    <div className="device-list-pane">
      {/* Search Bar */}
      <div className="list-search-bar">
        <div className="search-input-box">
          <IconSearch size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by device, vendor, MAC, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Device Cards List */}
      <div className="list-cards-scroll">
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
          <div className="empty-search-state">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>No matching devices found</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search query</div>
          </div>
        )}
      </div>

      {/* Pane Footer */}
      <div className="list-pane-footer mono">
        <span>Associated Clients: <strong>{devices.length}</strong></span>
        <span>Engine: <strong>Deterministic L2</strong></span>
      </div>
    </div>
  );
};
