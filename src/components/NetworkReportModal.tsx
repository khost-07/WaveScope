import React, { useState } from 'react';
import { NetworkScanResult, NetworkAuditReport } from '../layer1_data/networkScannerTypes';

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

  return (
    <div className="modal-overlay">
      <div className="modal-instrument">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">radar</span>
            <span className="font-headline-md text-primary">Whole-Network Diagnostic Audit Report</span>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button type="button" className="btn-instrument-secondary text-[11px] py-1" onClick={() => window.print()}>
              Print PDF
            </button>
            <button type="button" className="btn-instrument-secondary text-[11px] py-1" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
            <button type="button" className="btn-instrument-primary text-[11px] py-1 px-3" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body space-y-5">
          {isLoading && (
            <div className="p-8 text-center space-y-2">
              <div className="inline-block animate-spin text-primary">
                <span className="material-symbols-outlined text-[32px]">sync</span>
              </div>
              <h3 className="font-headline-md text-primary">Scanning Subnet & Running AI Engine...</h3>
              <p className="font-data-sm text-muted">Probing router latency and classifying device fleet.</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-5 border border-status-critical bg-surface space-y-3">
              <div className="font-label-caps text-status-critical">Audit Sweep Error</div>
              <p className="font-data-sm text-secondary">{error}</p>
              <button type="button" className="btn-instrument-primary" onClick={onRescan}>
                Retry Network Scan
              </button>
            </div>
          )}

          {!isLoading && !error && report && scanResult && (
            <>
              {/* Executive Health Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
                <div className="telemetry-cell">
                  <span className="telemetry-cell-label">Network Health Grade</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-primary">{report.healthGrade}</span>
                    <span className="telemetry-cell-unit">{report.overallHealthScore}/100</span>
                  </div>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-cell-label">Router Gateway Latency</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-primary">{scanResult.router.gatewayPingMs}</span>
                    <span className="telemetry-cell-unit">ms</span>
                  </div>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-cell-label">Active Discovered Endpoints</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-primary">{scanResult.devices.length}</span>
                    <span className="telemetry-cell-unit">devices</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 border border-border-subtle bg-surface-offset space-y-1">
                <div className="font-label-caps text-secondary">Executive Summary</div>
                <p className="font-body-md text-primary leading-relaxed">{report.executiveSummary}</p>
              </div>

              {/* Router Health & Verdicts */}
              <div className="border border-border-subtle bg-surface p-4 space-y-3">
                <div className="font-label-caps text-secondary border-b border-border-subtle pb-2">
                  Router & Wi-Fi Gateway Audit ({scanResult.router.ssid})
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-data-sm">
                  <div className="p-2.5 bg-surface-offset border border-border-subtle">
                    <div className="font-label-caps text-muted text-[10px] mb-1">Channel Congestion</div>
                    <div className="text-primary font-medium">{report.routerAssessment.channelCongestionVerdict}</div>
                  </div>

                  <div className="p-2.5 bg-surface-offset border border-border-subtle">
                    <div className="font-label-caps text-muted text-[10px] mb-1">Band Efficiency</div>
                    <div className="text-primary font-medium">{report.routerAssessment.bandEfficiencyVerdict}</div>
                  </div>

                  <div className="p-2.5 bg-surface-offset border border-border-subtle">
                    <div className="font-label-caps text-muted text-[10px] mb-1">Gateway Responsiveness</div>
                    <div className="text-primary font-medium">{report.routerAssessment.gatewayLatencyVerdict}</div>
                  </div>
                </div>
              </div>

              {/* Discovered Device Fleet Table */}
              <div className="border border-border-subtle bg-surface p-4 space-y-3">
                <div className="font-label-caps text-secondary flex items-center justify-between border-b border-border-subtle pb-2">
                  <span>Discovered Fleet Inventory ({scanResult.devices.length} Endpoints)</span>
                  <span className="font-data-sm text-muted">Subnet: {scanResult.subnet}</span>
                </div>

                <div className="border border-border-subtle overflow-x-auto max-h-56">
                  <table className="instrument-table">
                    <thead>
                      <tr>
                        <th>Device</th>
                        <th>Vendor / Category</th>
                        <th>IP Address</th>
                        <th>MAC Address</th>
                        <th style={{ textAlign: 'right' }}>Ping Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.devices.map(d => (
                        <tr key={d.ip}>
                          <td style={{ fontWeight: 600 }}>{d.hostname}</td>
                          <td className="font-data-sm text-secondary">{d.vendor} ({d.deviceType})</td>
                          <td className="font-data-sm">{d.ip}</td>
                          <td className="font-data-sm text-muted">{d.mac}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.pingMs} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actionable Plan */}
              <div className="border border-border-subtle bg-surface p-4 space-y-3">
                <div className="font-label-caps text-secondary border-b border-border-subtle pb-2">
                  Prioritized Action & Optimization Plan
                </div>

                <div className="space-y-2">
                  {report.actionablePlan.map((plan, idx) => (
                    <div key={idx} className="p-3 bg-surface-offset border border-border-subtle flex items-start gap-3">
                      <div className="font-data-sm font-bold w-6 h-6 flex items-center justify-center bg-primary text-white flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-body-md font-semibold text-primary">{plan.action}</span>
                          <span className="badge-status font-data-sm text-[10px]">
                            {plan.priority} Priority
                          </span>
                        </div>
                        <p className="font-body-md text-secondary text-[13px]">{plan.simpleWhy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
