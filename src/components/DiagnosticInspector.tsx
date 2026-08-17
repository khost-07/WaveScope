import React from 'react';
import { StructuredDiagnosis } from '../layer1_data/types';
import { IconRule, IconCheckBox, IconAlertTriangle, IconAlertCircle } from './SvgIcons';

interface DiagnosticInspectorProps {
  diagnosis: StructuredDiagnosis;
}

export const DiagnosticInspector: React.FC<DiagnosticInspectorProps> = ({ diagnosis }) => {
  const status = diagnosis.status;

  return (
    <div className="border border-[#E5E5E5] bg-white p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] flex items-center gap-1.5">
          <IconRule size={15} />
          <span>Deterministic Hypothesis Scores (Layer 2)</span>
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
      <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#747878] mb-1">Primary Classified Hypothesis</div>
        <div className="text-[16px] font-bold text-black">{diagnosis.primary_diagnosis}</div>
        <div className="font-mono text-[11px] text-[#444748] mt-1">
          Severity: <strong>{diagnosis.severity}</strong> | Evaluated at: {new Date(diagnosis.evaluated_at).toLocaleTimeString()}
        </div>
      </div>

      {/* Hypothesis Score Bars */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748] mb-2">Evaluated Competing Hypotheses Distribution</div>
        {Object.entries(diagnosis.hypothesis_scores).map(([name, score]) => {
          const isWinner = name === diagnosis.primary_diagnosis;
          const maxScore = Math.max(...Object.values(diagnosis.hypothesis_scores), 100);
          const pct = Math.min(100, Math.round((score / maxScore) * 100));

          return (
            <div key={name} className="flex items-center gap-3 font-mono text-[12px]">
              <span className={`w-64 truncate ${isWinner ? 'font-bold text-black' : 'text-[#444748]'}`}>
                {isWinner ? '▶ ' : '  '}{name}
              </span>
              <div className="hypothesis-bar-track flex-1">
                <div
                  className={`hypothesis-bar-fill ${isWinner ? 'bg-black' : 'bg-[#CBD5E1]'}`}
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
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#444748]">Diagnostic Evidence Base ({diagnosis.evidence.length} Points)</div>
        <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] space-y-1 font-mono text-[11px] text-[#444748]">
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
