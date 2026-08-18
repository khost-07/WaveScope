import React from 'react';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { IconSparkles, IconRefresh, IconAlertCircle, IconRule, IconCheckCircle, IconLightbulb } from './SvgIcons';

interface ExplanationCardProps {
  explanation: LLMExplanationResponse | null;
  isLoading: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenKeyModal?: () => void;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  explanation,
  isLoading,
  error,
  onRefresh,
  onOpenKeyModal
}) => {
  if (isLoading) {
    return (
      <div className="p-8 border border-[#E2E5E9] rounded-2xl bg-white shadow-panel text-center space-y-2">
        <div className="inline-block animate-spin text-black mb-1">
          <IconRefresh size={32} />
        </div>
        <div className="font-mono text-[13px] font-bold text-black mb-1">Executing Google Gemini Live Model...</div>
        <div className="font-mono text-[11px] text-[#6B7280]">Synthesizing Layer 2 mathematical telemetry into engineering recommendations</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-[#DC2626] rounded-2xl bg-white shadow-panel space-y-3">
        <div className="flex items-center gap-2 text-[#DC2626] text-[11px] font-bold uppercase tracking-wider mb-1">
          <IconAlertCircle size={16} />
          <span>Live Gemini Inference Error</span>
        </div>
        <p className="font-mono text-[12px] text-[#3B4045] bg-[#F8F9FA] p-3 rounded-lg border border-[#E2E5E9] mb-2">
          {error}
        </p>
        <div className="flex gap-2 pt-1">
          {onRefresh && (
            <button type="button" className="btn-instrument-primary text-[11px]" onClick={onRefresh}>
              Retry Query
            </button>
          )}
          {onOpenKeyModal && (
            <button type="button" className="btn-instrument-secondary text-[11px]" onClick={onOpenKeyModal}>
              Edit API Key
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="p-6 border border-[#E2E5E9] rounded-2xl bg-white text-center font-mono text-[12px] text-[#6B7280] shadow-card">
        Select a client to inspect live Gemini diagnostic analysis.
      </div>
    );
  }

  return (
    <div className="border border-[#E2E5E9] rounded-2xl bg-white shadow-panel overflow-hidden">
      {/* Banner Header */}
      <div className="p-4 bg-[#F8F9FA] border-b border-[#E2E5E9] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center">
            <IconSparkles size={14} />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-black">Layer 3: AI Diagnostic Deep-Dive</span>
        </div>
        <span className="font-mono text-[11px] text-[#6B7280] bg-white px-2.5 py-1 rounded-md border border-[#E2E5E9] shadow-xs">
          Model: <strong className="text-black">{explanation.sourceModel}</strong>
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Executive Summary */}
        <div className="p-4 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-[14px] text-[#0F1113] font-medium leading-relaxed shadow-subtle">
          {explanation.summary}
        </div>

        {/* Technical Analysis */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5 mb-1">
            <IconRule size={15} className="text-black" />
            <span>Technical Root-Cause Analysis</span>
          </div>
          <p className="text-[13.5px] text-[#3B4045] leading-relaxed p-4 border border-[#E2E5E9] rounded-xl bg-white shadow-subtle">
            {explanation.plainEnglishExplanation}
          </p>
        </div>

        {/* Two-Column Facts vs Hypotheses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#E2E5E9] rounded-xl p-4.5 bg-white shadow-card hover:shadow-panel hover:border-[#CBD0D6] transition-all duration-200 space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              <div className="w-5 h-5 rounded-md bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                <IconCheckCircle size={13} />
              </div>
              <span>Confirmed Telemetry Facts</span>
            </div>
            <ul className="font-mono text-[11.5px] text-black space-y-2 list-disc list-inside">
              {explanation.confirmedFacts.map((fact, idx) => (
                <li key={idx} className="leading-relaxed">{fact}</li>
              ))}
            </ul>
          </div>

          <div className="border border-[#E2E5E9] rounded-xl p-4.5 bg-white shadow-card hover:shadow-panel hover:border-[#CBD0D6] transition-all duration-200 space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              <div className="w-5 h-5 rounded-md bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <IconLightbulb size={13} />
              </div>
              <span>Physical Hypotheses Evaluated</span>
            </div>
            <ul className="text-[12.5px] text-black space-y-2 list-disc list-inside">
              {explanation.possibleHypotheses.map((hyp, idx) => (
                <li key={idx} className="leading-relaxed">{hyp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actionable Engineering Recommendations */}
        <div className="border border-[#E2E5E9] rounded-xl p-5 bg-white shadow-card space-y-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center justify-between border-b border-[#E2E5E9] pb-2.5 mb-2">
            <span>Engineering Recommendations ({explanation.recommendations.length})</span>
            <span className="font-mono text-[10px] text-[#6B7280] font-normal">Prioritized Hierarchy</span>
          </div>

          <div className="space-y-2.5">
            {explanation.recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl hover:bg-white hover:border-[#CBD0D6] hover:shadow-subtle transition-all duration-150 flex flex-col gap-1.5 group">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-0.5">
                  <div className="text-[13.5px] font-semibold text-black flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold w-5 h-5 rounded-md flex items-center justify-center bg-black text-white group-hover:bg-[#16A34A] transition-colors">
                      {idx + 1}
                    </span>
                    <span>{rec.action}</span>
                  </div>
                  <span className="badge-status font-mono text-[10px]">
                    {rec.targetLayer.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[12px] font-mono text-[#3B4045] pl-7">
                  Expected Impact: <strong className="text-black font-semibold">{rec.impact}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

