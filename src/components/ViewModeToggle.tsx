import React from 'react';

export type UIMode = 'SIMPLE' | 'NERD';

interface ViewModeToggleProps {
  uiMode: UIMode;
  onChangeUiMode: (mode: UIMode) => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ uiMode, onChangeUiMode }) => {
  return (
    <div className="view-mode-toggle">
      <button
        type="button"
        className={`view-mode-btn ${uiMode === 'SIMPLE' ? 'active' : ''}`}
        onClick={() => onChangeUiMode('SIMPLE')}
      >
        <span className="view-mode-icon">✦</span>
        <span>Simple View</span>
      </button>
      <button
        type="button"
        className={`view-mode-btn ${uiMode === 'NERD' ? 'active' : ''}`}
        onClick={() => onChangeUiMode('NERD')}
      >
        <span className="view-mode-icon">⚡</span>
        <span>Nerd Mode</span>
        <span className="nerd-pill">RF Data</span>
      </button>
    </div>
  );
};
