import React from 'react';
import { APCapabilities, DiagnosticStatus } from '../layer1_data/types';
import { IconRouter, IconCheckBox, IconAlertTriangle, IconAlertCircle, IconRadar } from './SvgIcons';

interface NetworkOverviewBarProps {
  ap: APCapabilities;
  stats: {
    total: number;
    healthy: number;
    attention: number;
    critical: number;
  };
  activeFilter: 'ALL' | DiagnosticStatus;
  onChangeFilter: (filter: 'ALL' | DiagnosticStatus) => void;
  selectedScenarioId?: string;
  onSelectScenario?: (scId: string) => void;
  isSimulation: boolean;
  onOpenNetworkAudit?: () => void;
  singleDeviceStatus?: DiagnosticStatus;
  singleDeviceHostname?: string;
  singleDeviceDiagnosis?: string;
  isEasyMode?: boolean;
}

export const NetworkOverviewBar: React.FC<NetworkOverviewBarProps> = ({
  ap,
  stats,
  activeFilter,
  onChangeFilter,
  selectedScenarioId,
  onSelectScenario,
  isSimulation,
  onOpenNetworkAudit,
  singleDeviceStatus = 'HEALTHY',
  singleDeviceHostname = 'Connected Wi-Fi Interface',
  singleDeviceDiagnosis,
  isEasyMode = false
}) => {
  return (
    <div className="flex flex-col gap-3.5 mb-4">
      {/* MODE CONDITIONAL HEADER */}

      {/* 1. SIMULATION MODE: 4-Box Fleet Metric Strip with Color Accent Tops */}
      {isSimulation ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Total Clients */}
          <button
            type="button"
            className={`telemetry-cell text-left cursor-pointer transition-all duration-200 rounded-xl shadow-card hover:shadow-panel ${
              activeFilter === 'ALL' ? 'border-[#0F1113] bg-[#F8F9FA]' : 'border-[#E2E5E9] bg-white hover:bg-[#F8F9FA]'
            }`}
            style={{ borderTop: '3px solid #0F1113' }}
            onClick={() => onChangeFilter('ALL')}
          >
            <div className="telemetry-cell-label flex items-center justify-between mb-1">
              <span>{isEasyMode ? 'TOTAL DEVICES' : 'TOTAL CLIENTS'}</span>
              <IconRouter size={15} className="text-[#6B7280]" />
            </div>
            <div className="telemetry-cell-value-group">
              <span className="telemetry-cell-value text-black">{stats.total}</span>
              <span className="telemetry-cell-unit">{isEasyMode ? 'devices' : 'nodes'}</span>
            </div>
          </button>

          {/* Healthy */}
          <button
            type="button"
            className={`telemetry-cell text-left cursor-pointer transition-all duration-200 rounded-xl shadow-card hover:shadow-panel ${
              activeFilter === 'HEALTHY' ? 'bg-[#16A34A]/10 border-[#16A34A]' : 'border-[#E2E5E9] bg-white hover:bg-[#F8F9FA]'
            }`}
            style={{ borderTop: '3px solid #16A34A' }}
            onClick={() => onChangeFilter('HEALTHY')}
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
          </button>

          {/* Attention */}
          <button
            type="button"
            className={`telemetry-cell text-left cursor-pointer transition-all duration-200 rounded-xl shadow-card hover:shadow-panel ${
              activeFilter === 'ATTENTION' ? 'bg-[#D97706]/10 border-[#D97706]' : 'border-[#E2E5E9] bg-white hover:bg-[#F8F9FA]'
            }`}
            style={{ borderTop: '3px solid #D97706' }}
            onClick={() => onChangeFilter('ATTENTION')}
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
          </button>

          {/* Critical */}
          <button
            type="button"
            className={`telemetry-cell text-left cursor-pointer transition-all duration-200 rounded-xl shadow-card hover:shadow-panel ${
              activeFilter === 'CRITICAL' ? 'bg-[#DC2626]/10 border-[#DC2626]' : 'border-[#E2E5E9] bg-white hover:bg-[#F8F9FA]'
            }`}
            style={{ borderTop: '3px solid #DC2626' }}
            onClick={() => onChangeFilter('CRITICAL')}
          >
            <div className="telemetry-cell-label flex items-center justify-between text-[#DC2626] mb-1">
              <span className="flex items-center gap-1.5">
                <IconAlertCircle size={14} />
                {isEasyMode ? 'NEEDS ATTENTION' : 'CRITICAL'}
              </span>
            </div>
            <div className="telemetry-cell-value-group">
              <span className="telemetry-cell-value text-[#DC2626]">{stats.critical}</span>
              <span className="telemetry-cell-unit">{isEasyMode ? 'action needed' : 'alert'}</span>
            </div>
          </button>
        </div>
      ) : (
        /* 2. LIVE DATA MODE (Real Mode): Single proportionate active connection health summary */
        <div className="border border-[#E2E5E9] rounded-xl bg-white p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {singleDeviceStatus === 'HEALTHY' && (
              <div className="badge-status badge-status-healthy text-[11px] py-1 px-2.5 flex items-center gap-1.5 rounded-lg">
                <IconCheckBox size={14} />
                <span>{isEasyMode ? 'GREAT CONNECTION' : 'HEALTHY LINK'}</span>
              </div>
            )}
            {singleDeviceStatus === 'ATTENTION' && (
              <div className="badge-status badge-status-attention text-[11px] py-1 px-2.5 flex items-center gap-1.5 rounded-lg">
                <IconAlertTriangle size={14} />
                <span>{isEasyMode ? 'COULD BE BETTER' : 'ATTENTION REQUIRED'}</span>
              </div>
            )}
            {singleDeviceStatus === 'CRITICAL' && (
              <div className="badge-status badge-status-critical text-[11px] py-1 px-2.5 flex items-center gap-1.5 rounded-lg">
                <IconAlertCircle size={14} />
                <span>{isEasyMode ? 'NEEDS ATTENTION' : 'CRITICAL LINK'}</span>
              </div>
            )}

            <div>
              <div className="text-[15px] font-bold text-black mb-0.5">
                {singleDeviceStatus === 'HEALTHY'
                  ? `Your Wi-Fi connection on ${singleDeviceHostname} is working great.`
                  : isEasyMode
                  ? `An issue was found on your ${singleDeviceHostname} connection.`
                  : singleDeviceDiagnosis
                  ? `1 issue detected: ${singleDeviceDiagnosis}`
                  : '1 potential issue detected on your active connection.'}
              </div>
              <div className="font-mono text-[11px] text-[#6B7280]">
                {isEasyMode
                  ? `Device: ${singleDeviceHostname} • Wi-Fi Health Check Active`
                  : `Host: ${singleDeviceHostname} • Evaluated by Layer 2 deterministic engine`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-lg text-black font-semibold shadow-xs">
              <span className="w-2 h-2 bg-[#16A34A] rounded-full inline-block animate-pulse-fast"></span>
              {isEasyMode ? 'LIVE WI-FI ACTIVE' : 'LIVE PROBE ACTIVE'}
            </span>
          </div>
        </div>
      )}

      {/* AP Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-[#E2E5E9] rounded-xl shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 border border-[#E2E5E9] bg-[#F8F9FA] rounded-lg flex items-center justify-center">
            <IconRouter size={20} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[16px] font-bold text-black">{ap.ssid}</span>
              {!isEasyMode && (
                <>
                  <span className="badge-status font-mono text-[10px] rounded-md">{ap.maxStandard}</span>
                  <span className="badge-status font-mono text-[10px] rounded-md">Tri-Band (2.4 / 5 / 6 GHz)</span>
                </>
              )}
              {isEasyMode && (
                <span className="badge-status font-mono text-[10px] text-[#16A34A] border-[#16A34A] rounded-md">
                  Home Network
                </span>
              )}
            </div>
            <div className="text-[11.5px] font-mono text-[#6B7280] mt-0.5">
              {isEasyMode ? (
                <span>
                  Router Status:{' '}
                  <strong className="text-black">
                    {ap.channelUtilizationPct < 50 ? 'Smooth & Fast' : 'Busy Airwaves'}
                  </strong>
                </span>
              ) : (
                <span>
                  {ap.apModel} &bull; Channel Utilization:{' '}
                  <strong style={{ color: ap.channelUtilizationPct >= 70 ? '#DC2626' : '#16A34A' }}>
                    {ap.channelUtilizationPct}%
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {onOpenNetworkAudit && (
          <button
            type="button"
            className="btn-instrument-primary"
            onClick={onOpenNetworkAudit}
          >
            <IconRadar size={15} />
            <span>{isEasyMode ? 'Check Entire Wi-Fi' : 'Whole-Network AI Audit'}</span>
          </button>
        )}
      </div>

      {/* Simulation Scenario Switcher Deck */}
      {isSimulation && onSelectScenario && (
        <div className="flex items-center gap-2 p-2.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl overflow-x-auto shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] whitespace-nowrap px-1">
            {isEasyMode ? 'TEST SITUATIONS:' : 'PRESET SCENARIOS:'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 transition-all ${
                selectedScenarioId === 'A' ? 'bg-black text-white border-black' : ''
              }`}
              onClick={() => onSelectScenario('A')}
            >
              <strong>A</strong>: {isEasyMode ? 'Great Wi-Fi' : 'Fast 5GHz'}
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 transition-all ${
                selectedScenarioId === 'B' ? 'bg-black text-white border-black' : ''
              }`}
              onClick={() => onSelectScenario('B')}
            >
              <strong>B</strong>: {isEasyMode ? 'Too Far' : 'Weak Signal (-76 dBm)'}
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 transition-all ${
                selectedScenarioId === 'C' ? 'bg-black text-white border-black' : ''
              }`}
              onClick={() => onSelectScenario('C')}
            >
              <strong>C</strong>: {isEasyMode ? 'Interference' : 'RF Noise / Jammed'}
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 transition-all ${
                selectedScenarioId === 'D' ? 'bg-black text-white border-black' : ''
              }`}
              onClick={() => onSelectScenario('D')}
            >
              <strong>D</strong>: {isEasyMode ? 'Older Device' : 'Legacy IoT'}
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 transition-all ${
                selectedScenarioId === 'E' ? 'bg-black text-white border-black' : ''
              }`}
              onClick={() => onSelectScenario('E')}
            >
              <strong>E</strong>: {isEasyMode ? 'Setting Tweak' : 'Wrong Band'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
