import React from 'react';
import { StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { IconSparkles, IconRefresh, IconKey, IconCheckBox, IconAlertTriangle, IconAlertCircle, IconZap } from './SvgIcons';

interface SuperSimpleOverviewProps {
  diagnosis: StructuredDiagnosis;
  explanation: LLMExplanationResponse | null;
  isLoading: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenKeyModal?: () => void;
  onSwitchToTechnical?: () => void;
}

export const SuperSimpleOverview: React.FC<SuperSimpleOverviewProps> = ({
  diagnosis,
  explanation,
  isLoading,
  error,
  onRefresh,
  onOpenKeyModal,
  onSwitchToTechnical
}) => {
  if (isLoading) {
    return (
      <div className="p-8 border border-[#E5E5E5] bg-white text-center space-y-3">
        <div className="inline-block animate-spin text-black">
          <IconRefresh size={32} />
        </div>
        <h3 className="text-[17px] font-bold text-black">Analyzing telemetry in everyday English...</h3>
        <p className="font-mono text-[12px] text-[#747878]">Running live prompt through gemini-3.1-flash-lite</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-[#D32F2F] bg-white space-y-4">
        <div className="flex items-center gap-2 text-[#D32F2F]">
          <IconAlertCircle size={24} />
          <h3 className="text-[16px] font-bold">Could not load AI explanation</h3>
        </div>
        <p className="font-mono text-[12px] text-[#444748]">{error}</p>
        <div className="flex gap-3">
          {onRefresh && (
            <button type="button" className="btn-instrument-primary" onClick={onRefresh}>
              <IconRefresh size={14} />
              <span>Retry Evaluation</span>
            </button>
          )}
          {onOpenKeyModal && (
            <button type="button" className="btn-instrument-secondary" onClick={onOpenKeyModal}>
              <IconKey size={14} />
              <span>Update API Key</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const simple = explanation?.simpleOverview;
  const isHealthy = diagnosis.status === 'HEALTHY';
  const isCritical = diagnosis.status === 'CRITICAL';

  return (
    <div className="space-y-4">
      {/* Top Banner: Big Plain English Headline */}
      <div
        className="p-5 border border-[#E5E5E5] bg-white"
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: isCritical ? '#D32F2F' : isHealthy ? '#2E7D32' : '#F57C00'
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] tracking-wider">
            {isHealthy ? (
              <span className="badge-status badge-status-healthy flex items-center gap-1">
                <IconCheckBox size={12} />
                EVERYTHING LOOKS GREAT
              </span>
            ) : isCritical ? (
              <span className="badge-status badge-status-critical flex items-center gap-1">
                <IconAlertCircle size={12} />
                ACTION RECOMMENDED
              </span>
            ) : (
              <span className="badge-status badge-status-attention flex items-center gap-1">
                <IconAlertTriangle size={12} />
                SUB-OPTIMAL LINK
              </span>
            )}
          </div>

          <div className="font-mono text-[11px] text-[#747878]">
            {simple?.experienceRating || (isHealthy ? 'Optimal for Streaming & Calls' : 'Performance Limited')}
          </div>
        </div>

        <h2 className="text-[20px] font-bold text-black">
          {simple?.headline || diagnosis.primary_diagnosis}
        </h2>
      </div>

      {/* Grid: What is Happening & Why It Matters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: What is happening */}
        <div className="p-4 border border-[#E5E5E5] bg-white space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#444748]">
            <IconSparkles size={15} className="text-black" />
            <span>What is happening?</span>
          </div>
          <p className="text-[13px] text-[#444748] leading-relaxed">
            {simple?.whatIsHappening || explanation?.plainEnglishExplanation || 'Analyzing network metrics...'}
          </p>
        </div>

        {/* Card 2: Why it matters */}
        <div className="p-4 border border-[#E5E5E5] bg-white space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#444748]">
            <IconAlertTriangle size={15} className="text-black" />
            <span>Why does this matter?</span>
          </div>
          <p className="text-[13px] text-[#444748] leading-relaxed">
            {simple?.whyItMatters || 'May cause occasional buffering, lower maximum speed, or longer download times.'}
          </p>
        </div>
      </div>

      {/* Step-by-Step Fix Checklist */}
      <div className="p-5 border border-[#E5E5E5] bg-white space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#444748] border-b border-[#E5E5E5] pb-2">
          <IconZap size={15} className="text-black" />
          <span>How to solve this problem</span>
        </div>

        <div className="space-y-2">
          {simple?.simpleStepsToFix && simple.simpleStepsToFix.length > 0 ? (
            simple.simpleStepsToFix.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 bg-[#FAFAFA] border border-[#E5E5E5]">
                <div className="font-mono text-[11px] font-bold w-5 h-5 flex items-center justify-center bg-black text-white flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="text-[13px] text-black">{step}</div>
              </div>
            ))
          ) : (
            <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] text-[13px] text-[#444748]">
              No configuration changes required. Link is operating within optimal RF thresholds.
            </div>
          )}
        </div>
      </div>

      {/* Switcher */}
      {onSwitchToTechnical && (
        <div className="flex items-center justify-between p-3 bg-[#FAFAFA] border border-[#E5E5E5] font-mono text-[12px] text-[#444748]">
          <span>Need full RF spectrum dBm numbers and Layer 2 hypothesis math?</span>
          <button type="button" className="btn-instrument-secondary" onClick={onSwitchToTechnical}>
            View RF Telemetry Spectrum &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
