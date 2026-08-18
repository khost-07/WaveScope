import React from 'react';
import { APCapabilities, DiagnosticStatus } from '../layer1_data/types';
import {
  IconRouter,
  IconCheckBox,
  IconAlertTriangle,
  IconAlertCircle,
  IconRadar,
  IconRfSignalWave,
  IconSparkles,
  IconLaptop,
  IconDashboard,
  IconRule,
  IconChevronRight,
  IconAward
} from './SvgIcons';

export type NavSection = 'OVERVIEW' | 'CLIENTS' | 'RADAR' | 'AUDIT' | 'MATRIX' | 'RULES';

interface OverviewDashboardProps {
  ap: APCapabilities;
  stats: {
    total: number;
    healthy: number;
    attention: number;
    critical: number;
  };
  onNavigate: (section: NavSection) => void;
  onFilterClients: (filter: 'ALL' | DiagnosticStatus) => void;
  selectedScenarioId?: string;
  onSelectScenario?: (scId: string) => void;
  isSimulation: boolean;
  isEasyMode: boolean;
  singleDeviceStatus?: DiagnosticStatus;
  singleDeviceHostname?: string;
  singleDeviceDiagnosis?: string;
  nearbyBestSsid?: string;
  nearbyCount?: number;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  ap,
  stats,
  onNavigate,
  onFilterClients,
  selectedScenarioId,
  onSelectScenario,
  isSimulation,
  isEasyMode,
  singleDeviceStatus = 'HEALTHY',
  singleDeviceHostname = 'Connected Wi-Fi Interface',
  singleDeviceDiagnosis,
  nearbyBestSsid = 'AeroMesh-Pro-5G',
  nearbyCount = 7
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HERO ACTIVE NETWORK STATUS CARD */}
      <div className="bg-white border border-[#E2E5E9] rounded-2xl p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E5E9] pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-card">
              <IconRouter size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="text-[20px] font-bold text-black tracking-tight">{ap.ssid}</h1>
                <span className="badge-status text-[10px] font-bold bg-[#F0FDF4] border-[#16A34A] text-[#16A34A] px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse-fast"></span>
                  {isSimulation ? 'ACTIVE SIMULATED AP' : 'CONNECTED GATEWAY'}
                </span>
                {!isEasyMode && (
                  <span className="badge-status font-mono text-[10px] bg-white border-[#E2E5E9] text-black">
                    {ap.maxStandard}
                  </span>
                )}
              </div>
              <p className="font-mono text-[11.5px] text-[#6B7280]">
                {ap.apModel} &bull; {ap.bssid} &bull; Channel Utilization:{' '}
                <strong style={{ color: ap.channelUtilizationPct >= 70 ? '#DC2626' : '#16A34A' }}>
                  {ap.channelUtilizationPct}%
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-instrument-secondary text-[12px] py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-2 text-[#16A34A] border-[#16A34A]/40 hover:border-black hover:text-black font-semibold"
              onClick={() => onNavigate('RADAR')}
            >
              <IconRfSignalWave size={15} />
              <span>Wi-Fi Radar</span>
            </button>
            <button
              type="button"
              className="btn-instrument-primary text-[12px] py-2 px-3.5 rounded-xl shadow-card"
              onClick={() => onNavigate('AUDIT')}
            >
              <IconRadar size={15} />
              <span>Network AI Audit</span>
            </button>
          </div>
        </div>

        {/* Live Link Health or Metric Summary */}
        <div className="pt-5">
          {isSimulation ? (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">
                {isEasyMode ? 'FLEET DEVICE HEALTH SUMMARY' : 'CONNECTED FLEET TELEMETRY STATUS (8 ENDPOINTS)'}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Total Clients */}
                <button
                  type="button"
                  className="telemetry-cell text-left cursor-pointer transition-all duration-200 rounded-xl shadow-card hover:shadow-panel border-[#E2E5E9] bg-white hover:bg-[#F8F9FA]"
                  style={{ borderTop: '3px solid #0F1113' }}
                  onClick={() => {
                    onFilterClients('ALL');
                    onNavigate('CLIENTS');
                  }}
                >
                  <div className="telemetry-cell-label flex items-center justify-between mb-1">
                    <span>TOTAL DEVICES</span>
                    <IconLaptop size={15} className="text-[#6B7280]" />
                  </div>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-black">{stats.total}</span>
                    <span className="telemetry-cell-unit">endpoints</span>
                  </div>
                  <div className="text-[10px] text-[#6B7280] font-mono mt-1 flex items-center justify-between">
                    <span>Inspect fleet &rarr;</span>
                  </div>
                </button>

                {/* Healthy */}
                <button
                  type="button"
                  className="telemetry-cell text-left cursor-pointer transition-all duration-200 rounded-xl shadow-card hover:shadow-panel border-[#E2E5E9] bg-white hover:bg-[#F8F9FA]"
                  style={{ borderTop: '3px solid #16A34A' }}
                  onClick={() => {
                    onFilterClients('HEALTHY');
                    onNavigate('CLIENTS');
                  }}
                >
                  <div className="telemetry-cell-label flex items-center justify-between text-[#16A34A] mb-1">
                    <span className="flex items-center gap-1.5">
                      <IconCheckBox size={14} />
                      {isEasyMode ? 'GREAT' : 'HEALTHY'}
                    </span>
                  </div>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-[#16A34A]">{stats.healthy}</span>
                    <span className="telemetry-cell-unit">{isEasyMode ? 'optimal' : 'nominal'}</span>
                  </div>
                  <div className="text-[10px] text-[#16A34A] font-mono mt-1">
                    Full MCS throughput
                  </div>
                </button>

                {/* Attention */}
                <button
                  type="button"
                  className="telemetry-cell text-left cursor-pointer transition-all duration-200 rounded-xl shadow-card hover:shadow-panel border-[#E2E5E9] bg-white hover:bg-[#F8F9FA]"
                  style={{ borderTop: '3px solid #D97706' }}
                  onClick={() => {
                    onFilterClients('ATTENTION');
                    onNavigate('CLIENTS');
                  }}
                >
                  <div className="telemetry-cell-label flex items-center justify-between text-[#D97706] mb-1">
                    <span className="flex items-center gap-1.5">
                      <IconAlertTriangle size={14} />
                      {isEasyMode ? 'CAN IMPROVE' : 'ATTENTION'}
                    </span>
                  </div>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-[#D97706]">{stats.attention}</span>
                    <span className="telemetry-cell-unit">{isEasyMode ? 'fair' : 'degraded'}</span>
                  </div>
                  <div className="text-[10px] text-[#D97706] font-mono mt-1">
                    Band/hardware issues
                  </div>
                </button>

                {/* Critical */}
                <button
                  type="button"
                  className="telemetry-cell text-left cursor-pointer transition-all duration-200 rounded-xl shadow-card hover:shadow-panel border-[#E2E5E9] bg-white hover:bg-[#F8F9FA]"
                  style={{ borderTop: '3px solid #DC2626' }}
                  onClick={() => {
                    onFilterClients('CRITICAL');
                    onNavigate('CLIENTS');
                  }}
                >
                  <div className="telemetry-cell-label flex items-center justify-between text-[#DC2626] mb-1">
                    <span className="flex items-center gap-1.5">
                      <IconAlertCircle size={14} />
                      {isEasyMode ? 'NEEDS ATTENTION' : 'CRITICAL'}
                    </span>
                  </div>
                  <div className="telemetry-cell-value-group">
                    <span className="telemetry-cell-value text-[#DC2626]">{stats.critical}</span>
                    <span className="telemetry-cell-unit">{isEasyMode ? 'alert' : 'action needed'}</span>
                  </div>
                  <div className="text-[10px] text-[#DC2626] font-mono mt-1">
                    Weak signal / interference
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E5E9]">
              <div className="flex items-center gap-3">
                {singleDeviceStatus === 'HEALTHY' && (
                  <div className="badge-status badge-status-healthy text-[11px] py-1 px-2.5 rounded-lg flex items-center gap-1.5">
                    <IconCheckBox size={14} />
                    <span>HEALTHY LINK</span>
                  </div>
                )}
                {singleDeviceStatus === 'ATTENTION' && (
                  <div className="badge-status badge-status-attention text-[11px] py-1 px-2.5 rounded-lg flex items-center gap-1.5">
                    <IconAlertTriangle size={14} />
                    <span>ATTENTION REQUIRED</span>
                  </div>
                )}
                {singleDeviceStatus === 'CRITICAL' && (
                  <div className="badge-status badge-status-critical text-[11px] py-1 px-2.5 rounded-lg flex items-center gap-1.5">
                    <IconAlertCircle size={14} />
                    <span>CRITICAL RF LINK</span>
                  </div>
                )}

                <div>
                  <div className="text-[14px] font-bold text-black">
                    {singleDeviceStatus === 'HEALTHY'
                      ? `Active Wi-Fi connection on ${singleDeviceHostname} is working great.`
                      : singleDeviceDiagnosis || 'Potential RF bottleneck detected on your active link.'}
                  </div>
                  <div className="font-mono text-[11px] text-[#6B7280]">
                    Host: {singleDeviceHostname} &bull; Native Windows WLAN API &bull; Layer 2 Deterministic Analysis
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-instrument-primary text-[11.5px] rounded-xl shadow-xs"
                onClick={() => onNavigate('CLIENTS')}
              >
                Inspect Link Diagnostics &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. SIMULATION SCENARIO QUICK-SWITCHER BAR */}
      {isSimulation && onSelectScenario && (
        <div className="flex items-center gap-2 p-3 bg-white border border-[#E2E5E9] rounded-2xl shadow-card overflow-x-auto">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6B7280] whitespace-nowrap px-2">
            {isEasyMode ? 'TEST SCENARIOS:' : 'SIMULATION SCENARIOS:'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1.5 px-3 rounded-lg transition-all ${
                selectedScenarioId === 'A' ? 'bg-black text-white border-black shadow-xs' : ''
              }`}
              onClick={() => onSelectScenario('A')}
            >
              <strong>A</strong>: {isEasyMode ? 'Great Wi-Fi' : 'Fast 5GHz'}
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1.5 px-3 rounded-lg transition-all ${
                selectedScenarioId === 'B' ? 'bg-black text-white border-black shadow-xs' : ''
              }`}
              onClick={() => onSelectScenario('B')}
            >
              <strong>B</strong>: {isEasyMode ? 'Far Away' : 'Weak Signal'}
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1.5 px-3 rounded-lg transition-all ${
                selectedScenarioId === 'C' ? 'bg-black text-white border-black shadow-xs' : ''
              }`}
              onClick={() => onSelectScenario('C')}
            >
              <strong>C</strong>: {isEasyMode ? 'Interference' : 'RF Interference'}
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1.5 px-3 rounded-lg transition-all ${
                selectedScenarioId === 'D' ? 'bg-black text-white border-black shadow-xs' : ''
              }`}
              onClick={() => onSelectScenario('D')}
            >
              <strong>D</strong>: {isEasyMode ? 'Old Device' : 'Legacy HW'}
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1.5 px-3 rounded-lg transition-all ${
                selectedScenarioId === 'E' ? 'bg-black text-white border-black shadow-xs' : ''
              }`}
              onClick={() => onSelectScenario('E')}
            >
              <strong>E</strong>: {isEasyMode ? 'Wrong Band' : 'Wrong Band (2.4G)'}
            </button>
          </div>
        </div>
      )}

      {/* 3. FEATURE LAUNCHPAD — 5 DEDICATED SUBPAGES GRID */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-2">
            <IconSparkles size={16} />
            <span>Dedicated Analysis Workspaces & Tools</span>
          </div>
          <span className="font-mono text-[11px] text-[#6B7280]">
            Click any section below to enter its full dedicated page
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Subpage Card 1: Connected Devices */}
          <div
            onClick={() => onNavigate('CLIENTS')}
            className="group p-5 bg-white border border-[#E2E5E9] hover:border-black rounded-2xl shadow-card hover:shadow-panel cursor-pointer transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors">
                  <IconLaptop size={20} />
                </div>
                <span className="badge-status text-[10.5px] font-mono font-bold bg-[#F8F9FA] rounded-md">
                  {stats.total} Active Nodes
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-black group-hover:text-black tracking-tight">
                Connected Devices Workspace
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                Inspect client endpoints, Layer 2 mathematical diagnostics, RF Link Budget spectrum, and AI explanations.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-[#E2E5E9] flex items-center justify-between text-[12px] font-bold text-black group-hover:translate-x-1 transition-transform">
              <span>Open Device Inspector</span>
              <IconChevronRight size={16} />
            </div>
          </div>

          {/* Subpage Card 2: Surrounding Wi-Fi Radar */}
          <div
            onClick={() => onNavigate('RADAR')}
            className="group p-5 bg-white border border-[#E2E5E9] hover:border-[#16A34A] rounded-2xl shadow-card hover:shadow-panel cursor-pointer transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#16A34A]/30 text-[#16A34A] flex items-center justify-center">
                  <IconRfSignalWave size={20} />
                </div>
                <span className="badge-status text-[10.5px] font-bold bg-[#F0FDF4] text-[#16A34A] border-[#16A34A] rounded-md flex items-center gap-1">
                  <IconAward size={12} />
                  {nearbyCount} Networks Found
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-black tracking-tight">
                Surrounding Wi-Fi Radar
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                Compare local 2.4/5/6 GHz airwaves with WQI scoring (Best: <strong className="text-black">{nearbyBestSsid}</strong>), and connect in 1 click.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-[#E2E5E9] flex items-center justify-between text-[12px] font-bold text-[#16A34A] group-hover:translate-x-1 transition-transform">
              <span>Find & Switch Wi-Fi</span>
              <IconChevronRight size={16} />
            </div>
          </div>

          {/* Subpage Card 3: Network AI Audit */}
          <div
            onClick={() => onNavigate('AUDIT')}
            className="group p-5 bg-white border border-[#E2E5E9] hover:border-black rounded-2xl shadow-card hover:shadow-panel cursor-pointer transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors">
                  <IconRadar size={20} />
                </div>
                <span className="badge-status text-[10.5px] font-mono font-bold bg-white border-[#E2E5E9] rounded-md">
                  Subnet Sweep
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-black tracking-tight">
                Whole-Network AI Security Audit
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                Run ARP sweeps, probe open ports on subnet hosts, and generate an AI-powered security & RF scorecard.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-[#E2E5E9] flex items-center justify-between text-[12px] font-bold text-black group-hover:translate-x-1 transition-transform">
              <span>Run Network Sweep</span>
              <IconChevronRight size={16} />
            </div>
          </div>

          {/* Subpage Card 4: Fleet Telemetry Matrix */}
          <div
            onClick={() => onNavigate('MATRIX')}
            className="group p-5 bg-white border border-[#E2E5E9] hover:border-black rounded-2xl shadow-card hover:shadow-panel cursor-pointer transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors">
                  <IconDashboard size={20} />
                </div>
                <span className="badge-status text-[10.5px] font-mono font-bold bg-white border-[#E2E5E9] rounded-md">
                  Raw Physical Layer
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-black tracking-tight">
                Fleet Telemetry Matrix
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                Inspect high-density raw tabular metrics: RSSI, SNR, Noise Floor, MCS Index, Retry %, and Link Rates.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-[#E2E5E9] flex items-center justify-between text-[12px] font-bold text-black group-hover:translate-x-1 transition-transform">
              <span>View Full Data Table</span>
              <IconChevronRight size={16} />
            </div>
          </div>

          {/* Subpage Card 5: Diagnostic Rules Specification */}
          <div
            onClick={() => onNavigate('RULES')}
            className="group p-5 bg-white border border-[#E2E5E9] hover:border-black rounded-2xl shadow-card hover:shadow-panel cursor-pointer transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors">
                  <IconRule size={20} />
                </div>
                <span className="badge-status text-[10.5px] font-mono font-bold bg-white border-[#E2E5E9] rounded-md">
                  Deterministic Logic
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-black tracking-tight">
                Diagnostic Rules Engine
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                Review transparent mathematical thresholds for Weak Signal, RF Noise, Capability Limits, and Band Steer.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-[#E2E5E9] flex items-center justify-between text-[12px] font-bold text-black group-hover:translate-x-1 transition-transform">
              <span>Inspect Rules Tree</span>
              <IconChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
