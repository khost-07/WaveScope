import React from 'react';
import { StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { IconSparkles, IconCheckCircle, IconAlertTriangle, IconAlertCircle, IconRefresh, IconKey } from './SvgIcons';

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
      <div className="simple-overview-container loading">
        <div className="simple-loading-spinner" />
        <h3 className="simple-loading-title">AI is translating network data into simple English...</h3>
        <p className="simple-loading-desc mono">Querying Google Gemini (gemini-3.1-flash-lite) in real-time</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-overview-container error">
        <div className="simple-error-icon">
          <IconAlertCircle size={28} />
        </div>
        <h3 className="simple-error-title">Couldn't generate AI explanation</h3>
        <p className="simple-error-desc mono">{error}</p>
        <div className="simple-error-actions">
          {onRefresh && (
            <button type="button" className="btn-simple-primary" onClick={onRefresh}>
              <IconRefresh size={14} />
              <span>Retry Now</span>
            </button>
          )}
          {onOpenKeyModal && (
            <button type="button" className="btn-simple-secondary" onClick={onOpenKeyModal}>
              <IconKey size={14} />
              <span>Check API Key</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const simple = explanation?.simpleOverview;
  const isHealthy = diagnosis.status === 'HEALTHY';
  const isCritical = diagnosis.status === 'CRITICAL';

  const statusTheme = isHealthy ? 'healthy' : isCritical ? 'critical' : 'warning';

  return (
    <div className={`simple-overview-container ${statusTheme}`}>
      {/* Top Banner: Big Plain English Headline */}
      <div className={`simple-hero-banner ${statusTheme}`}>
        <div className="simple-hero-top">
          <div className="simple-status-tag">
            {isHealthy ? (
              <>
                <IconCheckCircle size={14} />
                <span>Everything Looks Great</span>
              </>
            ) : isCritical ? (
              <>
                <IconAlertCircle size={14} />
                <span>Action Needed</span>
              </>
            ) : (
              <>
                <IconAlertTriangle size={14} />
                <span>Performance Warning</span>
              </>
            )}
          </div>

          <div className="simple-experience-pill">
            {simple?.experienceRating || (isHealthy ? 'Great for Streaming & Gaming' : 'Sub-Optimal Connection')}
          </div>
        </div>

        <h2 className="simple-headline-text">
          {simple?.headline || diagnosis.primary_diagnosis}
        </h2>
      </div>

      {/* Grid: What is Happening & Why It Matters */}
      <div className="simple-explanation-grid">
        {/* Card 1: What is going on */}
        <div className="simple-card">
          <div className="simple-card-header">
            <div className="simple-icon-circle blue">
              <IconSparkles size={16} />
            </div>
            <h4>What is happening?</h4>
          </div>
          <p className="simple-card-text">
            {simple?.whatIsHappening || explanation?.plainEnglishExplanation || 'Analyzing link conditions...'}
          </p>
        </div>

        {/* Card 2: Why it matters to daily use */}
        <div className="simple-card">
          <div className="simple-card-header">
            <div className="simple-icon-circle amber">
              <IconAlertTriangle size={16} />
            </div>
            <h4>Why does this matter?</h4>
          </div>
          <p className="simple-card-text">
            {simple?.whyItMatters || 'May impact video streaming, Zoom video calls, and file downloads.'}
          </p>
        </div>
      </div>

      {/* Solutions / Fix in 3 Easy Steps */}
      <div className="simple-solutions-card">
        <div className="simple-solutions-header">
          <div className="simple-icon-circle green">
            <IconCheckCircle size={16} />
          </div>
          <div>
            <h4>How to fix this problem</h4>
            <p className="simple-solutions-subtitle">Follow these simple steps to restore full speed</p>
          </div>
        </div>

        <div className="simple-steps-list">
          {simple?.simpleStepsToFix && simple.simpleStepsToFix.length > 0 ? (
            simple.simpleStepsToFix.map((step, idx) => (
              <div key={idx} className="simple-step-item">
                <div className="step-number-circle">{idx + 1}</div>
                <div className="step-text">{step}</div>
              </div>
            ))
          ) : (
            <div className="simple-step-item">
              <div className="step-number-circle">1</div>
              <div className="step-text">No action needed. Device is working at peak performance.</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Switcher */}
      {onSwitchToTechnical && (
        <div className="simple-footer-switch">
          <span>Want to see raw signal dBm, frequencies, and math scores?</span>
          <button type="button" className="btn-switch-tech" onClick={onSwitchToTechnical}>
            Switch to Detailed RF View &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
