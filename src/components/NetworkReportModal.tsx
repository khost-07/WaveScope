import React, { useState } from 'react';
import { NetworkScanResult, NetworkAuditReport } from '../layer1_data/networkScannerTypes';
import { IconRadar, IconRefresh, IconZap } from './SvgIcons';

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
Source: ${scanResult.isReal ? 'LIVE HARDWARE SCAN (Native WLAN + ARP Table)' : 'SIMULATED TESTBED'}
Network: ${scanResult.router.ssid} (${scanResult.subnet})
Gateway IP: ${scanResult.router.ip} (BSSID: ${scanResult.router.bssid})
Channel: ${scanResult.router.channel} (${scanResult.router.band}) | Signal: ${scanResult.router.rssi_dBm} dBm (${scanResult.router.signalPct}%)
Overall Health Score: ${report.overallHealthScore}/100 (Grade ${report.healthGrade})

Executive Summary:
${report.executiveSummary}

Router Assessment:
- Channel Congestion: ${report.routerAssessment.channelCongestionVerdict}
- Band Efficiency: ${report.routerAssessment.bandEfficiencyVerdict}
- Gateway Latency: ${report.routerAssessment.gatewayLatencyVerdict} (Ping: ${scanResult.router.gatewayPingMs}ms)

Discovered Devices (${report.deviceBreakdown.totalActive} active):
${scanResult.devices.map(d => `- ${d.hostname} (${d.ip}) | MAC: ${d.mac} | ${d.vendor} | Ping: ${d.pingMs}ms`).join('\n')}

