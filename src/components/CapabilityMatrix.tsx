import React from 'react';
import { DeviceCapabilities, APCapabilities } from '../layer1_data/types';

interface CapabilityMatrixProps {
  deviceCaps: DeviceCapabilities;
  apCaps: APCapabilities;
}

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ deviceCaps, apCaps }) => {
  return (
    <div className="instrument-section">
      <div className="section-header">
        <span>Hardware Capability Cross-Reference (Device vs AP)</span>
        <span className="mono" style={{ fontSize: '10.5px' }}>AP: {apCaps.ssid} ({apCaps.apModel})</span>
      </div>

      <div style={{ padding: '0' }}>
        <table className="instrument-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Capability Parameter</th>
              <th style={{ width: '35%' }}>Client Device Radio</th>
              <th style={{ width: '35%' }}>Access Point Radio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Protocol Generation / Standard</td>
              <td className="mono">
                {deviceCaps.maxStandard}
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({deviceCaps.supportedStandards.join(', ')})
                </span>
              </td>
              <td className="mono">
                {apCaps.maxStandard}
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({apCaps.operatingStandards.join(', ')})
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Supported Frequency Bands</td>
              <td className="mono">
                {deviceCaps.supportedBands.join(' / ')}
              </td>
              <td className="mono">
                {apCaps.enabledBands.join(' / ')}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Max Channel Width</td>
              <td className="mono">
                {deviceCaps.maxChannelWidthMHz} MHz
              </td>
              <td className="mono">
                {apCaps.maxChannelWidthMHz} MHz
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Spatial Stream Architecture (MIMO)</td>
              <td className="mono">
                {deviceCaps.mimoStreams}
              </td>
              <td className="mono">
                4x4 (Multi-User MIMO)
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Theoretical Maximum PHY Throughput</td>
              <td className="mono">
                {deviceCaps.maxTheoreticalPhyMbps} Mbps
              </td>
              <td className="mono">
                4804 Mbps (Aggregate)
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>6 GHz (Wi-Fi 6E / 7) Support</td>
              <td className="mono">
                {deviceCaps.supports6GHz ? 'YES (6GHz Enabled)' : 'NO (Legacy/Dual-Band Only)'}
              </td>
              <td className="mono">
                {apCaps.supports6GHz ? 'YES (Active U-NII 5-8)' : 'NO'}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>BSS Channel Airtime Utilization</td>
              <td className="mono" style={{ color: 'var(--text-muted)' }}>
                N/A (Client)
              </td>
              <td className="mono" style={{ fontWeight: 600, color: apCaps.channelUtilizationPct >= 70 ? 'var(--rf-critical-text)' : apCaps.channelUtilizationPct >= 50 ? 'var(--rf-attention-text)' : 'var(--text-main)' }}>
                {apCaps.channelUtilizationPct}% {apCaps.channelUtilizationPct >= 70 ? '[HIGH LOAD]' : '[NOMINAL]'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
