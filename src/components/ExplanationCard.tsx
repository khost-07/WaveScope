import React from 'react';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { IconSparkles, IconRefresh, IconAlertCircle, IconRule } from './SvgIcons';

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
      <div className="p-8 border border-[#E5E5E5] bg-white text-center space-y-2">
        <div className="inline-block animate-spin text-black">
          <IconRefresh size={32} />
        </div>
        <div className="font-mono text-[14px] font-bold text-black">Calling Google Gemini Live API...</div>
        <div className="font-mono text-[11px] text-[#747878]">Translating Layer 2 diagnosis into technical recommendations</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-[#D32F2F] bg-white space-y-3">
        <div className="flex items-center gap-2 text-[#D32F2F] text-[11px] font-bold uppercase tracking-wider">
          <IconAlertCircle size={16} />
          <span>Live Gemini Inference Error</span>
        </div>
        <p className="font-mono text-[12px] text-[#444748] bg-[#FAFAFA] p-2.5 border border-[#E5E5E5]">
          {error}
        </p>
        <div className="flex gap-2">
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
      <div className="p-6 border border-[#E5E5E5] bg-white text-center font-mono text-[12px] text-[#747878]">
        Select a client to view AI diagnostic analysis.
      </div>
    );
  }

  return (
    <div className="border border-[#E5E5E5] bg-white">
      {/* Banner */}
      <div className="p-3 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconSparkles size={16} className="text-black" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-black">Layer 3: AI Diagnostic Deep-Dive</span>
        </div>
        <span className="font-mono text-[11px] text-[#747878]">Model: {explanation.sourceModel}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Executive Summary */}
        <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] text-[14px] text-black font-medium leading-relaxed">
          {explanation.summary}
        </div>

        {/* Technical Analysis */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] flex items-center gap-1.5">
            <IconRule size={15} />
            <span>Technical Root-Cause Analysis</span>
          </div>
          <p className="text-[13px] text-[#444748] leading-relaxed p-3.5 border border-[#E5E5E5] bg-white">
            {explanation.plainEnglishExplanation}
          </p>
        </div>

        {/* Two-Column Facts vs Hypotheses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#E5E5E5] p-3.5 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] mb-2">Confirmed Telemetry Facts</div>
            <ul className="font-mono text-[11px] text-black space-y-1 list-disc list-inside">
              {explanation.confirmedFacts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>

          <div className="border border-[#E5E5E5] p-3.5 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] mb-2">Physical Hypotheses Evaluated</div>
            <ul className="text-[12px] text-black space-y-1 list-disc list-inside">
              {explanation.possibleHypotheses.map((hyp, idx) => (
                <li key={idx}>{hyp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actionable Engineering Recommendations */}
        <div className="border border-[#E5E5E5] p-4 bg-white space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] flex items-center justify-between border-b border-[#E5E5E5] pb-2">
            <span>Engineering Recommendations ({explanation.recommendations.length})</span>
            <span className="font-mono text-[10px] text-[#747878]">Prioritized</span>
          </div>

          <div className="space-y-2">
            {explanation.recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-black flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#747878]">#{idx + 1}</span>
                    <span>{rec.action}</span>
                  </div>
                  <span className="badge-status font-mono text-[10px]">
                    {rec.targetLayer.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[12px] font-mono text-[#444748] pl-6">
                  Expected Impact: {rec.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
