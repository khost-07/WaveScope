# WaveScope — Wi-Fi Band Analyzer & Root-Cause Diagnostic Tool
### Build Specification for Antigravity

---

## 1. What This Is

A tool that diagnoses **why** a device's Wi-Fi is underperforming — not just that it is. It cross-references what a device is *capable of* against what it's *actually getting*, runs that through a transparent rule/scoring engine, and only then uses an LLM to explain the result in plain English.

**Core principle — three separate layers, never merge them:**

```
Layer 1: DATA         → raw telemetry (RSSI, SNR, band, link rate, retries, packet loss, capabilities)
Layer 2: DIAGNOSIS     → rule-based scoring engine (deterministic, auditable, no LLM involved)
Layer 3: EXPLANATION   → LLM converts the structured diagnosis into plain English + recommendations
```

The LLM **never** performs networking calculations and **never** sees raw telemetry without an already-computed diagnosis attached. It only runs when a user selects a specific device — not continuously.

---

## 2. Data Modes (build both)

**Mode 1 — Real Data**: pulls from whatever real Wi-Fi interface/monitoring source is available. Before this is ever shown to a judge as "real," the data source must be identifiable and explainable — don't fake this label.

**Mode 2 — Simulation**: a fixed, editable dataset (JSON) of controlled scenarios used both as demo content and as a test suite. Include at minimum these five scenarios, each with expected diagnosis:

| Scenario | RSSI | SNR | Retry | Expected Diagnosis |
|---|---|---|---|---|
| A — Healthy | -45 dBm | 35 dB | 1% | Healthy / No significant issue |
| B — Weak/Attenuated | -76 dBm | 11 dB | 18% | Weak / Attenuated Signal |
| C — Interference | -45 dBm | 10 dB | 20% | Possible RF Interference |
| D — Hardware Limited | -50 dBm | 30 dB | low | Hardware / Capability Limited (device supports 2.4GHz only) |
| E — Band Selection | -48 dBm | 34 dB | low | Potential Band Selection / Configuration Issue (capable of 6GHz, sitting on 2.4GHz) |

The UI must make it **obvious and unmistakable** which mode is active — never let simulated data look like it could be real.

---

## 3. Diagnostic Engine (Layer 2 — build this first, it's the core IP)

Not a single if-chain. A **scoring system**: each rule contributes points toward competing hypotheses; highest score wins as primary diagnosis, others kept as secondary contributing factors.

**Rules to implement:**
- **Weak/Attenuated Signal** — poor RSSI + poor SNR + high retry/packet loss
- **Possible RF Interference** — strong RSSI but poor SNR + high retries (signal is fine, noise isn't)
- **Hardware/Capability Limited** — device's max supported band/standard is below what the AP offers
- **Band Selection/Configuration Issue** — device is *capable* of a higher band and signal is good, but it's sitting on a lower band (flag as *potential*, never certain — there are legitimate reasons for this)
- **Healthy** — all metrics good, don't invent a problem

**Output structure per diagnosis:**
```json
{
  "primary_diagnosis": "Weak / Attenuated Signal",
  "severity": "High",
  "confidence": 87,
  "evidence": ["RSSI = -76 dBm", "SNR = 11 dB", "Retry rate = 18%"],
  "possible_causes": ["Distance from AP", "Wall/obstruction", "Poor AP placement"],
  "secondary_factors": []
}
```

**Language discipline — the engine must never overclaim.** Use "likely," "possible," "suspected," never state an unproven physical cause as fact (e.g., never claim "there are two walls in the way" — RSSI alone can't prove that).

---

## 4. LLM Layer (Layer 3)

Only triggers on device selection. Input = raw device data + the structured diagnosis object above (never raw data alone).

**Explicit prompt constraints for the LLM call:**
- Use only the supplied data — do not invent measurements
- Do not state certainty when the data only supports a likely cause
- Explain technical terms in plain English
- Explain the evidence behind the diagnosis, don't just restate the label
- Give 2-4 practical, concrete recommended actions
- Clearly separate confirmed information from possible causes

Cache/pre-generate explanations for the five simulation scenarios as a fallback in case live API calls fail during the demo (ironic but real risk — you're demoing a Wi-Fi tool, venue Wi-Fi may be congested).

---

## 5. UI Structure

**Overview page:**
- Client count + status breakdown (Healthy / Attention / Critical)
- Table: device, band, RSSI, SNR, link rate, status
- Clicking a row selects that device

**Device detail page (loads on selection):**
- Raw telemetry
- Device capabilities vs AP capabilities
- Diagnostic result (diagnosis, severity, confidence, evidence)
- LLM explanation + recommendations
- Real/Simulation toggle, always visible, unambiguous

---

## 6. DESIGN CONSTRAINTS — read this section as hard requirements, not suggestions

This must look like a **precise technical instrument**, not a generic AI-generated dashboard. Minimalist, light theme, white-dominant.

### Explicitly forbidden (common AI-slop defaults):
- ❌ Dark navy background with cyan/purple glow — the reflexive "tech/security" cliché, says nothing specific about this tool
- ❌ Glassmorphism, frosted-glass cards, heavy drop shadows, floating panels
- ❌ Purple-to-blue gradient backgrounds or gradient text anywhere
- ❌ Generic rounded-corner stat-card grid (icon + big number + label, repeated identically)
- ❌ Stock icon packs — no generic "wifi bars," "signal tower," "gear," "sparkle/AI magic" icons
- ❌ Default Inter/Poppins-everywhere typography with no pairing decision made
- ❌ Decorative pulsing dots, spinner shimmer, or "AI is thinking..." animations used purely for flavor, not real state
- ❌ Lazy 3-color traffic-light system slapped onto everything without domain grounding
- ❌ Filler/marketing copy — no "Real-time insights at your fingertips," no "Powered by AI" badges. Every label names an actual measurable quantity (dBm, Mbps, %, dB)
- ❌ Emoji used as UI icons (🟢🟡🔴) — build real status indicators, not emoji substitutes
- ❌ Centered hero sections, large marketing-style whitespace, anything that reads as a landing page instead of an instrument panel

### Required direction:
- **Base palette**: white / off-white (#FAFAFA, #FFFFFF) backgrounds, near-black text (#1A1A1A), one restrained accent color earned from the RF domain itself — not chosen for "looking techy." Justify the accent choice against the subject (e.g., a signal-strength gradient tied to real dBm ranges) rather than assigning arbitrary status colors.
- **Density over decoration**: this is a data instrument — favor tables, precise numeric labels, and clear hierarchy over illustration or big empty cards.
- **Typography**: pick one deliberate pairing (e.g., a monospace for data/numbers, a clean grotesk for labels) — justify why monospace suits raw telemetry values specifically.
- **Borders over shadows**: thin 1px borders and whitespace for separation, not shadow/elevation effects.
- **Every visual element must map to a real measurable quantity.** If you can't name what data point a color/icon/badge represents, remove it.
- **Status indicators**: build a small custom shape/badge system with text labels, not colored dots alone and not emoji.

---

## 7. Build Priority (in order)

1. Confirm/document the real data source (or commit fully to simulation-only if time-constrained — don't claim "real" without being able to explain it to a judge)
2. Simulation dataset (JSON) + diagnostic scoring engine, tested against all 5 scenarios until output matches expected diagnosis
3. Overview + detail UI wired to the engine (simulation mode first)
4. LLM explanation layer, triggered on selection only, with cached fallback responses
5. Real data wiring into the same engine, if time allows
6. Final pass: verify nothing in the UI is a forbidden AI-slop pattern from Section 6
