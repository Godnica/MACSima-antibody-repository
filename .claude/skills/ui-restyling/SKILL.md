---
name: ui-restyling
description: Skill for restyling the Antibody Repository Tool frontend with a biotech-modern dark theme, custom color palette, neon accents, custom icons, and institutional logos. Use this skill whenever editing styles, themes, colors, fonts, icons, logos, layouts, or any visual/aesthetic aspect of the Angular frontend. Trigger on any mention of restyling, theme, dark mode, colors, branding, logos, icons, fonts, beautify, make it look good, or visual polish. This skill REPLACES the default Angular Material theme and minimal aesthetic — the app is feature-complete and now needs visual identity.
---

# UI Restyling Skill — Antibody Repository Tool

## Context

The app is feature-complete using Angular 17+ with Angular Material. It currently uses a default Material theme with minimal styling. The goal is to transform it into a visually distinctive biotech-modern dark interface while keeping all functionality intact.

**Rule #1**: Do NOT break any existing functionality. Every restyle change must be CSS/SCSS/template only. Do not modify component logic, services, or API calls unless strictly necessary for the visual change.

---

## Aesthetic Direction: Biotech Modern Dark

**Mood**: A high-tech laboratory control panel. Think: dark backgrounds with precise, glowing data. Scientific but futuristic. Clean but not sterile — there's energy in the accents.

**References**: Think sequencing dashboards, flow cytometry software UIs, genomics data portals — but elevated with modern web design sensibilities.

---

## Color Palette

Define all colors as CSS custom properties in `styles.scss` (global) so they cascade everywhere.

```scss
:root {
  // Base
  --bg-primary: #0d1117;         // Deep dark (main background)
  --bg-secondary: #161b22;       // Card/panel background
  --bg-tertiary: #21262d;        // Elevated surfaces (dialogs, dropdowns)
  --bg-hover: #30363d;           // Hover state on rows/items

  // Text
  --text-primary: #e6edf3;       // Main text
  --text-secondary: #8b949e;     // Muted text, labels
  --text-disabled: #484f58;      // Disabled state

  // Accent — Cyan/Teal (primary action color)
  --accent-primary: #00e5ff;     // Buttons, active nav, links
  --accent-primary-dim: #00b8d4; // Hover state of primary
  --accent-primary-glow: rgba(0, 229, 255, 0.15); // Subtle glow/shadow

  // Accent — Emerald Green (success, positive)
  --accent-success: #00e676;
  --accent-success-dim: #00c853;

  // Accent — Amber (warning, low stock)
  --accent-warning: #ffab00;
  --accent-warning-dim: #ff8f00;

  // Accent — Red/Pink (error, destructive)
  --accent-danger: #ff1744;
  --accent-danger-dim: #d50000;

  // Quality color dots (keep these specific)
  --quality-green: #00e676;
  --quality-yellow: #ffab00;
  --quality-grey: #8b949e;

  // Borders
  --border-default: #30363d;
  --border-accent: rgba(0, 229, 255, 0.3);

  // Shadows
  --shadow-glow: 0 0 20px rgba(0, 229, 255, 0.1);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.4);
}
```

### Angular Material Custom Theme

Override the default theme in `styles.scss` using Angular Material's theming API:

```scss
@use '@angular/material' as mat;

$dark-primary: mat.m2-define-palette(
  (50: #e0f7fa, 100: #b2ebf2, 200: #80deea, 300: #4dd0e1,
   400: #26c6da, 500: #00e5ff, 600: #00b8d4, 700: #0097a7,
   800: #00838f, 900: #006064, contrast: (500: #000000, 900: #ffffff))
);

$dark-accent: mat.m2-define-palette(
  (500: #00e676, contrast: (500: #000000))
);

$dark-warn: mat.m2-define-palette(
  (500: #ff1744, contrast: (500: #ffffff))
);

$dark-theme: mat.m2-define-dark-theme((
  color: (primary: $dark-primary, accent: $dark-accent, warn: $dark-warn)
));

@include mat.all-component-themes($dark-theme);

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  margin: 0;
}
```

---

## Typography

Use Google Fonts. Import in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- **Headings & UI elements**: `'Outfit', sans-serif` — geometric, modern, clean
- **Data, numbers, table cells, code**: `'JetBrains Mono', monospace` — precise, lab-grade readability

```scss
body {
  font-family: 'Outfit', sans-serif;
}

.mat-mdc-table,
.mat-mdc-cell,
.mat-mdc-header-cell,
.mono-data {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

h1, h2, h3, .mat-toolbar {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}
```

