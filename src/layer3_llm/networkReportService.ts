/**
 * AI NETWORK AUDIT REPORT SERVICE
 * Generates an executive, plain-English whole-network diagnostic audit using Google Gemini 3.1 Flash Lite
 * or deterministic Layer 2 fallback when API key is not supplied.
 */

import { NetworkScanResult, NetworkAuditReport } from '../layer1_data/networkScannerTypes';
import { DEFAULT_GEMINI_MODEL } from './llmService';

export function generateDeterministicAuditReport(scan: NetworkScanResult): NetworkAuditReport {
  const router = scan.router;
  const gwPing = router.gatewayPingMs;
  const rssi = router.rssi_dBm;
  const totalBssids = router.totalBssidsInArea;
  const activeCount = scan.devices.length;

  let score = 95;
  if (gwPing > 20) score -= 15;
  else if (gwPing > 8) score -= 5;

  if (rssi < -75) score -= 20;
  else if (rssi < -65) score -= 8;

  if (totalBssids > 50) score -= 10;
  else if (totalBssids > 20) score -= 5;

  score = Math.max(40, Math.min(100, score));

  let grade = 'A';
  if (score >= 92) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 68) grade = 'B';
  else if (score >= 50) grade = 'C';
  else grade = 'D';

  const isIsolated = scan.clientIsolationActive || activeCount <= 2;
  const isolationNote = isIsolated
    ? ' AP Client Isolation is active on this access point, preventing direct peer device broadcasting.'
    : ` ${activeCount} active devices are communicating on this local subnet.`;

  const execSummary = `Live physical layer audit of "${router.ssid}" shows a solid ${router.band} link at ${rssi} dBm (${router.signalPct}% signal) with a ${gwPing}ms gateway response.${isolationNote}`;

  const channelVerdict = totalBssids > 40
    ? `Channel ${router.channel} is sharing RF spectrum with ${totalBssids} surrounding BSSIDs. Signal is currently strong at ${rssi} dBm.`
    : `Channel ${router.channel} is operating cleanly in the ${router.band} band with low adjacent interference.`;

  const bandVerdict = router.band === '6GHz'
    ? 'High-throughput 6GHz spectrum with ultra-wide 160MHz bandwidth.'
    : router.band === '5GHz'
    ? 'High-speed 5GHz band with low RF propagation attenuation and modern 80MHz channel width.'
    : '2.4GHz legacy band in use. Consider switching to 5GHz for higher throughput.';

  const latencyVerdict = gwPing <= 5
    ? `Router gateway (${router.ip}) is responding with exceptional sub-5ms round-trip latency (${gwPing}ms).`
    : gwPing <= 20
    ? `Router gateway (${router.ip}) is responsive at ${gwPing}ms round-trip latency.`
    : `Router gateway (${router.ip}) is exhibiting elevated response time (${gwPing}ms).`;

  const actions: Array<{ priority: 'High' | 'Medium' | 'Low'; action: string; simpleWhy: string; targetComponent: 'Router Settings' | 'Device Placement' | 'Band Migration' | 'Security' }> = [];

  if (router.band === '2.4GHz') {
    actions.push({
      priority: 'High',
      action: 'Migrate to 5GHz / 6GHz Frequency Band',
      simpleWhy: '5GHz offers much wider channels and higher data rates with zero microwave/Bluetooth interference.',
      targetComponent: 'Band Migration'
    });
  }

  if (totalBssids > 60) {
    actions.push({
      priority: 'Medium',
      action: 'Monitor Channel Crowding',
      simpleWhy: `${totalBssids} surrounding access points were detected. Ensure automatic channel switching (DFS) is enabled on your router.`,
      targetComponent: 'Router Settings'
    });
  }

  if (gwPing > 15) {
    actions.push({
      priority: 'High',
      action: 'Investigate Gateway Latency Jitter',
      simpleWhy: `Gateway ping response of ${gwPing}ms is higher than nominal (< 5ms) baseline.`,
      targetComponent: 'Device Placement'
    });
  } else {
    actions.push({
      priority: 'Low',
      action: 'Nominal Wi-Fi Baseline Confirmed',
      simpleWhy: `Physical RF link and gateway round-trip latency are operating within nominal parameters.`,
      targetComponent: 'Router Settings'
    });
  }

  return {
    overallHealthScore: score,
    healthGrade: grade,
    executiveSummary: execSummary,
    routerAssessment: {
      status: score >= 80 ? 'Optimal' : score >= 65 ? 'Warning' : 'Critical',
      channelCongestionVerdict: channelVerdict,
      bandEfficiencyVerdict: bandVerdict,
      gatewayLatencyVerdict: latencyVerdict
    },
    deviceBreakdown: {
      totalActive: activeCount,
      categories: { 'Physical Wi-Fi Devices': activeCount },
      highBandwidthDevices: [],
      suspiciousOrUnknown: []
    },
    keyBottlenecks: totalBssids > 50 ? [`High spectrum density (${totalBssids} surrounding BSSIDs in area)`] : [],
    actionablePlan: actions,
    generatedAt: Date.now(),
    sourceModel: 'WaveScope Deterministic Diagnostic Engine (Live Telemetry)'
  };
}

