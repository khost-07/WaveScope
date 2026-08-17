import React from 'react';
import { DeviceCapabilities, APCapabilities } from '../layer1_data/types';
import { IconCpu } from './SvgIcons';

interface CapabilityMatrixProps {
  deviceCaps: DeviceCapabilities;
  apCaps: APCapabilities;
}

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ deviceCaps, apCaps }) => {
  return (
    <div className="border border-[#E5E5E5] bg-white p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] flex items-center gap-1.5">
          <IconCpu size={15} />
          <span>Capability Cross-Reference</span>
        </div>
        <span className="font-mono text-[11px] text-[#747878]">AP: {apCaps.ssid} ({apCaps.apModel})</span>
      </div>

      <div className="border border-[#E5E5E5] overflow-x-auto">
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
            <tr className="bg-[#FAFAFA]">
              <td style={{ fontWeight: 600 }}>Spatial Streams (MIMO)</td>
              <td style={{ textAlign: 'right' }}>{deviceCaps.mimoStreams}</td>
              <td style={{ textAlign: 'right' }}>4x4</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Channel Width</td>
              <td
                style={{
                  textAlign: 'right',
                  color: deviceCaps.maxChannelWidthMHz < apCaps.maxChannelWidthMHz ? '#F57C00' : 'inherit'
                }}
              >
                {deviceCaps.maxChannelWidthMHz} MHz
              </td>
              <td style={{ textAlign: 'right' }}>{apCaps.maxChannelWidthMHz} MHz</td>
            </tr>
            <tr className="bg-[#FAFAFA]">
              <td style={{ fontWeight: 600 }}>Supported Bands</td>
              <td style={{ textAlign: 'right' }}>{deviceCaps.supportedBands.join(', ')}</td>
              <td style={{ textAlign: 'right' }}>{apCaps.enabledBands.join(', ')}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Max Theoretical PHY</td>
              <td style={{ textAlign: 'right' }}>{deviceCaps.maxTheoreticalPhyMbps} Mbps</td>
              <td style={{ textAlign: 'right' }}>4804 Mbps</td>
            </tr>
            <tr className="bg-[#FAFAFA]">
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
