import React from 'react';
import { APCapabilities, DiagnosticStatus } from '../layer1_data/types';

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Total Clients */}
        <button
          type="button"
          className={`telemetry-cell text-left ${activeFilter === 'ALL' ? 'border-primary bg-surface-offset' : ''}`}
          onClick={() => onChangeFilter('ALL')}
        >
          <div className="telemetry-cell-label flex items-center justify-between">
            <span>TOTAL CLIENTS</span>
            <span className="material-symbols-outlined text-[16px] text-muted">router</span>
          </div>
          <div className="telemetry-cell-value-group">
            <span className="telemetry-cell-value">{stats.total}</span>
            <span className="telemetry-cell-unit">nodes</span>
          </div>
        </button>

        {/* Healthy */}
        <button
          type="button"
          className={`telemetry-cell text-left ${activeFilter === 'HEALTHY' ? 'border-status-healthy bg-status-healthy-bg' : ''}`}
          style={{ borderColor: activeFilter === 'HEALTHY' ? 'var(--status-healthy)' : 'var(--border-subtle)' }}
          onClick={() => onChangeFilter('HEALTHY')}
        >
          <div className="telemetry-cell-label flex items-center justify-between" style={{ color: 'var(--status-healthy)' }}>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_box</span>
              HEALTHY
            </span>
          </div>
          <div className="telemetry-cell-value-group">
            <span className="telemetry-cell-value" style={{ color: 'var(--status-healthy)' }}>{stats.healthy}</span>
            <span className="telemetry-cell-unit">nominal</span>
          </div>
        </button>

        {/* Attention */}
        <button
          type="button"
          className={`telemetry-cell text-left ${activeFilter === 'ATTENTION' ? 'border-status-attention bg-status-attention-bg' : ''}`}
          style={{ borderColor: activeFilter === 'ATTENTION' ? 'var(--status-attention)' : 'var(--border-subtle)' }}
          onClick={() => onChangeFilter('ATTENTION')}
        >
          <div className="telemetry-cell-label flex items-center justify-between" style={{ color: 'var(--status-attention)' }}>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              ATTENTION
            </span>
          </div>
          <div className="telemetry-cell-value-group">
            <span className="telemetry-cell-value" style={{ color: 'var(--status-attention)' }}>{stats.attention}</span>
            <span className="telemetry-cell-unit">degraded</span>
          </div>
        </button>

        {/* Critical */}
        <button
          type="button"
          className={`telemetry-cell text-left ${activeFilter === 'CRITICAL' ? 'border-status-critical bg-status-critical-bg' : ''}`}
          style={{ borderColor: activeFilter === 'CRITICAL' ? 'var(--status-critical)' : 'var(--border-subtle)' }}
          onClick={() => onChangeFilter('CRITICAL')}
        >
          <div className="telemetry-cell-label flex items-center justify-between" style={{ color: 'var(--status-critical)' }}>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              CRITICAL
            </span>
          </div>
          <div className="telemetry-cell-value-group">
            <span className="telemetry-cell-value" style={{ color: 'var(--status-critical)' }}>{stats.critical}</span>
            <span className="telemetry-cell-unit">alert</span>
          </div>
        </button>
      </div>

      {/* AP Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border border-border-subtle">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">router</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-primary text-[15px]">{ap.ssid}</span>
              <span className="badge-status font-data-sm">{ap.maxStandard}</span>
              <span className="badge-status font-data-sm">Tri-Band (2.4/5/6 GHz)</span>
            </div>
            <div className="font-data-sm text-muted mt-0.5">
              {ap.apModel} &bull; Channel Load: <span className="font-bold" style={{ color: ap.channelUtilizationPct >= 70 ? 'var(--status-critical)' : 'var(--status-healthy)' }}>{ap.channelUtilizationPct}%</span>
            </div>
          </div>
        </div>

        {onOpenNetworkAudit && (
          <button
            type="button"
            className="btn-instrument-primary"
            onClick={onOpenNetworkAudit}
          >
            <span className="material-symbols-outlined text-[16px]">radar</span>
            Scan Whole Network & AI Audit
          </button>
        )}
      </div>

      {/* Simulation Scenario Switcher Strip */}
      {isSimulation && onSelectScenario && (
        <div className="flex items-center gap-2 p-2 bg-surface-offset border border-border-subtle overflow-x-auto">
          <span className="font-label-caps text-muted whitespace-nowrap px-1">
            TEST SCENARIOS:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`btn-instrument-secondary font-data-sm text-[11px] py-1 px-2.5 ${selectedScenarioId === 'A' ? 'bg-inverse text-white' : ''}`}
              onClick={() => onSelectScenario('A')}
            >
              <strong>A</strong>: Fast 5GHz
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-data-sm text-[11px] py-1 px-2.5 ${selectedScenarioId === 'B' ? 'bg-inverse text-white' : ''}`}
              onClick={() => onSelectScenario('B')}
            >
              <strong>B</strong>: Weak Signal (-76 dBm)
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-data-sm text-[11px] py-1 px-2.5 ${selectedScenarioId === 'C' ? 'bg-inverse text-white' : ''}`}
              onClick={() => onSelectScenario('C')}
            >
              <strong>C</strong>: RF Interference
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-data-sm text-[11px] py-1 px-2.5 ${selectedScenarioId === 'D' ? 'bg-inverse text-white' : ''}`}
              onClick={() => onSelectScenario('D')}
            >
              <strong>D</strong>: Legacy IoT
            </button>
            <button
              type="button"
              className={`btn-instrument-secondary font-data-sm text-[11px] py-1 px-2.5 ${selectedScenarioId === 'E' ? 'bg-inverse text-white' : ''}`}
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