---

## Logos & Branding

### File locations

Place logo files in:
```
client/src/assets/logos/
├── ior.png
├── usi.png
└── bios.png
```

Also copy them into the skill assets folder for reference:
```
.claude/skills/ui-restyling/assets/
├── ior.png
├── usi.png
└── bios.png
```

### Where to display logos

**Toolbar** — All three logos in a row on the left side of the toolbar, before the app title:

```html
<mat-toolbar class="app-toolbar">
  <div class="toolbar-logos">
    <img src="assets/logos/ior.png" alt="IOR" class="toolbar-logo">
    <img src="assets/logos/usi.png" alt="USI" class="toolbar-logo">
    <img src="assets/logos/bios.png" alt="BIOS" class="toolbar-logo">
  </div>
  <span class="app-title">Antibody Repository</span>
  <span class="spacer"></span>
  <!-- user menu -->
</mat-toolbar>
```

```scss
.app-toolbar {
  background-color: var(--bg-secondary) !important;
  border-bottom: 1px solid var(--border-default);
  height: 56px;
}

.toolbar-logos {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 20px;
}

.toolbar-logo {
  height: 28px;
  width: auto;
  filter: brightness(0.9) contrast(1.1);
  // If logos are on light backgrounds, add:
  // background: rgba(255,255,255,0.9);
  // border-radius: 4px;
  // padding: 2px 6px;
}

.app-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
  color: var(--accent-primary);
}
```

**Login page** — Logos stacked vertically above the login form, centered, larger (height: 48px).

**Billing PDFs** — Logos in the PDF header (this is server-side, update `pdfGenerator.js` to include logo images at the top).

---

## Icons

Replace default Material Icons with **Material Symbols Outlined** (more modern, variable weight):

In `index.html`, replace the existing Material Icons link with:
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
```

In `styles.scss`:
```scss
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 300,
    'GRAD' 0,
    'opsz' 24;
}
```

Then in templates, use:
```html
<mat-icon fontSet="material-symbols-outlined">science</mat-icon>
```

### Recommended icon mapping for navigation:

| Tab           | Icon name          |
|---------------|--------------------|
| Inventory     | `science`          |
| Experiments   | `biotech`          |
| Low Stock     | `warning`          |
| Billing       | `receipt_long`     |
| Laboratories  | `domain`           |
| Repository    | `search`           |

### Accent glow on active nav icon:
```scss
.mat-mdc-list-item.active {
  .mat-icon {
    color: var(--accent-primary);
    filter: drop-shadow(0 0 6px var(--accent-primary));
  }
}
```

---

## Component Styling Overrides

### Sidenav

```scss
.mat-sidenav {
  background-color: var(--bg-secondary) !important;
  border-right: 1px solid var(--border-default) !important;
  width: 220px;
}

.mat-mdc-nav-list .mat-mdc-list-item {
  color: var(--text-secondary);
  border-radius: 8px;
  margin: 2px 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }

  &.active {
    background-color: var(--accent-primary-glow);
    color: var(--accent-primary);
    border-left: 3px solid var(--accent-primary);
  }
}
```

### Tables

```scss
.mat-mdc-table {
  background-color: var(--bg-secondary) !important;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
}

.mat-mdc-header-row {
  background-color: var(--bg-tertiary) !important;

  .mat-mdc-header-cell {
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border-default);
  }
}

.mat-mdc-row {
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--bg-hover) !important;
  }

  .mat-mdc-cell {
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-default);
  }
}

// Low stock row highlight
.low-stock-row {
  border-left: 3px solid var(--accent-warning);
  background-color: rgba(255, 171, 0, 0.05) !important;
}
```

### Cards

```scss
.mat-mdc-card {
  background-color: var(--bg-secondary) !important;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}
```

### Form Fields

```scss
.mat-mdc-form-field {
  .mdc-text-field--outlined .mdc-notched-outline__leading,
  .mdc-text-field--outlined .mdc-notched-outline__trailing,
  .mdc-text-field--outlined .mdc-notched-outline__notch {
    border-color: var(--border-default) !important;
  }

  &.mat-focused {
    .mdc-notched-outline__leading,
    .mdc-notched-outline__trailing,
    .mdc-notched-outline__notch {
      border-color: var(--accent-primary) !important;
    }
  }

  .mat-mdc-input-element {
    color: var(--text-primary) !important;
  }

  .mat-mdc-floating-label {
    color: var(--text-secondary) !important;
  }
}
```

### Buttons

```scss
// Primary action
.mat-mdc-flat-button.mat-primary {
  background-color: var(--accent-primary) !important;
  color: #000 !important;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--accent-primary-dim) !important;
    box-shadow: var(--shadow-glow);
  }
}

