import React from 'react';
import { APCapabilities, DiagnosticStatus } from '../layer1_data/types';
import { IconRouter, IconCheckCircle, IconAlertTriangle, IconAlertCircle } from './SvgIcons';

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
}

export const NetworkOverviewBar: React.FC<NetworkOverviewBarProps> = ({
  ap,
  stats,
  activeFilter,
  onChangeFilter,
  selectedScenarioId,
  onSelectScenario,
  isSimulation
}) => {
  // Calculate aggregate health score (0-100)
  const healthScore = stats.total > 0
    ? Math.round(((stats.healthy * 100) + (stats.attention * 60) + (stats.critical * 20)) / stats.total)
    : 100;

  const healthLevel = healthScore >= 80 ? 'optimal' : healthScore >= 50 ? 'warning' : 'critical';

  return (
    <div className="network-overview-card">
      <div className="overview-main-grid">
        {/* Network Health Score Meter */}
        <div className="health-score-widget">
          <div className={`health-score-circle ${healthLevel}`}>
            <span className="score-number">{healthScore}</span>
            <span className="score-label">/ 100</span>
          </div>
          <div className="health-score-meta">
            <div className="health-title">
              {healthLevel === 'optimal' ? 'Network Health: Excellent' : healthLevel === 'warning' ? 'Network Health: Moderate' : 'Network Health: Degraded'}
            </div>
            <div className="health-subtitle">
              {stats.critical > 0
                ? `${stats.critical} device${stats.critical > 1 ? 's require' : ' requires'} immediate RF optimization`
                : stats.attention > 0
                ? `${stats.attention} device${stats.attention > 1 ? 's have' : ' has'} minor performance throttling`
                : 'All connected clients operating at peak channel efficiency'}
            </div>
          </div>
        </div>

        {/* Access Point Hardware Pill */}
        <div className="ap-info-widget">
          <div className="ap-icon-box">
            <IconRouter size={20} />
          </div>
          <div className="ap-text-block">
            <div className="ap-ssid-name">
              <span>{ap.ssid}</span>
              <span className="ap-tag mono">Tri-Band {ap.maxStandard}</span>
            </div>
            <div className="ap-details mono">
              {ap.apModel} &bull; BSS Load: <span style={{ fontWeight: 700, color: ap.channelUtilizationPct >= 70 ? '#DC2626' : '#16A34A' }}>{ap.channelUtilizationPct}%</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="status-filter-pills">
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => onChangeFilter('ALL')}
          >
            <span className="pill-title">All Clients</span>
            <span className="pill-count">{stats.total}</span>
          </button>

          <button
            type="button"
            className={`filter-pill success ${activeFilter === 'HEALTHY' ? 'active' : ''}`}
            onClick={() => onChangeFilter('HEALTHY')}
          >
            <IconCheckCircle size={13} />
            <span className="pill-title">Optimal</span>
            <span className="pill-count">{stats.healthy}</span>
          </button>

          <button
            type="button"
            className={`filter-pill warning ${activeFilter === 'ATTENTION' ? 'active' : ''}`}
            onClick={() => onChangeFilter('ATTENTION')}
          >
            <IconAlertTriangle size={13} />
            <span className="pill-title">Attention</span>
            <span className="pill-count">{stats.attention}</span>
          </button>

          <button
            type="button"
            className={`filter-pill critical ${activeFilter === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => onChangeFilter('CRITICAL')}
          >
            <IconAlertCircle size={13} />
            <span className="pill-title">Critical</span>
            <span className="pill-count">{stats.critical}</span>
          </button>
        </div>
      </div>

      {/* 1-Click Scenario Preset Switcher */}
      {isSimulation && onSelectScenario && (
        <div className="scenario-presets-bar">
          <span className="scenario-bar-label">
            <span className="mono">TEST PRESETS:</span>
          </span>
          <div className="scenario-chips-row">
            <button
              type="button"
              className={`scenario-chip ${selectedScenarioId === 'A' ? 'active' : ''}`}
              onClick={() => onSelectScenario('A')}
            >
              <span className="chip-badge success">A</span>
              <span className="chip-text">Fast & Clean (Wi-Fi 6)</span>
            </button>

            <button
              type="button"
              className={`scenario-chip ${selectedScenarioId === 'B' ? 'active' : ''}`}
              onClick={() => onSelectScenario('B')}
            >
              <span className="chip-badge critical">B</span>
              <span className="chip-text">Weak Signal (-76 dBm)</span>
            </button>

            <button
              type="button"
              className={`scenario-chip ${selectedScenarioId === 'C' ? 'active' : ''}`}
              onClick={() => onSelectScenario('C')}
            >
              <span className="chip-badge critical">C</span>
              <span className="chip-text">RF Interference (Ch 6)</span>
            </button>

            <button
              type="button"
              className={`scenario-chip ${selectedScenarioId === 'D' ? 'active' : ''}`}
              onClick={() => onSelectScenario('D')}
            >
              <span className="chip-badge warning">D</span>
              <span className="chip-text">Legacy Device (802.11n)</span>
            </button>

            <button
              type="button"
              className={`scenario-chip ${selectedScenarioId === 'E' ? 'active' : ''}`}
              onClick={() => onSelectScenario('E')}
            >
              <span className="chip-badge warning">E</span>
              <span className="chip-text">Wrong Band (2.4GHz)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
