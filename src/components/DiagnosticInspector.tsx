import React from 'react';
import { StructuredDiagnosis } from '../layer1_data/types';

interface DiagnosticInspectorProps {
  diagnosis: StructuredDiagnosis;
}

export const DiagnosticInspector: React.FC<DiagnosticInspectorProps> = ({ diagnosis }) => {
  const status = diagnosis.status;

  return (
    <div className="border border-border-subtle bg-surface p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <h3 className="font-label-caps text-secondary flex items-center">
          <span className="material-symbols-outlined mr-1.5 text-[16px]">analytics</span>
          Deterministic Hypothesis Scores (Layer 2)
        </h3>
        <div className="flex items-center gap-2">
          {status === 'HEALTHY' && (
            <span className="badge-status badge-status-healthy">HEALTHY</span>
          )}
          {status === 'ATTENTION' && (
            <span className="badge-status badge-status-attention">ATTENTION</span>
          )}
          {status === 'CRITICAL' && (
            <span className="badge-status badge-status-critical">CRITICAL</span>
          )}
          <span className="font-data-sm text-primary font-bold">{diagnosis.confidence}% Confidence</span>
        </div>
      </div>

      {/* Primary Diagnosis Callout */}
      <div className="p-3 bg-surface-offset border border-border-subtle">
        <div className="font-label-caps text-muted text-[10px] mb-1">Primary Classified Hypothesis</div>
        <div className="font-headline-md text-primary text-[16px] font-bold">{diagnosis.primary_diagnosis}</div>
        <div className="font-data-sm text-secondary mt-1">
          Severity: <strong>{diagnosis.severity}</strong> | Evaluated at: {new Date(diagnosis.evaluated_at).toLocaleTimeString()}
        </div>
      </div>

      {/* Hypothesis Score Bars */}
      <div className="space-y-2">
        <div className="font-label-caps text-secondary mb-2">Evaluated Competing Hypotheses Distribution</div>
        {Object.entries(diagnosis.hypothesis_scores).map(([name, score]) => {
          const isWinner = name === diagnosis.primary_diagnosis;
          const maxScore = Math.max(...Object.values(diagnosis.hypothesis_scores), 100);
          const pct = Math.min(100, Math.round((score / maxScore) * 100));

          return (
            <div key={name} className="flex items-center gap-3 font-data-sm text-[12px]">
              <span className={`w-64 truncate ${isWinner ? 'font-bold text-primary' : 'text-secondary'}`}>
                {isWinner ? '▶ ' : '  '}{name}
              </span>
              <div className="hypothesis-bar-track flex-1">
                <div
                  className={`hypothesis-bar-fill ${isWinner ? 'bg-primary' : 'bg-muted'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 text-right font-bold text-primary">
                {score} pts
              </span>
            </div>
          );
        })}
      </div>

      {/* Physical Evidence Bullets */}
      <div className="space-y-2">
        <div className="font-label-caps text-secondary">Diagnostic Evidence Base ({diagnosis.evidence.length} Points)</div>
        <div className="p-3 bg-surface-offset border border-border-subtle space-y-1 font-data-sm text-secondary">
          {diagnosis.evidence.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-bold text-primary flex-shrink-0">[{idx + 1}]</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
