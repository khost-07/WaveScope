/**
 * WI-FI QUALITY INDEX (WQI) DETERMINISTIC SCORING ENGINE
 * Evaluates RF signal strength, band spectrum, channel congestion, protocol generation,
 * and security integrity to deterministically rank reachable Wi-Fi networks and pick the best one.
 */

import { NearbyNetwork, WifiQualityScore, ScoredNetwork, NearbyNetworksScanResult } from '../layer1_data/nearbyWifiTypes';

export function scoreWifiNetwork(network: NearbyNetwork): WifiQualityScore {
  let signalScore = 0;
  let bandScore = 0;
  let congestionScore = 0;
  let standardScore = 0;
  let securityScore = 0;
  const reasons: string[] = [];

  // 1. Signal Quality & RSSI (Max 35 pts)
  // RSSI typically ranges from -30 (excellent) to -90 (unusable)
  const rssi = network.rssi_dBm;
  if (rssi >= -50) {
    signalScore = 35;
    reasons.push(`Pristine signal strength (${rssi} dBm / ${network.signalPct}%)`);
  } else if (rssi >= -65) {
    signalScore = 28;
    reasons.push(`Strong signal reception (${rssi} dBm)`);
  } else if (rssi >= -75) {
    signalScore = 18;
    reasons.push(`Moderate signal (${rssi} dBm)`);
  } else if (rssi >= -85) {
    signalScore = 8;
  } else {
    signalScore = 2;
  }

  // 2. Frequency Band & Spectrum Width (Max 25 pts)
  if (network.band === '6GHz') {
    bandScore = 25;
    reasons.push('Ultra-fast 6GHz Wi-Fi 6E/7 spectrum with 160MHz wide channels');
  } else if (network.band === '5GHz') {
    bandScore = 22;
    reasons.push('High-bandwidth 5GHz frequency band with low interference');
  } else {
    bandScore = 10;
    reasons.push('Legacy 2.4GHz band (narrower spectrum, higher wall penetration)');
  }

  // 3. Channel Utilization & Congestion (Max 20 pts)
  const util = network.channelUtilizationPct;
  if (util <= 20) {
    congestionScore = 20;
    reasons.push(`Very clean airwaves (${util}% channel load on Ch ${network.channel})`);
  } else if (util <= 40) {
    congestionScore = 16;
    reasons.push(`Moderate channel load (${util}% utilization)`);
  } else if (util <= 65) {
    congestionScore = 9;
  } else {
    congestionScore = 3;
  }

  // 4. Protocol Standard Generation (Max 12 pts)
  const radio = network.radioType.toLowerCase();
  if (radio.includes('802.11be') || radio.includes('wifi 7') || radio.includes('wi-fi 7')) {
    standardScore = 12;
    reasons.push('Next-generation Wi-Fi 7 (802.11be) multi-link operation support');
  } else if (radio.includes('802.11ax') || radio.includes('wifi 6') || radio.includes('wi-fi 6')) {
    standardScore = 10;
    reasons.push('High-efficiency Wi-Fi 6 (802.11ax) OFDMA modulation');
  } else if (radio.includes('802.11ac') || radio.includes('wifi 5')) {
    standardScore = 7;
    reasons.push('Wi-Fi 5 (802.11ac) Gigabit standard');
  } else {
    standardScore = 3;
  }

  // 5. Security & Authentication (Max 8 pts)
  const auth = network.authentication.toLowerCase();
  if (auth.includes('wpa3')) {
    securityScore = 8;
    reasons.push('Maximum WPA3-SAE encrypted security');
  } else if (auth.includes('wpa2') || auth.includes('enterprise')) {
    securityScore = 7;
    reasons.push('Secure WPA2-AES encryption');
  } else if (auth.includes('open') || auth.includes('none')) {
    securityScore = 1;
    reasons.push('Open / Unencrypted network (use VPN)');
  } else {
    securityScore = 4;
  }

  const totalScore = Math.min(100, Math.max(0, signalScore + bandScore + congestionScore + standardScore + securityScore));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (totalScore >= 92) grade = 'A+';
  else if (totalScore >= 82) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 55) grade = 'C';
  else if (totalScore >= 40) grade = 'D';

  // Calculate throughput multiplier relative to average 2.4GHz network
  const basePhy = network.band === '6GHz' ? 2400 : network.band === '5GHz' ? 1200 : 300;
  const signalFactor = Math.max(0.2, (network.signalPct / 100));
  const utilPenalty = (100 - network.channelUtilizationPct) / 100;
  const estimatedThroughput = basePhy * signalFactor * utilPenalty;
  const throughputMultiplier = parseFloat((estimatedThroughput / 150).toFixed(1));

  return {
    totalScore,
    signalScore,
    bandScore,
    congestionScore,
    standardScore,
    securityScore,
    grade,
    isBest: false,
    recommendationReasons: reasons.slice(0, 3),
    throughputMultiplier: Math.max(0.5, throughputMultiplier)
  };
}

