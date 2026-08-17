import React from 'react';
import { StructuredDiagnosis } from '../layer1_data/types';
import { IconRule, IconCheckBox, IconAlertTriangle, IconAlertCircle } from './SvgIcons';

interface DiagnosticInspectorProps {
  diagnosis: StructuredDiagnosis;
}

export const DiagnosticInspector: React.FC<DiagnosticInspectorProps> = ({ diagnosis }) => {
  const status = diagnosis.status;

  return (
    <div className="border border-[#E2E5E9] bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-2 flex-wrap gap-2 mb-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-1.5">
          <IconRule size={15} />
          <span>Deterministic Hypothesis Scoring (Layer 2)</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'HEALTHY' && (
            <span className="badge-status badge-status-healthy flex items-center gap-1">
              <IconCheckBox size={11} />
              HEALTHY
            </span>
          )}
          {status === 'ATTENTION' && (
            <span className="badge-status badge-status-attention flex items-center gap-1">
              <IconAlertTriangle size={11} />
              ATTENTION
            </span>
          )}
          {status === 'CRITICAL' && (
            <span className="badge-status badge-status-critical flex items-center gap-1">
              <IconAlertCircle size={11} />
              CRITICAL
            </span>
          )}
          <span className="font-mono text-[12px] text-black font-bold">{diagnosis.confidence}% Confidence</span>
        </div>
      </div>

      {/* Primary Diagnosis Callout */}
      <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E9]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">Primary Classified Hypothesis</div>
        <div className="text-[16px] font-bold text-black my-1">{diagnosis.primary_diagnosis}</div>
        <div className="font-mono text-[11px] text-[#3B4045] mt-1.5">
          Severity: <strong className="text-black">{diagnosis.severity}</strong> &bull; Evaluated: {new Date(diagnosis.evaluated_at).toLocaleTimeString()}
        </div>
      </div>

      {/* Hypothesis Score Bars */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045] mb-2">Evaluated Competing Hypotheses Distribution</div>
        {Object.entries(diagnosis.hypothesis_scores).map(([name, score]) => {
          const isWinner = name === diagnosis.primary_diagnosis;
          const maxScore = Math.max(...Object.values(diagnosis.hypothesis_scores), 100);
          const pct = Math.min(100, Math.round((score / maxScore) * 100));

          return (
            <div key={name} className="flex items-center gap-3 font-mono text-[12px]">
              <span className={`w-64 truncate ${isWinner ? 'font-bold text-black' : 'text-[#3B4045]'}`}>
                {isWinner ? '▶ ' : '  '}{name}
              </span>
              <div className="hypothesis-bar-track flex-1">
                <div
                  className={`hypothesis-bar-fill ${isWinner ? 'bg-black' : 'bg-[#CBD0D6]'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 text-right font-bold text-black">
                {score} pts
              </span>
            </div>
          );
        })}
      </div>

      {/* Physical Evidence Bullets */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045] mb-1">
          Diagnostic Evidence Base ({diagnosis.evidence.length} Points)
        </div>
        <div className="p-3 bg-[#F8F9FA] border border-[#E2E5E9] space-y-1.5 font-mono text-[11px] text-[#3B4045]">
          {diagnosis.evidence.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-bold text-black flex-shrink-0">[{idx + 1}]</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
