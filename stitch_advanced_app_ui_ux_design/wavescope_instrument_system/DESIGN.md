---
name: WaveScope Instrument System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dddddd'
  on-secondary-container: '#606161'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1a'
  on-tertiary-container: '#868382'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  surface-offset: '#FAFAFA'
  status-critical: '#D32F2F'
  status-attention: '#F57C00'
  status-healthy: '#2E7D32'
  status-neutral: '#455A64'
  border-subtle: '#E5E5E5'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  container-max: 1440px
---

## Brand & Style

The design system is engineered as a **Precise Technical Instrument**. It rejects the aesthetic tropes of consumer "AI" dashboards in favor of high-density, utility-first information design. The brand persona is clinical, objective, and deterministic. It serves network engineers and systems administrators who require high-fidelity telemetry over decorative visualizations.

### Design Movement: Technical Minimalism
The system utilizes a **High-Density Minimalist** approach. It is characterized by:
- **Physical Precision:** Layouts are governed by 1px rules and strict alignment rather than shadows or depth.
- **Data over Decoration:** Every visual mark (color, line, or shape) represents a specific data point or status change.
- **Instrument Density:** Information is packed tightly to allow for rapid cross-referencing of metrics without excessive scrolling.
- **Anti-Slop Logic:** No gradients, no blurs, and no "magic" icons. All interface elements must be auditable.

## Colors

The palette is strictly functional, utilizing a white-dominant base to maximize contrast for raw data readability.

- **Backgrounds:** Pure `#FFFFFF` for primary work surfaces. `#FAFAFA` is used exclusively for structural offsets like sidebars or secondary telemetry panels.
- **Typography:** `#1A1A1A` for all text to ensure maximum legibility. No "low-contrast gray" text is permitted for primary data.
- **Borders:** `#E5E5E5` is the primary tool for separation. All containers, dividers, and table cells are defined by 1px solid lines.
- **RF Status Scale:** Use the status colors (Critical to Healthy) sparingly. These are reserved for status badges and metric-specific highlights (e.g., a "Weak" RSSI value text) and never used for large backgrounds or decorative flourishes.

## Typography

This system uses a dual-type strategy to separate **Interface Narrative** from **Telemetry Data**.

- **Hanken Grotesk (Interface):** Used for navigation, headers, and LLM-generated explanations. It provides a modern, clean, and legible frame for the instrument.
- **JetBrains Mono (Data):** Used for all raw telemetry, table values, MAC addresses, and metric units (dBm, Mbps, %). The monospaced nature ensures that numbers align vertically in tables, facilitating rapid visual scanning of fluctuating values.

**Usage Rules:**
- All numbers must be in `JetBrains Mono`.
- Labels for data fields (e.g., "RSSI:") use `label-caps` in Hanken Grotesk.
- Explanatory text uses `body-md`.

## Layout & Spacing

The layout is a **Fixed-Fluid Hybrid** designed for high information density. 

- **Grid Model:** A 12-column grid with 1px borders acting as the visual gutter. 
- **Density:** Elements are spaced using a tight 4px base unit. 
- **Sectioning:** Content is divided by 1px `#E5E5E5` lines. Do not use white space as the primary separator; use explicit borders to create a "grid of modules" feel.
- **Mobile Adaptation:** On mobile, the 12-column grid collapses to a single column. Horizontal scrolling is permitted for data tables to maintain the integrity of the monospaced columns.

## Elevation & Depth

This system intentionally **avoids 3D elevation**. 
- **No Shadows:** Do not use box-shadows or drop-shadows. Depth is entirely flat.
- **No Blurs:** Transparency and glassmorphism are forbidden as they obscure data clarity.
- **Tonal Layering:** To indicate a "raised" or "active" state (e.g., a selected row in a table), use a subtle background fill of `#FAFAFA` or a high-contrast 2px border on the left edge.
- **Hierarchy:** Established through line weight and font size. The most important data is largest and boldest, not "highest" on the Z-axis.

## Shapes

The design system uses a **Sharp (0px)** roundedness strategy. 
- **Hard Edges:** All buttons, cards, input fields, and badges must have 0px border-radius. 
- **Rationale:** Hard corners reinforce the "instrument" aesthetic and maximize the usable internal area for data display, avoiding the "wasted" corner space of rounded stat-cards.
- **Status Badges:** Use rectangular blocks or clipped-corner polygons (implemented via CSS clip-path) to distinguish between status levels without relying on color alone.

## Components

### Buttons
- **Primary:** Solid `#1A1A1A` background, white monospaced text, 0px radius.
- **Secondary:** 1px `#1A1A1A` border, transparent background, black monospaced text.
- **Mode Toggle (Real vs Sim):** A split-segment control. The active segment has a solid black background. The "Simulated" state must include a high-contrast pattern (diagonal stripes) or a distinct "SIM" label.

### Status Badges
- **Structure:** `[ICON/SHAPE] [TEXT_LABEL]`.
- **Healthy:** Square prefix icon + "HEALTHY" (Green text/border).
- **Attention:** Triangle prefix icon + "ATTENTION" (Orange text/border).
- **Critical:** Diamond prefix icon + "CRITICAL" (Red text/border).
- All badges are 1px bordered boxes with 0px radius.

### Data Tables
- **Header:** `#FAFAFA` background, 1px bottom border, `label-caps` typography.
- **Cells:** 1px borders, `data-md` typography.
- **Alignment:** Numbers are always right-aligned; labels are left-aligned.

### Telemetry Cards
- No shadows. Use a 1px `#E5E5E5` border.
- Group metrics logically (e.g., "Signal Statistics", "Hardware Capabilities").
- Use monospaced font for the primary value and Hanken Grotesk for the unit and label.

### Input Fields
- 1px `#E5E5E5` border. Focus state is a 1px `#1A1A1A` border. No glow.