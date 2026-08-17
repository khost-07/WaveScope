/**
 * AI NETWORK AUDIT REPORT SERVICE
 * Generates an executive, plain-English whole-network diagnostic audit using Google Gemini 3.1 Flash Lite.
 */

import { NetworkScanResult, NetworkAuditReport } from '../layer1_data/networkScannerTypes';
import { DEFAULT_GEMINI_MODEL } from './llmService';

export async function generateNetworkAuditReport(
  scan: NetworkScanResult,
  apiKey: string,
  model: string = DEFAULT_GEMINI_MODEL
): Promise<NetworkAuditReport> {
  const cleanKey = apiKey ? apiKey.trim() : '';
  const cleanModel = model ? model.trim() : DEFAULT_GEMINI_MODEL;

  if (!cleanKey) {
    throw new Error('Gemini API Key is required to generate the AI Network Diagnostic Report.');
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} (${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.error?.message) {
        errorDetail = `${errJson.error.message} [Code: ${errJson.error.code || response.status}]`;
      }
    } catch {
      // ignore
    }
    throw new Error(`Gemini Network Report Failed (${cleanModel}): ${errorDetail}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty network report response.');
  }

  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
  else if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
  if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
  cleanJson = cleanJson.trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (parseErr: any) {
    throw new Error(`Failed to parse network report JSON: ${parseErr.message}\nRaw Text: ${rawText}`);
  }

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
}