// Danger/warn button
.mat-mdc-flat-button.mat-warn {
  background-color: var(--accent-danger) !important;
  border-radius: 8px;
}

// Outlined/stroked button
.mat-mdc-outlined-button {
  border-color: var(--border-default) !important;
  color: var(--text-primary) !important;
  border-radius: 8px;

  &:hover {
    border-color: var(--accent-primary) !important;
    color: var(--accent-primary) !important;
  }
}
```

### Status Badges (mat-chip)

```scss
.status-planning {
  background-color: var(--bg-tertiary) !important;
  color: var(--text-secondary) !important;
}

.status-executed-not-billed {
  background-color: rgba(0, 229, 255, 0.15) !important;
  color: var(--accent-primary) !important;
}

.status-executed-billed {
  background-color: rgba(0, 230, 118, 0.15) !important;
  color: var(--accent-success) !important;
}
```

### Quality Color Dots

```scss
.quality-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;

  &.green  { background-color: var(--quality-green); box-shadow: 0 0 6px var(--quality-green); }
  &.yellow { background-color: var(--quality-yellow); box-shadow: 0 0 6px var(--quality-yellow); }
  &.grey   { background-color: var(--quality-grey); }
}
```

---

## Login Page

The login page should feel like an entry point to a high-tech system:

- **Centered card** on a dark background
- Logos stacked above the form (IOR, USI, BIOS)
- App title below logos: "Antibody Repository" in `Outfit` bold, `--accent-primary` color
- Subtle animated background: a slow-moving CSS gradient or a faint DNA helix pattern using SVG
- Form fields and login button following the dark theme

```scss
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(0, 229, 255, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(0, 230, 118, 0.04) 0%, transparent 50%),
    var(--bg-primary);
}

.login-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 48px 40px;
  width: 400px;
  box-shadow: var(--shadow-card);
}

.login-logos {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;

  img {
    height: 40px;
    width: auto;
  }
}

.login-title {
  text-align: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: var(--accent-primary);
  margin-bottom: 32px;
}
```

---

## Micro-interactions (subtle, not distracting)

Keep animations minimal but purposeful:

```scss
// Page content fade-in
.page-content {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

// Glow pulse on low stock warning icon
.low-stock-icon {
  animation: pulse-warning 2s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% { filter: drop-shadow(0 0 2px var(--accent-warning)); }
  50%      { filter: drop-shadow(0 0 8px var(--accent-warning)); }
}
```

No other animations. No skeleton loaders. No page transitions. Just these two.

---

## Scrollbar Styling

```scss
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 4px;

  &:hover {
    background: var(--text-disabled);
  }
}
```

---

## Checklist for Restyling

When restyling the app, work through this checklist in order:

1. **Global styles** — Add CSS variables, custom Material theme, fonts, scrollbar to `styles.scss`
2. **index.html** — Add Google Fonts links, Material Symbols link
3. **Toolbar** — Logos, app title, dark background
4. **Sidenav** — Dark styling, active state with glow
5. **Login page** — Full redesign with logos and gradient background
6. **Tables** (all pages) — Dark theme, header styling, hover, borders
7. **Forms** (inventory, experiments, labs) — Dark field styling
8. **Buttons** — Accent colors, border radius, hover glow
9. **Cards & dialogs** — Dark surfaces, border, radius
10. **Status badges** — Colored chips per status
11. **Quality dots** — Glowing dots in inventory/repository tables
12. **Low stock page** — Warning row highlights, pulsing icon
13. **Icons** — Switch to Material Symbols Outlined
14. **Final review** — Check every page in browser, fix any missed elements

## Things to Avoid

- **No white backgrounds anywhere** — everything is dark
- **No default Material theme colors leaking through** — check dialogs, selects, menus
- **No blur/glassmorphism** — keep surfaces opaque with borders
- **No rounded-everything** — max `border-radius: 12px` on cards, `8px` on buttons/inputs
- **No gradients on buttons** — flat colors with glow on hover
- **No complex SVG animations** — only the two defined above (fadeIn + pulse-warning)
- **Do not change component TypeScript files** unless required for template changes (e.g. adding a CSS class binding)