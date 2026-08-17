import React, { useState } from 'react';
import { NetworkScanResult, NetworkAuditReport } from '../layer1_data/networkScannerTypes';
import { IconCheckCircle, IconAlertTriangle, IconAlertCircle, IconRouter, IconSparkles, IconCpu, IconRefresh } from './SvgIcons';

interface NetworkReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: NetworkScanResult | null;
  report: NetworkAuditReport | null;
  isLoading: boolean;
  error?: string | null;
  onRescan: () => void;
}

export const NetworkReportModal: React.FC<NetworkReportModalProps> = ({
  isOpen,
  onClose,
  scanResult,
  report,
  isLoading,
  error,
  onRescan
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!report || !scanResult) return;
    const text = `=== WaveScope Whole-Network Diagnostic Audit ===
Network: ${scanResult.router.ssid} (${scanResult.subnet})
Overall Health Score: ${report.overallHealthScore}/100 (Grade ${report.healthGrade})

Executive Summary:
${report.executiveSummary}

Router Assessment:
- Channel Congestion: ${report.routerAssessment.channelCongestionVerdict}
- Band Efficiency: ${report.routerAssessment.bandEfficiencyVerdict}
- Gateway Latency: ${report.routerAssessment.gatewayLatencyVerdict}

Discovered Devices (${report.deviceBreakdown.totalActive} active):
${scanResult.devices.map(d => `- ${d.hostname} (${d.ip}) | ${d.vendor} | Ping: ${d.pingMs}ms`).join('\n')}

Actionable Optimization Plan:
${report.actionablePlan.map((p, i) => `${i + 1}. [${p.priority}] ${p.action} — Why: ${p.simpleWhy}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const scoreClass = (report?.overallHealthScore ?? 80) >= 80 ? 'optimal' : (report?.overallHealthScore ?? 60) >= 60 ? 'warning' : 'critical';

  return (
    <div className="report-modal-backdrop">
      <div className="report-modal-dialog">
        {/* Header */}
        <div className="report-modal-header">
          <div className="report-header-titles">
            <div className="report-badge-tag">
              <IconSparkles size={13} />
              <span>Full-Network Diagnostic Audit</span>
            </div>
            <h2>Network Health & Fleet Inspection Report</h2>
            {scanResult && (
              <p className="report-subtitle mono">
                SSID: <strong>{scanResult.router.ssid}</strong> &bull; Subnet: <strong>{scanResult.subnet}</strong> &bull; Active Clients: <strong>{scanResult.devices.length}</strong>
              </p>
            )}
          </div>

          <div className="report-header-actions">
            <button type="button" className="btn-modal-close" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="report-modal-body">
          {isLoading && (
            <div className="report-loading-state">
              <div className="simple-loading-spinner" />
              <h3>Scanning local network & querying Gemini 3.1 Flash Lite...</h3>
              <p className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Probing router gateway, analyzing subnet ARP table, and constructing plain-English health report.
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="report-error-state">
              <div style={{ color: '#DC2626', marginBottom: '8px' }}>
                <IconAlertCircle size={32} />
              </div>
              <h3>Network Diagnostic Scan Error</h3>
              <p className="mono" style={{ color: '#7F1D1D', fontSize: '12px', marginTop: '6px' }}>{error}</p>
              <div style={{ marginTop: '16px' }}>
                <button type="button" className="btn-simple-primary" onClick={onRescan}>
                  <IconRefresh size={14} />
                  <span>Retry Network Scan</span>
                </button>
              </div>
            </div>
          )}

          {report && scanResult && !isLoading && (
            <div className="report-content-scroll">
              {/* Executive Grade Banner */}
              <div className={`report-hero-card ${scoreClass}`}>
                <div className="report-grade-circle">
                  <div className="grade-letter">{report.healthGrade}</div>
                  <div className="grade-score mono">{report.overallHealthScore}/100</div>
                </div>

                <div className="report-hero-text">
                  <div className="report-hero-title">
                    {report.overallHealthScore >= 80 ? 'Overall Network Health is Strong' : report.overallHealthScore >= 60 ? 'Moderate Network Bottlenecks Detected' : 'Critical Wi-Fi Optimization Required'}
                  </div>
                  <p className="report-hero-summary">
                    {report.executiveSummary}
                  </p>
                </div>
              </div>

              {/* Grid: Router Health & Device Inventory */}
              <div className="report-two-col-grid">
                {/* Router & Gateway Card */}
                <div className="report-sub-card">
                  <div className="sub-card-header">
                    <div className="sub-icon-box">
                      <IconRouter size={18} />
                    </div>
                    <div>
                      <h4>Connected Router & Wi-Fi Gateway</h4>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Gateway: {scanResult.router.ip} &bull; BSSID: {scanResult.router.bssid}
                      </span>
                    </div>
                  </div>

                  <div className="router-metrics-grid mono">
                    <div className="r-metric">
                      <span className="label">Operating Band:</span>
                      <span className="val">{scanResult.router.band} (Ch {scanResult.router.channel})</span>
                    </div>
                    <div className="r-metric">
                      <span className="label">Channel Width:</span>
                      <span className="val">{scanResult.router.channelWidthMHz} MHz ({scanResult.router.standard})</span>
                    </div>
                    <div className="r-metric">
                      <span className="label">Gateway Latency:</span>
                      <span className="val" style={{ color: scanResult.router.gatewayPingMs <= 5 ? '#16A34A' : '#D97706', fontWeight: 700 }}>
                        {scanResult.router.gatewayPingMs} ms
                      </span>
                    </div>
                    <div className="r-metric">
                      <span className="label">Security Protocol:</span>
                      <span className="val">{scanResult.router.security}</span>
                    </div>
                  </div>

                  <div className="router-assessment-box">
                    <div className="verdict-line">
                      <strong>Channel Crowding:</strong> {report.routerAssessment.channelCongestionVerdict}
                    </div>
                    <div className="verdict-line">
                      <strong>Band Distribution:</strong> {report.routerAssessment.bandEfficiencyVerdict}
                    </div>
                    <div className="verdict-line">
                      <strong>Gateway Response:</strong> {report.routerAssessment.gatewayLatencyVerdict}
                    </div>
                  </div>
                </div>

                {/* Discovered Device Fleet */}
                <div className="report-sub-card">
                  <div className="sub-card-header">
                    <div className="sub-icon-box">
                      <IconCpu size={18} />
                    </div>
                    <div>
                      <h4>Connected Device Inventory ({scanResult.devices.length} Endpoints)</h4>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Discovered via Subnet ARP & Wi-Fi Probing
                      </span>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="device-categories-row">
                    {Object.entries(report.deviceBreakdown.categories).map(([cat, count]) => (
                      <span key={cat} className="dev-cat-pill">
                        {cat}: <strong>{count}</strong>
                      </span>
                    ))}
                  </div>

                  {/* Device List Table */}
                  <div className="discovered-devices-list">
                    {scanResult.devices.map(dev => (
                      <div key={dev.id} className="discovered-dev-row">
                        <div className="dev-info-left">
                          <span className="dev-name">{dev.hostname}</span>
                          <span className="dev-sub mono">{dev.vendor} &bull; {dev.ip}</span>
                        </div>
                        <div className="dev-info-right mono">
                          <span className="dev-band-tag">{dev.band || 'Wi-Fi'}</span>
                          <span className="dev-ping">{dev.pingMs} ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Bottlenecks */}
              {report.keyBottlenecks.length > 0 && (
                <div className="report-bottlenecks-card">
                  <div className="bottlenecks-header">
                    <IconAlertTriangle size={16} />
                    <h4>Identified Performance Bottlenecks ({report.keyBottlenecks.length})</h4>
                  </div>
                  <ul className="bottlenecks-list">
                    {report.keyBottlenecks.map((item, idx) => (
                      <li key={idx}>&bull; {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Plan */}
              <div className="report-action-plan-card">
                <div className="action-plan-header">
                  <div className="action-plan-icon">
                    <IconCheckCircle size={18} />
                  </div>
                  <div>
                    <h4>Recommended Optimization Plan</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Prioritized steps to eliminate lag and maximize network bandwidth
                    </p>
                  </div>
                </div>

                <div className="action-plan-items">
                  {report.actionablePlan.map((plan, idx) => (
                    <div key={idx} className="plan-item-row">
                      <div className="plan-priority-badge" data-priority={plan.priority}>
                        {plan.priority}
                      </div>
                      <div className="plan-text-block">
                        <div className="plan-action-title">
                          <span className="plan-target-tag mono">{plan.targetComponent}</span>
                          {plan.action}
                        </div>
                        <div className="plan-why-desc">
                          <strong>Why:</strong> {plan.simpleWhy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="report-modal-footer">
          <div className="footer-left mono">
            AI Engine: <strong>gemini-3.1-flash-lite (Live API)</strong>
          </div>
          <div className="footer-right">
            <button type="button" className="btn-instrument" onClick={handleCopy} disabled={!report}>
              {copied ? '✓ Copied Summary!' : 'Copy Summary'}
            </button>
            <button type="button" className="btn-instrument" onClick={handlePrint} disabled={!report}>
              Print / Save PDF
            </button>
            <button type="button" className="btn-instrument primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
