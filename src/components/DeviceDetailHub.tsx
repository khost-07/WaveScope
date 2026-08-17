import React, { useState } from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { SuperSimpleOverview } from './SuperSimpleOverview';
import { RFLinkBudgetGauge } from './RFLinkBudgetGauge';
import { CapabilityMatrix } from './CapabilityMatrix';
import { DiagnosticInspector } from './DiagnosticInspector';
import { ExplanationCard } from './ExplanationCard';
import {
  IconChevronRight,
  IconRefresh,
  IconSignal,
  IconSparkles,
  IconRule,
  IconCheckBox,
  IconAlertTriangle,
  IconAlertCircle
} from './SvgIcons';

export type DetailTab = 'OVERVIEW' | 'EVIDENCE' | 'SPECTRUM';

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
  const [activeTab, setActiveTab] = useState<DetailTab>('OVERVIEW');
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
    <div className="bg-white border border-[#E5E5E5] p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center font-mono text-[12px] text-[#747878] uppercase tracking-wider">
        <span className="cursor-pointer hover:text-black">Connected Clients</span>
        <IconChevronRight size={14} className="mx-1 text-[#747878]" />
        <span className="text-black font-bold">{device.hostname}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between border-b border-[#E5E5E5] pb-4 gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-black tracking-tight">{device.hostname}</h1>
          <p className="font-mono text-[12px] text-[#444748] mt-1">
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
              <IconRefresh size={14} />
              <span>Re-Evaluate AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Canonical Raw Telemetry 4-Box Grid (Fix 1: Single source of truth for numbers) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] mb-2 flex items-center gap-1.5">
          <IconSignal size={15} />
          <span>Raw Telemetry</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* RSSI */}
          <div className="telemetry-cell">
            <span className="telemetry-cell-label">RSSI (Signal)</span>
            <div className="telemetry-cell-value-group">
              <span
                className="telemetry-cell-value"
                style={{
                  color: telemetry.rssi_dBm <= -75 ? '#D32F2F' : telemetry.rssi_dBm <= -70 ? '#F57C00' : '#2E7D32'
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
                  color: telemetry.snr_dB <= 12 ? '#D32F2F' : telemetry.snr_dB <= 20 ? '#F57C00' : '#2E7D32'
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
                  color: telemetry.retryRatePct >= 15 ? '#D32F2F' : telemetry.retryRatePct >= 8 ? '#F57C00' : '#2E7D32'
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
              <span className="telemetry-cell-value text-black">{telemetry.band}</span>
              <span className="telemetry-cell-unit">{telemetry.channelWidthMHz}MHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Layer 2 Diagnostic Result Banner (Fix 1: No duplicated raw numbers) */}
      <div className="border border-[#E5E5E5] bg-white">
        <div
          className="p-4"
          style={{
            backgroundColor: status === 'CRITICAL' ? 'rgba(211, 47, 47, 0.05)' : status === 'ATTENTION' ? 'rgba(245, 124, 0, 0.05)' : 'rgba(46, 125, 50, 0.05)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] flex items-center gap-1.5">
              <IconRule size={15} />
              <span>Layer 2 Diagnostic Result</span>
            </div>

            {status === 'HEALTHY' && (
              <span className="badge-status badge-status-healthy flex items-center gap-1">
                <IconCheckBox size={11} />
                HEALTHY LINK
              </span>
            )}
            {status === 'ATTENTION' && (
              <span className="badge-status badge-status-attention flex items-center gap-1">
                <IconAlertTriangle size={11} />
                ATTENTION REQUIRED
              </span>
            )}
            {status === 'CRITICAL' && (
              <span className="badge-status badge-status-critical flex items-center gap-1">
                <IconAlertCircle size={11} />
                HIGH SEVERITY
              </span>
            )}
          </div>

          <h2
            className="text-[18px] font-bold mb-2"
            style={{
              color: status === 'CRITICAL' ? '#D32F2F' : status === 'ATTENTION' ? '#F57C00' : '#2E7D32'
            }}
          >
            {diagnosis.primary_diagnosis}
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-4 text-[12px] font-mono text-[#444748] pt-2 border-t border-[#E5E5E5]/60">
            <div>
              <span className="text-[#747878] uppercase text-[10px] font-bold mr-1.5">ENGINE CONFIDENCE:</span>
              <strong className="text-black text-[13px]">{diagnosis.confidence}%</strong>
            </div>
            <div className="font-sans text-[12px] text-[#747878]">
              See Raw Telemetry above for supporting signal data and the Evidence tab for hypothesis breakdown.
            </div>
          </div>
        </div>
      </div>

      {/* Consolidated 3-Tab Controller (Fix 2) */}
      <div className="flex border-b border-[#E5E5E5] bg-[#FAFAFA] overflow-x-auto">
        <button
          type="button"
          className={`px-5 py-3 text-[12px] font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'border-black bg-white text-black font-bold'
              : 'border-transparent text-[#444748] hover:bg-white'
          }`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          <IconSparkles size={16} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`px-5 py-3 text-[12px] font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'EVIDENCE'
              ? 'border-black bg-white text-black font-bold'
              : 'border-transparent text-[#444748] hover:bg-white'
          }`}
          onClick={() => setActiveTab('EVIDENCE')}
        >
          <IconRule size={16} />
          <span>Evidence</span>
        </button>

        <button
          type="button"
          className={`px-5 py-3 text-[12px] font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'SPECTRUM'
              ? 'border-black bg-white text-black font-bold'
              : 'border-transparent text-[#444748] hover:bg-white'
          }`}
          onClick={() => setActiveTab('SPECTRUM')}
        >
          <IconSignal size={16} />
          <span>Spectrum</span>
        </button>
      </div>

      {/* 3 Tab Panels */}
      <div>
        {/* TAB 1: OVERVIEW (Merged Simple Plain English + Diagnostic AI Deep-Dive) */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <SuperSimpleOverview
              diagnosis={diagnosis}
              explanation={explanation}
              isLoading={isLoading}
              error={error}
              onRefresh={onTriggerExplanation}
              onOpenKeyModal={onOpenKeyModal}
            />

            <ExplanationCard
              explanation={explanation}
              isLoading={isLoading}
              error={error}
              onRefresh={onTriggerExplanation}
              onOpenKeyModal={onOpenKeyModal}
            />
          </div>
        )}

        {/* TAB 2: EVIDENCE (Merged Hypothesis Scores + Capability Cross-Reference) */}
        {activeTab === 'EVIDENCE' && (
          <div className="space-y-6">
            <DiagnosticInspector diagnosis={diagnosis} />
            <CapabilityMatrix deviceCaps={device.capabilities} apCaps={device.apCapabilities} />
          </div>
        )}

        {/* TAB 3: SPECTRUM (Merged RF Link Budget + Parameter Tuner) */}
        {activeTab === 'SPECTRUM' && (
          <div className="space-y-6">
            <RFLinkBudgetGauge telemetry={telemetry} />

            {/* Parameter Tuner */}
            <div className="border border-[#E5E5E5] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#444748]">
                  Interactive RF Parameter Tuner
                </span>
                <span className="font-mono text-[11px] text-[#747878]">
                  Adjust parameters to test Layer 2 scoring engine response in real-time
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="font-mono text-[12px] text-[#444748] block mb-1">
                    RSSI: <strong className="text-black">{device.telemetry.rssi_dBm} dBm</strong>
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="-30"
                    value={device.telemetry.rssi_dBm}
                    onChange={(e) => handleTweakField('rssi_dBm', parseInt(e.target.value, 10))}
                  />
                  <div className="flex justify-between font-mono text-[10px] text-[#747878] mt-1">
                    <span>-90 dBm (Weak)</span>
                    <span>-60 dBm (Nominal)</span>
                    <span>-30 dBm (Strong)</span>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[12px] text-[#444748] block mb-1">
                    Noise Floor: <strong className="text-black">{device.telemetry.noiseFloor_dBm} dBm</strong>
                  </label>
                  <input
                    type="range"
                    min="-95"
                    max="-45"
                    value={device.telemetry.noiseFloor_dBm}
                    onChange={(e) => handleTweakField('noiseFloor_dBm', parseInt(e.target.value, 10))}
                  />
                  <div className="flex justify-between font-mono text-[10px] text-[#747878] mt-1">
                    <span>-95 dBm (Clean)</span>
                    <span>-70 dBm (Noisy)</span>
                    <span>-45 dBm (Jammed)</span>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[12px] text-[#444748] block mb-1">
                    Retry Rate: <strong className="text-black">{device.telemetry.retryRatePct}%</strong>
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
                  <label className="font-mono text-[12px] text-[#444748] block mb-1">
                    Channel Width: <strong className="text-black">{device.telemetry.channelWidthMHz} MHz</strong>
                  </label>
                  <div className="flex gap-2 mt-1">
                    {[20, 40, 80, 160].map((w) => (
                      <button
                        key={w}
                        type="button"
                        className={`btn-instrument-secondary text-[11px] py-1 px-3 ${device.telemetry.channelWidthMHz === w ? 'bg-black text-white' : ''}`}
                        onClick={() => handleTweakField('channelWidthMHz', w)}
                      >
                        {w} MHz
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