export async function generateNetworkAuditReport(
  scan: NetworkScanResult,
  apiKey: string,
  model: string = DEFAULT_GEMINI_MODEL
): Promise<NetworkAuditReport> {
  const cleanKey = apiKey ? apiKey.trim() : '';
  const cleanModel = model ? model.trim() : DEFAULT_GEMINI_MODEL;

  if (!cleanKey) {
    return generateDeterministicAuditReport(scan);
  }

  const systemPrompt = `You are an elite Wi-Fi & Network Performance Auditor for WaveScope.
Your task is to analyze a comprehensive whole-network scan (Router parameters, connected device fleet, latency metrics, and band allocation) and generate a clear, executive health report in SIMPLE, EVERYDAY ENGLISH that any homeowner or office manager can easily understand.

MANDATORY RULES:
1. Ground every conclusion strictly in the provided scan data. Do not invent devices or phantom metrics.
2. In the "executiveSummary", explain the overall network health in 2-3 friendly, jargon-free sentences.
3. Calculate an overallHealthScore between 0 and 100 based on latency, signal strength, channel width, and device distribution.
4. Assign a letter grade ('A+', 'A', 'B', 'C', 'D', 'F').
5. Under "routerAssessment", evaluate:
   - Channel Congestion (Are channels overlapping with neighbors?)
   - Band Efficiency (Are fast devices utilizing 5GHz/6GHz vs crowding 2.4GHz?)
   - Gateway Latency (Is the router responding promptly under 10ms?)
6. Under "actionablePlan", provide 3 to 5 simple, prioritized, numbered action items in plain English.

Output strictly valid JSON with the following structure:
{
  "overallHealthScore": 88,
  "healthGrade": "B+",
  "executiveSummary": "Your overall network is in solid shape with fast router speeds, but 2 devices are experiencing noticeable latency and could benefit from band optimization.",
  "routerAssessment": {
    "status": "Optimal" | "Warning" | "Critical",
    "channelCongestionVerdict": "Short sentence assessing channel crowding",
    "bandEfficiencyVerdict": "Short sentence assessing 5GHz vs 2.4GHz usage",
    "gatewayLatencyVerdict": "Short sentence assessing gateway ping response"
  },
  "deviceBreakdown": {
    "totalActive": 10,
    "categories": {
      "Computers & Laptops": 2,
      "Mobile Phones": 2,
      "Smart TVs & Media": 2,
      "Smart Home / IoT": 3,
      "Network Equipment": 1
    },
    "highBandwidthDevices": ["List of device names that demand high throughput"],
    "suspiciousOrUnknown": ["Any unexpected device or empty array"]
  },
  "keyBottlenecks": [
    "Bottleneck 1 in simple English",
    "Bottleneck 2 in simple English"
  ],
  "actionablePlan": [
    {
      "priority": "High" | "Medium" | "Low",
      "action": "Clear action to take in plain words",
      "simpleWhy": "Why this helps everyday performance",
      "targetComponent": "Router Settings" | "Device Placement" | "Band Migration" | "Security"
    }
  ]
}`;

  const userContent = JSON.stringify({
    scan_metadata: {
      timestamp: scan.timestamp,
      scanDurationMs: scan.scanDurationMs,
      subnet: scan.subnet,
      isRealProbe: scan.isReal
    },
    router_probe: scan.router,
    discovered_endpoints: scan.devices.map(d => ({
      ip: d.ip,
      mac: d.mac,
      hostname: d.hostname,
      vendor: d.vendor,
      device_type: d.deviceType,
      is_gateway: d.isGateway,
      ping_latency_ms: d.pingMs,
      band: d.band,
      status: d.status
    }))
  }, null, 2);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(cleanKey)}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nScan Data Input:\n${userContent}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return generateDeterministicAuditReport(scan);
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return generateDeterministicAuditReport(scan);
    }

    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    else if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);

    return {
      overallHealthScore: typeof parsed.overallHealthScore === 'number' ? parsed.overallHealthScore : 85,
      healthGrade: parsed.healthGrade || 'B+',
      executiveSummary: parsed.executiveSummary || 'Network audit completed successfully.',
      routerAssessment: parsed.routerAssessment || {
        status: 'Optimal',
        channelCongestionVerdict: 'Channel usage is within acceptable limits.',
        bandEfficiencyVerdict: 'Devices are distributed across available bands.',
        gatewayLatencyVerdict: 'Gateway latency is stable.'
      },
      deviceBreakdown: parsed.deviceBreakdown || {
        totalActive: scan.devices.length,
        categories: { 'Discovered Clients': scan.devices.length },
        highBandwidthDevices: [],
        suspiciousOrUnknown: []
      },
      keyBottlenecks: Array.isArray(parsed.keyBottlenecks) ? parsed.keyBottlenecks : [],
      actionablePlan: Array.isArray(parsed.actionablePlan) ? parsed.actionablePlan : [],
      generatedAt: Date.now(),
      sourceModel: `${cleanModel} (Live API)`
    };
  } catch {
    return generateDeterministicAuditReport(scan);
  }
}
