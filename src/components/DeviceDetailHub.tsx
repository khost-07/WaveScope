import React, { useState } from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { SuperSimpleOverview } from './SuperSimpleOverview';
import { RFLinkBudgetGauge } from './RFLinkBudgetGauge';
import { CapabilityMatrix } from './CapabilityMatrix';
import { DiagnosticInspector } from './DiagnosticInspector';
import { ExplanationCard } from './ExplanationCard';

export type DetailTab = 'SIMPLE' | 'EXPLANATION' | 'TELEMETRY' | 'CAPABILITIES' | 'SCORES' | 'TUNER';

interface DeviceDetailHubProps {
  device: ClientDevice;
  diagnosis: StructuredDiagnosis;
  explanation: LLMExplanationResponse | null;
  isLoading: boolean;
  error?: string | null;
  onUpdateDeviceTelemetry?: (updatedDevice: ClientDevice) => void;
  onTriggerExplanation?: () => void;
  onOpenKeyModal?: () => void;
}

export const DeviceDetailHub: React.FC<DeviceDetailHubProps> = ({
  device,
  diagnosis,
  explanation,
  isLoading,
  error,
  onUpdateDeviceTelemetry,
  onTriggerExplanation,
  onOpenKeyModal
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('SIMPLE');
  const { telemetry } = device;

  const handleTweakField = (field: string, value: any) => {
    if (!onUpdateDeviceTelemetry) return;
    const updated: ClientDevice = {
      ...device,
      telemetry: {
        ...device.telemetry,
        [field]: value
      }
    };
    if (field === 'rssi_dBm' || field === 'noiseFloor_dBm') {
      const rssi = field === 'rssi_dBm' ? value : updated.telemetry.rssi_dBm;
      const noise = field === 'noiseFloor_dBm' ? value : updated.telemetry.noiseFloor_dBm;
      updated.telemetry.snr_dB = Math.max(0, rssi - noise);
    }
    onUpdateDeviceTelemetry(updated);
  };

  const status = diagnosis.status;

  return (
    <div className="bg-surface border border-border-subtle p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center font-data-sm text-muted uppercase tracking-wider">
        <span className="cursor-pointer hover:text-primary">Connected Clients</span>
        <span className="material-symbols-outlined text-[14px] mx-1.5">chevron_right</span>
        <span className="text-primary font-bold">{device.hostname}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between border-b border-border-subtle pb-4 gap-4">
        <div>
          <h1 className="font-headline-lg text-primary">{device.hostname}</h1>
          <p className="font-data-md text-secondary mt-1">
            MAC: {device.macAddress} | IP: {device.ipAddress} | Vendor: {device.vendor}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onTriggerExplanation && (
            <button
              type="button"
              className="btn-instrument-secondary"
              onClick={onTriggerExplanation}
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Re-Evaluate AI
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Raw Telemetry 4-Box Grid */}
      <div>
        <h3 className="font-label-caps text-secondary mb-2 flex items-center">
          <span className="material-symbols-outlined mr-1.5 text-[16px]">sensors</span>
          Raw Telemetry
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-subtle border border-border-subtle">
          {/* RSSI */}
          <div className="telemetry-cell">
            <span className="telemetry-cell-label">RSSI (Signal)</span>
            <div className="telemetry-cell-value-group">
              <span
                className="telemetry-cell-value"
                style={{
                  color: telemetry.rssi_dBm <= -75 ? 'var(--status-critical)' : telemetry.rssi_dBm <= -70 ? 'var(--status-attention)' : 'var(--status-healthy)'
                }}
              >
                {telemetry.rssi_dBm}
              </span>
              <span className="telemetry-cell-unit">dBm</span>
            </div>
          </div>

          {/* SNR */}
          <div className="telemetry-cell">
            <span className="telemetry-cell-label">SNR (Signal-to-Noise)</span>
            <div className="telemetry-cell-value-group">
              <span
                className="telemetry-cell-value"
                style={{
                  color: telemetry.snr_dB <= 12 ? 'var(--status-critical)' : telemetry.snr_dB <= 20 ? 'var(--status-attention)' : 'var(--status-healthy)'
                }}
              >
                {telemetry.snr_dB}
              </span>
              <span className="telemetry-cell-unit">dB</span>
            </div>
          </div>

          {/* Retry Rate */}
          <div className="telemetry-cell">
            <span className="telemetry-cell-label">Frame Retry Rate</span>
            <div className="telemetry-cell-value-group">
              <span
                className="telemetry-cell-value"
                style={{
                  color: telemetry.retryRatePct >= 15 ? 'var(--status-critical)' : telemetry.retryRatePct >= 8 ? 'var(--status-attention)' : 'var(--status-healthy)'
                }}
              >
                {telemetry.retryRatePct.toFixed(1)}
              </span>
              <span className="telemetry-cell-unit">%</span>
            </div>
          </div>

          {/* Band & Width */}
          <div className="telemetry-cell">
            <span className="telemetry-cell-label">Operating Band</span>
            <div className="telemetry-cell-value-group">
              <span className="telemetry-cell-value text-primary">{telemetry.band}</span>
              <span className="telemetry-cell-unit">{telemetry.channelWidthMHz}MHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Stitch Diagnostic Engine Result Card */}
      <div className="border border-border-subtle bg-surface">
        <div
          className="p-4 border-b border-border-subtle"
          style={{
            backgroundColor: status === 'CRITICAL' ? 'var(--status-critical-bg)' : status === 'ATTENTION' ? 'var(--status-attention-bg)' : 'var(--status-healthy-bg)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-label-caps text-secondary flex items-center">
              <span className="material-symbols-outlined mr-1.5 text-[16px]">rule</span>
              Layer 2 Diagnostic Result
            </div>

            {status === 'HEALTHY' && (
              <span className="badge-status badge-status-healthy">
                <span className="material-symbols-outlined text-[12px]">check_box</span>
                HEALTHY LINK
              </span>
            )}
            {status === 'ATTENTION' && (
              <span className="badge-status badge-status-attention">
                <span className="material-symbols-outlined text-[12px]">warning</span>
                ATTENTION REQUIRED
              </span>
            )}
            {status === 'CRITICAL' && (
              <span className="badge-status badge-status-critical">
                <span className="material-symbols-outlined text-[12px]">error</span>
                HIGH SEVERITY
              </span>
            )}
          </div>

          <h2
            className="font-headline-md text-[18px] font-bold mb-3"
            style={{
              color: status === 'CRITICAL' ? 'var(--status-critical)' : status === 'ATTENTION' ? 'var(--status-attention)' : 'var(--status-healthy)'
            }}
          >
            {diagnosis.primary_diagnosis}
          </h2>

          <div className="flex flex-wrap gap-6 font-data-sm text-secondary">
            <div>
              <span className="text-muted block text-[10px] font-label-caps mb-0.5">Confidence</span>
              <span className="font-data-md text-primary font-bold">{diagnosis.confidence}%</span>
            </div>
            <div>
              <span className="text-muted block text-[10px] font-label-caps mb-0.5">Physical Evidence</span>
              <ul className="list-disc list-inside space-y-0.5">
                {diagnosis.evidence.slice(0, 3).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border-subtle bg-surface-offset">
        <button
          type="button"
          className={`px-4 py-2.5 font-label-caps border-b-2 flex items-center gap-1.5 ${
            activeTab === 'SIMPLE'
              ? 'border-primary bg-surface text-primary font-bold'
              : 'border-transparent text-secondary hover:bg-surface'
          }`}
          onClick={() => setActiveTab('SIMPLE')}
        >
          <span className="material-symbols-outlined text-[16px]">lightbulb</span>
          Simple Plain English
        </button>

        <button
          type="button"
          className={`px-4 py-2.5 font-label-caps border-b-2 flex items-center gap-1.5 ${
            activeTab === 'EXPLANATION'
              ? 'border-primary bg-surface text-primary font-bold'
              : 'border-transparent text-secondary hover:bg-surface'
          }`}
          onClick={() => setActiveTab('EXPLANATION')}
        >
          <span className="material-symbols-outlined text-[16px]">psychology</span>
          Diagnostic AI Deep-Dive
        </button>

        <button
          type="button"
          className={`px-4 py-2.5 font-label-caps border-b-2 flex items-center gap-1.5 ${
            activeTab === 'TELEMETRY'
              ? 'border-primary bg-surface text-primary font-bold'
              : 'border-transparent text-secondary hover:bg-surface'
          }`}
          onClick={() => setActiveTab('TELEMETRY')}
        >
          <span className="material-symbols-outlined text-[16px]">stacked_bar_chart</span>
          RF Link Budget
        </button>

        <button
          type="button"
          className={`px-4 py-2.5 font-label-caps border-b-2 flex items-center gap-1.5 ${
            activeTab === 'CAPABILITIES'
              ? 'border-primary bg-surface text-primary font-bold'
              : 'border-transparent text-secondary hover:bg-surface'
          }`}
          onClick={() => setActiveTab('CAPABILITIES')}
        >
          <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
          Capability Cross-Reference
        </button>

        <button
          type="button"
          className={`px-4 py-2.5 font-label-caps border-b-2 flex items-center gap-1.5 ${
            activeTab === 'SCORES'
              ? 'border-primary bg-surface text-primary font-bold'
              : 'border-transparent text-secondary hover:bg-surface'
          }`}
          onClick={() => setActiveTab('SCORES')}
        >
          <span className="material-symbols-outlined text-[16px]">analytics</span>
          Hypothesis Scores
        </button>

        <button
          type="button"
          className={`px-4 py-2.5 font-label-caps border-b-2 flex items-center gap-1.5 ${
            activeTab === 'TUNER'
              ? 'border-primary bg-surface text-primary font-bold'
              : 'border-transparent text-secondary hover:bg-surface'
          }`}
          onClick={() => setActiveTab('TUNER')}
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Parameter Tuner
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'SIMPLE' && (
          <SuperSimpleOverview
            diagnosis={diagnosis}
            explanation={explanation}
            isLoading={isLoading}
            error={error}
            onRefresh={onTriggerExplanation}
            onOpenKeyModal={onOpenKeyModal}
            onSwitchToTechnical={() => setActiveTab('TELEMETRY')}
          />
        )}

        {activeTab === 'EXPLANATION' && (
          <div className="space-y-4">
            <ExplanationCard
              explanation={explanation}
              isLoading={isLoading}
              error={error}
              onRefresh={onTriggerExplanation}
              onOpenKeyModal={onOpenKeyModal}
            />
            <DiagnosticInspector diagnosis={diagnosis} />
          </div>
        )}

        {activeTab === 'TELEMETRY' && (
          <div className="space-y-4">
            <RFLinkBudgetGauge telemetry={telemetry} />
            <DiagnosticInspector diagnosis={diagnosis} />
          </div>
        )}

        {activeTab === 'CAPABILITIES' && (
          <div className="space-y-4">
            <CapabilityMatrix deviceCaps={device.capabilities} apCaps={device.apCapabilities} />
            <RFLinkBudgetGauge telemetry={telemetry} />
          </div>
        )}

        {activeTab === 'SCORES' && (
          <div className="space-y-4">
            <DiagnosticInspector diagnosis={diagnosis} />
            <RFLinkBudgetGauge telemetry={telemetry} />
          </div>
        )}

        {activeTab === 'TUNER' && (
          <div className="border border-border-subtle bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-label-caps text-secondary">Interactive Telemetry Tuner</span>
              <span className="font-data-sm text-muted">Sliders recalculate Layer 2 hypothesis scores in real-time</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-data-sm text-secondary block mb-1">
                  RSSI: <strong className="text-primary">{device.telemetry.rssi_dBm} dBm</strong>
                </label>
                <input
                  type="range"
                  min="-90"
                  max="-30"
                  value={device.telemetry.rssi_dBm}
                  onChange={(e) => handleTweakField('rssi_dBm', parseInt(e.target.value, 10))}
                />
                <div className="flex justify-between font-data-sm text-[10px] text-muted mt-1">
                  <span>-90 dBm (Weak)</span>
                  <span>-60 dBm (Nominal)</span>
                  <span>-30 dBm (Strong)</span>
                </div>
              </div>

              <div>
                <label className="font-data-sm text-secondary block mb-1">
                  Noise Floor: <strong className="text-primary">{device.telemetry.noiseFloor_dBm} dBm</strong>
                </label>
                <input
                  type="range"
                  min="-95"
                  max="-45"
                  value={device.telemetry.noiseFloor_dBm}
                  onChange={(e) => handleTweakField('noiseFloor_dBm', parseInt(e.target.value, 10))}
                />
                <div className="flex justify-between font-data-sm text-[10px] text-muted mt-1">
                  <span>-95 dBm (Clean)</span>
                  <span>-70 dBm (Noisy)</span>
                  <span>-45 dBm (Jammed)</span>
                </div>
              </div>

              <div>
                <label className="font-data-sm text-secondary block mb-1">
                  Retry Rate: <strong className="text-primary">{device.telemetry.retryRatePct}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={device.telemetry.retryRatePct}
                  onChange={(e) => handleTweakField('retryRatePct', parseInt(e.target.value, 10))}
                />
              </div>

              <div>
                <label className="font-data-sm text-secondary block mb-1">
                  Channel Width: <strong className="text-primary">{device.telemetry.channelWidthMHz} MHz</strong>
                </label>
                <div className="flex gap-2 mt-1">
                  {[20, 40, 80, 160].map(w => (
                    <button
                      key={w}
                      type="button"
                      className={`btn-instrument-secondary text-[11px] py-1 px-3 ${device.telemetry.channelWidthMHz === w ? 'bg-inverse text-white' : ''}`}
                      onClick={() => handleTweakField('channelWidthMHz', w)}
                    >
                      {w} MHz
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
