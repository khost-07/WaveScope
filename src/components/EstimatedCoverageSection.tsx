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
    <div className="border border-[#E2E5E9] bg-white p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-2 flex-wrap gap-2 mb-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-1.5">
          <IconSignal size={15} />
          <span>Inferred Coverage & Dead-Zone Map</span>
        </div>
        <span className="font-mono text-[11px] text-[#6B7280]">
          {markers.length} Active Fleet Endpoints Plotted
        </span>
      </div>

      {/* Description & Physical Environment */}
      <div className="text-[13px] text-[#3B4045] font-sans space-y-1.5 my-2">
        <p className="leading-relaxed">
          <strong className="text-black">{selectedHostname}</strong>: {zoneDescription}
        </p>
        {environmentNote && (
          <p className="font-mono text-[11px] text-[#6B7280] mt-1">
            Physical Location: <strong className="text-black">{environmentNote}</strong>
          </p>
        )}
      </div>

      {/* Horizontal Gradient Bar */}
      <div className="space-y-2 pt-2">
        <div
          className="relative h-7 border border-[#CBD0D6]"
          style={{ background: 'linear-gradient(to right, #DCFCE7 0%, #FEF3C7 55%, #FEE2E2 100%)' }}
        >
          {/* Zone Dividers */}
          <div className="absolute top-0 bottom-0 left-[35%] w-[1px] bg-black/15"></div>
          <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-black/15"></div>

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
                  zIndex: isTarget ? 30 : 10
                }}
                title={`${m.hostname}: ${m.rssi_dBm} dBm (~${m.estimatedDistanceMeters}m) [${m.zone}]`}
              >
                <div
                  className={`w-3 h-3 border transition-transform ${
                    isTarget
                      ? 'bg-black border-black scale-125 ring-2 ring-black/30'
                      : 'bg-white border-[#6B7280]'
                  }`}
                  style={{
                    backgroundColor: isTarget
                      ? '#0F1113'
                      : m.status === 'CRITICAL'
                      ? '#DC2626'
                      : m.status === 'ATTENTION'
                      ? '#D97706'
                      : '#16A34A'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Zone Labels */}
        <div className="flex justify-between font-mono text-[10px] text-[#6B7280] mt-1.5">
          <span className="text-[#16A34A] font-bold">STRONG LINE-OF-SIGHT (&lt; 5m)</span>
          <span className="text-[#D97706] font-bold">SECONDARY PERIMETER (5–12m)</span>
          <span className="text-[#DC2626] font-bold">ATTENUATED DEAD ZONE (&gt; 12m)</span>
        </div>
      </div>
    </div>
  );
};
