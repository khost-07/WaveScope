import React from 'react';
import { DeviceCapabilities, APCapabilities } from '../layer1_data/types';
import { IconCpu } from './SvgIcons';

interface CapabilityMatrixProps {
  deviceCaps: DeviceCapabilities;
  apCaps: APCapabilities;
}

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ deviceCaps, apCaps }) => {
  return (
    <div className="border border-[#E2E5E9] bg-white p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-2 flex-wrap gap-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-1.5">
          <IconCpu size={15} />
          <span>Capability Cross-Reference</span>
        </div>
        <span className="font-mono text-[11px] text-[#6B7280]">AP: {apCaps.ssid} ({apCaps.apModel})</span>
      </div>

      <div className="border border-[#E2E5E9] overflow-x-auto">
        <table className="instrument-table">
          <thead>
            <tr>
              <th>Metric / Hardware Specification</th>
              <th style={{ textAlign: 'right' }}>Client Device</th>
              <th style={{ textAlign: 'right' }}>Access Point Radio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Protocol Standard</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{deviceCaps.maxStandard}</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{apCaps.maxStandard}</td>
            </tr>
            <tr className="bg-[#F8F9FA]">
              <td style={{ fontWeight: 600 }}>Spatial Streams (MIMO)</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{deviceCaps.mimoStreams}</td>
              <td style={{ textAlign: 'right' }} className="font-mono">4x4</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Channel Width</td>
              <td
                style={{
                  textAlign: 'right',
                  color: deviceCaps.maxChannelWidthMHz < apCaps.maxChannelWidthMHz ? '#D97706' : 'inherit'
                }}
                className="font-mono font-semibold"
              >
                {deviceCaps.maxChannelWidthMHz} MHz
              </td>
              <td style={{ textAlign: 'right' }} className="font-mono">{apCaps.maxChannelWidthMHz} MHz</td>
            </tr>
            <tr className="bg-[#F8F9FA]">
              <td style={{ fontWeight: 600 }}>Supported Frequency Bands</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{deviceCaps.supportedBands.join(', ')}</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{apCaps.enabledBands.join(', ')}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Max Theoretical PHY Speed</td>
              <td style={{ textAlign: 'right' }} className="font-mono font-semibold">{deviceCaps.maxTheoreticalPhyMbps} Mbps</td>
              <td style={{ textAlign: 'right' }} className="font-mono">4804 Mbps</td>
            </tr>
            <tr className="bg-[#F8F9FA]">
              <td style={{ fontWeight: 600 }}>6GHz (Wi-Fi 6E/7) Support</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{deviceCaps.supports6GHz ? 'Yes' : 'No'}</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{apCaps.supports6GHz ? 'Yes' : 'No'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
