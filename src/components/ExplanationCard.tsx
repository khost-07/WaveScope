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
      <div className="explanation-panel">
        <div className="explanation-banner">
          <span className="explanation-banner-title">Layer 3: Diagnostic Explanation Layer</span>
          <span className="explanation-banner-meta mono">[CALLING GEMINI LIVE API...]</span>
        </div>
        <div className="explanation-content" style={{ padding: '24px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            Querying gemini-3.1-flash-lite...
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Converting Layer 2 telemetry & pre-computed diagnosis into plain English
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="explanation-panel" style={{ borderColor: '#FECACA' }}>
        <div className="explanation-banner" style={{ background: '#991B1B' }}>
          <span className="explanation-banner-title">Layer 3: Live API Error</span>
          <span className="explanation-banner-meta mono">[API FAILURE]</span>
        </div>
        <div className="explanation-content" style={{ padding: '16px' }}>
          <div style={{ color: '#B91C1C', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
            Live Gemini API call failed
          </div>
          <div className="mono" style={{ fontSize: '11.5px', color: '#7F1D1D', background: '#FEF2F2', border: '1px solid #FECACA', padding: '8px 10px', borderRadius: '4px', marginBottom: '14px', wordBreak: 'break-word' }}>
            {error}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onRefresh && (
              <button
                type="button"
                className="btn-instrument primary"
                onClick={onRefresh}
              >
                Retry API Call
              </button>
            )}
            {onOpenKeyModal && (
              <button
                type="button"
                className="btn-instrument"
                onClick={onOpenKeyModal}
              >
                Update Gemini API Key
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="explanation-panel">
        <div className="explanation-banner">
          <span className="explanation-banner-title">Layer 3: Diagnostic Explanation Layer</span>
          <span className="explanation-banner-meta mono">[STANDBY]</span>
        </div>
        <div className="explanation-content" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Select a client device from the overview table to trigger live plain-English explanation.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="explanation-panel">
      <div className="explanation-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="explanation-banner-title">Layer 3: Diagnostic Explanation Layer</span>
          <span className="mono" style={{ fontSize: '10px', background: '#0F766E', padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
            Live Gemini API
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="explanation-banner-meta mono">
            MODEL: {explanation.sourceModel}
          </span>
          {onRefresh && (
            <button
              type="button"
              className="btn-instrument"
              onClick={onRefresh}
              style={{ fontSize: '10px', padding: '2px 8px', background: '#334155', color: '#FFFFFF', borderColor: '#475569' }}
            >
              Re-Query API
            </button>
          )}
        </div>
      </div>

      <div className="explanation-content">
        {/* Concise Summary */}
        <div className="explanation-summary">
          {explanation.summary}
        </div>

        {/* Detailed Plain English Breakdown */}
        <div className="explanation-text">
          {explanation.plainEnglishExplanation}
        </div>

        {/* Confirmed Facts vs Hypotheses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div style={{ border: '1px solid var(--border-light)', padding: '10px', background: 'var(--bg-surface-inset)', borderRadius: '6px' }}>
            <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Confirmed Telemetry Facts
            </div>
            <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
              {explanation.confirmedFacts.map((fact, idx) => (
                <li key={idx} style={{ padding: '2px 0', color: 'var(--text-secondary)' }}>
                  &bull; {fact}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ border: '1px solid var(--border-light)', padding: '10px', background: 'var(--bg-surface-inset)', borderRadius: '6px' }}>
            <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Evaluated Physical Hypotheses
            </div>
            <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '11.5px' }}>
              {explanation.possibleHypotheses.map((hyp, idx) => (
                <li key={idx} style={{ padding: '2px 0', color: 'var(--text-secondary)' }}>
                  &bull; {hyp}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Concrete Actionable Recommendations */}
        <div className="recommendations-box">
          <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            Concrete Actionable Recommendations ({explanation.recommendations.length})
          </div>
          {explanation.recommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-row">
              <div className="rec-title">
                <span className="rec-layer-tag">{rec.targetLayer.replace('_', ' ')}</span>
                {rec.action}
              </div>
              <div className="rec-impact">
                Expected RF Impact: {rec.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
