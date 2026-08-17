import React, { useState } from 'react';
import { IconRadar } from './SvgIcons';

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
    <div className="fixed inset-0 bg-[#F4F5F7] flex items-center justify-center p-6 z-50">
      <div className="bg-white border border-[#0F1113] max-w-lg w-full p-8 space-y-6 shadow-xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-4">
          <div className="flex items-center gap-3">
            <IconRadar size={28} className="text-black" />
            <div>
              <h1 className="text-[22px] font-bold text-black tracking-tight mb-0.5">WaveScope</h1>
              <p className="font-mono text-[11px] text-[#6B7280]">Precision RF Wi-Fi Diagnostic Instrument</p>
            </div>
          </div>
          <span className="badge-status font-mono text-[10px]">Setup Configuration</span>
        </div>

        {/* Intro */}
        <div className="space-y-2">
          <h2 className="text-[17px] font-bold text-black mb-1">Connect Google Gemini AI Engine</h2>
          <p className="text-[14px] text-[#3B4045] leading-relaxed">
            WaveScope runs Layer 2 deterministic RF scoring locally, then connects directly to{' '}
            <strong className="text-black">gemini-3.1-flash-lite</strong> for live root-cause explanations and whole-network audits.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#3B4045] mb-1">
              <label htmlFor="gemini-key">Gemini API Key</label>
              <button
                type="button"
                className="text-black hover:underline cursor-pointer"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide Key' : 'Show Key'}
              </button>
            </div>

            <input
              id="gemini-key"
              type={showKey ? 'text' : 'password'}
              className="w-full bg-[#F8F9FA] border border-[#E2E5E9] p-3 font-mono text-[13px] text-black outline-none focus:border-black transition-colors"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />

            {error && (
              <div className="font-mono text-[11px] text-[#DC2626] mt-1.5">{error}</div>
            )}

            <div className="font-mono text-[11px] text-[#6B7280] pt-1.5">
              Get a free API key at{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black underline font-bold"
              >
                Google AI Studio &rarr;
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-[#3B4045] my-2">
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

        <div className="pt-2 border-t border-[#E2E5E9] font-mono text-[10px] text-[#6B7280] flex justify-between">
          <span>Engine: <strong>Deterministic L2 + Gemini 3.1 Flash Lite</strong></span>
          <span>Zero Fallbacks</span>
        </div>
      </div>
    </div>
  );
};