export function rankAndCompareNetworks(
  rawNetworks: NearbyNetwork[],
  currentConnectedSsid: string | null
): NearbyNetworksScanResult {
  if (!rawNetworks || rawNetworks.length === 0) {
    return {
      timestamp: Date.now(),
      isReal: false,
      currentConnectedSsid,
      networks: [],
      bestNetwork: null,
      comparisonSummary: 'No reachable Wi-Fi networks found in the local environment.'
    };
  }

  // Deduplicate by SSID, taking the strongest BSSID for each SSID
  const ssidMap = new Map<string, NearbyNetwork>();
  for (const net of rawNetworks) {
    const existing = ssidMap.get(net.ssid);
    if (!existing || net.signalPct > existing.signalPct) {
      ssidMap.set(net.ssid, net);
    }
  }

  const dedupedNetworks = Array.from(ssidMap.values());

  const scored: ScoredNetwork[] = dedupedNetworks.map(net => {
    const score = scoreWifiNetwork(net);
    return {
      ...net,
      isConnected: Boolean(currentConnectedSsid && net.ssid.toLowerCase() === currentConnectedSsid.toLowerCase()),
      score,
      rank: 0
    };
  });

  // Sort descending by total score, then by signal strength
  scored.sort((a, b) => {
    if (b.score.totalScore !== a.score.totalScore) {
      return b.score.totalScore - a.score.totalScore;
    }
    return b.signalPct - a.signalPct;
  });

  // Assign ranks
  scored.forEach((net, idx) => {
    net.rank = idx + 1;
    if (idx === 0) {
      net.score.isBest = true;
    }
  });

  const bestNetwork = scored[0] || null;
  const currentNetwork = scored.find(n => n.isConnected) || null;

  let comparisonSummary = '';
  if (bestNetwork) {
    if (currentNetwork && currentNetwork.ssid === bestNetwork.ssid) {
      comparisonSummary = `You are currently connected to "${bestNetwork.ssid}", which is the optimal network in your area (Score: ${bestNetwork.score.totalScore}/100, Grade ${bestNetwork.score.grade}).`;
    } else if (currentNetwork) {
      const scoreDiff = bestNetwork.score.totalScore - currentNetwork.score.totalScore;
      const speedDiff = Math.max(1.1, bestNetwork.score.throughputMultiplier / Math.max(0.5, currentNetwork.score.throughputMultiplier)).toFixed(1);
      comparisonSummary = `Switching from "${currentNetwork.ssid}" to "${bestNetwork.ssid}" offers +${scoreDiff} pts higher Wi-Fi quality and an estimated ${speedDiff}x throughput boost with lower channel contention.`;
    } else {
      comparisonSummary = `"${bestNetwork.ssid}" is the #1 recommended Wi-Fi network nearby (${bestNetwork.band} ${bestNetwork.radioType}, Score: ${bestNetwork.score.totalScore}/100).`;
    }
  }

  return {
    timestamp: Date.now(),
    isReal: true,
    currentConnectedSsid,
    networks: scored,
    bestNetwork,
    comparisonSummary
  };
}

/**
 * Controlled 7-Network Surrounding Testbed for Simulation Mode
 */
