import React from 'react';
import { DeviceCapabilities, APCapabilities } from '../layer1_data/types';

interface CapabilityMatrixProps {
  deviceCaps: DeviceCapabilities;
  apCaps: APCapabilities;
}

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ deviceCaps, apCaps }) => {
  return (
    <div className="border border-border-subtle bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <h3 className="font-label-caps text-secondary flex items-center">
          <span className="material-symbols-outlined mr-1.5 text-[16px]">compare_arrows</span>
          Capability Cross-Reference
        </h3>
        <span className="font-data-sm text-muted">AP: {apCaps.ssid} ({apCaps.apModel})</span>
      </div>

      <div className="border border-border-subtle overflow-x-auto">
        <table className="instrument-table">
          <thead>
            <tr>
              <th>Metric / Feature</th>
              <th style={{ textAlign: 'right' }}>Device</th>
              <th style={{ textAlign: 'right' }}>Access Point</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Standard</td>
              <td style={{ textAlign: 'right' }}>{deviceCaps.maxStandard}</td>
              <td style={{ textAlign: 'right' }}>{apCaps.maxStandard}</td>
            </tr>
            <tr className="bg-surface-offset">
              <td style={{ fontWeight: 600 }}>Spatial Streams (MIMO)</td>
              <td style={{ textAlign: 'right' }}>{deviceCaps.mimoStreams}</td>
              <td style={{ textAlign: 'right' }}>4x4</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Channel Width</td>
              <td
                style={{
                  textAlign: 'right',
                  color: deviceCaps.maxChannelWidthMHz < apCaps.maxChannelWidthMHz ? 'var(--status-attention)' : 'inherit'
                }}
              >
                {deviceCaps.maxChannelWidthMHz} MHz
              </td>
              <td style={{ textAlign: 'right' }}>{apCaps.maxChannelWidthMHz} MHz</td>
            </tr>
            <tr className="bg-surface-offset">
              <td style={{ fontWeight: 600 }}>Supported Bands</td>
              <td style={{ textAlign: 'right' }}>{deviceCaps.supportedBands.join(', ')}</td>
              <td style={{ textAlign: 'right' }}>{apCaps.enabledBands.join(', ')}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Max Theoretical PHY</td>
              <td style={{ textAlign: 'right' }}>{deviceCaps.maxTheoreticalPhyMbps} Mbps</td>
              <td style={{ textAlign: 'right' }}>4804 Mbps</td>
            </tr>
            <tr className="bg-surface-offset">
              <td style={{ fontWeight: 600 }}>6GHz (Wi-Fi 6E/7) Capable</td>
              <td style={{ textAlign: 'right' }}>{deviceCaps.supports6GHz ? 'Yes' : 'No'}</td>
              <td style={{ textAlign: 'right' }}>{apCaps.supports6GHz ? 'Yes' : 'No'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
