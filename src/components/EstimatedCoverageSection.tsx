import React from 'react';
import { CoverageMapResult } from '../layer2_engine/deadZoneMapper';
import { IconSignal } from './SvgIcons';

interface EstimatedCoverageSectionProps {
  coverageResult: CoverageMapResult;
  selectedHostname: string;
}

export const EstimatedCoverageSection: React.FC<EstimatedCoverageSectionProps> = ({
  coverageResult,
  selectedHostname
}) => {
  const { markers, zoneDescription, environmentNote } = coverageResult;

  return (
    <div className="border border-[#E5E5E5] bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] flex items-center gap-1.5">
          <IconSignal size={15} />
          <span>Estimated Coverage</span>
        </div>
        <span className="font-mono text-[11px] text-[#747878]">
          {markers.length} Endpoints Plotted
        </span>
      </div>

      {/* Description & Physical Environment */}
      <div className="text-[12px] text-[#444748] font-sans space-y-1">
        <p>
          <strong className="text-black">{selectedHostname}</strong>: {zoneDescription}
        </p>
        {environmentNote && (
          <p className="font-mono text-[11px] text-[#747878]">
            Physical Location: {environmentNote}
          </p>
        )}
      </div>

      {/* Horizontal Gradient Bar */}
      <div className="space-y-1.5 pt-2">
        <div
          className="relative h-6 border border-[#E5E5E5]"
          style={{ background: 'linear-gradient(to right, #E8F5E9 0%, #FFF3E0 55%, #FFEBEE 100%)' }}
        >
          {/* Zone Dividers */}
          <div className="absolute top-0 bottom-0 left-[35%] w-[1px] bg-black/10"></div>
          <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-black/10"></div>

          {/* Device Markers */}
          {markers.map(m => {
            const isTarget = m.isSelected;
            return (
              <div
                key={m.id}
                className="absolute top-0 bottom-0 flex flex-col items-center justify-center transition-all"
                style={{
                  left: `${m.positionPercent}%`,
                  transform: 'translateX(-50%)',
                  zIndex: isTarget ? 20 : 10
                }}
                title={`${m.hostname}: ${m.rssi_dBm} dBm (~${m.estimatedDistanceMeters}m) [${m.zone}]`}
              >
                <div
                  className={`w-2.5 h-2.5 border transition-transform ${
                    isTarget ? 'bg-black border-black scale-125 ring-2 ring-black/20' : 'bg-white border-[#747878]'
                  }`}
                  style={{
                    backgroundColor: isTarget
                      ? '#000000'
                      : m.status === 'CRITICAL'
                      ? '#D32F2F'
                      : m.status === 'ATTENTION'
                      ? '#F57C00'
                      : '#2E7D32'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Zone Labels */}
        <div className="flex justify-between font-mono text-[10px] text-[#747878]">
          <span className="text-[#2E7D32] font-semibold">STRONG (&lt; 5m)</span>
          <span className="text-[#F57C00] font-semibold">MARGINAL (5–12m)</span>
          <span className="text-[#D32F2F] font-semibold">WEAK / DEAD ZONE (&gt; 12m)</span>
        </div>
      </div>
    </div>
  );
};
