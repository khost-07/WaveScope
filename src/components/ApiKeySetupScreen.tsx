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
    <div className="fixed inset-0 bg-background grid-bg flex items-center justify-center p-6 z-50">
      <div className="bg-surface border border-primary max-w-lg w-full p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[28px]">radar</span>
            <div>
              <h1 className="font-headline-lg text-primary text-[22px]">WaveScope</h1>
              <p className="font-data-sm text-muted">Precision RF Wi-Fi Diagnostic Instrument</p>
            </div>
          </div>
          <span className="badge-status font-data-sm">Instrument Setup</span>
        </div>

        {/* Intro */}
        <div className="space-y-2">
          <h2 className="font-headline-md text-primary text-[17px]">Connect Google Gemini AI Engine</h2>
          <p className="font-body-md text-secondary leading-relaxed">
            WaveScope runs Layer 2 deterministic RF scoring locally, then connects directly to{' '}
            <strong className="text-primary">gemini-3.1-flash-lite</strong> for live root-cause explanations and whole-network audits.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-label-caps text-secondary text-[10px]">
              <label htmlFor="gemini-key">Gemini API Key</label>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide Key' : 'Show Key'}
              </button>
            </div>

            <input
              id="gemini-key"
              type={showKey ? 'text' : 'password'}
              className="w-full bg-surface-offset border border-border-subtle p-3 font-data-md text-primary outline-none focus:border-primary"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />

            {error && (
              <div className="font-data-sm text-status-critical mt-1">{error}</div>
            )}

            <div className="font-data-sm text-muted text-[11px] pt-1">
              Get a free API key at{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline font-bold"
              >
                Google AI Studio &rarr;
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 font-data-sm text-secondary">
            <input
              type="checkbox"
              id="remember-key"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="remember-key" className="cursor-pointer">
              Remember API key in browser storage
            </label>
          </div>

          <button
            type="submit"
            className="w-full btn-instrument-primary py-3 justify-center text-[13px]"
            disabled={!keyInput.trim()}
          >
            Launch WaveScope Instrument &rarr;
          </button>
        </form>

        <div className="pt-2 border-t border-border-subtle font-data-sm text-[10px] text-muted flex justify-between">
          <span>Engine: <strong>Deterministic L2 + Gemini 3.1 Flash Lite</strong></span>
          <span>Zero Fallbacks</span>
        </div>
      </div>
    </div>
  );
};
