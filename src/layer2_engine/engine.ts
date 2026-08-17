/**
 * LAYER 2: DIAGNOSTIC SCORING ENGINE
 * Deterministic, auditable diagnostic evaluator.
 * Cross-references raw telemetry against hardware capabilities.
 * 
 * GUARANTEES:
 * 1. Zero LLM calls or dependencies.
 * 2. Competing hypotheses scoring model.
 * 3. Transparent evidence and confidence calculation.
 */

import { ClientDevice, StructuredDiagnosis, SeverityLevel, DiagnosticStatus } from '../layer1_data/types';
import {
  HYPOTHESES,
  evaluateWeakSignal,
  evaluateRFInterference,
  evaluateHardwareLimited,
  evaluateBandSelection,
  evaluateHealthy,
  RuleResult
} from './rules';

export function runDiagnosticEngine(device: ClientDevice): StructuredDiagnosis {
  const evaluations: Record<string, RuleResult> = {
    [HYPOTHESES.WEAK_SIGNAL]: evaluateWeakSignal(device),
    [HYPOTHESES.RF_INTERFERENCE]: evaluateRFInterference(device),
    [HYPOTHESES.HARDWARE_LIMITED]: evaluateHardwareLimited(device),
    [HYPOTHESES.BAND_SELECTION]: evaluateBandSelection(device),
    [HYPOTHESES.HEALTHY]: evaluateHealthy(device)
  };

  const hypothesisScores: Record<string, number> = {};
  for (const [key, result] of Object.entries(evaluations)) {
    hypothesisScores[key] = result.score;
  }

  // Sort hypotheses descending by score
  const sorted = Object.entries(evaluations).sort((a, b) => b[1].score - a[1].score);
  const [winnerName, winnerResult] = sorted[0];
  const runnerUp = sorted[1];

  // Secondary contributing factors: non-winning hypotheses with substantial scores (>= 30)
  const secondary_factors: string[] = sorted
    .slice(1)
    .filter(([name, res]) => res.score >= 30 && name !== HYPOTHESES.HEALTHY)
    .map(([name, res]) => `${name} (Score: ${res.score} pts)`);

  // Calculate deterministic confidence score (0-100)
  const scoreMargin = winnerResult.score - (runnerUp ? runnerUp[1].score : 0);
  let confidence = Math.min(96, Math.max(65, Math.round(50 + winnerResult.score * 0.3 + scoreMargin * 0.2)));
  if (winnerName === HYPOTHESES.HEALTHY && winnerResult.score >= 80) {
    confidence = Math.min(98, Math.max(88, confidence));
  }

  // Determine Severity and Status
  let severity: SeverityLevel = 'Low';
  let status: DiagnosticStatus = 'HEALTHY';

  switch (winnerName) {
    case HYPOTHESES.WEAK_SIGNAL:
      severity = (device.telemetry.rssi_dBm <= -75 || device.telemetry.retryRatePct >= 15) ? 'High' : 'Medium';
      status = severity === 'High' ? 'CRITICAL' : 'ATTENTION';
      break;

    case HYPOTHESES.RF_INTERFERENCE:
      severity = (device.telemetry.snr_dB <= 12 || device.telemetry.retryRatePct >= 18) ? 'High' : 'Medium';
      status = severity === 'High' ? 'CRITICAL' : 'ATTENTION';
      break;

    case HYPOTHESES.HARDWARE_LIMITED:
      severity = 'Medium';
      status = 'ATTENTION';
      break;

    case HYPOTHESES.BAND_SELECTION:
      severity = 'Medium';
      status = 'ATTENTION';
      break;

    case HYPOTHESES.HEALTHY:
    default:
      severity = 'Low';
      status = 'HEALTHY';
      break;
  }

  return {
    primary_diagnosis: winnerName,
    severity,
    status,
    confidence,
    evidence: winnerResult.evidence,
    possible_causes: winnerResult.possibleCauses,
    secondary_factors,
    hypothesis_scores: hypothesisScores,
    evaluated_at: Date.now()
  };
}
