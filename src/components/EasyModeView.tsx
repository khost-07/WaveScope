import React, { useMemo } from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { evaluatePeerCorroboration } from '../layer2_engine/peerAnalysis';
import { computeEstimatedCoverage } from '../layer2_engine/deadZoneMapper';
import { DeviceTrend } from '../layer2_engine/trendEngine';
import { mapToEasyMode } from '../layer2_engine/easyModeMapper';
import { FriendlyVisualIndicator } from './FriendlyVisualIndicator';

interface EasyModeViewProps {
  device: ClientDevice;
  allDevices?: ClientDevice[];
  diagnosis: StructuredDiagnosis;
  diagnoses?: Record<string, StructuredDiagnosis>;
  trend?: DeviceTrend;
}

export const EasyModeView: React.FC<EasyModeViewProps> = ({
  device,
  allDevices = [],
  diagnosis,
  diagnoses = {},
  trend
}) => {
  // Derive peer comparison & coverage without displaying technical artifacts
  const peerResult = useMemo(() => {
    return evaluatePeerCorroboration(device, allDevices.length > 0 ? allDevices : [device], diagnoses);
  }, [device, allDevices, diagnoses]);

  const coverageResult = useMemo(() => {
    return computeEstimatedCoverage(device, allDevices.length > 0 ? allDevices : [device], diagnoses);
  }, [device, allDevices, diagnoses]);

  const easyData = useMemo(() => {
    return mapToEasyMode(device, diagnosis, peerResult, trend, coverageResult);
  }, [device, diagnosis, peerResult, trend, coverageResult]);

  const { headline, explanation, peerOrTrendNote, recommendedAction, level, iconType } = easyData;

  return (
    <div className="bg-white border border-[#E2E5E9] rounded-2xl p-7 space-y-6 shadow-panel">
      {/* Device Name Header */}
      <div className="border-b border-[#E2E5E9] pb-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] font-bold block mb-1">
            Selected Device
          </span>
          <h1 className="text-[26px] font-bold text-black tracking-tight">
            {device.hostname}
          </h1>
        </div>

        <FriendlyVisualIndicator level={level} iconType={iconType} size="large" />
      </div>

      {/* Main Friendly Verdict Card */}
      <div
        className="p-6 border rounded-xl bg-[#F8F9FA] space-y-3 shadow-card"
        style={{
          borderLeftWidth: '5px',
          borderLeftColor: level === 'GREAT' ? '#16A34A' : level === 'ATTENTION' ? '#D97706' : '#DC2626',
          backgroundColor: level === 'GREAT' ? 'rgba(22,163,74,0.02)' : level === 'ATTENTION' ? 'rgba(217,119,6,0.02)' : 'rgba(220,38,38,0.02)'
        }}
      >
        <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#6B7280] block mb-1">
          Diagnosis Summary
        </span>

        <h2 className="text-[22px] font-bold text-black leading-snug mb-2 tracking-tight">
          {headline}
        </h2>

        <p className="text-[15.5px] text-[#3B4045] leading-relaxed font-sans mb-1">
          {explanation}
        </p>

        {/* Peer or Trend Context Note in Plain Sentences */}
        {peerOrTrendNote && (
          <div className="p-4 bg-white border border-[#E2E5E9] rounded-lg text-[13.5px] text-black font-medium leading-relaxed mt-3 shadow-subtle">
            💡 {peerOrTrendNote}
          </div>
        )}
      </div>

      {/* Clear Next Action */}
      <div className="p-6 border border-[#E2E5E9] rounded-xl bg-white space-y-3.5 shadow-card">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-6 h-6 rounded-md bg-black text-white font-bold text-[12px] flex items-center justify-center">
            ✓
          </div>
          <h3 className="text-[16px] font-bold text-black">
            What You Can Do
          </h3>
        </div>

        <div className="p-4.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-[15px] font-semibold text-black leading-relaxed shadow-subtle">
          {recommendedAction}
        </div>
      </div>
    </div>
  );
};

