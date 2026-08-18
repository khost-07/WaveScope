import React, { useState } from 'react';
import { NetworkScanResult, NetworkAuditReport } from '../layer1_data/networkScannerTypes';
import { IconRefresh, IconZap, IconSparkles } from './SvgIcons';

interface NetworkAuditSubpageProps {
  scanResult: NetworkScanResult | null;
  report: NetworkAuditReport | null;
  isLoading: boolean;
  error?: string | null;
  onRescan: () => void;
  onBack: () => void;
}

export const NetworkAuditSubpage: React.FC<NetworkAuditSubpageProps> = ({
  scanResult,
  report,
  isLoading,
  error,
  onRescan,
  onBack
}) => {
  const [copied, setCopied] = useState(false);

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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Subpage Header & Breadcrumb */}
      <div className="bg-white border border-[#E2E5E9] rounded-2xl p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="btn-instrument-secondary text-[12px] py-1.5 px-3 rounded-xl flex items-center gap-1 font-semibold cursor-pointer"
              onClick={onBack}
            >
              &larr; Back to Overview
            </button>
            <div className="h-6 w-px bg-[#E2E5E9]"></div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[20px] font-bold text-black tracking-tight">Whole-Network AI Security & RF Audit</h1>
                {scanResult && (
                  <span className="badge-status font-mono text-[10px] bg-[#F8F9FA] text-black border-[#E2E5E9]">
                    {scanResult.isReal ? 'LIVE SUBNET SWEEP' : 'SIMULATION FLEET PROBE'}
                  </span>
                )}
              </div>
              <p className="font-mono text-[11.5px] text-[#6B7280] mt-0.5">
                Subnet node discovery, open port analysis & Gemini AI infrastructure audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-instrument-secondary text-[11.5px] py-2 px-3 rounded-xl shadow-xs cursor-pointer"
              onClick={() => window.print()}
            >
              Print PDF
            </button>
            <button
              type="button"
              className="btn-instrument-secondary text-[11.5px] py-2 px-3 rounded-xl shadow-xs cursor-pointer"
              onClick={handleCopy}
            >
              {copied ? '✓ Copied' : 'Copy Summary'}
            </button>
            <button
              type="button"
              className="btn-instrument-primary text-[11.5px] py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-card cursor-pointer"
              onClick={onRescan}
              disabled={isLoading}
            >
              <IconRefresh size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>{isLoading ? 'Scanning Subnet...' : 'Run Network Sweep'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border border-[#E2E5E9] rounded-2xl p-16 text-center space-y-4 shadow-card">
          <div className="inline-block animate-spin text-black">
            <IconRefresh size={36} />
          </div>
          <h2 className="text-[19px] font-bold text-black">Probing Subnet & Synthesizing AI Audit...</h2>
          <p className="font-mono text-[12px] text-[#6B7280] max-w-md mx-auto">
            Sweeping local ARP table, pinging active endpoints, auditing router link budget, and querying Gemini AI for root-cause synthesis.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && !isLoading && (
        <div className="p-6 border border-[#DC2626] rounded-2xl bg-white space-y-3 shadow-card">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#DC2626]">Audit Sweep Error</div>
          <p className="font-mono text-[13px] text-[#3B4045]">{error}</p>
          <button type="button" className="btn-instrument-primary text-[12px] rounded-xl" onClick={onRescan}>
            Retry Network Scan
          </button>
        </div>
      )}

      {/* Audit Report Content */}
      {report && scanResult && !isLoading && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="p-6 bg-white border border-[#E2E5E9] rounded-2xl shadow-panel flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-black text-white flex flex-col items-center justify-center shadow-card">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">GRADE</span>
                <span className="text-[24px] font-extrabold leading-none">{report.healthGrade}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[18px] font-bold text-black tracking-tight">Overall Network Health Score</h2>
                  <span className="badge-status text-[11px] font-mono font-bold bg-[#F8F9FA] rounded-md">
                    {report.overallHealthScore} / 100
                  </span>
                </div>
                <p className="text-[13px] text-[#6B7280]">
                  Subnet <strong className="text-black font-mono">{scanResult.subnet}</strong> &bull; Sweep duration:{' '}
                  <strong className="text-black font-mono">{scanResult.scanDurationMs}ms</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-[12px]">
              <div className="p-3 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-[#6B7280]">Active Nodes</div>
                <div className="text-[16px] font-bold text-black">{scanResult.devices.length}</div>
              </div>
              <div className="p-3 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-[#6B7280]">Gateway Ping</div>
                <div className="text-[16px] font-bold text-black">{scanResult.router.gatewayPingMs} ms</div>
              </div>
              <div className="p-3 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-[#6B7280]">Surrounding BSSIDs</div>
                <div className="text-[16px] font-bold text-black">{scanResult.router.totalBssidsInArea}</div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-6 bg-white border border-[#E2E5E9] rounded-2xl shadow-card space-y-2">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-2">
              <IconSparkles size={16} />
              <span>AI Executive Synthesis</span>
            </div>
            <p className="text-[14px] text-[#0F1113] leading-relaxed font-sans">
              {report.executiveSummary}
            </p>
          </div>

          {/* Router Assessment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-[#E2E5E9] rounded-2xl shadow-card space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Channel Congestion</div>
              <div className="text-[13.5px] text-black font-medium">{report.routerAssessment.channelCongestionVerdict}</div>
              <div className="font-mono text-[11px] text-[#6B7280] pt-1">
                Ch {scanResult.router.channel} ({scanResult.router.band}) &bull; {scanResult.router.signalPct}% signal
              </div>
            </div>

            <div className="p-5 bg-white border border-[#E2E5E9] rounded-2xl shadow-card space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Band Efficiency</div>
              <div className="text-[13.5px] text-black font-medium">{report.routerAssessment.bandEfficiencyVerdict}</div>
              <div className="font-mono text-[11px] text-[#6B7280] pt-1">
                {scanResult.router.band} Band &bull; {scanResult.router.security}
              </div>
            </div>

            <div className="p-5 bg-white border border-[#E2E5E9] rounded-2xl shadow-card space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Gateway Latency</div>
              <div className="text-[13.5px] text-black font-medium">{report.routerAssessment.gatewayLatencyVerdict}</div>
              <div className="font-mono text-[11px] text-[#6B7280] pt-1">
                Gateway: {scanResult.router.ip} &bull; DNS: {scanResult.router.dnsLatencyMs}ms
              </div>
            </div>
          </div>

          {/* Discovered Subnet Devices Table */}
          <div className="border border-[#E2E5E9] rounded-2xl bg-white shadow-card overflow-hidden">
            <div className="p-4 bg-[#F8F9FA] border-b border-[#E2E5E9] flex items-center justify-between">
              <span className="text-[13px] font-bold text-black uppercase tracking-wider">
                Discovered LAN Subnet Nodes ({scanResult.devices.length})
              </span>
              <span className="font-mono text-[11px] text-[#6B7280]">
                ARP Probe Table &bull; Hardware Classification &bull; Latency
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="instrument-table">
                <thead>
                  <tr>
                    <th>DEVICE HOSTNAME</th>
                    <th>IP ADDRESS</th>
                    <th>MAC ADDRESS</th>
                    <th>VENDOR</th>
                    <th>DEVICE TYPE</th>
                    <th>PING</th>
                    <th>LINK STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResult.devices.map((d, i) => (
                    <tr key={i} className="hover:bg-[#F8F9FA]">
                      <td className="font-bold text-black text-[13px]">{d.hostname}</td>
                      <td className="font-mono text-[11.5px] text-[#3B4045]">{d.ip}</td>
                      <td className="font-mono text-[11.5px] text-[#6B7280]">{d.mac}</td>
                      <td className="font-sans text-[12px] text-black">{d.vendor}</td>
                      <td className="font-mono text-[11.5px] text-[#6B7280]">{d.deviceType}</td>
                      <td className="font-mono text-[11.5px]">
                        <span style={{ color: d.pingMs < 30 ? '#16A34A' : d.pingMs < 80 ? '#D97706' : '#DC2626' }}>
                          {d.pingMs} ms
                        </span>
                      </td>
                      <td>
                        <span className="badge-status text-[9.5px] font-bold bg-[#F0FDF4] text-[#16A34A] border-[#16A34A] px-2 py-0.5 rounded">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Prioritized Plan */}
          <div className="space-y-3">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-2">
              <IconZap size={16} />
              <span>Prioritized Remediation & Action Plan</span>
            </div>

            <div className="space-y-3">
              {report.actionablePlan.map((plan, idx) => {
                const isHigh = plan.priority === 'High';
                const isMed = plan.priority === 'Medium';

                return (
                  <div
                    key={idx}
                    className="p-5 bg-white border border-[#E2E5E9] rounded-2xl shadow-card space-y-1.5"
                    style={{
                      borderLeft: `4px solid ${isHigh ? '#DC2626' : isMed ? '#D97706' : '#16A34A'}`
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="badge-status font-mono text-[9.5px] font-bold rounded-md"
                        style={{
                          color: isHigh ? '#DC2626' : isMed ? '#D97706' : '#16A34A',
                          borderColor: isHigh ? '#DC2626' : isMed ? '#D97706' : '#16A34A'
                        }}
                      >
                        {plan.priority.toUpperCase()} PRIORITY
                      </span>
                      <h4 className="text-[14px] font-bold text-black">{plan.action}</h4>
                    </div>
                    <p className="text-[13px] text-[#3B4045] leading-relaxed pl-1">
                      <strong className="text-black font-semibold">Rationale: </strong>
                      {plan.simpleWhy}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
