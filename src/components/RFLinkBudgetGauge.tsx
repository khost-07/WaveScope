import React from 'react';
import { TelemetryRecord } from '../layer1_data/types';
import { IconRfSignalWave } from './SvgIcons';

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
    <div className="border border-[#E2E5E9] rounded-2xl bg-white p-6 space-y-5 shadow-panel">
      <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-3 flex-wrap gap-2">
        <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center">
            <IconRfSignalWave size={14} />
          </div>
          <span>RF Physical Link Budget & Spectrum Separation</span>
        </div>
        <span className="font-mono text-[12px] text-black font-bold bg-[#F8F9FA] px-3 py-1 rounded-md border border-[#E2E5E9]">
          SNR Margin:{' '}
          <strong style={{ color: isSnrGood ? '#16A34A' : isSnrMarginal ? '#D97706' : '#DC2626' }}>
            {telemetry.snr_dB} dB
          </strong>
        </span>
      </div>

      {/* Spectrum Scale Bar */}
      <div className="space-y-2.5 pt-2 pb-1">
        <div className="relative h-8 bg-[#F0F2F5] border border-[#CBD0D6] rounded-xl overflow-hidden shadow-inner">
          {/* SNR span */}
          <div
            className="absolute top-0 bottom-0 bg-black/10 border-x border-[#0F1113]/30 flex items-center justify-center font-mono text-[10.5px] text-black font-bold overflow-hidden"
            style={{
              left: `${noisePos}%`,
              width: `${snrWidth}%`
            }}
          >
            {telemetry.snr_dB} dB SNR Margin
          </div>

          {/* Noise Marker */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-[#DC2626] z-10 shadow-xs"
            style={{ left: `${noisePos}%` }}
            title={`Noise Floor: ${telemetry.noiseFloor_dBm} dBm`}
          />

          {/* RSSI Marker */}
          <div
            className="absolute top-0 bottom-0 w-2 bg-[#0F1113] z-20 shadow-md"
            style={{ left: `${rssiPos}%` }}
            title={`RSSI: ${telemetry.rssi_dBm} dBm`}
          />
        </div>

        {/* Ticks */}
        <div className="flex justify-between font-mono text-[10.5px] text-[#6B7280]">
          <span>-100 dBm (Floor)</span>
          <span>-85 dBm (Nominal Noise)</span>
          <span>-70 dBm (Threshold)</span>
          <span>-55 dBm (Strong)</span>
          <span>-30 dBm (Max)</span>
        </div>
      </div>

      {/* Metric summary footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-[#E2E5E9] font-mono text-[11px]">
        <div className="p-4 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl shadow-subtle hover:shadow-panel transition-all">
          <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider mb-1">Negotiated Link Rate</span>
          <span className="font-bold text-black text-[15px]">{telemetry.txLinkRate_Mbps} / {telemetry.rxLinkRate_Mbps} Mbps</span>
        </div>
        <div className="p-4 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl shadow-subtle hover:shadow-panel transition-all">
          <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider mb-1">Modulation & Streams</span>
          <span className="font-bold text-black text-[15px]">MCS {telemetry.mcsIndex} ({telemetry.spatialStreams}x{telemetry.spatialStreams} MIMO)</span>
        </div>
        <div className="p-4 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl shadow-subtle hover:shadow-panel transition-all">
          <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider mb-1">Retransmission Rate</span>
          <span className="font-bold text-[15px]" style={{ color: telemetry.retryRatePct >= 15 ? '#DC2626' : '#0F1113' }}>
            {telemetry.retryRatePct.toFixed(1)}% Retries
          </span>
        </div>
      </div>
    </div>
  );
};

