import React from 'react';
import { StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { IconSparkles, IconRefresh, IconKey, IconCheckBox, IconAlertTriangle, IconAlertCircle, IconZap, IconRfSignalWave } from './SvgIcons';

interface SuperSimpleOverviewProps {
  diagnosis: StructuredDiagnosis;
  explanation: LLMExplanationResponse | null;
  isLoading: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenKeyModal?: () => void;
}

export const SuperSimpleOverview: React.FC<SuperSimpleOverviewProps> = ({
  diagnosis,
  explanation,
  isLoading,
  error,
  onRefresh,
  onOpenKeyModal
}) => {
  if (isLoading) {
    return (
      <div className="p-8 border border-[#E2E5E9] rounded-xl bg-white shadow-card text-center space-y-3">
        <div className="inline-block animate-spin text-black mb-1">
          <IconRefresh size={32} />
        </div>
        <h3 className="text-[16px] font-bold text-black mb-1">Translating telemetry into plain English...</h3>
        <p className="font-mono text-[11px] text-[#6B7280]">Running live prompt via gemini-3.1-flash-lite</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-[#DC2626] rounded-xl bg-white shadow-card space-y-3">
        <div className="flex items-center gap-2 text-[#DC2626] mb-1">
          <IconAlertCircle size={22} />
          <h3 className="text-[15px] font-bold">Could not load AI explanation</h3>
        </div>
        <p className="font-mono text-[12px] text-[#3B4045] bg-[#F8F9FA] p-3 rounded-lg border border-[#E2E5E9] mb-2">{error}</p>
        <div className="flex gap-3 pt-2">
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
        className="p-5 border rounded-xl bg-white shadow-card relative overflow-hidden transition-all duration-200"
        style={{
          borderColor: isCritical ? 'rgba(220,38,38,0.3)' : isHealthy ? 'rgba(22,163,74,0.3)' : 'rgba(217,119,6,0.3)',
          borderLeftWidth: '4px',
          borderLeftColor: isCritical ? '#DC2626' : isHealthy ? '#16A34A' : '#D97706',
          backgroundColor: isCritical ? 'rgba(220,38,38,0.02)' : isHealthy ? 'rgba(22,163,74,0.02)' : 'rgba(217,119,6,0.02)'
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
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

          <div className="font-mono text-[11px] text-[#6B7280] bg-white px-2.5 py-1 rounded-md border border-[#E2E5E9] shadow-xs">
            {simple?.experienceRating || (isHealthy ? 'Optimal for 4K Streaming & Voice' : 'Performance Constrained')}
          </div>
        </div>

        <h2 className="text-[20px] font-bold text-black leading-snug tracking-tight mt-1.5">
          {simple?.headline || diagnosis.primary_diagnosis}
        </h2>
      </div>

      {/* Grid: What is Happening & Why It Matters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: What is happening */}
        <div className="p-5 border border-[#E2E5E9] rounded-xl bg-white shadow-card hover:shadow-panel hover:border-[#CBD0D6] transition-all duration-200 space-y-2.5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            <div className="w-6 h-6 rounded-md bg-[#F8F9FA] border border-[#E2E5E9] flex items-center justify-center text-black">
              <IconSparkles size={14} />
            </div>
            <span>What is happening?</span>
          </div>
          <p className="text-[13.5px] text-[#3B4045] leading-relaxed">
            {simple?.whatIsHappening || 'The connection status has been evaluated against RF physical parameters.'}
          </p>
        </div>

        {/* Card 2: Why it matters */}
        <div className="p-5 border border-[#E2E5E9] rounded-xl bg-white shadow-card hover:shadow-panel hover:border-[#CBD0D6] transition-all duration-200 space-y-2.5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            <div className="w-6 h-6 rounded-md bg-[#F8F9FA] border border-[#E2E5E9] flex items-center justify-center text-black">
              <IconRfSignalWave size={14} />
            </div>
            <span>Why does this matter?</span>
          </div>
          <p className="text-[13.5px] text-[#3B4045] leading-relaxed">
            {simple?.whyItMatters || 'Affects streaming stability, throughput, and audio/video call latency.'}
          </p>
        </div>
      </div>

      {/* Step-by-Step Fix Checklist */}
      <div className="p-5 border border-[#E2E5E9] rounded-xl bg-white shadow-card space-y-3.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#3B4045] border-b border-[#E2E5E9] pb-2.5 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center">
              <IconZap size={13} />
            </div>
            <span>How to solve this issue</span>
          </div>
          <span className="font-mono text-[10px] text-[#6B7280] font-normal">Action Checklist</span>
        </div>

        <div className="space-y-2.5">
          {simple?.simpleStepsToFix && simple.simpleStepsToFix.length > 0 ? (
            simple.simpleStepsToFix.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl hover:bg-white hover:border-[#CBD0D6] hover:shadow-subtle transition-all duration-150 group">
                <div className="font-mono text-[11px] font-bold w-5 h-5 rounded-md flex items-center justify-center bg-black text-white flex-shrink-0 group-hover:bg-[#16A34A] transition-colors">
                  {idx + 1}
                </div>
                <div className="text-[13px] text-[#0F1113] leading-snug font-medium">{step}</div>
              </div>
            ))
          ) : (
            <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-[13px] text-[#3B4045]">
              No manual changes required. Client connection is operating within optimal RF parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

