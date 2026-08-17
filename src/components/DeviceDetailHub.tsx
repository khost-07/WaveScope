import React, { useState, useMemo } from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { DeviceTrend } from '../layer2_engine/trendEngine';
import { evaluatePeerCorroboration } from '../layer2_engine/peerAnalysis';
import { computeEstimatedCoverage } from '../layer2_engine/deadZoneMapper';
import { SuperSimpleOverview } from './SuperSimpleOverview';
import { RFLinkBudgetGauge } from './RFLinkBudgetGauge';
import { CapabilityMatrix } from './CapabilityMatrix';
import { DiagnosticInspector } from './DiagnosticInspector';
import { ExplanationCard } from './ExplanationCard';
import { PeerComparisonSection } from './PeerComparisonSection';
import { EstimatedCoverageSection } from './EstimatedCoverageSection';
import { Sparkline } from './Sparkline';
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
  allDevices?: ClientDevice[];
  diagnosis: StructuredDiagnosis;
  diagnoses?: Record<string, StructuredDiagnosis>;
  explanation: LLMExplanationResponse | null;
  isLoading: boolean;
  error?: string | null;
  onUpdateDeviceTelemetry?: (updatedDevice: ClientDevice) => void;
  onTriggerExplanation?: () => void;
  onOpenKeyModal?: () => void;
  trend?: DeviceTrend;
}

