import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { getFriendlyStatus, getDeviceTypeIcon } from './SimpleDeviceCard';

interface SimpleDetailViewProps {
  device: ClientDevice;
  diagnosis: StructuredDiagnosis;
  explanation: LLMExplanationResponse | null;
  isLoading: boolean;
  error?: string | null;
  onSwitchToNerdMode: () => void;
  onRefreshExplanation?: () => void;
  onOpenKeyModal?: () => void;
}

export const SimpleDetailView: React.FC<SimpleDetailViewProps> = ({
  device,
  diagnosis,
  explanation,
  isLoading,
  error,
  onSwitchToNerdMode,
  onRefreshExplanation,
  onOpenKeyModal
}) => {
  const statusInfo = getFriendlyStatus(diagnosis, device);
  const icon = getDeviceTypeIcon(device.deviceType, device.hostname);

  return (
    <div className="simple-detail-container">
      {/* Top Banner */}
      <div className={`simple-detail-hero ${statusInfo.theme}`}>
        <div className="simple-detail-hero-left">
          <div className="simple-hero-icon">{icon}</div>
          <div>
            <div className="simple-hero-badge-row">
              <span className={`simple-status-badge large ${statusInfo.theme}`}>
                {statusInfo.badge}
              </span>
              <span className="simple-hero-scenario-tag">
                {device.scenarioName ? device.scenarioName.split(':')[0] : 'Connected Device'}
              </span>
            </div>
            <h1 className="simple-hero-title">{device.hostname}</h1>
            <p className="simple-hero-subtitle">
              {device.vendor} &bull; {device.deviceType} &bull; Connected to <span style={{ fontWeight: 600 }}>{device.apCapabilities.ssid}</span>
            </p>
          </div>
        </div>

        <div className="simple-detail-hero-right">
          <button
            type="button"
            className="btn-nerd-switch"
            onClick={onSwitchToNerdMode}
            title="Inspect in technical RF instrument mode"
          >
            <span style={{ fontSize: '14px' }}>⚡</span>
            <span>Inspect in Nerd Mode</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="simple-metrics-summary">
        <div className="simple-metric-card">
          <div className="simple-metric-label">Wi-Fi Health Score</div>
          <div className="simple-metric-value" style={{ color: statusInfo.theme === 'success' ? '#16A34A' : statusInfo.theme === 'warning' ? '#D97706' : '#DC2626' }}>
            {statusInfo.theme === 'success' ? '98 / 100' : statusInfo.theme === 'warning' ? '68 / 100' : '34 / 100'}
          </div>
          <div className="simple-metric-caption">
            {statusInfo.theme === 'success' ? 'Excellent channel health' : statusInfo.theme === 'warning' ? 'Performance throttled' : 'Critical connection issue'}
          </div>
        </div>

        <div className="simple-metric-card">
          <div className="simple-metric-label">Current Wi-Fi Speed</div>
          <div className="simple-metric-value">
            {device.telemetry.txLinkRate_Mbps} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>Mbps</span>
          </div>
          <div className="simple-metric-caption">
            Max potential: {device.capabilities.maxTheoreticalPhyMbps} Mbps
          </div>
        </div>

        <div className="simple-metric-card">
          <div className="simple-metric-label">Frequency Band In Use</div>
          <div className="simple-metric-value">
            {device.telemetry.band}
          </div>
          <div className="simple-metric-caption">
            Channel {device.telemetry.channel} ({device.telemetry.channelWidthMHz} MHz)
          </div>
        </div>

        <div className="simple-metric-card">
          <div className="simple-metric-label">Connection Stability</div>
          <div className="simple-metric-value" style={{ color: device.telemetry.retryRatePct < 5 ? '#16A34A' : '#DC2626' }}>
            {device.telemetry.retryRatePct < 5 ? '99% Clean' : `${device.telemetry.retryRatePct.toFixed(0)}% Retries`}
          </div>
          <div className="simple-metric-caption">
            {device.telemetry.retryRatePct < 5 ? 'No packet loss observed' : 'Packets are dropping & resending'}
          </div>
        </div>
      </div>

      {/* Main Plain English Diagnosis Section */}
      <div className="simple-section-card">
        <div className="simple-section-header">
          <div className="simple-section-title">
            <span>What's going on with this connection?</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onRefreshExplanation && (
              <button
                type="button"
                className="simple-btn-secondary"
                onClick={onRefreshExplanation}
                disabled={isLoading}
              >
                {isLoading ? 'Calling Gemini...' : 'Refresh Analysis'}
              </button>
            )}
          </div>
        </div>

        <div className="simple-section-body">
          {isLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Querying Google Gemini Live API...</div>
              <div style={{ fontSize: '13px' }}>Generating plain-English root-cause breakdown and actionable steps</div>
            </div>
          ) : error ? (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '18px' }}>
              <div style={{ color: '#B91C1C', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                Unable to load live Gemini explanation
              </div>
              <div className="mono" style={{ fontSize: '12px', color: '#7F1D1D', marginBottom: '14px', wordBreak: 'break-word' }}>
                {error}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {onRefreshExplanation && (
                  <button
                    type="button"
                    className="btn-nerd-switch"
                    onClick={onRefreshExplanation}
                  >
                    Retry Live API Call
                  </button>
                )}
                {onOpenKeyModal && (
                  <button
                    type="button"
                    className="simple-btn-secondary"
                    onClick={onOpenKeyModal}
                  >
                    Change Gemini API Key
                  </button>
                )}
              </div>
            </div>
          ) : explanation ? (
            <>
              <div className="simple-callout-box">
                <div className="simple-callout-summary">{explanation.summary}</div>
                <div className="simple-callout-desc">{explanation.plainEnglishExplanation}</div>
              </div>

              {/* Likely Causes */}
              <div style={{ marginTop: '20px' }}>
                <h3 className="simple-subsection-title">Why is this happening?</h3>
                <div className="simple-causes-list">
                  {explanation.possibleHypotheses.map((cause, idx) => (
                    <div key={idx} className="simple-cause-item">
                      <span className="simple-cause-bullet">{idx + 1}</span>
                      <span>{cause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Steps / How to fix */}
              <div style={{ marginTop: '24px' }}>
                <h3 className="simple-subsection-title">How to fix this (Recommended Steps)</h3>
                <div className="simple-action-cards">
                  {explanation.recommendations.map((rec, idx) => (
                    <div key={idx} className="simple-action-card">
                      <div className="simple-action-top">
                        <span className="simple-step-tag">Step {idx + 1}</span>
                        <span className="simple-layer-pill">{rec.targetLayer.replace('_', ' ')}</span>
                      </div>
                      <div className="simple-action-text">{rec.action}</div>
                      <div className="simple-action-impact">
                        <strong>Expected Result:</strong> {rec.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '20px', color: '#64748B' }}>
              Select a device to view explanation.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Quick Switch Banner */}
      <div className="simple-nerd-banner">
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>Want the full RF engineering telemetry?</div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            Inspect raw RSSI, SNR, Noise floor, MIMO streams, BSS channel load, and live parameter tuning.
          </div>
        </div>
        <button
          type="button"
          className="btn-nerd-switch"
          onClick={onSwitchToNerdMode}
        >
          Open in Nerd Mode &rarr;
        </button>
      </div>
    </div>
  );
};
