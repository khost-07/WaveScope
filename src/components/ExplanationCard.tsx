import React from 'react';
import { LLMExplanationResponse } from '../layer3_llm/types';

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
      <div className="p-8 border border-border-subtle bg-surface text-center space-y-2">
        <div className="inline-block animate-spin text-primary">
          <span className="material-symbols-outlined text-[32px]">sync</span>
        </div>
        <div className="font-data-md font-bold text-primary">Calling Google Gemini Live API...</div>
        <div className="font-data-sm text-muted">Translating Layer 2 diagnosis into technical recommendations</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-status-critical bg-surface space-y-3">
        <div className="flex items-center gap-2 text-status-critical font-label-caps">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>Live Gemini Inference Error</span>
        </div>
        <p className="font-data-sm text-secondary bg-surface-offset p-2.5 border border-border-subtle">
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
      <div className="p-6 border border-border-subtle bg-surface text-center font-data-sm text-muted">
        Select a client to view AI diagnostic analysis.
      </div>
    );
  }

  return (
    <div className="border border-border-subtle bg-surface">
      {/* Banner */}
      <div className="p-3 bg-surface-offset border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[16px]">psychology</span>
          <span className="font-label-caps text-primary">Layer 3: AI Diagnostic Deep-Dive</span>
        </div>
        <span className="font-data-sm text-muted">Model: {explanation.sourceModel}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Executive Summary */}
        <div className="p-3.5 bg-surface-offset border border-border-subtle font-body-md text-primary font-medium leading-relaxed">
          {explanation.summary}
        </div>

        {/* Technical Analysis */}
        <div className="space-y-2">
          <h4 className="font-label-caps text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            Technical Root-Cause Analysis
          </h4>
          <p className="font-body-md text-secondary leading-relaxed p-3.5 border border-border-subtle bg-surface">
            {explanation.plainEnglishExplanation}
          </p>
        </div>

        {/* Two-Column Facts vs Hypotheses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border-subtle p-3.5 bg-surface">
            <div className="font-label-caps text-secondary mb-2">Confirmed Telemetry Facts</div>
            <ul className="font-data-sm text-primary space-y-1 list-disc list-inside">
              {explanation.confirmedFacts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>

          <div className="border border-border-subtle p-3.5 bg-surface">
            <div className="font-label-caps text-secondary mb-2">Physical Hypotheses Evaluated</div>
            <ul className="font-body-md text-primary space-y-1 list-disc list-inside">
              {explanation.possibleHypotheses.map((hyp, idx) => (
                <li key={idx}>{hyp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actionable Engineering Recommendations */}
        <div className="border border-border-subtle p-4 bg-surface space-y-3">
          <div className="font-label-caps text-secondary flex items-center justify-between border-b border-border-subtle pb-2">
            <span>Engineering Recommendations ({explanation.recommendations.length})</span>
            <span className="font-data-sm text-muted">Prioritized</span>
          </div>

          <div className="space-y-2">
            {explanation.recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-surface-offset border border-border-subtle flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="font-body-md font-semibold text-primary flex items-center gap-2">
                    <span className="font-data-sm font-bold text-muted">#{idx + 1}</span>
                    <span>{rec.action}</span>
                  </div>
                  <span className="badge-status font-data-sm text-[10px]">
                    {rec.targetLayer.replace('_', ' ')}
                  </span>
                </div>
                <div className="font-data-sm text-secondary pl-6">
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
