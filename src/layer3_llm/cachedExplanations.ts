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
    sourceModel: "WaveScope Deterministic Pre-Computed Engine / Gemini Pro Validated"
  },

  // Scenario B: Weak / Attenuated Signal
  "device-scenario-b": {
    summary: "The device is experiencing severe signal attenuation (-76 dBm) and a depressed SNR (11 dB), resulting in an 18% frame retransmission rate and significant link rate throttling down to 117 Mbps.",
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
        action: "Evaluate deploying an additional 5GHz AP or mesh node in this coverage dead-zone",
        impact: "Restores link SNR above 25 dB and brings retry rate below 5%",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "If client cannot move, consider enabling 2.4GHz association if 2.4GHz channel is quiet",
        impact: "Provides better structural wall penetration, though maximum theoretical throughput will be lower",
        targetLayer: "CLIENT_CONFIG"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Pre-Computed Engine / Gemini Pro Validated"
  },

  // Scenario C: Possible RF Interference
  "device-scenario-c": {
    summary: "The client receives a strong signal (-45 dBm) but suffers from high RF noise (-55 dBm noise floor) and 82% AP channel utilization, crushing the SNR to 10 dB and causing a 20% retransmission rate on 2.4GHz Channel 6.",
    plainEnglishExplanation: "This is a classic RF interference scenario: signal strength is not the problem, but background noise is overwhelming the channel. The client is close enough to receive a potent -45 dBm signal, but the noise floor on Channel 6 has spiked to -55 dBm (normal is -85 dBm or lower). This leaves only a 10 dB SNR margin. Furthermore, the AP reports 82% channel utilization. As a result, radio frames frequently collide with ambient emissions or competing transmissions, forcing 20% of all packets to be retransmitted and choking throughput down to 54 Mbps.",
    confirmedFacts: [
      "Measured RSSI is strong at -45 dBm",
      "Measured Noise Floor is severely elevated at -55 dBm (nominal is <= -85 dBm)",
      "Measured SNR is crushed to 10 dB despite strong signal",
      "Frame retry rate is 20.0% with 5.8% packet loss on 2.4GHz Channel 6",
      "AP reports 82% total channel airtime utilization"
    ],
    possibleHypotheses: [
      "Suspected non-Wi-Fi RF interference from 2.4GHz ISM sources (microwave ovens, legacy wireless video, cordless systems)",
      "Likely severe co-channel interference (CCI) from adjacent rogue or neighbor BSSIDs on Channel 6",
      "High channel utilization causing near-constant Clear Channel Assessment (CCA) channel busy deferrals"
    ],
    recommendations: [
      {
        action: "Migrate the device to the 5GHz or 6GHz band which is free from 2.4GHz ISM interference",
        impact: "Immediately bypasses 2.4GHz noise, boosting SNR to > 30 dB and eliminating collisions",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "Perform a 2.4GHz spectrum scan and switch AP to an uncontested channel (e.g. Channel 1 or 11)",
        impact: "Evades localized Channel 6 co-channel interferers",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "Locate and isolate non-Wi-Fi 2.4GHz emitters in proximity to the workstation",
        impact: "Reduces noise floor back toward the -85 dBm baseline",
        targetLayer: "RF_PHYSICAL"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Pre-Computed Engine / Gemini Pro Validated"
  },

  // Scenario D: Hardware / Capability Limited
  "device-scenario-d": {
    summary: "The connection is stable and error-free, but speed is hard-capped at 65 Mbps because this legacy single-band IoT client only supports single-stream (1x1) 802.11n on 2.4GHz, unable to utilize the AP's Wi-Fi 6 capabilities.",
    plainEnglishExplanation: "There is no RF link fault or interference here. The physical environment is clear with a clean 30 dB SNR and a low 2.0% retry rate. However, the client device hardware is physically limited to legacy single-band 802.11n with a 1x1 SISO radio and a 20 MHz channel limit. Even though the connected Access Point supports modern 802.11ax Tri-Band with 160 MHz channels up to 2402 Mbps, the connection can never exceed the client radio's physical ceiling of 72 Mbps. The device is functioning as designed within its hardware limits.",
    confirmedFacts: [
      "Client hardware only supports 802.11b/g/n on 2.4GHz (single spatial stream 1x1, 20 MHz max width)",
      "AP hardware supports 802.11ax on 2.4GHz, 5GHz, and 6GHz (up to 160 MHz width)",
      "RF metrics are clean: RSSI = -50 dBm, SNR = 30 dB, Retry rate = 2.0%",
      "Connection negotiated at max client hardware rate: 65 Mbps (MCS 7)"
    ],
    possibleHypotheses: [
      "Device is an IoT sensor or legacy endpoint engineered with a low-cost, low-power single-band radio module",
      "Bandwidth constraints are architectural hardware bounds rather than RF or configuration failures"
    ],
    recommendations: [
      {
        action: "Assign this and similar IoT devices to an isolated 2.4GHz IoT SSID / VLAN",
        impact: "Prevents legacy 802.11n preamble overhead from consuming airtime on primary employee/user SSIDs",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "No RF troubleshooting needed; do not attempt AP antenna or power modifications",
        impact: "Prevents unnecessary network reconfigurations for devices already at hardware maximums",
        targetLayer: "CLIENT_CONFIG"
      },
      {
        action: "If high throughput is required for this workstation, upgrade to an external Wi-Fi 6 (802.11ax) USB/PCIe adapter",
        impact: "Enables 5GHz/6GHz operation with theoretical link speeds up to 1200+ Mbps",
        targetLayer: "HARDWARE_UPGRADE"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Pre-Computed Engine / Gemini Pro Validated"
  },

  // Scenario E: Potential Band Selection / Configuration Issue
  "device-scenario-e": {
    summary: "A high-end Wi-Fi 6E flagship device is connected to the slower 2.4GHz band (144 Mbps) despite strong signal (-48 dBm) and full client & AP capability to operate on 5GHz or 6GHz (up to 2402 Mbps).",
    plainEnglishExplanation: "The client device is equipped with advanced Wi-Fi 6E (802.11ax) hardware supporting 2.4GHz, 5GHz, and 6GHz with 160 MHz channel width. The AP also has all three bands active. However, the client is currently associated on 2.4GHz Channel 11. With a strong RSSI of -48 dBm and 34 dB SNR, the device is well within range for a 5GHz or 6GHz link. Because it is stuck on 2.4GHz with 20 MHz channels, throughput is artificially throttled to 144 Mbps instead of the 1200–2402 Mbps it could achieve on 5GHz/6GHz.",
    confirmedFacts: [
      "Client supports 802.11ax across 2.4GHz, 5GHz, and 6GHz (2x2 MIMO, 160 MHz width)",
      "AP has active 2.4GHz, 5GHz, and 6GHz radios broadcasting the SSID",
      "Current connection is on 2.4GHz Channel 11 with 20 MHz width (Tx Rate: 144 Mbps)",
      "Signal is strong: RSSI = -48 dBm, SNR = 34 dB, Retries = 1.2%"
    ],
    possibleHypotheses: [
      "Client association algorithm chose 2.4GHz upon wake or during initial connection sequence",
      "Combined single-SSID band-steering on the AP is either disabled or threshold is set too conservatively",
      "Client OS roaming profile may have 5GHz band preference disabled or set to automatic default"
    ],
    recommendations: [
      {
        action: "Enable or tune AP Band Steering (802.11v BSS Transition Management & 802.11k Radio Resource Mgmt)",
        impact: "Directs dual/tri-band capable devices to 5GHz or 6GHz upon association",
        targetLayer: "AP_CONFIG"
      },
      {
        action: "Check client Wi-Fi settings: toggle Preferred Band to 'Prefer 5GHz/6GHz' in device adapter properties",
        impact: "Forces client driver to prioritize higher-frequency BSSIDs when signal is > -70 dBm",
        targetLayer: "CLIENT_CONFIG"
      },
      {
        action: "Verify 5GHz/6GHz SSID broadcasting and power balance (5GHz EIRP should be 6 dB higher than 2.4GHz)",
        impact: "Equalizes perceived coverage footprint between 2.4GHz and 5GHz",
        targetLayer: "AP_CONFIG"
      }
    ],
    generatedAt: Date.now(),
    isCachedFallback: true,
    sourceModel: "WaveScope Deterministic Pre-Computed Engine / Gemini Pro Validated"
  }
};
