/**
 * LAYER 3: PRE-GENERATED CACHED EXPLANATIONS
 * Guarantees zero-failure live demos even without internet or API connectivity.
 * Each explanation strictly follows the required format and language discipline.
 */

import { LLMExplanationResponse } from './types';

export const CACHED_EXPLANATIONS: Record<string, LLMExplanationResponse> = {
  // Scenario A: Healthy
  "device-scenario-a": {
    summary: "The client device is operating in an optimal RF environment with full Wi-Fi 6 (802.11ax) modulation on the 5GHz band, delivering maximum negotiated throughput with virtually zero frame retransmissions.",
    simpleOverview: {
      headline: "Everything is running at top speed with no issues.",
      whatIsHappening: "Your laptop has a strong, clean connection to the Wi-Fi router on the fast 5GHz band. Data flows instantly with no delays.",
      whyItMatters: "Ideal for 4K video streaming, online gaming, huge file downloads, and crystal-clear video calls.",
      simpleStepsToFix: [
        "No action required — your connection is running at maximum efficiency."
      ],
      experienceRating: "⚡ Excellent (Top Speed & Zero Lag)"
    },
    plainEnglishExplanation: "The connection is healthy across all physical and protocol metrics. With an RSSI of -45 dBm and an SNR of 35 dB, the received radio signal is strong and clean above the background noise floor (-80 dBm). This allows the radio to maintain high-order MCS 11 modulation and dual spatial streams (2x2 MIMO), yielding a symmetric 1200 Mbps link rate. Retransmissions are at a negligible 1.0%, indicating zero airtime contention or packet collisions.",
    confirmedFacts: [
      "Measured RSSI is -45 dBm (optimal range: >= -65 dBm)",
      "Measured SNR is 35 dB (well above the 25 dB threshold required for MCS 11)",
      "Frame retry rate is 1.0% with 0.1% packet loss",
      "Associated on 5GHz Channel 36 using 80 MHz channel width under 802.11ax"
    ],
    possibleHypotheses: [
      "Client is in clear line-of-sight or short unobstructed range from AP",
      "Channel 36 exhibits zero co-channel interference or competing BSS traffic"
    ],
    recommendations: [
      {
        action: "Maintain current channel configuration and AP power levels",
        impact: "Preserves baseline nominal throughput for high-throughput clients",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "Ensure 802.11ax OFDMA remains enabled on the AP",
        impact: "Maintains low-latency scheduling under multi-client traffic load",
        targetLayer: "AP_CONFIG"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Engine / gemini-3.1-flash-lite Validated"
  },

  // Scenario B: Weak / Attenuated Signal
  "device-scenario-b": {
    summary: "The device is experiencing severe signal attenuation (-76 dBm) and a depressed SNR (11 dB), resulting in an 18% frame retransmission rate and significant link rate throttling down to 117 Mbps.",
    simpleOverview: {
      headline: "The Wi-Fi signal is too weak because the laptop is too far away.",
      whatIsHappening: "Your laptop is struggling to hear the router. The signal is fading through distance and walls, so 1 out of every 5 data packets gets lost and has to be resent.",
      whyItMatters: "Websites will feel sluggish, YouTube will drop to low quality, and Zoom calls might freeze or drop audio.",
      simpleStepsToFix: [
        "Step 1: Move your laptop closer to the Wi-Fi router (e.g. into the same or adjacent room).",
        "Step 2: If moving isn't possible, install a mesh Wi-Fi extender midway between you and the router.",
        "Step 3: Keep doors open along the hallway to prevent thick walls from blocking the signal."
      ],
      experienceRating: "⚠️ Weak Signal (Sluggish & Buffering)"
    },
    plainEnglishExplanation: "The radio signal reaching this device has been significantly weakened by distance or structural obstructions. Although the background noise floor is normal (-87 dBm), the faint received power (-76 dBm) leaves only an 11 dB signal-to-noise margin. Because the link margin is too narrow for complex modulation, the access point and client have automatically downshifted from high-speed MCS rates to MCS 2. Almost one out of every five frames (18%) fails transmission and must be resent, introducing latency spikes and reducing real-world throughput.",
    confirmedFacts: [
      "Measured RSSI is -76 dBm (below the -75 dBm acceptable threshold for 5GHz voice/video)",
      "Measured SNR is 11 dB (nominal is >= 25 dB for reliable high-speed data)",
      "Frame retry rate is elevated at 18.0% with 4.2% dropped packets",
      "PHY rate has fallen to 117 Mbps Tx / 86 Mbps Rx (device hardware supports up to 866 Mbps)"
    ],
    possibleHypotheses: [
      "Likely excessive physical distance between client and access point",
      "Possible structural attenuation from reinforced walls, metal framing, or architectural glass",
      "Suspected client positioning in an RF shadow or radiation null of the AP"
    ],
    recommendations: [
      {
        action: "Relocate client closer to the access point or reposition obstructing physical items",
        impact: "Directly improves received power (target RSSI >= -65 dBm)",
        targetLayer: "RF_PHYSICAL"
      },
      {
        action: "Deploy an additional access point (or mesh node) closer to this coverage zone",
        impact: "Eliminates coverage dead spots and elevates link SNR to > 25 dB",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "Verify client Wi-Fi power-saving mode (802.11 WMM-PS) is not forcing low Tx power",
        impact: "Prevents client from artificially reducing its transmit radio power",
        targetLayer: "CLIENT_CONFIG"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Engine / gemini-3.1-flash-lite Validated"
  },

  // Scenario C: RF Interference
  "device-scenario-c": {
    summary: "High RSSI (-45 dBm) paired with a severely elevated noise floor (-55 dBm) indicates intense RF interference on 2.4GHz Channel 6, causing a 20% retry rate and heavy airtime degradation.",
    simpleOverview: {
      headline: "Severe wireless interference is jamming your Wi-Fi channel.",
      whatIsHappening: "Your signal is strong, but other wireless devices (like microwave ovens, cordless phones, or neighboring Wi-Fi) are shouting on the exact same frequency, causing radio collisions.",
      whyItMatters: "Severe lag, sudden spikes in ping during games, and choppy audio during voice calls.",
      simpleStepsToFix: [
        "Step 1: Switch your device to the 5GHz Wi-Fi network which has much less noise.",
        "Step 2: Change your router settings to use a clean channel (such as Channel 1 or 11 instead of Channel 6).",
        "Step 3: Move microwave ovens, Bluetooth speakers, or baby monitors away from the router."
      ],
      experienceRating: "🔴 Jammed (High Lag & Retries)"
    },
    plainEnglishExplanation: "While the device is close enough to receive a very strong raw signal (-45 dBm), the airwaves on 2.4GHz Channel 6 are saturated with background electromagnetic noise (-55 dBm). This cuts the effective Signal-to-Noise Ratio to a tiny 10 dB. Despite strong signal bars, frames are continuously colliding and being corrupted in mid-air, driving frame retransmissions up to 20%. The 82% channel utilization confirms the wireless medium is heavily congested by neighboring networks or non-Wi-Fi emitters.",
    confirmedFacts: [
      "RSSI is very strong at -45 dBm, ruling out distance/attenuation issues",
      "Noise floor is elevated to -55 dBm (nominal is <= -85 dBm)",
      "Effective SNR is compressed to 10 dB (nominal >= 25 dB)",
      "Frame retry rate is 20.0% with 6.5% packet loss",
      "Operating on 2.4GHz Channel 6 with 82% total channel utilization"
    ],
    possibleHypotheses: [
      "Likely non-802.11 continuous RF emitter nearby (microwave oven, wireless video transmitter, FHSS device)",
      "Possible severe co-channel interference from overlapping neighbor APs configured on Channel 6",
      "Suspected overlapping 40 MHz channel operation in crowded 2.4GHz space"
    ],
    recommendations: [
      {
        action: "Switch AP to operate on a clean, non-overlapping channel (Channel 1 or 11 on 2.4GHz), or restrict channel width to 20 MHz",
        impact: "Reduces co-channel contention and lowers the noise floor",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "Steer or migrate this client to the 5GHz or 6GHz band",
        impact: "Bypasses crowded 2.4GHz band entirely, gaining access to 24+ clean non-overlapping channels",
        targetLayer: "AP_CONFIG"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Engine / gemini-3.1-flash-lite Validated"
  },

  // Scenario D: Hardware / Capability Limited
  "device-scenario-d": {
    summary: "The client link is constrained exclusively by legacy hardware limitations: single-band 2.4GHz, single-stream 1x1 SISO, 20 MHz channel width, and 802.11n Wi-Fi 4 standard, capping maximum throughput at 72 Mbps.",
    simpleOverview: {
      headline: "Your device has an older Wi-Fi chip that cannot go faster.",
      whatIsHappening: "Your Wi-Fi connection is clean and working properly, but this specific device only has an old single-antenna chip (Wi-Fi 4) and cannot use the faster 5GHz or 6GHz frequencies.",
      whyItMatters: "Maximum download speed is capped around 72 Mbps. While plenty for basic web and 1080p video, it won't hit modern Gigabit speeds.",
      simpleStepsToFix: [
        "Step 1: If you need higher speeds on this device, plug in an inexpensive USB Wi-Fi 6 adapter.",
        "Step 2: No router changes are necessary — the router is already faster than the device."
      ],
      experienceRating: "⚡ Reliable (Hardware Speed Capped at 72 Mbps)"
    },
    plainEnglishExplanation: "The physical RF environment is completely clean and stable (SNR 30 dB, noise floor -80 dBm, 2% retry rate). However, the client device itself is an older IoT thermal sensor possessing only a legacy 1x1 SISO 802.11n radio limited to 2.4GHz and 20 MHz channel width. Even though the connected Access Point supports Tri-Band 802.11ax (Wi-Fi 6) across 160 MHz channels with 4x4 spatial streams, the link rate is fundamentally capped at the client's physical hardware ceiling of 72 Mbps.",
    confirmedFacts: [
      "Client radio supports only 2.4GHz (no 5GHz or 6GHz hardware)",
      "Client maximum protocol is 802.11n (Wi-Fi 4) vs AP operating at 802.11ax (Wi-Fi 6)",
      "Client max channel width is 20 MHz vs AP capable of 160 MHz",
      "Client physical antenna architecture is 1x1 SISO (Single-Input Single-Output)",
      "RF link is healthy: RSSI -50 dBm, SNR 30 dB, Retries 2.0%"
    ],
    possibleHypotheses: [
      "Device is an IoT sensor or legacy endpoint designed with low-cost, low-power single-band hardware",
      "Performance ceiling is entirely hardware-bound, not caused by RF environment or AP misconfiguration"
    ],
    recommendations: [
      {
        action: "No AP configuration change required for this specific client; link is performing at theoretical hardware ceiling",
        impact: "Prevents unnecessary network re-tuning that could disrupt other high-performance clients",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "If higher throughput is required for this application, upgrade client hardware to a dual-band 802.11ac/ax Wi-Fi module",
        impact: "Unlocks 5GHz/6GHz multi-stream operation (> 866 Mbps)",
        targetLayer: "HARDWARE_UPGRADE"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Engine / gemini-3.1-flash-lite Validated"
  },

  // Scenario E: Potential Band Selection / Configuration Issue
  "device-scenario-e": {
    summary: "The dual-band capable client is associated on the slower 2.4GHz band despite strong signal proximity (-48 dBm) and full client & AP support for 5GHz and 6GHz, restricting link speeds to 144 Mbps instead of > 866 Mbps.",
    simpleOverview: {
      headline: "Your modern device is stuck on the slower 2.4GHz Wi-Fi band.",
      whatIsHappening: "Both your phone and router support fast 5GHz and 6GHz Wi-Fi, but your phone picked the slower 2.4GHz band. Because you are close to the router, you should be on the fast band.",
      whyItMatters: "Your download speeds are currently limited to ~144 Mbps instead of the 1,200+ Mbps your phone and router can easily achieve.",
      simpleStepsToFix: [
        "Step 1: Go into your phone's Wi-Fi settings and choose your 5GHz network (or disconnect and reconnect).",
        "Step 2: Enable 'Band Steering' on your router so it automatically pushes fast devices to 5GHz.",
        "Step 3: Make sure the 2.4GHz and 5GHz networks share the same network name (SSID)."
      ],
      experienceRating: "⚡ Moderate Speed (Could be 8x Faster on 5GHz)"
    },
    plainEnglishExplanation: "The client smartphone possesses modern Tri-Band Wi-Fi 6E hardware with 2x2 MIMO and 160 MHz support, and the AP broadcasts both 5GHz and 6GHz radios. The device has a strong signal (-48 dBm RSSI, 34 dB SNR) which easily exceeds the standard -68 dBm threshold required for high-speed 5GHz association. However, the client is currently connected on 2.4GHz Channel 1, constraining its link speed to 144 Mbps instead of the 1200+ Mbps available on 5GHz/6GHz.",
    confirmedFacts: [
      "Client hardware supports 2.4GHz, 5GHz, and 6GHz radios with 802.11ax capability",
      "AP broadcasts active radios on 2.4GHz, 5GHz, and 6GHz",
      "Current connection is established on 2.4GHz Channel 1 with 144 Mbps Tx rate",
      "Measured RSSI is -48 dBm (well above the typical -68 dBm 5GHz band steering trigger threshold)"
    ],
    possibleHypotheses: [
      "AP Band Steering / Client Steering is disabled or threshold is set too conservatively",
      "Client roaming algorithm previously associated to 2.4GHz when entering from outdoor range and has not re-evaluated 5GHz availability ('sticky client')",
      "SSID separation has forced client to manually save the 2.4GHz network"
    ],
    recommendations: [
      {
        action: "Enable or tune AP Band Steering (prefer 5GHz/6GHz for 802.11ax capable clients with RSSI > -70 dBm)",
        impact: "Automatically transitions capable clients to 5GHz/6GHz, unlocking 8x higher PHY rates",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "Enable 802.11k (Neighbor Reports) and 802.11v (BSS Transition Management) on the AP",
        impact: "Assists client in making timely, seamless band and AP roaming decisions",
        targetLayer: "AP_CONFIG"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Engine / gemini-3.1-flash-lite Validated"
  }
};
