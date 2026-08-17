import React from 'react';
import { StructuredDiagnosis } from '../layer1_data/types';
import { StatusBadge } from './StatusBadge';

interface DiagnosticInspectorProps {
  diagnosis: StructuredDiagnosis;
}

export const DiagnosticInspector: React.FC<DiagnosticInspectorProps> = ({ diagnosis }) => {
  return (
    <div className="instrument-section">
      <div className="section-header">
        <span>Layer 2: Deterministic Diagnostic Scoring Result</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <StatusBadge status={diagnosis.status} />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            CONFIDENCE: <strong>{diagnosis.confidence}%</strong>
          </span>
        </div>
      </div>

      <div className="section-body">
        <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
            Primary Diagnosis
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            {diagnosis.primary_diagnosis}
          </div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Severity Rating: <strong>{diagnosis.severity}</strong> | Evaluated at: {new Date(diagnosis.evaluated_at).toLocaleTimeString()}
          </div>
        </div>

        {/* Structured Evidence */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>
            Auditable Evidence Base ({diagnosis.evidence.length} Points)
          </div>
          <ul className="evidence-list">
            {diagnosis.evidence.map((item, idx) => (
              <li key={idx} className="evidence-item">
                <span className="evidence-bullet">[{idx + 1}]</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Possible Causes (Language disciplined) */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>
            Suspected Physical Root-Causes (Hypotheses)
          </div>
          <ul className="evidence-list" style={{ fontFamily: 'var(--font-sans)', fontSize: '12px' }}>
            {diagnosis.possible_causes.map((cause, idx) => (
              <li key={idx} className="evidence-item" style={{ borderBottom: 'none', padding: '2px 0' }}>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>&bull;</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Secondary Contributing Factors */}
        {diagnosis.secondary_factors && diagnosis.secondary_factors.length > 0 && (
          <div style={{ marginBottom: '14px', background: 'var(--bg-surface-inset)', border: '1px solid var(--border-light)', padding: '8px 10px' }}>
            <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>
              Secondary Contributing Factors
            </div>
            {diagnosis.secondary_factors.map((factor, idx) => (
              <div key={idx} className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                - {factor}
              </div>
            ))}
          </div>
        )}

        {/* Hypothesis Score Breakdown */}
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '8px' }}>
            Competing Hypothesis Scoring Distribution
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(diagnosis.hypothesis_scores).map(([name, score]) => {
              const isWinner = name === diagnosis.primary_diagnosis;
              const maxScore = Math.max(...Object.values(diagnosis.hypothesis_scores), 100);
              const pct = Math.min(100, Math.round((score / maxScore) * 100));

              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                  <span style={{ width: '220px', fontWeight: isWinner ? 700 : 400, color: isWinner ? 'var(--text-main)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isWinner ? '> ' : '  '}{name}
                  </span>
                  <div style={{ flex: 1, height: '6px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-light)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: isWinner ? 'var(--border-dark)' : 'var(--border-medium)'
                      }}
                    />
                  </div>
                  <span className="mono" style={{ width: '45px', textAlign: 'right', fontWeight: isWinner ? 700 : 400 }}>
                    {score} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
