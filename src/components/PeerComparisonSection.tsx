import React, { useState } from 'react';
import { PeerCorroborationResult } from '../layer2_engine/peerAnalysis';
import { IconChevronRight, IconCheckBox, IconAlertTriangle, IconAlertCircle } from './SvgIcons';

interface PeerComparisonSectionProps {
  peerResult: PeerCorroborationResult | null;
}

export const PeerComparisonSection: React.FC<PeerComparisonSectionProps> = ({ peerResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If only 1 device connected or no peer data, hide the section entirely
  if (!peerResult || !peerResult.hasPeers) {
    return null;
  }

  return (
    <div className="border border-[#E2E5E9] bg-white">
      {/* Collapsible Header */}
      <button
        type="button"
        className="w-full p-4 bg-[#F8F9FA] flex items-center justify-between text-left cursor-pointer hover:bg-[#ECEEF1] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className="text-[12px] font-bold text-black transform transition-transform duration-150 inline-block"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <IconChevronRight size={14} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-black">
            Peer Comparison & Corroboration
          </span>
          <span className="badge-status font-mono text-[9px] py-0.5 px-1.5">
            {peerResult.verdict === 'DEVICE_SPECIFIC'
              ? 'Device-Specific Placement'
              : peerResult.verdict === 'ENVIRONMENTAL_SHARED'
              ? 'Shared Environmental Noise'
              : 'Fleet Consistent'}
          </span>
        </div>

        <span className="font-mono text-[11px] text-[#6B7280]">
          {isExpanded ? 'Collapse' : `Compare (${peerResult.relevantPeers.length} Peers)`}
        </span>
      </button>

      {/* Expanded Content Body */}
      {isExpanded && (
        <div className="p-4 border-t border-[#E2E5E9] space-y-3">
          {/* Summary Sentence */}
          <div className="p-3 bg-[#F8F9FA] border border-[#E2E5E9] text-[13px] text-black leading-relaxed font-medium">
            {peerResult.summarySentence}
          </div>

          {/* Compact Peer Comparison List */}
          {peerResult.relevantPeers.length > 0 && (
            <div className="border border-[#E2E5E9] overflow-x-auto">
              <table className="instrument-table">
                <thead>
                  <tr>
                    <th>Peer Device</th>
                    <th>Band</th>
                    <th>Standard</th>
                    <th style={{ textAlign: 'right' }}>RSSI / SNR</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {peerResult.relevantPeers.map(peer => (
                    <tr key={peer.id}>
                      <td>
                        <strong className="text-black">{peer.hostname}</strong>
                        <span className="font-mono text-[11px] text-[#6B7280] ml-2">({peer.vendor})</span>
                      </td>
                      <td className="font-mono text-[12px]">{peer.band}</td>
                      <td className="font-mono text-[12px]">{peer.standard}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono text-[12px]">
                        {peer.rssi_dBm} dBm / {peer.snr_dB} dB
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {peer.status === 'HEALTHY' && (
                          <span className="badge-status badge-status-healthy text-[9px]">
                            <IconCheckBox size={10} /> HEALTHY
                          </span>
                        )}
                        {peer.status === 'ATTENTION' && (
                          <span className="badge-status badge-status-attention text-[9px]">
                            <IconAlertTriangle size={10} /> ATTN
                          </span>
                        )}
                        {peer.status === 'CRITICAL' && (
                          <span className="badge-status badge-status-critical text-[9px]">
                            <IconAlertCircle size={10} /> CRIT
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
