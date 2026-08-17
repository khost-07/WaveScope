import React from 'react';
import { TelemetryRecord } from '../layer1_data/types';

interface TelemetryPanelProps {
  telemetry: TelemetryRecord;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetry }) => {
  return (
    <div className="instrument-section">
      <div className="section-header">
        <span>Raw Physical & Link Layer Telemetry</span>
        <span className="mono" style={{ fontSize: '10.5px' }}>CH {telemetry.channel} // {telemetry.channelWidthMHz} MHz // {telemetry.standard}</span>
      </div>

      <div className="telemetry-grid" style={{ margin: 0, border: 'none' }}>
        <div className="telemetry-cell">
          <div className="telemetry-cell-label">Received Power (RSSI)</div>
          <div className="telemetry-cell-val" style={{ color: telemetry.rssi_dBm <= -75 ? 'var(--rf-critical-text)' : telemetry.rssi_dBm <= -70 ? 'var(--rf-attention-text)' : 'var(--text-main)' }}>
            {telemetry.rssi_dBm} <span className="telemetry-cell-unit">dBm</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Nominal: &ge; -65 dBm
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-label">Noise Floor</div>
          <div className="telemetry-cell-val" style={{ color: telemetry.noiseFloor_dBm >= -70 ? 'var(--rf-critical-text)' : 'var(--text-main)' }}>
            {telemetry.noiseFloor_dBm} <span className="telemetry-cell-unit">dBm</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Nominal: &le; -85 dBm
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-label">Signal-to-Noise (SNR)</div>
          <div className="telemetry-cell-val" style={{ color: telemetry.snr_dB <= 12 ? 'var(--rf-critical-text)' : telemetry.snr_dB <= 20 ? 'var(--rf-attention-text)' : 'var(--text-main)' }}>
            {telemetry.snr_dB} <span className="telemetry-cell-unit">dB</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Nominal: &ge; 25 dB
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-label">Frame Retry Rate</div>
          <div className="telemetry-cell-val" style={{ color: telemetry.retryRatePct >= 15 ? 'var(--rf-critical-text)' : telemetry.retryRatePct >= 8 ? 'var(--rf-attention-text)' : 'var(--text-main)' }}>
            {telemetry.retryRatePct.toFixed(1)} <span className="telemetry-cell-unit">%</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Nominal: &le; 5.0%
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-label">Tx Negotiated PHY</div>
          <div className="telemetry-cell-val">
            {telemetry.txLinkRate_Mbps} <span className="telemetry-cell-unit">Mbps</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            MCS Index: {telemetry.mcsIndex}
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-label">Rx Negotiated PHY</div>
          <div className="telemetry-cell-val">
            {telemetry.rxLinkRate_Mbps} <span className="telemetry-cell-unit">Mbps</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Spatial Streams: {telemetry.spatialStreams}x{telemetry.spatialStreams}
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-label">Packet Loss Rate</div>
          <div className="telemetry-cell-val" style={{ color: telemetry.packetLossPct >= 3 ? 'var(--rf-critical-text)' : 'var(--text-main)' }}>
            {telemetry.packetLossPct.toFixed(1)} <span className="telemetry-cell-unit">%</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Nominal: &le; 0.5%
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-label">Max Hardware Ceiling</div>
          <div className="telemetry-cell-val">
            {telemetry.maxSupportedPhy_Mbps} <span className="telemetry-cell-unit">Mbps</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Device PHY limit
          </div>
        </div>
      </div>
    </div>
  );
};