export function getSimulatedNearbyNetworks(currentConnectedSsid = 'VITC-EVENT'): NearbyNetwork[] {
  return [
    {
      ssid: 'AeroMesh-Pro-5G',
      bssid: '58:56:9F:A1:00:12',
      signalPct: 96,
      rssi_dBm: -42,
      band: '5GHz',
      channel: 36,
      radioType: '802.11ax (Wi-Fi 6)',
      authentication: 'WPA3-Personal',
      encryption: 'CCMP',
      channelUtilizationPct: 18,
      connectedStationsCount: 3,
      isSavedProfile: true,
      isConnected: currentConnectedSsid === 'AeroMesh-Pro-5G',
      vendor: 'Cisco / Enterprise AP'
    },
    {
      ssid: 'VITC-EVENT',
      bssid: 'F0:6F:CE:70:B8:A6',
      signalPct: 100,
      rssi_dBm: -46,
      band: '2.4GHz',
      channel: 8,
      radioType: '802.11ax (Wi-Fi 6)',
      authentication: 'WPA2-Personal',
      encryption: 'CCMP',
      channelUtilizationPct: 44,
      connectedStationsCount: 8,
      isSavedProfile: true,
      isConnected: currentConnectedSsid === 'VITC-EVENT',
      vendor: 'Ruijie / Enterprise Wi-Fi'
    },
    {
      ssid: 'Campus-Ultra-6GHz',
      bssid: 'AC:DE:48:88:21:40',
      signalPct: 75,
      rssi_dBm: -64,
      band: '6GHz',
      channel: 69,
      radioType: '802.11be (Wi-Fi 7)',
      authentication: 'WPA3-Enterprise',
      encryption: 'GCMP-256',
      channelUtilizationPct: 8,
      connectedStationsCount: 2,
      isSavedProfile: false,
      isConnected: currentConnectedSsid === 'Campus-Ultra-6GHz',
      vendor: 'Aruba / HPE Networks'
    },
    {
      ssid: 'Office-Fast-5G',
      bssid: '2C:AB:46:12:89:FE',
      signalPct: 88,
      rssi_dBm: -52,
      band: '5GHz',
      channel: 149,
      radioType: '802.11ac (Wi-Fi 5)',
      authentication: 'WPA2-Personal',
      encryption: 'CCMP',
      channelUtilizationPct: 32,
      connectedStationsCount: 6,
      isSavedProfile: true,
      isConnected: currentConnectedSsid === 'Office-Fast-5G',
      vendor: 'Ubiquiti UniFi 6 Pro'
    },
    {
      ssid: 'Cafe-Public-Open',
      bssid: '7A:57:E8:0D:98:F8',
      signalPct: 90,
      rssi_dBm: -50,
      band: '5GHz',
      channel: 44,
      radioType: '802.11ac (Wi-Fi 5)',
      authentication: 'Open',
      encryption: 'None',
      channelUtilizationPct: 58,
      connectedStationsCount: 14,
      isSavedProfile: false,
      isConnected: currentConnectedSsid === 'Cafe-Public-Open',
      vendor: 'Netgear Nighthawk'
    },
    {
      ssid: 'Legacy-IoT-Hub',
      bssid: '84:F3:EB:21:87:C0',
      signalPct: 65,
      rssi_dBm: -70,
      band: '2.4GHz',
      channel: 6,
      radioType: '802.11n (Wi-Fi 4)',
      authentication: 'WPA2-Personal',
      encryption: 'CCMP',
      channelUtilizationPct: 76,
      connectedStationsCount: 19,
      isSavedProfile: true,
      isConnected: currentConnectedSsid === 'Legacy-IoT-Hub',
      vendor: 'Espressif Systems'
    },
    {
      ssid: 'Neighbor-WiFi-Far',
      bssid: 'E2:D0:D8:52:25:89',
      signalPct: 22,
      rssi_dBm: -86,
      band: '2.4GHz',
      channel: 11,
      radioType: '802.11n (Wi-Fi 4)',
      authentication: 'WPA2-Personal',
      encryption: 'CCMP',
      channelUtilizationPct: 38,
      connectedStationsCount: 2,
      isSavedProfile: false,
      isConnected: currentConnectedSsid === 'Neighbor-WiFi-Far',
      vendor: 'TP-Link Technologies'
    }
  ];
}
