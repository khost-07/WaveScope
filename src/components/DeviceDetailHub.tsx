import React, { useState } from 'react';
import { ClientDevice, StructuredDiagnosis, WiFiBand, WiFiStandard } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { RFLinkBudgetGauge } from './RFLinkBudgetGauge';
import { CapabilityMatrix } from './CapabilityMatrix';
import { DiagnosticInspector } from './DiagnosticInspector';
import { ExplanationCard } from './ExplanationCard';
import { getDeviceIconComponent, getFriendlyBadgeText } from './DeviceCard';
import { IconSparkles, IconSignal, IconCpu, IconSliders } from './SvgIcons';

export type DetailTab = 'EXPLANATION' | 'TELEMETRY' | 'CAPABILITIES' | 'SCORES' | 'TUNER';

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
  const [activeTab, setActiveTab] = useState<DetailTab>('EXPLANATION');

  const badgeInfo = getFriendlyBadgeText(diagnosis);
  const icon = getDeviceIconComponent(device.deviceType, device.hostname);
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

  return (
    <div className="detail-hub-container">
      {/* Device Header Banner */}
      <div className={`detail-hub-header ${badgeInfo.theme}`}>
        <div className="hub-header-left">
          <div className="hub-device-icon-wrapper">
            {icon}
          </div>
          <div>
            <div className="hub-badge-line">
              <span className={`card-status-pill ${badgeInfo.theme}`}>
                {badgeInfo.label}
              </span>
              <span className="hub-scenario-tag mono">
                {device.scenarioName ? device.scenarioName.split(':')[0] : 'Associated Client'}
              </span>
            </div>
            <h1 className="hub-hostname-title">{device.hostname}</h1>
            <p className="hub-mac-line mono">
              {device.vendor} &bull; {device.deviceType} &bull; MAC: {device.macAddress} &bull; IP: {device.ipAddress}
            </p>
          </div>
        </div>

        {/* Live Status Tag */}
        <div className="hub-header-right">
          <div className="hub-quick-stats mono">
            <div>BAND: <strong>{telemetry.band}</strong> (Ch {telemetry.channel})</div>
            <div>SPEED: <strong>{telemetry.txLinkRate_Mbps} Mbps</strong></div>
            <div>LINK: <strong>{telemetry.rssi_dBm} dBm / {telemetry.snr_dB} dB SNR</strong></div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="hub-tab-bar">
        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'EXPLANATION' ? 'active' : ''}`}
          onClick={() => setActiveTab('EXPLANATION')}
        >
          <IconSparkles size={14} />
          <span>Root Cause & AI Fixes</span>
        </button>

        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'TELEMETRY' ? 'active' : ''}`}
          onClick={() => setActiveTab('TELEMETRY')}
        >
          <IconSignal size={14} />
          <span>RF Telemetry & Spectrum</span>
        </button>

        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'CAPABILITIES' ? 'active' : ''}`}
          onClick={() => setActiveTab('CAPABILITIES')}
        >
          <IconCpu size={14} />
          <span>Radio Capabilities</span>
        </button>

        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'SCORES' ? 'active' : ''}`}
          onClick={() => setActiveTab('SCORES')}
        >
          <span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>L2</span>
          <span>Engine Hypothesis Scores</span>
        </button>

        <button
          type="button"
          className={`hub-tab-btn ${activeTab === 'TUNER' ? 'active' : ''}`}
          onClick={() => setActiveTab('TUNER')}
        >
          <IconSliders size={14} />
          <span>Live Parameter Tuner</span>
        </button>
      </div>

      {/* Tab Body Content */}
      <div className="hub-body-scroll">
        {/* Scenario Description Pill */}
        {device.scenarioDescription && (
          <div className="scenario-info-banner">
            <span className="scenario-info-title mono">{device.scenarioName}:</span>
            <span className="scenario-info-desc">{device.scenarioDescription}</span>
          </div>
        )}

        {/* TAB 1: ROOT CAUSE & AI FIXES */}
        {activeTab === 'EXPLANATION' && (
          <div className="tab-pane-fade">
            <ExplanationCard
              explanation={explanation}
              isLoading={isLoading}
              error={error}
              onRefresh={onTriggerExplanation}
              onOpenKeyModal={onOpenKeyModal}
            />
            <div style={{ marginTop: '16px' }}>
              <DiagnosticInspector diagnosis={diagnosis} />
            </div>
          </div>
        )}

        {/* TAB 2: RF TELEMETRY & SPECTRUM */}
        {activeTab === 'TELEMETRY' && (
          <div className="tab-pane-fade">
            <RFLinkBudgetGauge telemetry={telemetry} />
            <div style={{ marginTop: '16px' }}>
              <DiagnosticInspector diagnosis={diagnosis} />
            </div>
          </div>
        )}

        {/* TAB 3: CAPABILITIES */}
        {activeTab === 'CAPABILITIES' && (
          <div className="tab-pane-fade">
            <CapabilityMatrix deviceCaps={device.capabilities} apCaps={device.apCapabilities} />
            <div style={{ marginTop: '16px' }}>
              <RFLinkBudgetGauge telemetry={telemetry} />
            </div>
          </div>
        )}

        {/* TAB 4: ENGINE HYPOTHESIS SCORES */}
        {activeTab === 'SCORES' && (
          <div className="tab-pane-fade">
            <DiagnosticInspector diagnosis={diagnosis} />
            <div style={{ marginTop: '16px' }}>
              <RFLinkBudgetGauge telemetry={telemetry} />
            </div>
          </div>
        )}

        {/* TAB 5: LIVE PARAMETER TUNER */}
        {activeTab === 'TUNER' && (
          <div className="tab-pane-fade">
            <div className="instrument-section">
              <div className="section-header">
                <span>Interactive Telemetry & Capability Tuner</span>
                <span className="mono" style={{ fontSize: '11px' }}>Drag sliders to test live engine re-scoring</span>
              </div>
              <div className="section-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      RSSI (Received Power): <span className="mono" style={{ color: '#2563EB' }}>{device.telemetry.rssi_dBm} dBm</span>
                    </label>
                    <input
                      type="range"
                      min="-90"
                      max="-30"
                      value={device.telemetry.rssi_dBm}
                      onChange={(e) => handleTweakField('rssi_dBm', parseInt(e.target.value, 10))}
                      style={{ width: '100%' }}
                    />
                    <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>-90 dBm (Weak)</span>
                      <span>-60 dBm (Nominal)</span>
                      <span>-30 dBm (Strong)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Noise Floor: <span className="mono" style={{ color: '#DC2626' }}>{device.telemetry.noiseFloor_dBm} dBm</span>
                    </label>
                    <input
                      type="range"
                      min="-95"
                      max="-45"
                      value={device.telemetry.noiseFloor_dBm}
                      onChange={(e) => handleTweakField('noiseFloor_dBm', parseInt(e.target.value, 10))}
                      style={{ width: '100%' }}
                    />
                    <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>-95 dBm (Clean)</span>
                      <span>-75 dBm (Elevated)</span>
                      <span>-45 dBm (Severe Jamming)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Frame Retransmission Rate: <span className="mono" style={{ color: '#D97706' }}>{device.telemetry.retryRatePct.toFixed(1)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={device.telemetry.retryRatePct}
                      onChange={(e) => handleTweakField('retryRatePct', parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>0% (Clean)</span>
                      <span>10% (Warning)</span>
                      <span>50% (Saturated)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Connected Band:
                    </label>
                    <select
                      className="input-instrument"
                      style={{ width: '100%' }}
                      value={device.telemetry.band}
                      onChange={(e) => handleTweakField('band', e.target.value as WiFiBand)}
                    >
                      <option value="2.4GHz">2.4 GHz (ISM Band)</option>
                      <option value="5GHz">5 GHz (U-NII Band)</option>
                      <option value="6GHz">6 GHz (Wi-Fi 6E/7)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Physical Protocol Standard:
                    </label>
                    <select
                      className="input-instrument"
                      style={{ width: '100%' }}
                      value={device.telemetry.standard}
                      onChange={(e) => handleTweakField('standard', e.target.value as WiFiStandard)}
                    >
                      <option value="802.11n">802.11n (Wi-Fi 4 Legacy)</option>
                      <option value="802.11ac">802.11ac (Wi-Fi 5)</option>
                      <option value="802.11ax">802.11ax (Wi-Fi 6 / 6E)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Tx Link Rate (Mbps):
                    </label>
                    <input
                      type="number"
                      className="input-instrument"
                      style={{ width: '100%' }}
                      value={device.telemetry.txLinkRate_Mbps}
                      onChange={(e) => handleTweakField('txLinkRate_Mbps', parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <RFLinkBudgetGauge telemetry={device.telemetry} />
                </div>
                <div style={{ marginTop: '16px' }}>
                  <DiagnosticInspector diagnosis={diagnosis} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
