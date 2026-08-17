import React from 'react';
import { DataSourceMode, DataProvenance } from '../layer1_data/types';
import { ViewModeToggle, UIMode } from './ViewModeToggle';

interface HeaderInstrumentProps {
  mode: DataSourceMode;
  onModeChange: (mode: DataSourceMode) => void;
  uiMode: UIMode;
  onChangeUiMode: (uiMode: UIMode) => void;
  provenance: DataProvenance;
  stats: {
    total: number;
    healthy: number;
    attention: number;
    critical: number;
  };
  onOpenSettings?: () => void;
}

export const HeaderInstrument: React.FC<HeaderInstrumentProps> = ({
  mode,
  onModeChange,
  uiMode,
  onChangeUiMode,
  provenance,
  stats,
  onOpenSettings
}) => {
  return (
    <header className="instrument-header">
      <div className="header-main-row">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo-badge">WS</div>
          <div>
            <div className="brand-title">WaveScope</div>
            <div className="brand-subtitle">Wi-Fi Root-Cause Diagnostic Tool</div>
          </div>
        </div>

        {/* View Mode Toggle (Simple View vs Nerd Mode) */}
        <div className="center-controls">
          <ViewModeToggle uiMode={uiMode} onChangeUiMode={onChangeUiMode} />
        </div>

        {/* Right Action Controls */}
        <div className="header-actions">
          <div className="data-mode-segmented">
            <button
              type="button"
              className={`data-mode-btn ${mode === 'SIMULATION' ? 'active' : ''}`}
              onClick={() => onModeChange('SIMULATION')}
              title="Fixed Scenario Dataset (Scenarios A-E)"
            >
              Simulation
            </button>
            <button
              type="button"
              className={`data-mode-btn ${mode === 'REAL' ? 'active' : ''}`}
              onClick={() => onModeChange('REAL')}
              title="Live Windows WLAN Telemetry"
            >
              Real Wi-Fi
            </button>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              className="btn-header-action"
              onClick={onOpenSettings}
              title="LLM API Configuration"
            >
              ⚙ API
            </button>
          )}
        </div>
      </div>

      {/* Provenance & Quick Status Bar */}
      <div className="header-sub-bar">
        <div className="provenance-indicator">
          <span className="provenance-chip-label">DATA SOURCE:</span>
          <span className="provenance-chip-value">{provenance.sourceIdentifier}</span>
          {provenance.adapterName && (
            <span className="provenance-chip-sub">({provenance.adapterName})</span>
          )}
        </div>

        <div className="header-status-pills">
          <div className="status-counter-item">
            <span className="counter-label">Devices:</span>
            <span className="counter-val bold">{stats.total}</span>
          </div>
          <div className="status-counter-item">
            <span className="counter-dot success" />
            <span className="counter-label">Optimal:</span>
            <span className="counter-val success">{stats.healthy}</span>
          </div>
          <div className="status-counter-item">
            <span className="counter-dot warning" />
            <span className="counter-label">Attention:</span>
            <span className="counter-val warning">{stats.attention}</span>
          </div>
          <div className="status-counter-item">
            <span className="counter-dot critical" />
            <span className="counter-label">Critical:</span>
            <span className="counter-val critical">{stats.critical}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