Actionable Optimization Plan:
${report.actionablePlan.map((p, i) => `${i + 1}. [${p.priority}] ${p.action} — Why: ${p.simpleWhy}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-instrument rounded-2xl shadow-float overflow-hidden">
        {/* Header */}
        <div className="modal-header bg-[#F8F9FA] p-5 border-b border-[#E2E5E9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
              <IconRadar size={18} />
            </div>
            <span className="text-[16px] font-bold text-black tracking-tight">Whole-Network Diagnostic Audit Report</span>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button type="button" className="btn-instrument-secondary text-[11px] py-1.5 px-3 rounded-lg" onClick={() => window.print()}>
              Print PDF
            </button>
            <button type="button" className="btn-instrument-secondary text-[11px] py-1.5 px-3 rounded-lg" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
            <button type="button" className="btn-instrument-primary text-[11px] py-1.5 px-4 rounded-lg" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body p-6 space-y-5 max-h-[calc(85vh-100px)] overflow-y-auto">
          {isLoading && (
            <div className="p-12 text-center space-y-3">
              <div className="inline-block animate-spin text-black mb-1">
                <IconRefresh size={32} />
              </div>
              <h3 className="text-[17px] font-bold text-black mb-1">Probing Subnet & Synthesizing AI Audit...</h3>
              <p className="font-mono text-[12px] text-[#6B7280]">Auditing router latency and classifying real-time device fleet.</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-6 border border-[#DC2626] rounded-xl bg-white space-y-3 shadow-card">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#DC2626] mb-1">Audit Sweep Error</div>
              <p className="font-mono text-[12px] text-[#3B4045] mb-2">{error}</p>
              <button type="button" className="btn-instrument-primary" onClick={onRescan}>
                Retry Network Scan
              </button>
            </div>
          )}

          {!isLoading && !error && report && scanResult && (
            <>
              {/* Provenance Banner */}
              {scanResult.isReal ? (
                <div className="flex items-center justify-between p-4 bg-[#F0FDF4] border border-[#16A34A]/30 rounded-xl text-[12.5px] text-[#16A34A] flex-wrap gap-2 shadow-subtle">
                  <div className="flex items-center gap-2.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] inline-block animate-pulse-fast"></span>
                    <span>LIVE WI-FI NETWORK PROBE</span>
                    <span className="font-mono font-normal text-black text-[11.5px]">
                      (SSID: <strong>{scanResult.router.ssid}</strong> &bull; Gateway: <strong>{scanResult.router.ip}</strong> &bull; Subnet: {scanResult.subnet})
                    </span>
                  </div>
                  <span className="badge-status font-mono text-[10px] bg-white border-[#16A34A] text-[#16A34A] rounded-md">
                    REAL OS TELEMETRY
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-[12.5px] text-[#6B7280] flex-wrap gap-2 shadow-subtle">
                  <div className="flex items-center gap-2.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6B7280] inline-block"></span>
                    <span>SIMULATED TESTBED SCAN</span>
                    <span className="font-mono font-normal text-[#3B4045] text-[11.5px]">
                      (SSID: {scanResult.router.ssid} &bull; Subnet: {scanResult.subnet})
                    </span>
                  </div>
                  <span className="badge-status font-mono text-[10px] rounded-md">
                    SIMULATION TESTBED
                  </span>
                </div>
              )}

              {/* Executive Health Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="telemetry-cell rounded-xl shadow-card" style={{ borderTop: '3px solid #0F1113' }}>
                  <span className="telemetry-cell-label">Network Health Grade</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-black">{report.healthGrade}</span>
                    <span className="telemetry-cell-unit">{report.overallHealthScore}/100</span>
                  </div>
                </div>

                <div className="telemetry-cell rounded-xl shadow-card" style={{ borderTop: '3px solid #16A34A' }}>
                  <span className="telemetry-cell-label">Gateway Latency</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-black">{scanResult.router.gatewayPingMs}</span>
                    <span className="telemetry-cell-unit">ms ping</span>
                  </div>
                </div>

                <div className="telemetry-cell rounded-xl shadow-card" style={{ borderTop: '3px solid #0F1113' }}>
                  <span className="telemetry-cell-label">Active Discovered Endpoints</span>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-black">{scanResult.devices.length}</span>
                    <span className="telemetry-cell-unit">devices</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-5 border border-[#E2E5E9] bg-[#F8F9FA] rounded-xl space-y-2 shadow-subtle">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">Executive Summary</div>
                <p className="text-[14px] text-black leading-relaxed font-sans">{report.executiveSummary}</p>
              </div>

              {/* Router Health & Verdicts */}
              <div className="border border-[#E2E5E9] bg-white rounded-xl p-5 space-y-3.5 shadow-card">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] border-b border-[#E2E5E9] pb-2 mb-2">
                  Router & Wi-Fi Gateway Audit ({scanResult.router.ssid})
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[12px]">
                  <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-lg">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Channel Congestion</div>
                    <div className="text-black font-semibold">{report.routerAssessment.channelCongestionVerdict}</div>
                    <div className="text-[10.5px] text-[#6B7280] mt-1">Channel {scanResult.router.channel} ({scanResult.router.band})</div>
                  </div>

                  <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-lg">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Band Efficiency</div>
                    <div className="text-black font-semibold">{report.routerAssessment.bandEfficiencyVerdict}</div>
                    <div className="text-[10.5px] text-[#6B7280] mt-1">{scanResult.router.standard} &bull; {scanResult.router.channelWidthMHz}MHz</div>
                  </div>

                  <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-lg">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Gateway Responsiveness</div>
                    <div className="text-black font-semibold">{report.routerAssessment.gatewayLatencyVerdict}</div>
                    <div className="text-[10.5px] text-[#6B7280] mt-1">Ping: {scanResult.router.gatewayPingMs}ms &bull; DNS: {scanResult.router.dnsLatencyMs}ms</div>
                  </div>
                </div>
              </div>

              {/* Discovered Device Fleet Table */}
              <div className="border border-[#E2E5E9] bg-white rounded-xl p-5 space-y-3.5 shadow-card">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center justify-between border-b border-[#E2E5E9] pb-2 mb-2">
                  <span>Discovered Fleet Inventory ({scanResult.devices.length} Endpoints)</span>
                  <span className="font-mono text-[11px] text-[#6B7280]">Subnet: {scanResult.subnet}</span>
                </div>

                <div className="border border-[#E2E5E9] rounded-lg overflow-x-auto max-h-60 shadow-subtle">
                  <table className="instrument-table">
                    <thead>
                      <tr>
                        <th>Host Identifier</th>
                        <th>IP Address</th>
                        <th>MAC Address</th>
                        <th>Vendor / Manufacturer</th>
                        <th style={{ textAlign: 'right' }}>Ping Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.devices.map((dev, idx) => (
                        <tr key={idx} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="font-semibold text-black">
                            {dev.hostname}
                            {dev.isGateway && <span className="ml-1.5 badge-status text-[9px] py-0.5 px-1.5 bg-black text-white rounded-md">GATEWAY</span>}
                          </td>
                          <td className="font-mono text-[12px]">{dev.ip}</td>
                          <td className="font-mono text-[12px] text-[#6B7280]">{dev.mac}</td>
                          <td className="font-mono text-[12px]">{dev.vendor}</td>
                          <td style={{ textAlign: 'right' }} className="font-mono">
                            {dev.pingMs} ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actionable Plan */}
              <div className="border border-[#E2E5E9] bg-white rounded-xl p-5 space-y-3.5 shadow-card">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center justify-between border-b border-[#E2E5E9] pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <IconZap size={14} className="text-black" />
                    <span>Prioritized Network Optimization Plan</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#6B7280]">
                    {report.actionablePlan.length} Actions
                  </span>
                </div>

                <div className="space-y-2.5">
                  {report.actionablePlan.map((plan, idx) => (
                    <div key={idx} className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl flex flex-col gap-1.5 shadow-subtle hover:shadow-panel transition-all">
                      <div className="flex items-center justify-between flex-wrap gap-1.5 mb-0.5">
                        <div className="text-[13.5px] font-semibold text-black flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center font-mono text-[10.5px] font-bold">
                            {idx + 1}
                          </span>
                          <span>{plan.action}</span>
                        </div>
                        <span
                          className="badge-status font-mono text-[10px] rounded-md"
                          style={{
                            color: plan.priority === 'High' ? '#DC2626' : plan.priority === 'Medium' ? '#D97706' : '#16A34A',
                            borderColor: plan.priority === 'High' ? '#DC2626' : plan.priority === 'Medium' ? '#D97706' : '#16A34A'
                          }}
                        >
                          {plan.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <div className="text-[12.5px] text-[#3B4045] pl-7 font-mono">
                        Rationale: {plan.simpleWhy}
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
