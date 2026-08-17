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
}

export const NetworkOverviewBar: React.FC<NetworkOverviewBarProps> = ({
  ap,
  stats,
  activeFilter,
  onChangeFilter,
  selectedScenarioId,
  onSelectScenario,
  isSimulation,
  onOpenNetworkAudit
}) => {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Stitch 4-Box Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Clients */}
        <button
          type="button"
          className={`telemetry-cell text-left cursor-pointer transition-colors ${activeFilter === 'ALL' ? 'border-black bg-[#FAFAFA]' : 'border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]'}`}
          onClick={() => onChangeFilter('ALL')}
        >
          <div className="telemetry-cell-label flex items-center justify-between">
            <span>TOTAL CLIENTS</span>
            <IconRouter size={15} className="text-[#747878]" />
          </div>
          <div className="telemetry-cell-value-group">
            <span className="telemetry-cell-value text-black">{stats.total}</span>
            <span className="telemetry-cell-unit">nodes</span>
          </div>
        </button>

        {/* Healthy */}
        <button
          type="button"
          className={`telemetry-cell text-left cursor-pointer transition-colors ${activeFilter === 'HEALTHY' ? 'bg-[#2E7D32]/10' : 'bg-white hover:bg-[#FAFAFA]'}`}
          style={{ borderColor: activeFilter === 'HEALTHY' ? '#2E7D32' : '#E5E5E5' }}
          onClick={() => onChangeFilter('HEALTHY')}
        >
          <div className="telemetry-cell-label flex items-center justify-between text-[#2E7D32]">
            <span className="flex items-center gap-1.5">
              <IconCheckBox size={14} />
              HEALTHY
            </span>
          </div>
          <div className="telemetry-cell-value-group">
            <span className="telemetry-cell-value text-[#2E7D32]">{stats.healthy}</span>
            <span className="telemetry-cell-unit">nominal</span>
          </div>
        </button>

        {/* Attention */}
        <button
          type="button"
          className={`telemetry-cell text-left cursor-pointer transition-colors ${activeFilter === 'ATTENTION' ? 'bg-[#F57C00]/10' : 'bg-white hover:bg-[#FAFAFA]'}`}
          style={{ borderColor: activeFilter === 'ATTENTION' ? '#F57C00' : '#E5E5E5' }}
          onClick={() => onChangeFilter('ATTENTION')}
        >
          <div className="telemetry-cell-label flex items-center justify-between text-[#F57C00]">
            <span className="flex items-center gap-1.5">
              <IconAlertTriangle size={14} />
              ATTENTION
            </span>
          </div>
          <div className="telemetry-cell-value-group">
            <span className="telemetry-cell-value text-[#F57C00]">{stats.attention}</span>
            <span className="telemetry-cell-unit">degraded</span>
          </div>
        </button>

        {/* Critical */}
        <button
          type="button"
          className={`telemetry-cell text-left cursor-pointer transition-colors ${activeFilter === 'CRITICAL' ? 'bg-[#D32F2F]/10' : 'bg-white hover:bg-[#FAFAFA]'}`}
          style={{ borderColor: activeFilter === 'CRITICAL' ? '#D32F2F' : '#E5E5E5' }}
          onClick={() => onChangeFilter('CRITICAL')}
        >
          <div className="telemetry-cell-label flex items-center justify-between text-[#D32F2F]">
            <span className="flex items-center gap-1.5">
              <IconAlertCircle size={14} />
              CRITICAL
            </span>
          </div>
          <div className="telemetry-cell-value-group">
            <span className="telemetry-cell-value text-[#D32F2F]">{stats.critical}</span>
            <span className="telemetry-cell-unit">alert</span>
          </div>
        </button>
      </div>

      {/* AP Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-[#E5E5E5] bg-[#FAFAFA]">
            <IconRouter size={20} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-black">{ap.ssid}</span>
              <span className="badge-status font-mono text-[10px]">{ap.maxStandard}</span>
              <span className="badge-status font-mono text-[10px]">Tri-Band (2.4/5/6 GHz)</span>
            </div>
            <div className="text-[11px] font-mono text-[#747878] mt-0.5">
              {ap.apModel} &bull; Channel Load: <span className="font-bold" style={{ color: ap.channelUtilizationPct >= 70 ? '#D32F2F' : '#2E7D32' }}>{ap.channelUtilizationPct}%</span>
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
            <span>Scan Whole Network & AI Audit</span>
          </button>
        )}
      </div>

      {/* Simulation Scenario Switcher Strip */}
      {isSimulation && onSelectScenario && (
        <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] border border-[#E5E5E5] overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#747878] whitespace-nowrap px-1">
            TEST SCENARIOS:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 ${selectedScenarioId === 'A' ? 'bg-black text-white' : ''}`}
              onClick={() => onSelectScenario('A')}
            >
              <strong>A</strong>: Fast 5GHz
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 ${selectedScenarioId === 'B' ? 'bg-black text-white' : ''}`}
              onClick={() => onSelectScenario('B')}
            >
              <strong>B</strong>: Weak Signal (-76 dBm)
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 ${selectedScenarioId === 'C' ? 'bg-black text-white' : ''}`}
              onClick={() => onSelectScenario('C')}
            >
              <strong>C</strong>: RF Interference
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 ${selectedScenarioId === 'D' ? 'bg-black text-white' : ''}`}
              onClick={() => onSelectScenario('D')}
            >
              <strong>D</strong>: Legacy IoT
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-mono text-[11px] py-1 px-2.5 ${selectedScenarioId === 'E' ? 'bg-black text-white' : ''}`}
              onClick={() => onSelectScenario('E')}
            >
              <strong>E</strong>: Wrong Band
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