export const DeviceDetailHub: React.FC<DeviceDetailHubProps> = ({
  device,
  allDevices = [],
  diagnosis,
  diagnoses = {},
  explanation,
  isLoading,
  error,
  onUpdateDeviceTelemetry,
  onTriggerExplanation,
  onOpenKeyModal,
  trend
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('OVERVIEW');
  const { telemetry } = device;

  // Feature 1: Peer comparison evaluation (only when peers exist)
  const peerResult = useMemo(() => {
    return evaluatePeerCorroboration(device, allDevices.length > 0 ? allDevices : [device], diagnoses);
  }, [device, allDevices, diagnoses]);

  // Feature 2: Inferred dead-zone coverage mapping
  const coverageResult = useMemo(() => {
    return computeEstimatedCoverage(device, allDevices.length > 0 ? allDevices : [device], diagnoses);
  }, [device, allDevices, diagnoses]);

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
  const effectiveConfidence = Math.min(99, diagnosis.confidence + (peerResult?.confidenceBoost || 0));

  return (
    <div className="bg-white border border-[#E2E5E9] p-6 space-y-5">
      {/* Breadcrumb & Navigation Path */}
      <div className="flex items-center font-mono text-[11px] text-[#6B7280] uppercase tracking-wider">
        <span className="cursor-pointer hover:text-black transition-colors">Client Fleet</span>
        <IconChevronRight size={14} className="mx-1 text-[#6B7280]" />
        <span className="text-black font-bold">{device.hostname}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between border-b border-[#E2E5E9] pb-4 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-black tracking-tight">{device.hostname}</h1>
          <p className="font-mono text-[12px] text-[#6B7280] mt-0.5">
            MAC: <strong className="text-black">{device.macAddress}</strong> &bull; IP: <strong className="text-black">{device.ipAddress}</strong> &bull; Vendor: {device.vendor}
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

      {/* Section 1: Canonical Raw Telemetry 4-Box Grid with Inline Sparkline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-1.5">
            <IconSignal size={15} />
            <span>Raw Telemetry</span>
          </div>

          {/* Sparkline */}
          {trend?.hasEnoughData && trend.sparklinePoints.length >= 2 && (
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#6B7280]">
              <span>Signal Drift ({trend.label}):</span>
              <Sparkline points={trend.sparklinePoints} color={trend.color} width={64} height={16} />
              <span className="font-bold" style={{ color: trend.color }}>{trend.symbol}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* RSSI */}
          <div className="telemetry-cell">
            <span className="telemetry-cell-label">RSSI (Signal)</span>
            <div className="telemetry-cell-value-group">
              <span
                className="telemetry-cell-value"
                style={{
                  color: telemetry.rssi_dBm <= -75 ? '#DC2626' : telemetry.rssi_dBm <= -70 ? '#D97706' : '#16A34A'
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
                  color: telemetry.snr_dB <= 12 ? '#DC2626' : telemetry.snr_dB <= 20 ? '#D97706' : '#16A34A'
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
                  color: telemetry.retryRatePct >= 15 ? '#DC2626' : telemetry.retryRatePct >= 8 ? '#D97706' : '#16A34A'
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

      {/* Section 2: Layer 2 Diagnostic Result Banner */}
      <div
        className="border border-[#E2E5E9] p-4.5 bg-white"
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: status === 'CRITICAL' ? '#DC2626' : status === 'ATTENTION' ? '#D97706' : '#16A34A'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-1.5">
            <IconRule size={15} />
            <span>Layer 2 Diagnostic Engine Verdict</span>
          </div>

          <div className="flex items-center gap-1.5">
            {status === 'HEALTHY' && (
              <span className="badge-status badge-status-healthy flex items-center gap-1">
                <IconCheckBox size={11} />
                HEALTHY LINK
                {trend?.hasEnoughData && <span className="font-bold ml-0.5">{trend.symbol}</span>}
              </span>
            )}
            {status === 'ATTENTION' && (
              <span className="badge-status badge-status-attention flex items-center gap-1">
                <IconAlertTriangle size={11} />
                ATTENTION REQUIRED
                {trend?.hasEnoughData && <span className="font-bold ml-0.5">{trend.symbol}</span>}
              </span>
            )}
            {status === 'CRITICAL' && (
              <span className="badge-status badge-status-critical flex items-center gap-1">
                <IconAlertCircle size={11} />
                HIGH SEVERITY
                {trend?.hasEnoughData && <span className="font-bold ml-0.5">{trend.symbol}</span>}
              </span>
            )}
          </div>
        </div>

        <h2
          className="text-[18px] font-bold mb-2 flex items-center gap-2 flex-wrap"
          style={{
            color: status === 'CRITICAL' ? '#DC2626' : status === 'ATTENTION' ? '#D97706' : '#16A34A'
          }}
        >
          <span>{diagnosis.primary_diagnosis}</span>
          {trend?.hasEnoughData && trend.direction !== 'STABLE' && (
            <span className="font-mono text-[12px] text-[#6B7280] font-normal">
              {trend.qualifier}
            </span>
          )}
        </h2>

        {/* Confidence Meter Bar */}
        <div className="space-y-1.5 pt-2 border-t border-[#E2E5E9]">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#6B7280] uppercase font-bold">Engine Scoring Confidence:</span>
            <strong className="text-black">{effectiveConfidence}%</strong>
          </div>
          <div className="hypothesis-bar-track">
            <div
              className="hypothesis-bar-fill"
              style={{
                width: `${effectiveConfidence}%`,
                backgroundColor: status === 'CRITICAL' ? '#DC2626' : status === 'ATTENTION' ? '#D97706' : '#16A34A'
              }}
            />
          </div>
        </div>
      </div>

      {/* Consolidated 3-Tab Controller */}
      <div className="flex border-b border-[#E2E5E9] bg-[#F8F9FA] overflow-x-auto">
        <button
          type="button"
          className={`px-5 py-3 text-[12px] font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'OVERVIEW'
              ? 'border-black bg-white text-black font-bold'
              : 'border-transparent text-[#6B7280] hover:text-black hover:bg-white'
          }`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          <IconSparkles size={16} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`px-5 py-3 text-[12px] font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'EVIDENCE'
              ? 'border-black bg-white text-black font-bold'
              : 'border-transparent text-[#6B7280] hover:text-black hover:bg-white'
          }`}
          onClick={() => setActiveTab('EVIDENCE')}
        >
          <IconRule size={16} />
          <span>Evidence</span>
        </button>

        <button
          type="button"
          className={`px-5 py-3 text-[12px] font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'SPECTRUM'
              ? 'border-black bg-white text-black font-bold'
              : 'border-transparent text-[#6B7280] hover:text-black hover:bg-white'
          }`}
          onClick={() => setActiveTab('SPECTRUM')}
        >
          <IconSignal size={16} />
          <span>Spectrum</span>
        </button>
      </div>

      {/* 3 Tab Panels */}
      <div>
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-5">
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

        {/* TAB 2: EVIDENCE */}
        {activeTab === 'EVIDENCE' && (
          <div className="space-y-5">
            <DiagnosticInspector diagnosis={diagnosis} />

            {/* Feature 1: Peer Comparison Section */}
            <PeerComparisonSection peerResult={peerResult} />

            <CapabilityMatrix deviceCaps={device.capabilities} apCaps={device.apCapabilities} />
          </div>
        )}

        {/* TAB 3: SPECTRUM */}
        {activeTab === 'SPECTRUM' && (
          <div className="space-y-5">
            <RFLinkBudgetGauge telemetry={telemetry} />

            {/* Feature 2: Inferred Dead-Zone Mapping */}
            <EstimatedCoverageSection
              coverageResult={coverageResult}
              selectedHostname={device.hostname}
            />

            {/* Parameter Tuner */}
            <div className="border border-[#E2E5E9] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045]">
                  Interactive RF Parameter Tuner
                </span>
                <span className="font-mono text-[11px] text-[#6B7280]">
                  Live Layer 2 scoring engine simulator
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="font-mono text-[12px] text-[#3B4045] block mb-1">
                    RSSI: <strong className="text-black">{device.telemetry.rssi_dBm} dBm</strong>
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="-30"
                    value={device.telemetry.rssi_dBm}
                    onChange={(e) => handleTweakField('rssi_dBm', parseInt(e.target.value, 10))}
                  />
                  <div className="flex justify-between font-mono text-[10px] text-[#6B7280] mt-1">
                    <span>-90 dBm (Weak)</span>
                    <span>-60 dBm (Nominal)</span>
                    <span>-30 dBm (Strong)</span>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[12px] text-[#3B4045] block mb-1">
                    Noise Floor: <strong className="text-black">{device.telemetry.noiseFloor_dBm} dBm</strong>
                  </label>
                  <input
                    type="range"
                    min="-95"
                    max="-45"
                    value={device.telemetry.noiseFloor_dBm}
                    onChange={(e) => handleTweakField('noiseFloor_dBm', parseInt(e.target.value, 10))}
                  />
                  <div className="flex justify-between font-mono text-[10px] text-[#6B7280] mt-1">
                    <span>-95 dBm (Clean)</span>
                    <span>-70 dBm (Noisy)</span>
                    <span>-45 dBm (Jammed)</span>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[12px] text-[#3B4045] block mb-1">
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
                  <label className="font-mono text-[12px] text-[#3B4045] block mb-1">
                    Channel Width: <strong className="text-black">{device.telemetry.channelWidthMHz} MHz</strong>
                  </label>
                  <div className="flex gap-2 mt-1">
                    {[20, 40, 80, 160].map((w) => (
                      <button
                        key={w}
                        type="button"
                        className={`btn-instrument-secondary text-[11px] py-1 px-3 ${device.telemetry.channelWidthMHz === w ? 'bg-black text-white border-black' : ''}`}
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
