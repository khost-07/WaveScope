import React, { useState } from 'react';
import { ClientDevice, StructuredDiagnosis, WiFiBand, WiFiStandard } from '../layer1_data/types';
import { LLMExplanationResponse } from '../layer3_llm/types';
import { TelemetryPanel } from './TelemetryPanel';
import { CapabilityMatrix } from './CapabilityMatrix';
import { DiagnosticInspector } from './DiagnosticInspector';
import { ExplanationCard } from './ExplanationCard';
import { BandBadge, StatusBadge } from './StatusBadge';

interface ClientDetailProps {
  device: ClientDevice;
  diagnosis: StructuredDiagnosis;
  explanation: LLMExplanationResponse | null;
  isLlmLoading: boolean;
  error?: string | null;
  onUpdateDeviceTelemetry?: (updatedDevice: ClientDevice) => void;
  onTriggerExplanation?: () => void;
  onOpenKeyModal?: () => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({
  device,
  diagnosis,
  explanation,
  isLlmLoading,
  error,
  onUpdateDeviceTelemetry,
  onTriggerExplanation,
  onOpenKeyModal
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DIAGNOSTICS' | 'CAPABILITIES' | 'TWEAK'>('OVERVIEW');

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Device Header Bar */}
      <div className="panel-header" style={{ borderBottom: '1px solid var(--border-medium)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
              {device.hostname}
            </span>
            <BandBadge band={device.telemetry.band} />
            <StatusBadge status={diagnosis.status} />
          </div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            MAC: {device.macAddress} | IP: {device.ipAddress} | VENDOR: {device.vendor}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className={`btn-instrument ${activeTab === 'OVERVIEW' ? 'primary' : ''}`}
            onClick={() => setActiveTab('OVERVIEW')}
          >
            Overview & Telemetry
          </button>
          <button
            type="button"
            className={`btn-instrument ${activeTab === 'DIAGNOSTICS' ? 'primary' : ''}`}
            onClick={() => setActiveTab('DIAGNOSTICS')}
          >
            Layer 2 Engine
          </button>
          <button
            type="button"
            className={`btn-instrument ${activeTab === 'CAPABILITIES' ? 'primary' : ''}`}
            onClick={() => setActiveTab('CAPABILITIES')}
          >
            Capabilities
          </button>
          <button
            type="button"
            className={`btn-instrument ${activeTab === 'TWEAK' ? 'primary' : ''}`}
            onClick={() => setActiveTab('TWEAK')}
          >
            RF Parameter Tuner
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {device.scenarioDescription && (
          <div style={{ margin: '0 16px 16px 16px', padding: '8px 12px', background: 'var(--bg-surface-inset)', border: '1px solid var(--border-light)', fontSize: '12px' }}>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--text-main)', marginRight: '6px' }}>
              {device.scenarioName}:
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {device.scenarioDescription}
            </span>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <>
            <TelemetryPanel telemetry={device.telemetry} />
            <DiagnosticInspector diagnosis={diagnosis} />
            <ExplanationCard
              explanation={explanation}
              isLoading={isLlmLoading}
              error={error}
              onRefresh={onTriggerExplanation}
              onOpenKeyModal={onOpenKeyModal}
            />
          </>
        )}

        {/* Tab 2: Diagnostics Focus */}
        {activeTab === 'DIAGNOSTICS' && (
          <>
            <DiagnosticInspector diagnosis={diagnosis} />
            <ExplanationCard
              explanation={explanation}
              isLoading={isLlmLoading}
              error={error}
              onRefresh={onTriggerExplanation}
              onOpenKeyModal={onOpenKeyModal}
            />
          </>
        )}

        {/* Tab 3: Capabilities */}
        {activeTab === 'CAPABILITIES' && (
          <>
            <CapabilityMatrix deviceCaps={device.capabilities} apCaps={device.apCapabilities} />
            <TelemetryPanel telemetry={device.telemetry} />
          </>
        )}

        {/* Tab 4: Interactive Parameter Tuner */}
        {activeTab === 'TWEAK' && (
          <div className="instrument-section">
            <div className="section-header">
              <span>Interactive Telemetry & Capability Tuner</span>
              <span className="mono" style={{ fontSize: '10.5px' }}>Live re-scoring on parameter change</span>
            </div>
            <div className="section-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    RSSI (dBm): {device.telemetry.rssi_dBm} dBm
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Noise Floor (dBm): {device.telemetry.noiseFloor_dBm} dBm
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Frame Retry Rate (%): {device.telemetry.retryRatePct.toFixed(1)}%
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
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

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <DiagnosticInspector diagnosis={diagnosis} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
