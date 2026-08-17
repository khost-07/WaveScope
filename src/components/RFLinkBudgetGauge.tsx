import React from 'react';
import { TelemetryRecord } from '../layer1_data/types';

interface RFLinkBudgetGaugeProps {
  telemetry: TelemetryRecord;
}

export const RFLinkBudgetGauge: React.FC<RFLinkBudgetGaugeProps> = ({ telemetry }) => {
  // Scale range: -100 dBm to -30 dBm
  const minDbm = -100;
  const maxDbm = -30;
  const range = maxDbm - minDbm; // 70 dB

  const getPositionPercent = (dbm: number) => {
    const clamped = Math.max(minDbm, Math.min(maxDbm, dbm));
    return ((clamped - minDbm) / range) * 100;
  };

  const rssiPos = getPositionPercent(telemetry.rssi_dBm);
  const noisePos = getPositionPercent(telemetry.noiseFloor_dBm);
  const snrWidth = Math.max(0, rssiPos - noisePos);

  const isRssiGood = telemetry.rssi_dBm >= -65;
  const isRssiMarginal = telemetry.rssi_dBm < -65 && telemetry.rssi_dBm >= -74;
  const isSnrGood = telemetry.snr_dB >= 25;
  const isSnrMarginal = telemetry.snr_dB < 25 && telemetry.snr_dB >= 15;

  return (
    <div className="rf-gauge-card">
      <div className="rf-gauge-header">
        <div>
          <span className="rf-gauge-title">RF Physical Link Budget & Spectrum Separation</span>
          <span className="rf-gauge-sub mono">
            {telemetry.band} &bull; Channel {telemetry.channel} ({telemetry.channelWidthMHz} MHz) &bull; {telemetry.standard}
          </span>
        </div>
        <div className="rf-snr-badge mono">
          SNR MARGIN: <strong style={{ color: isSnrGood ? '#16A34A' : isSnrMarginal ? '#D97706' : '#DC2626' }}>{telemetry.snr_dB} dB</strong>
        </div>
      </div>

      {/* Visual Spectrum Bar */}
      <div className="rf-bar-wrapper">
        <div className="rf-bar-track">
          {/* Signal to Noise span */}
          <div
            className={`rf-snr-span ${isSnrGood ? 'optimal' : isSnrMarginal ? 'marginal' : 'critical'}`}
            style={{
              left: `${noisePos}%`,
              width: `${snrWidth}%`
            }}
          >
            <span className="snr-span-label mono">{telemetry.snr_dB} dB SNR</span>
          </div>

          {/* Noise Floor Marker */}
          <div
            className="rf-marker noise"
            style={{ left: `${noisePos}%` }}
          >
            <div className="marker-pin" />
            <div className="marker-label mono">
              Noise: {telemetry.noiseFloor_dBm} dBm
            </div>
          </div>

          {/* RSSI Marker */}
          <div
            className={`rf-marker rssi ${isRssiGood ? 'good' : isRssiMarginal ? 'marginal' : 'critical'}`}
            style={{ left: `${rssiPos}%` }}
          >
            <div className="marker-pin" />
            <div className="marker-label mono">
              RSSI: {telemetry.rssi_dBm} dBm
            </div>
          </div>
        </div>

        {/* Ticks and scale labels */}
        <div className="rf-scale-ticks mono">
          <span>-100 dBm (Dead Zone)</span>
          <span>-85 dBm (Nominal Noise)</span>
          <span>-70 dBm (Threshold)</span>
          <span>-55 dBm (Strong)</span>
          <span>-30 dBm (Proximity Max)</span>
        </div>
      </div>

      {/* Mini Telemetry Highlights */}
      <div className="rf-gauge-footer">
        <div className="rf-stat-item">
          <span className="rf-stat-label">Negotiated PHY:</span>
          <span className="rf-stat-val mono">{telemetry.txLinkRate_Mbps} / {telemetry.rxLinkRate_Mbps} Mbps</span>
        </div>
        <div className="rf-stat-item">
          <span className="rf-stat-label">Modulation / Streams:</span>
          <span className="rf-stat-val mono">MCS {telemetry.mcsIndex} ({telemetry.spatialStreams}x{telemetry.spatialStreams} MIMO)</span>
        </div>
        <div className="rf-stat-item">
          <span className="rf-stat-label">Retransmission Rate:</span>
          <span className="rf-stat-val mono" style={{ color: telemetry.retryRatePct >= 15 ? '#DC2626' : telemetry.retryRatePct >= 6 ? '#D97706' : '#16A34A', fontWeight: 700 }}>
            {telemetry.retryRatePct.toFixed(1)}% Retries
          </span>
        </div>
      </div>
    </div>
  );
};
