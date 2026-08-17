import React from 'react';
import { TelemetryRecord } from '../layer1_data/types';
import { IconSignal } from './SvgIcons';

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
    <div className="border border-[#E5E5E5] bg-white p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] flex items-center gap-1.5">
          <IconSignal size={15} />
          <span>RF Physical Link Budget & Spectrum Separation</span>
        </div>
        <span className="font-mono text-[12px] text-black font-bold">
          SNR: <strong style={{ color: isSnrGood ? '#2E7D32' : isSnrMarginal ? '#F57C00' : '#D32F2F' }}>{telemetry.snr_dB} dB</strong>
        </span>
      </div>

      {/* Spectrum Scale Bar */}
      <div className="space-y-2 pt-4 pb-2">
        <div className="relative h-6 bg-[#E2E2E2] border border-[#E5E5E5]">
          {/* SNR span */}
          <div
            className="absolute top-0 bottom-0 bg-black/15 border-x border-black flex items-center justify-center font-mono text-[10px] text-black font-bold overflow-hidden"
            style={{
              left: `${noisePos}%`,
              width: `${snrWidth}%`
            }}
          >
            {telemetry.snr_dB} dB SNR
          </div>

          {/* Noise Marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#D32F2F]"
            style={{ left: `${noisePos}%` }}
            title={`Noise Floor: ${telemetry.noiseFloor_dBm} dBm`}
          />

          {/* RSSI Marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-black"
            style={{ left: `${rssiPos}%` }}
            title={`RSSI: ${telemetry.rssi_dBm} dBm`}
          />
        </div>

        {/* Ticks */}
        <div className="flex justify-between font-mono text-[10px] text-[#747878]">
          <span>-100 dBm (Floor)</span>
          <span>-85 dBm (Nominal Noise)</span>
          <span>-70 dBm (Threshold)</span>
          <span>-55 dBm (Strong)</span>
          <span>-30 dBm (Max)</span>
        </div>
      </div>

      {/* Metric summary footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-[#E5E5E5] font-mono text-[11px]">
        <div className="p-2 bg-[#FAFAFA] border border-[#E5E5E5]">
          <span className="text-[#747878] block text-[10px] uppercase font-bold">Negotiated PHY:</span>
          <span className="font-bold text-black">{telemetry.txLinkRate_Mbps} / {telemetry.rxLinkRate_Mbps} Mbps</span>
        </div>
        <div className="p-2 bg-[#FAFAFA] border border-[#E5E5E5]">
          <span className="text-[#747878] block text-[10px] uppercase font-bold">Modulation / MIMO:</span>
          <span className="font-bold text-black">MCS {telemetry.mcsIndex} ({telemetry.spatialStreams}x{telemetry.spatialStreams})</span>
        </div>
        <div className="p-2 bg-[#FAFAFA] border border-[#E5E5E5]">
          <span className="text-[#747878] block text-[10px] uppercase font-bold">Retransmission Rate:</span>
          <span className="font-bold" style={{ color: telemetry.retryRatePct >= 15 ? '#D32F2F' : 'inherit' }}>
            {telemetry.retryRatePct.toFixed(1)}% Retries
          </span>
        </div>
      </div>
    </div>
  );
};
