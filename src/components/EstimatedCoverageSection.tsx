import React from 'react';
import { CoverageMapResult } from '../layer2_engine/deadZoneMapper';
import { IconRfAntenna } from './SvgIcons';

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
    <div className="border border-[#E2E5E9] rounded-2xl bg-white p-6 space-y-4 shadow-panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-3 flex-wrap gap-2 mb-1">
        <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center">
            <IconRfAntenna size={14} />
          </div>
          <span>Inferred Coverage & Dead-Zone Map</span>
        </div>
        <span className="font-mono text-[11px] text-[#6B7280] bg-[#F8F9FA] px-2.5 py-1 rounded-md border border-[#E2E5E9]">
          {markers.length} Active Fleet Endpoints Plotted
        </span>
      </div>

      {/* Description & Physical Environment */}
      <div className="text-[13.5px] text-[#3B4045] font-sans space-y-1.5 my-2">
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
      <div className="space-y-2.5 pt-2">
        <div
          className="relative h-8 border border-[#CBD0D6] rounded-xl overflow-hidden shadow-inner"
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
                  className={`w-3.5 h-3.5 rounded-full border transition-transform duration-200 ${
                    isTarget
                      ? 'scale-125 ring-4 ring-black/20 shadow-md'
                      : 'border-white/80 shadow-xs'
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
        <div className="flex justify-between font-mono text-[10.5px] text-[#6B7280] mt-2">
          <span className="text-[#16A34A] font-bold">STRONG LINE-OF-SIGHT (&lt; 5m)</span>
          <span className="text-[#D97706] font-bold">SECONDARY PERIMETER (5–12m)</span>
          <span className="text-[#DC2626] font-bold">ATTENUATED DEAD ZONE (&gt; 12m)</span>
        </div>
      </div>
    </div>
  );
};

