import React, { useState } from 'react';
import { NetworkScanResult, NetworkAuditReport } from '../layer1_data/networkScannerTypes';
import { IconRadar, IconRefresh } from './SvgIcons';

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
            <IconRadar size={18} className="text-black" />
            <span className="text-[15px] font-bold text-black">Whole-Network Diagnostic Audit Report</span>
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
              <div className="inline-block animate-spin text-black">
                <IconRefresh size={32} />
              </div>
              <h3 className="text-[17px] font-bold text-black">Scanning Subnet & Running AI Engine...</h3>
              <p className="font-mono text-[12px] text-[#747878]">Probing router latency and classifying device fleet.</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-5 border border-[#D32F2F] bg-white space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#D32F2F]">Audit Sweep Error</div>
              <p className="font-mono text-[12px] text-[#444748]">{error}</p>
              <button type="button" className="btn-instrument-primary" onClick={onRescan}>
                Retry Network Scan
              </button>
            </div>
          )}

          {!isLoading && !error && report && scanResult && (
            <>
              {/* Executive Health Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="telemetry-cell">
                  <span className="telemetry-cell-label">Network Health Grade</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-black">{report.healthGrade}</span>
                    <span className="telemetry-cell-unit">{report.overallHealthScore}/100</span>
                  </div>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-cell-label">Router Gateway Latency</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-black">{scanResult.router.gatewayPingMs}</span>
                    <span className="telemetry-cell-unit">ms</span>
                  </div>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-cell-label">Active Discovered Endpoints</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-black">{scanResult.devices.length}</span>
                    <span className="telemetry-cell-unit">devices</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 border border-[#E5E5E5] bg-[#FAFAFA] space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748]">Executive Summary</div>
                <p className="text-[13px] text-black leading-relaxed">{report.executiveSummary}</p>
              </div>

              {/* Router Health & Verdicts */}
              <div className="border border-[#E5E5E5] bg-white p-4 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] border-b border-[#E5E5E5] pb-2">
                  Router & Wi-Fi Gateway Audit ({scanResult.router.ssid})
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[12px]">
                  <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E5E5]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#747878] mb-1">Channel Congestion</div>
                    <div className="text-black font-semibold">{report.routerAssessment.channelCongestionVerdict}</div>
                  </div>

                  <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E5E5]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#747878] mb-1">Band Efficiency</div>
                    <div className="text-black font-semibold">{report.routerAssessment.bandEfficiencyVerdict}</div>
                  </div>

                  <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E5E5]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#747878] mb-1">Gateway Responsiveness</div>
                    <div className="text-black font-semibold">{report.routerAssessment.gatewayLatencyVerdict}</div>
                  </div>
                </div>
              </div>

              {/* Discovered Device Fleet Table */}
              <div className="border border-[#E5E5E5] bg-white p-4 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                  <span>Discovered Fleet Inventory ({scanResult.devices.length} Endpoints)</span>
                  <span className="font-mono text-[11px] text-[#747878]">Subnet: {scanResult.subnet}</span>
                </div>

                <div className="border border-[#E5E5E5] overflow-x-auto max-h-56">
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
                          <td className="font-mono text-[12px] text-[#444748]">{d.vendor} ({d.deviceType})</td>
                          <td className="font-mono text-[12px]">{d.ip}</td>
                          <td className="font-mono text-[11px] text-[#747878]">{d.mac}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.pingMs} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actionable Plan */}
              <div className="border border-[#E5E5E5] bg-white p-4 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] border-b border-[#E5E5E5] pb-2">
                  Prioritized Action & Optimization Plan
                </div>

                <div className="space-y-2">
                  {report.actionablePlan.map((plan, idx) => (
                    <div key={idx} className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] flex items-start gap-3">
                      <div className="font-mono text-[11px] font-bold w-6 h-6 flex items-center justify-center bg-black text-white flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-black">{plan.action}</span>
                          <span className="badge-status font-mono text-[10px]">
                            {plan.priority} Priority
                          </span>
                        </div>
                        <p className="text-[13px] text-[#444748]">{plan.simpleWhy}</p>
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
