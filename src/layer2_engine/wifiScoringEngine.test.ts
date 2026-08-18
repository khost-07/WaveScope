import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreWifiNetwork, rankAndCompareNetworks, getSimulatedNearbyNetworks } from './wifiScoringEngine';
import { NearbyNetwork } from '../layer1_data/nearbyWifiTypes';

test('WQI Engine - Scoring 6GHz Wi-Fi 7 network with clean airwaves', () => {
  const net: NearbyNetwork = {
    ssid: 'Test-6GHz-Ultra',
    bssid: 'AA:BB:CC:11:22:33',
    signalPct: 95,
    rssi_dBm: -42,
    band: '6GHz',
    channel: 69,
    radioType: '802.11be',
    authentication: 'WPA3-Personal',
    encryption: 'CCMP',
    channelUtilizationPct: 8,
    connectedStationsCount: 2,
    isSavedProfile: true,
    isConnected: false,
    vendor: 'Ubiquiti Inc.'
  };

  const score = scoreWifiNetwork(net);

  assert.ok(score.totalScore >= 90, `Score should be >= 90, got ${score.totalScore}`);
  assert.equal(score.grade, 'A+');
  assert.equal(score.bandScore, 25);
  assert.equal(score.standardScore, 12);
  assert.equal(score.securityScore, 8);
  assert.ok(score.recommendationReasons.length >= 2);
});

test('WQI Engine - Scoring 2.4GHz legacy network with heavy congestion', () => {
  const net: NearbyNetwork = {
    ssid: 'Test-2.4G-Crowded',
    bssid: '11:22:33:44:55:66',
    signalPct: 40,
    rssi_dBm: -80,
    band: '2.4GHz',
    channel: 6,
    radioType: '802.11n',
    authentication: 'Open',
    encryption: 'None',
    channelUtilizationPct: 85,
    connectedStationsCount: 30,
    isSavedProfile: false,
    isConnected: false,
    vendor: 'Legacy AP'
  };

  const score = scoreWifiNetwork(net);

  assert.ok(score.totalScore < 50, `Score should be < 50 for poor network, got ${score.totalScore}`);
  assert.ok(score.grade === 'C' || score.grade === 'D' || score.grade === 'F');
  assert.equal(score.bandScore, 10);
  assert.equal(score.securityScore, 1);
  assert.ok(score.congestionScore <= 5);
});

test('WQI Engine - Simulated Nearby Networks ranking & comparison', () => {
  const currentSsid = 'VITC-EVENT';
  const simulatedNets = getSimulatedNearbyNetworks(currentSsid);

  assert.equal(simulatedNets.length, 7, 'Should have 7 surrounding networks in simulation testbed');

  const result = rankAndCompareNetworks(simulatedNets, currentSsid);

  assert.ok(result.networks.length === 7);
  assert.ok(result.bestNetwork, 'Should have identified a best network');
  assert.equal(result.bestNetwork?.rank, 1);
  assert.ok(result.bestNetwork?.score.totalScore >= 90, 'Best network should score high');
  assert.ok(result.comparisonSummary.length > 0, 'Should generate plain-language comparison');

  // Verify networks are sorted in descending order of total score
  for (let i = 0; i < result.networks.length - 1; i++) {
    assert.ok(
      result.networks[i].score.totalScore >= result.networks[i + 1].score.totalScore,
      `Network at rank ${i + 1} (${result.networks[i].score.totalScore}) should be >= rank ${i + 2} (${result.networks[i + 1].score.totalScore})`
    );
  }
});
