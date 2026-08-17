# Design System: WaveScope (Google Stitch UI/UX Specification)

## 1. Visual Theme & Atmosphere
WaveScope is a precision RF instrument and network intelligence cockpit. The visual atmosphere is **clinical, gallery-airy, and deeply functional** — blending the rigorous clarity of laboratory measurement instruments with the approachable warmth of modern consumer software.

- **Density:** 7/10 (Balanced Cockpit — high information density without visual clutter)
- **Variance:** 6/10 (Offset Asymmetric — distinct zones for high-level health vs deep telemetry)
- **Motion:** 6/10 (Fluid CSS transitions with tactile push feedback on interactions)

---

## 2. Color Palette & Roles

### Neutral Bases
- **Canvas White** (`#F8FAFC` / Slate-50) — Primary application background canvas.
- **Pure Surface** (`#FFFFFF`) — Cards, modals, and interactive container fills.
- **Surface Inset** (`#F1F5F9` / Slate-100) — Metric readouts, search boxes, tab bars, table rows.
- **Surface Hover** (`#F8FAFC`) — Interactive hover states on table rows and client cards.

### Typography Ink
- **Charcoal Ink** (`#0F172A` / Slate-900) — Primary titles, active values, high-contrast labels.
- **Muted Slate** (`#334155` / Slate-700) — Explanatory copy, secondary titles, body text.
- **Steel Gray** (`#64748B` / Slate-500) — Monospace units (dBm, MHz, Mbps), metadata, timestamps.

### Structural Lines
- **Whisper Border** (`#E2E8F0` / Slate-200) — 1px structural card borders, dividers, subtle grid lines.
- **Border Medium** (`#CBD5E1` / Slate-300) — Input strokes, unselected segmented buttons.
- **Border Focus** (`#0284C7`) — High-contrast active selection rings.

### Singular Semantic Accents
- **Instrument Cobalt** (`#0284C7` / Sky-600) — Primary CTAs, active tab indicators, brand marks.
- **RF Optimal Green** (`#059669` / Emerald-600) — Healthy links (RSSI >= -65 dBm, SNR >= 25 dB).
- **RF Warning Amber** (`#D97706` / Amber-600) — Marginal signal attenuation or legacy device caps.
- **RF Critical Crimson** (`#DC2626` / Red-600) — Severe jamming, interference, or dropped packets.

---

## 3. Typography Architecture

- **Primary Sans:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Outfit', 'Geist', sans-serif`
  - Track-tight on headlines (`letter-spacing: -0.02em`).
  - Controlled weight scale (400 regular, 600 semibold, 700 bold, 800 heavy).
  - Maximum 65 characters per line on prose.
- **Precision Monospace:** `'SF Mono', 'JetBrains Mono', 'Consolas', Menlo, monospace`
  - Applied to **every physical measurement and network address**: RSSI dBm, SNR dB, MCS Index, PHY link rates, Channel numbers, BSSID, MAC, IPv4, Subnet masks.

---

## 4. Component Stylings & Interaction Rules

- **Buttons:**
  - Flat, crisp 1px borders, zero neon glow.
  - Tactile physical feedback on click: `transform: translateY(1px)` with `box-shadow: none`.
- **Cards & Panels:**
  - Refined rounded corners (`8px` to `12px`).
  - Subtle diffused whisper elevation (`box-shadow: 0 1px 3px rgba(0,0,0,0.05)`).
  - Strict spatial separation: elements never overlap text or icons.
- **Loading & State Transitions:**
  - Skeletal loaders matching exact container dimensions with smooth pulse animations.
- **RF Spectrum Meter:**
  - Calibrated physical scale (-100 dBm to -30 dBm) with continuous SNR span indicator.

---

## 5. Anti-Patterns (Explicitly Banned)
- ❌ No dark navy / purple cyber glowing backgrounds.
- ❌ No gradient text fills on main headlines.
- ❌ No frosted-glass heavy blur blobs over unreadable text.
- ❌ No decorative emoji spam as the sole status indicator.
- ❌ No ungrounded / phantom numbers — every metric maps to real Wi-Fi telemetry.
- ❌ No AI jargon words ("Unleash", "Next-Gen", "Elevate").
