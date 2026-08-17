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
import { recordDeviceSample, evaluateDeviceTrend } from './trendEngine';

test('Diagnostic Engine - Scenario A: Healthy nominal performance', () => {
  const scenarioA = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'A');
  assert.ok(scenarioA, 'Scenario A should exist');

  const diagnosis = runDiagnosticEngine(scenarioA);

  console.log('\n--- Scenario A Diagnosis ---');
  console.log('Primary:', diagnosis.primary_diagnosis);
  console.log('Severity:', diagnosis.severity);
  console.log('Confidence:', diagnosis.confidence + '%');
  console.log('Scores:', JSON.stringify(diagnosis.hypothesis_scores));
  console.log('Evidence:', diagnosis.evidence);

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

  console.log('\n--- Scenario B Diagnosis ---');
  console.log('Primary:', diagnosis.primary_diagnosis);
  console.log('Severity:', diagnosis.severity);
  console.log('Confidence:', diagnosis.confidence + '%');
  console.log('Scores:', JSON.stringify(diagnosis.hypothesis_scores));
  console.log('Evidence:', diagnosis.evidence);

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

  console.log('\n--- Scenario C Diagnosis ---');
  console.log('Primary:', diagnosis.primary_diagnosis);
  console.log('Severity:', diagnosis.severity);
  console.log('Confidence:', diagnosis.confidence + '%');
  console.log('Scores:', JSON.stringify(diagnosis.hypothesis_scores));
  console.log('Evidence:', diagnosis.evidence);

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

  console.log('\n--- Scenario D Diagnosis ---');
  console.log('Primary:', diagnosis.primary_diagnosis);
  console.log('Severity:', diagnosis.severity);
  console.log('Confidence:', diagnosis.confidence + '%');
  console.log('Scores:', JSON.stringify(diagnosis.hypothesis_scores));
  console.log('Evidence:', diagnosis.evidence);

  assert.equal(diagnosis.primary_diagnosis, HYPOTHESES.HARDWARE_LIMITED);
  assert.equal(diagnosis.severity, 'Medium');
  assert.equal(diagnosis.status, 'ATTENTION');
  assert.ok(diagnosis.evidence.some(e => e.includes('2.4GHz only') || e.includes('802.11n')));
});

test('Diagnostic Engine - Scenario E: Potential Band Selection / Configuration Issue', () => {
  const scenarioE = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'E');
  assert.ok(scenarioE, 'Scenario E should exist');

  const diagnosis = runDiagnosticEngine(scenarioE);

  console.log('\n--- Scenario E Diagnosis ---');
  console.log('Primary:', diagnosis.primary_diagnosis);
  console.log('Severity:', diagnosis.severity);
  console.log('Confidence:', diagnosis.confidence + '%');
  console.log('Scores:', JSON.stringify(diagnosis.hypothesis_scores));
  console.log('Evidence:', diagnosis.evidence);

  assert.equal(diagnosis.primary_diagnosis, HYPOTHESES.BAND_SELECTION);
  assert.equal(diagnosis.severity, 'Medium');
  assert.equal(diagnosis.status, 'ATTENTION');
  assert.ok(diagnosis.evidence.some(e => e.includes('2.4GHz') && e.includes('5GHz')));
});

test('Feature 1: Peer-Corroborated Diagnosis Evaluator', () => {
  const scenarioB = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'B')!;
  const diagnosesMap = {
    'device-scenario-a': { status: 'HEALTHY' as const, primary_diagnosis: 'Healthy' },
    'device-scenario-b': { status: 'CRITICAL' as const, primary_diagnosis: 'Weak / Attenuated Signal' },
    'device-scenario-c': { status: 'CRITICAL' as const, primary_diagnosis: 'Possible RF Interference' }
  };

  const peerResult = evaluatePeerCorroboration(scenarioB, SIMULATION_SCENARIOS, diagnosesMap);

  assert.ok(peerResult, 'Peer result should exist for multi-device network');
  assert.equal(peerResult.hasPeers, true);
  assert.equal(peerResult.verdict, 'DEVICE_SPECIFIC');
  assert.ok(peerResult.summarySentence.includes('nearby device') || peerResult.summarySentence.includes('device-specific'));
  assert.ok(peerResult.relevantPeers.length > 0);

  // Single device check: should return null
  const singlePeerResult = evaluatePeerCorroboration(scenarioB, [scenarioB], diagnosesMap);
  assert.equal(singlePeerResult, null, 'Single device should return null to hide peer section');
});

test('Feature 2: Inferred Dead-Zone Mapping', () => {
  const scenarioB = SIMULATION_SCENARIOS.find(s => s.scenarioId === 'B')!;
  const diagnosesMap = {
    'device-scenario-a': { status: 'HEALTHY' as const },
    'device-scenario-b': { status: 'CRITICAL' as const }
  };

  const coverage = computeEstimatedCoverage(scenarioB, SIMULATION_SCENARIOS, diagnosesMap);

  assert.ok(coverage.markers.length === SIMULATION_SCENARIOS.length);
  assert.equal(coverage.targetZone, 'DEAD_ZONE');
  assert.ok(coverage.zoneDescription.includes('attenuated') || coverage.zoneDescription.includes('dead zone'));
  const targetMarker = coverage.markers.find(m => m.id === scenarioB.id);
  assert.ok(targetMarker?.isSelected, 'Target marker must be selected');
  assert.ok(targetMarker.positionPercent > 60, 'Weak signal position should be towards edge');
});

test('Feature 3: Trend & Drift Detection Engine', () => {
  const testDevId = 'test-trend-device';

  // Record degrading trend
  recordDeviceSample(testDevId, -50, 35, 1);
  recordDeviceSample(testDevId, -58, 28, 5);
  recordDeviceSample(testDevId, -72, 14, 18);
  recordDeviceSample(testDevId, -78, 10, 24);

  const trend = evaluateDeviceTrend(testDevId);

  assert.equal(trend.hasEnoughData, true);
  assert.equal(trend.direction, 'DEGRADING');
  assert.equal(trend.symbol, '↓');
  assert.equal(trend.qualifier, '(degrading)');
  assert.ok(trend.sparklinePoints.length >= 3);
});
