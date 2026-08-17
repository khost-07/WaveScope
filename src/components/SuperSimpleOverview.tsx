import React from 'react';
import { StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';

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
      <div className="p-8 border border-border-subtle bg-surface text-center space-y-3">
        <div className="inline-block animate-spin text-primary">
          <span className="material-symbols-outlined text-[32px]">sync</span>
        </div>
        <h3 className="font-headline-md text-primary">Analyzing telemetry in everyday English...</h3>
        <p className="font-data-sm text-muted">Running live prompt through gemini-3.1-flash-lite</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-status-critical bg-surface space-y-4">
        <div className="flex items-center gap-2 text-status-critical">
          <span className="material-symbols-outlined text-[24px]">error</span>
          <h3 className="font-headline-md font-bold">Could not load AI explanation</h3>
        </div>
        <p className="font-data-sm text-secondary">{error}</p>
        <div className="flex gap-3">
          {onRefresh && (
            <button type="button" className="btn-instrument-primary" onClick={onRefresh}>
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry Evaluation
            </button>
          )}
          {onOpenKeyModal && (
            <button type="button" className="btn-instrument-secondary" onClick={onOpenKeyModal}>
              <span className="material-symbols-outlined text-[16px]">key</span>
              Update API Key
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
        className="p-5 border border-border-subtle bg-surface"
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: isCritical ? 'var(--status-critical)' : isHealthy ? 'var(--status-healthy)' : 'var(--status-attention)'
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 font-label-caps">
            {isHealthy ? (
              <span className="badge-status badge-status-healthy">
                <span className="material-symbols-outlined text-[12px]">check_box</span>
                EVERYTHING LOOKS GREAT
              </span>
            ) : isCritical ? (
              <span className="badge-status badge-status-critical">
                <span className="material-symbols-outlined text-[12px]">error</span>
                ACTION RECOMMENDED
              </span>
            ) : (
              <span className="badge-status badge-status-attention">
                <span className="material-symbols-outlined text-[12px]">warning</span>
                SUB-OPTIMAL LINK
              </span>
            )}
          </div>

          <div className="font-data-sm text-muted">
            {simple?.experienceRating || (isHealthy ? 'Optimal for Streaming & Calls' : 'Performance Limited')}
          </div>
        </div>

        <h2 className="font-headline-lg text-primary text-[20px] font-bold">
          {simple?.headline || diagnosis.primary_diagnosis}
        </h2>
      </div>

      {/* Grid: What is Happening & Why It Matters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: What is happening */}
        <div className="p-4 border border-border-subtle bg-surface space-y-2">
          <div className="flex items-center gap-1.5 font-label-caps text-secondary">
            <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
            What is happening?
          </div>
          <p className="font-body-md text-secondary leading-relaxed">
            {simple?.whatIsHappening || explanation?.plainEnglishExplanation || 'Analyzing network metrics...'}
          </p>
        </div>

        {/* Card 2: Why it matters */}
        <div className="p-4 border border-border-subtle bg-surface space-y-2">
          <div className="flex items-center gap-1.5 font-label-caps text-secondary">
            <span className="material-symbols-outlined text-[16px] text-primary">warning</span>
            Why does this matter?
          </div>
          <p className="font-body-md text-secondary leading-relaxed">
            {simple?.whyItMatters || 'May cause occasional buffering, lower maximum speed, or longer download times.'}
          </p>
        </div>
      </div>

      {/* Step-by-Step Fix Checklist */}
      <div className="p-5 border border-border-subtle bg-surface space-y-3">
        <div className="flex items-center gap-2 font-label-caps text-secondary border-b border-border-subtle pb-2">
          <span className="material-symbols-outlined text-[16px] text-primary">build</span>
          <span>How to solve this problem</span>
        </div>

        <div className="space-y-2">
          {simple?.simpleStepsToFix && simple.simpleStepsToFix.length > 0 ? (
            simple.simpleStepsToFix.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 bg-surface-offset border border-border-subtle">
                <div className="font-data-sm font-bold w-5 h-5 flex items-center justify-center bg-primary text-white flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="font-body-md text-primary">{step}</div>
              </div>
            ))
          ) : (
            <div className="p-3 bg-surface-offset border border-border-subtle font-body-md text-secondary">
              No configuration changes required. Link is operating within optimal RF thresholds.
            </div>
          )}
        </div>
      </div>

      {/* Switcher */}
      {onSwitchToTechnical && (
        <div className="flex items-center justify-between p-3 bg-surface-offset border border-border-subtle font-data-sm text-secondary">
          <span>Need full RF spectrum dBm numbers and Layer 2 hypothesis math?</span>
          <button type="button" className="btn-instrument-secondary" onClick={onSwitchToTechnical}>
            View RF Telemetry Spectrum &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
