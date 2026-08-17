import React from 'react';
import { TelemetryRecord } from '../layer1_data/types';

interface RFLinkBudgetGaugeProps {
  telemetry: TelemetryRecord;
}

export const RFLinkBudgetGauge: React.FC<RFLinkBudgetGaugeProps> = ({ telemetry }) => {
  const minDbm = -100;
  const maxDbm = -30;
  const range = maxDbm - minDbm;

  const getPositionPercent = (dbm: number) => {
    const clamped = Math.max(minDbm, Math.min(maxDbm, dbm));
    return ((clamped - minDbm) / range) * 100;
  };

  const rssiPos = getPositionPercent(telemetry.rssi_dBm);
  const noisePos = getPositionPercent(telemetry.noiseFloor_dBm);
  const snrWidth = Math.max(0, rssiPos - noisePos);

  const isSnrGood = telemetry.snr_dB >= 25;
  const isSnrMarginal = telemetry.snr_dB < 25 && telemetry.snr_dB >= 15;

  return (
    <div className="border border-border-subtle bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <h3 className="font-label-caps text-secondary flex items-center">
          <span className="material-symbols-outlined mr-1.5 text-[16px]">stacked_bar_chart</span>
          RF Physical Link Budget & Spectrum Separation
        </h3>
        <span className="font-data-sm text-primary font-bold">
          SNR: <strong style={{ color: isSnrGood ? 'var(--status-healthy)' : isSnrMarginal ? 'var(--status-attention)' : 'var(--status-critical)' }}>{telemetry.snr_dB} dB</strong>
        </span>
      </div>

      {/* Spectrum Scale Bar */}
      <div className="space-y-2 pt-4 pb-2">
        <div className="relative h-6 bg-surface-highest border border-border-subtle">
          {/* SNR span */}
          <div
            className="absolute top-0 bottom-0 bg-primary/20 border-x border-primary flex items-center justify-center font-data-sm text-[10px] text-primary font-bold overflow-hidden"
            style={{
              left: `${noisePos}%`,
              width: `${snrWidth}%`
            }}
          >
            {telemetry.snr_dB} dB SNR
          </div>

          {/* Noise Marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-status-critical"
            style={{ left: `${noisePos}%` }}
            title={`Noise Floor: ${telemetry.noiseFloor_dBm} dBm`}
          />

          {/* RSSI Marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-primary"
            style={{ left: `${rssiPos}%` }}
            title={`RSSI: ${telemetry.rssi_dBm} dBm`}
          />
        </div>

        {/* Ticks */}
        <div className="flex justify-between font-data-sm text-[10px] text-muted">
          <span>-100 dBm (Floor)</span>
          <span>-85 dBm (Nominal Noise)</span>
          <span>-70 dBm (Threshold)</span>
          <span>-55 dBm (Strong)</span>
          <span>-30 dBm (Max)</span>
        </div>
      </div>

      {/* Metric summary footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-border-subtle font-data-sm text-[11px]">
        <div className="p-2 bg-surface-offset border border-border-subtle">
          <span className="text-muted block">Negotiated PHY:</span>
          <span className="font-bold text-primary">{telemetry.txLinkRate_Mbps} / {telemetry.rxLinkRate_Mbps} Mbps</span>
        </div>
        <div className="p-2 bg-surface-offset border border-border-subtle">
          <span className="text-muted block">Modulation / MIMO:</span>
          <span className="font-bold text-primary">MCS {telemetry.mcsIndex} ({telemetry.spatialStreams}x{telemetry.spatialStreams})</span>
        </div>
        <div className="p-2 bg-surface-offset border border-border-subtle">
          <span className="text-muted block">Retransmission Rate:</span>
          <span className="font-bold" style={{ color: telemetry.retryRatePct >= 15 ? 'var(--status-critical)' : 'inherit' }}>
            {telemetry.retryRatePct.toFixed(1)}% Retries
          </span>
        </div>
      </div>
    </div>
  );
};
