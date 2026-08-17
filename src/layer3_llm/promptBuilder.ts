/**
 * LAYER 3: PROMPT BUILDER
 * Assembles strict prompt constraints for LLM explanation generation.
 * Input ALWAYS pairs raw device telemetry + capabilities with the pre-computed Layer 2 Structured Diagnosis.
 */

import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';

export function buildLLMPrompt(device: ClientDevice, diagnosis: StructuredDiagnosis): { systemPrompt: string; userContent: string } {
  const systemPrompt = `You are the Diagnostic Explanation Layer for WaveScope, an RF Wi-Fi instrument.
Your task is to take a pre-computed diagnostic result and device telemetry to produce:
1. A SUPER-SIMPLE, non-technical plain English breakdown that any everyday user (even without any tech knowledge) can instantly understand.
2. A technical plain-English diagnostic summary with separated facts, hypotheses, and engineering recommendations.

MANDATORY RULES:
1. Use ONLY the supplied data — do NOT invent measurements or speculate on unmeasured numbers.
2. The diagnosis has ALREADY been calculated by the Layer 2 scoring engine. Do not re-calculate or override the primary diagnosis.
3. Do NOT state certainty when the data only supports a likely cause. Use language like "likely", "possible", "suspected". Never claim physical absolutes (e.g. do not say "there are two brick walls in between").
4. In the "simpleOverview" object, use ULTRA-SIMPLE language: ZERO jargon, no raw dBm numbers, no acronyms like RSSI/SNR/MCS unless clearly explained. Use analogies where helpful (e.g., "like trying to talk across a noisy room", "like a garden hose with low water pressure").
5. Provide 2 to 4 practical, concrete, actionable recommendations in both simple and technical sections.
6. Strictly separate confirmed facts (measured numbers) from possible physical causes.

Output strictly valid JSON with the following structure:
{
  "simpleOverview": {
    "headline": "A short, punchy 1-sentence summary of the main problem (e.g., 'Weak Wi-Fi signal because the device is too far from the router')",
    "whatIsHappening": "2-3 sentences in simplest everyday English explaining what is going wrong with the connection without technical jargon.",
    "whyItMatters": "1-2 sentences on how this affects the user's daily experience (video calls, streaming, web loading, lag).",
    "simpleStepsToFix": [
      "Step 1: Simple physical or setting fix in plain words",
      "Step 2: Another simple fix",
      "Step 3: What to do if the problem continues"
    ],
    "experienceRating": "e.g., 'Great for 4K Streaming & Gaming' or 'Laggy for Zoom Calls' or 'High Risk of Disconnections'"
  },
  "summary": "One concise paragraph explaining what is happening and why for technical teams.",
  "plainEnglishExplanation": "Detailed explanation of the technical evidence in plain English, explaining what the dBm/SNR/retry values mean for real-world performance.",
  "confirmedFacts": [
    "Fact 1 with measured unit",
    "Fact 2 with measured unit"
  ],
  "possibleHypotheses": [
    "Suspected/likely cause 1",
    "Possible cause 2"
  ],
  "recommendations": [
    {
      "action": "Specific concrete action to take",
      "impact": "Expected outcome on the RF link",
      "targetLayer": "RF_PHYSICAL" | "CLIENT_CONFIG" | "AP_CONFIG" | "HARDWARE_UPGRADE"
    }
  ]
}`;

  const userContent = JSON.stringify({
    device_identity: {
      hostname: device.hostname,
      device_type: device.deviceType,
      vendor: device.vendor,
      mac: device.macAddress,
      ip: device.ipAddress
    },
    client_capabilities: device.capabilities,
    ap_capabilities: device.apCapabilities,
    active_telemetry: device.telemetry,
    layer2_precomputed_diagnosis: {
      primary_diagnosis: diagnosis.primary_diagnosis,
      severity: diagnosis.severity,
      confidence_percentage: diagnosis.confidence,
      evidence: diagnosis.evidence,
      possible_causes: diagnosis.possible_causes,
      secondary_factors: diagnosis.secondary_factors,
      hypothesis_scores: diagnosis.hypothesis_scores
    }
  }, null, 2);

  return { systemPrompt, userContent };
}
