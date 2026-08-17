/**
 * LAYER 2 ENGINE TEST SUITE
 * Validates diagnostic scoring engine against all 5 controlled scenarios
 * and the 3 new capabilities (Peer Corroboration, Dead-Zone Mapping, Trend Detection).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { SIMULATION_SCENARIOS } from '../layer1_data/simulationDataset';
import { runDiagnosticEngine } from './engine';
import { HYPOTHESES } from './rules';
import { evaluatePeerCorroboration } from './peerAnalysis';
import { computeEstimatedCoverage } from './deadZoneMapper';
import { evaluateDeviceTrend } from './trendEngine';

test('Diagnostic Engine - Scenario A: Healthy nominal performance', () => {
  const scenarioA = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'A');
  assert.ok(scenarioA, 'Scenario A should exist');

  const diagnosis = runDiagnosticEngine(scenarioA);

  assert.equal(diagnosis.primary_diagnosis, HYPOTHESES.HEALTHY);
  assert.equal(diagnosis.severity, 'Low');
  assert.equal(diagnosis.status, 'HEALTHY');
  assert.ok(diagnosis.confidence >= 80, 'Healthy scenario should have high confidence');
  assert.ok(diagnosis.evidence.length > 0, 'Must provide structured evidence');
});

test('Diagnostic Engine - Scenario B: Weak / Attenuated Signal', () => {
  const scenarioB = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'B');
  assert.ok(scenarioB, 'Scenario B should exist');

  const diagnosis = runDiagnosticEngine(scenarioB);

  assert.equal(diagnosis.primary_diagnosis, HYPOTHESES.WEAK_SIGNAL);
  assert.equal(diagnosis.severity, 'High');
  assert.equal(diagnosis.status, 'CRITICAL');
  assert.ok(diagnosis.hypothesis_scores[HYPOTHESES.WEAK_SIGNAL] > diagnosis.hypothesis_scores[HYPOTHESES.RF_INTERFERENCE]);
  assert.ok(diagnosis.possible_causes.some(c => c.toLowerCase().includes('distance') || c.toLowerCase().includes('path loss')));
});

test('Diagnostic Engine - Scenario C: Possible RF Interference', () => {
  const scenarioC = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'C');
  assert.ok(scenarioC, 'Scenario C should exist');

  const diagnosis = runDiagnosticEngine(scenarioC);

  assert.equal(diagnosis.primary_diagnosis, HYPOTHESES.RF_INTERFERENCE);
  assert.equal(diagnosis.severity, 'High');
  assert.equal(diagnosis.status, 'CRITICAL');
  assert.ok(diagnosis.hypothesis_scores[HYPOTHESES.RF_INTERFERENCE] > diagnosis.hypothesis_scores[HYPOTHESES.WEAK_SIGNAL]);
  assert.ok(diagnosis.evidence.some(e => e.includes('noise') || e.includes('SNR') || e.includes('RSSI')));
});

test('Diagnostic Engine - Scenario D: Hardware / Capability Limited', () => {
  const scenarioD = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'D');
  assert.ok(scenarioD, 'Scenario D should exist');

  const diagnosis = runDiagnosticEngine(scenarioD);

  assert.equal(diagnosis.primary_diagnosis, HYPOTHESES.HARDWARE_LIMITED);
  assert.equal(diagnosis.severity, 'Medium');
  assert.equal(diagnosis.status, 'ATTENTION');
  assert.ok(diagnosis.evidence.some(e => e.includes('2.4GHz only') || e.includes('802.11n')));
});

test('Diagnostic Engine - Scenario E: Potential Band Selection / Configuration Issue', () => {
  const scenarioE = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'E');
  assert.ok(scenarioE, 'Scenario E should exist');

  const diagnosis = runDiagnosticEngine(scenarioE);

  assert.equal(diagnosis.primary_diagnosis, HYPOTHESES.BAND_SELECTION);
  assert.equal(diagnosis.severity, 'Medium');
  assert.equal(diagnosis.status, 'ATTENTION');
  assert.ok(diagnosis.evidence.some(e => e.includes('2.4GHz') && e.includes('5GHz')));
});

test('Feature 1: Peer-Corroborated Diagnosis Evaluator (Device-Specific vs Shared)', () => {
  const scenarioB = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'B')!;
  const scenarioC = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'C')!;
  const diagnosesMap: Record<string, { status: any; primary_diagnosis: string }> = {};

  for (const d of SIMULATION_SCENARIOS) {
    const diag = runDiagnosticEngine(d);
    diagnosesMap[d.id] = { status: diag.status, primary_diagnosis: diag.primary_diagnosis };
  }

  // Check Scenario B (Device-specific placement issue corroborated by healthy 5GHz peers)
  const peerResultB = evaluatePeerCorroboration(scenarioB, SIMULATION_SCENARIOS, diagnosesMap);
  assert.ok(peerResultB, 'Peer result should exist for multi-device network');
  assert.equal(peerResultB.hasPeers, true);
  assert.equal(peerResultB.verdict, 'DEVICE_SPECIFIC');
  assert.ok(peerResultB.summarySentence.includes('nearby') || peerResultB.summarySentence.includes('device-specific'));
  assert.ok(peerResultB.relevantPeers.length > 0);

  // Check Scenario C (Shared environmental issue corroborated by jammed 2.4GHz peers)
  const peerResultC = evaluatePeerCorroboration(scenarioC, SIMULATION_SCENARIOS, diagnosesMap);
  assert.ok(peerResultC, 'Peer result should exist for Scenario C');
  assert.equal(peerResultC.verdict, 'ENVIRONMENTAL_SHARED');
  assert.ok(peerResultC.summarySentence.includes('Multiple devices'));

  // Single device check: should return null
  const singlePeerResult = evaluatePeerCorroboration(scenarioB, [scenarioB], diagnosesMap);
  assert.equal(singlePeerResult, null, 'Single device should return null to hide peer section');
});

test('Feature 2: Inferred Dead-Zone Mapping (Spatial Distance & Zone Clusters)', () => {
  const scenarioB = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'B')!;
  const diagnosesMap: Record<string, { status: any }> = {};

  for (const d of SIMULATION_SCENARIOS) {
    const diag = runDiagnosticEngine(d);
    diagnosesMap[d.id] = { status: diag.status };
  }

  const coverage = computeEstimatedCoverage(scenarioB, SIMULATION_SCENARIOS, diagnosesMap);

  assert.equal(coverage.markers.length, SIMULATION_SCENARIOS.length);
  assert.equal(coverage.targetZone, 'DEAD_ZONE');
  assert.ok(coverage.zoneDescription.includes('Attenuated') || coverage.zoneDescription.includes('Dead Zone'));
  assert.equal(coverage.targetDistanceMeters, 16.5);
  assert.ok(coverage.environmentNote?.includes('Corner Office 304'));

  const targetMarker = coverage.markers.find(m => m.id === scenarioB.id);
  assert.ok(targetMarker?.isSelected, 'Target marker must be selected');
  assert.ok(targetMarker.positionPercent > 60, 'Weak signal position should be towards edge');
});

test('Feature 3: Trend & Drift Detection Engine (Synthetic History & Direction)', () => {
  // Scenario B should be degrading
  const trendB = evaluateDeviceTrend('device-scenario-b');
  assert.equal(trendB.hasEnoughData, true);
  assert.equal(trendB.direction, 'DEGRADING');
  assert.equal(trendB.symbol, '↓');
  assert.equal(trendB.qualifier, '(degrading)');

  // Peer iPad Pro should be improving
  const trend5G = evaluateDeviceTrend('device-peer-5g');
  assert.equal(trend5G.hasEnoughData, true);
  assert.equal(trend5G.direction, 'IMPROVING');
  assert.equal(trend5G.symbol, '↑');
  assert.equal(trend5G.qualifier, '(improving)');

  // Scenario A should be stable
  const trendA = evaluateDeviceTrend('device-scenario-a');
  assert.equal(trendA.hasEnoughData, true);
  assert.equal(trendA.direction, 'STABLE');
  assert.equal(trendA.symbol, '→');
});
