# WaveScope — Wi-Fi Band Analyzer & Root-Cause Diagnostic Instrument

WaveScope is a Wi-Fi performance analyzer and root-cause diagnostic tool. It cross-references client device hardware capabilities against real-time physical RF telemetry, runs that through a deterministic, auditable scoring engine (zero LLM involved in scoring), and uses **Google Gemini (`gemini-3.1-flash-lite`)** to explain findings in plain English with concrete, actionable recommendations.

---

## ⚡ Key Features

- **Decoupled 3-Layer Architecture**:
  - **Layer 1 (Data Ingestion)**: Strictly typed RF telemetry (RSSI, SNR, Noise Floor, Retries, PHY Link Rates, Channel Width, MCS, Spatial Streams) and device/AP capability matrices.
  - **Layer 2 (Diagnostic Scoring Engine)**: Mathematical competing hypothesis scoring system evaluating Signal Attenuation, RF Interference, Hardware Bottlenecks, and Band Steering issues without LLM dependency.
  - **Layer 3 (LLM Explanation Layer)**: Translates pre-computed diagnoses into plain-English summaries, separated facts vs hypotheses, and concrete actions via Google Gemini (`gemini-3.1-flash-lite`).
- **Dual-Mode User Interface**:
  - **Simple View**: Clean, human-friendly cards with Wi-Fi health score, friendly device icons, visual signal meters, and step-by-step fix guides.
  - **Nerd Mode**: Instrument-grade engineering interface with raw telemetry grids, capability matrices, hypothesis score distribution charts, and live interactive RF parameter tuning.
- **Dual Telemetry Modes**:
  - **Mode 2 (Simulation)**: Controlled 5-scenario test suite (Scenarios A through E).
  - **Mode 1 (Real Wi-Fi Telemetry)**: Connects to host Windows Native WLAN API (`netsh wlan show interfaces`).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Diagnostic Engine Test Suite
```bash
npx tsx src/layer2_engine/engine.test.ts
```

### 3. Launch Development Server
```bash
npm run dev
```

### 4. Optional: Launch Local Windows WLAN Probe Daemon
```bash
node server/wlanScanner.cjs
```

---

## 🧪 Simulation Test Scenarios

| Scenario | RSSI | SNR | Retry Rate | Expected Diagnosis |
|---|---|---|---|---|
| **A — Healthy** | -45 dBm | 35 dB | 1.0% | Healthy / No significant issue |
| **B — Weak Signal** | -76 dBm | 11 dB | 18.0% | Weak / Attenuated Signal |
| **C — RF Interference** | -45 dBm | 10 dB | 20.0% | Possible RF Interference |
| **D — Hardware Limited** | -50 dBm | 30 dB | 2.0% | Hardware / Capability Limited |
| **E — Band Selection** | -48 dBm | 34 dB | 1.2% | Potential Band Selection / Configuration Issue |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS Design Tokens (Dual-Mode: Simple & Nerd)
- **AI Engine**: Google Gemini API (`gemini-3.1-flash-lite`)
- **Backend / Telemetry Reader**: Node.js Native WLAN API integration (`netsh wlan`)
