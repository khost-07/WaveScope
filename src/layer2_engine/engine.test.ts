/**
 * LAYER 2 ENGINE TEST SUITE
 * Validates diagnostic scoring engine against all 5 controlled scenarios from Section 2.
 * Must pass completely before any UI code is written.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { SIMULATION_SCENARIOS } from '../layer1_data/simulationDataset';
import { runDiagnosticEngine } from './engine';
import { HYPOTHESES } from './rules';

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
