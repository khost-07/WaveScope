import React, { useState } from 'react';

interface ApiKeySetupScreenProps {
  initialKey?: string;
  onSaveKey: (key: string, persist: boolean) => void;
}

export const ApiKeySetupScreen: React.FC<ApiKeySetupScreenProps> = ({
  initialKey = '',
  onSaveKey
}) => {
  const [keyInput, setKeyInput] = useState(initialKey);
  const [persist, setPersist] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = keyInput.trim();
    if (!clean) {
      setError('Please enter a valid Gemini API Key to continue.');
      return;
    }
    setError(null);
    onSaveKey(clean, persist);
  };

  return (
    <div className="setup-screen-backdrop">
      <div className="setup-card">
        {/* Brand Header */}
        <div className="setup-brand-row">
          <div className="setup-logo-badge">WS</div>
          <div>
            <h1 className="setup-title">WaveScope</h1>
            <p className="setup-subtitle">Wi-Fi Band Analyzer & Root-Cause Diagnostic Tool</p>
          </div>
        </div>

        <div className="setup-divider" />

        {/* Informative Intro */}
        <div className="setup-intro">
          <div className="setup-badge-tag">Model: gemini-3.1-flash-lite</div>
          <h2 className="setup-heading">Enter your Google Gemini API Key</h2>
          <p className="setup-desc">
            WaveScope pairs a deterministic RF diagnostic engine with <strong>gemini-3.1-flash-lite</strong> to generate plain-English explanations and step-by-step troubleshooting actions.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="setup-form">
          <div className="setup-field">
            <div className="setup-label-row">
              <label htmlFor="gemini-key" className="setup-label">
                Google Gemini API Key
              </label>
              <button
                type="button"
                className="setup-toggle-btn"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide Key' : 'Show Key'}
              </button>
            </div>

            <div className="setup-input-wrapper">
              <input
                id="gemini-key"
                type={showKey ? 'text' : 'password'}
                className={`setup-input mono ${error ? 'input-error' : ''}`}
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
              />
            </div>

            {error && <div className="setup-error-msg">{error}</div>}

            <div className="setup-help-text">
              Don't have an API key? You can generate a free one in seconds at{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="setup-link"
              >
                Google AI Studio &rarr;
              </a>
            </div>
          </div>

          <div className="setup-checkbox-row">
            <label className="setup-checkbox-label">
              <input
                type="checkbox"
                checked={persist}
                onChange={(e) => setPersist(e.target.checked)}
                className="setup-checkbox"
              />
              <span>Remember API key in this browser session</span>
            </label>
          </div>

          <div className="setup-actions">
            <button
              type="submit"
              className="setup-submit-btn"
              disabled={!keyInput.trim()}
            >
              <span>Continue to WaveScope</span>
              <span>&rarr;</span>
            </button>
          </div>
        </form>

        <div className="setup-footer-note">
          <span>⚡ Model: <strong>gemini-3.1-flash-lite</strong> &bull; Zero cached fallbacks &bull; Direct Google Gemini inference</span>
        </div>
      </div>
    </div>
  );
};
