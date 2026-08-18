import React from 'react';
import { DeviceCapabilities, APCapabilities } from '../layer1_data/types';
import { IconCpu } from './SvgIcons';

interface CapabilityMatrixProps {
  deviceCaps: DeviceCapabilities;
  apCaps: APCapabilities;
}

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ deviceCaps, apCaps }) => {
  return (
    <div className="border border-[#E2E5E9] rounded-2xl bg-white p-6 space-y-4 shadow-panel">
      <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-3 flex-wrap gap-2">
        <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center">
            <IconCpu size={14} />
          </div>
          <span>Capability Cross-Reference</span>
        </div>
        <span className="font-mono text-[11px] text-[#6B7280] bg-[#F8F9FA] px-2.5 py-1 rounded-md border border-[#E2E5E9]">
          AP: {apCaps.ssid} ({apCaps.apModel})
        </span>
      </div>

      <div className="border border-[#E2E5E9] rounded-xl overflow-hidden shadow-subtle">
        <table className="instrument-table">
          <thead>
            <tr>
              <th>Metric / Hardware Specification</th>
              <th style={{ textAlign: 'right' }}>Client Device</th>
              <th style={{ textAlign: 'right' }}>Access Point Radio</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-[#F8F9FA] transition-colors">
              <td style={{ fontWeight: 600 }}>Protocol Standard</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{deviceCaps.maxStandard}</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{apCaps.maxStandard}</td>
            </tr>
            <tr className="bg-[#F8F9FA]/60 hover:bg-[#F8F9FA] transition-colors">
              <td style={{ fontWeight: 600 }}>Spatial Streams (MIMO)</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{deviceCaps.mimoStreams}</td>
              <td style={{ textAlign: 'right' }} className="font-mono">4x4</td>
            </tr>
            <tr className="hover:bg-[#F8F9FA] transition-colors">
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
            <tr className="bg-[#F8F9FA]/60 hover:bg-[#F8F9FA] transition-colors">
              <td style={{ fontWeight: 600 }}>Supported Frequency Bands</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{deviceCaps.supportedBands.join(', ')}</td>
              <td style={{ textAlign: 'right' }} className="font-mono">{apCaps.enabledBands.join(', ')}</td>
            </tr>
            <tr className="hover:bg-[#F8F9FA] transition-colors">
              <td style={{ fontWeight: 600 }}>Max Theoretical PHY Speed</td>
              <td style={{ textAlign: 'right' }} className="font-mono font-semibold">{deviceCaps.maxTheoreticalPhyMbps} Mbps</td>
              <td style={{ textAlign: 'right' }} className="font-mono">4804 Mbps</td>
            </tr>
            <tr className="bg-[#F8F9FA]/60 hover:bg-[#F8F9FA] transition-colors">
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

