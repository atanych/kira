# Volat AI — Design System

> Drop this file into your project root. Any AI coding agent (Claude, Cursor, Stitch) reads it and generates on-brand UI without extra context. Update as the brand evolves.

Status: **V1 — locked 2026-04-19**, tuned to 3D avatar (chrome V on deep navy).
Related: [[identity.md]] (brand voice, naming), [[brand/avatars/]] (source images).

---

## 1. Visual Theme & Atmosphere

Volat AI feels like a deep-night workshop where something heavy and precise is being forged. The palette is built on **deep midnight navy** (`#121A2E`) — not true black, not corporate tech-blue — a colour that reads as "after hours, serious work." The brand's single chromatic signal is **brushed chrome silver**, a direct nod to the Volat myth: ancient giants who moved boulders. The chrome is the stone, the navy is the night, and the interface is the artifact.

There is no neon. There is no gradient rainbow. Volat AI doesn't shout — it stands there and you notice. The aesthetic sits between Linear's restraint, Anthropic's warmth, and the understated premium of Swiss watchmaking. Every interactive element feels weighted — as if it would make a sound if you could touch it.

Typography is sharp and geometric. Inter carries almost everything (UI, body, headings at most sizes). Space Grotesk appears on display-sized headings where the brand needs slightly more character. JetBrains Mono handles code and anywhere a technical signal is required.

**Key characteristics:**
- Midnight navy canvas (`#121A2E`) with subtle radial vignette — never flat black, never corporate blue
- Single metallic identity: **Brushed Chrome** (`#C7CDD4`) as the only non-neutral accent; no coloured brand greens/reds/purples
- Warm off-white text (`#F4F6FA`) over navy — pure white is reserved for maximum emphasis only
- Typography: Inter as the workhorse, Space Grotesk for display, JetBrains Mono for code
- Tight letter-spacing on headings (-0.02em to -0.04em), compressed line-heights (1.0–1.15)
- Depth comes from **border weight and inner glows**, not drop shadows
- Motion is slow and weighty — nothing bounces, nothing flashes

---

## 2. Color Palette & Roles

### Primary — Navy Canvas

| Token | Hex | Role |
|---|---|---|
| **Midnight Navy** | `#121A2E` | Primary page background |
| **Deep Navy** | `#1A2340` | Elevated surface (cards, modals) |
| **Navy Surface** | `#22304F` | Highest surface (hover, input fill) |
| **Navy Shadow** | `#0B1020` | Vignette edges, deepest drop |

### Accent — Chrome / Metal

| Token | Hex | Role |
|---|---|---|
| **Chrome Bright** | `#E6EAEE` | Logo highlight, metallic top edge |
| **Chrome** | `#C7CDD4` | Brand signal, primary accent, logo midtone |
| **Chrome Muted** | `#8A94A3` | Secondary accent, icon default |
| **Chrome Deep** | `#4A5365` | Chrome shadow, pressed state |

### Neutrals & Text

| Token | Hex | Role |
|---|---|---|
| **Snow** | `#F4F6FA` | Primary text on dark (default) |
| **Pure White** | `#FFFFFF` | Maximum emphasis (display headings, CTA text) |
| **Fog** | `#B6BDC8` | Secondary text, descriptions |
| **Steel** | `#7A8394` | Tertiary, metadata, captions |
| **Slate** | `#4E5769` | Disabled, placeholder, divider text |

### Borders & Dividers

| Token | Hex | Role |
|---|---|---|
| **Hairline** | `#2B3450` | Default card border, subtle divider |
| **Edge** | `#3A4566` | Hover border, input outline |
| **Signal** | `#C7CDD4` | Active/focused border (= Chrome) |

### Semantic

| Token | Hex | Role |
|---|---|---|
| **Success** | `#6EE7B7` | Confirmations, positive states — desaturated mint, never bright |
| **Warning** | `#FCD34D` | Caution — muted amber |
| **Danger** | `#F87171` | Errors, destructive — soft coral, never vivid red |
| **Info** | `#93C5FD` | Tips, informational callouts |

### Gradients & Glows

- **Navy Vignette** (page background): `radial-gradient(ellipse at center, #1A2340 0%, #121A2E 60%, #0B1020 100%)` — the signature atmosphere. Applied to body.
- **Chrome Gradient** (logo, premium surfaces): `linear-gradient(135deg, #E6EAEE 0%, #C7CDD4 45%, #8A94A3 100%)` — the metallic sheen.
- **Inner Signal Glow** (focus rings): `inset 0 0 0 1px rgba(199, 205, 212, 0.4), 0 0 0 3px rgba(199, 205, 212, 0.12)` — subtle chrome halo, never neon.
- **Ambient Lift** (elevated cards): `0 8px 24px rgba(11, 16, 32, 0.5), 0 0 0 1px #2B3450 inset` — shadow sinks into navy, inner hairline holds the edge.

---

## 3. Typography

### Font Stack

- **Display (hero, large headings):** `Space Grotesk`, fallback `Inter, system-ui, -apple-system, sans-serif`
- **UI / Body (everything else):** `Inter`, fallback `system-ui, -apple-system, sans-serif` — OpenType features `"calt", "rlig", "ss01"` enabled
- **Monospace (code, metadata):** `JetBrains Mono`, fallback `ui-monospace, SFMono-Regular, Menlo, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| Display / Hero | Space Grotesk | 64px (4rem) | 600 | 1.00 | -0.04em |
| H1 | Space Grotesk | 48px (3rem) | 600 | 1.05 | -0.035em |
| H2 | Inter | 36px (2.25rem) | 600 | 1.1 | -0.03em |
| H3 | Inter | 24px (1.5rem) | 600 | 1.2 | -0.02em |
| H4 | Inter | 20px (1.25rem) | 600 | 1.3 | -0.015em |
| Body Large | Inter | 18px (1.125rem) | 400 | 1.55 | 0 |
| Body | Inter | 16px (1rem) | 400 | 1.55 | 0 |
| Body Small | Inter | 14px (0.875rem) | 400 | 1.5 | 0 |
| Caption / Micro | Inter | 12px (0.75rem) | 500 | 1.4 | 0.01em |
| Overline | Inter | 12px (0.75rem) | 600 | 1.3 | 0.12em, UPPERCASE |
| Code Inline | JetBrains Mono | 14px | 400 | 1.5 | 0 |
| Code Block | JetBrains Mono | 13px | 400 | 1.6 | 0 |

### Principles

- **Space Grotesk earns its place.** Use only at display/H1 sizes. Below 36px it gets noisy — switch to Inter.
- **Weights live in a narrow band.** 400 for body, 500 for emphasised inline, 600 for all headings. No 700+ except in rare display cases. No thin weights (<400) anywhere.
- **Tight at the top, loose at the bottom.** Display has -0.04em + 1.00 line-height; body has 0 + 1.55. Hierarchy is carried by spacing, not weight changes.
- **Uppercase earns letter-spacing.** Overlines/tags get +0.12em. Never uppercase a heading.
- **Monospace is a signal.** Use it to mark code, data, keyboard shortcuts, and version numbers — never for aesthetic. Mono is meaning.

---

## 4. Components

### Buttons

**Primary — Chrome CTA**
- Background: `linear-gradient(135deg, #E6EAEE 0%, #C7CDD4 100%)`
- Text: `#121A2E` (Midnight Navy) at Inter 15px weight 600
- Padding: `12px 20px`
- Radius: `8px`
- Border: none
- Shadow: `0 1px 0 rgba(255,255,255,0.35) inset, 0 4px 12px rgba(11,16,32,0.4)`
- Hover: shift gradient brighter by ~4%, shadow deepens
- Active: gradient flips to darker end, shadow collapses
- **Use for:** the single most important action on the page (Book a call, Start, Submit)

**Secondary — Ghost**
- Background: transparent
- Text: `#F4F6FA` at Inter 15px weight 500
- Padding: `12px 20px`
- Radius: `8px`
- Border: `1px solid #3A4566`
- Hover: background `#1A2340`, border `#C7CDD4`
- **Use for:** supporting actions (Learn more, Cancel)

**Tertiary — Link**
- No background, no border
- Text: `#C7CDD4` at Inter 15px weight 500, underline on hover only
- Hover: text `#E6EAEE`

### Cards

- Background: `#1A2340` (Deep Navy)
- Border: `1px solid #2B3450` (Hairline)
- Radius: `12px`
- Padding: `24px` (small), `32px` (standard), `48px` (feature)
- Shadow: `0 8px 24px rgba(11, 16, 32, 0.5)` on elevated cards; none on inline
- Hover (when interactive): border shifts to `#3A4566` (Edge), no transform
- **Accent variant:** swap border to `1px solid #C7CDD4` (Signal) for the single highlighted card per section — never more than one

### Inputs

- Background: `#22304F` (Navy Surface)
- Text: `#F4F6FA` at Inter 15px
- Placeholder: `#4E5769` (Slate)
- Border: `1px solid #2B3450` (Hairline)
- Radius: `8px`
- Padding: `10px 14px`
- Focus: border `#C7CDD4`, glow `0 0 0 3px rgba(199, 205, 212, 0.12)`
- Error state: border `#F87171`, message below in Danger

### Navigation

- Background: `#121A2E` with bottom border `1px solid #2B3450`
- Logo left (chrome V wordmark), links centre/right in Inter 14px weight 500
- Link default: `#B6BDC8` (Fog); hover: `#F4F6FA`; active: `#C7CDD4`
- Primary CTA right (Chrome button)
- Height: 64px desktop, 56px mobile
- Sticky with subtle backdrop-blur (8px) on scroll

### Code Blocks

- Background: `#0B1020` (Navy Shadow)
- Border: `1px solid #2B3450`
- Radius: `8px`
- Padding: `16px 20px`
- Font: JetBrains Mono 13px, line-height 1.6
- Syntax highlight palette: base `#F4F6FA`, keyword `#C7CDD4`, string `#6EE7B7`, number `#FCD34D`, comment `#4E5769`

### Badges / Tags

- Background: `#22304F` or transparent with `1px solid #3A4566`
- Text: `#B6BDC8` Inter 11px weight 600 UPPERCASE, letter-spacing 0.12em
- Radius: `9999px` (pill)
- Padding: `4px 10px`

---

## 5. Layout

### Spacing Scale

Base unit: **4px**. Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`.

- Component internal gap: `16–24px`
- Card padding: `24–48px` (small → feature)
- Section vertical: `96–128px` desktop, `64–80px` mobile
- Component gap in grids: `24px` standard, `16px` dense

### Grid & Container

- Max container: `1200px`, centred, horizontal padding `24px` mobile / `48px` desktop
- Hero: single column, centred, max text width `720px`
- Feature grids: 3-col desktop → 2-col tablet → 1-col mobile
- Never break the container with full-bleed except deliberately (marquees, dividers)

### Whitespace Philosophy

- **Generous between sections.** Let the navy breathe. 96–128px vertical gaps between major chapters. If in doubt, add more.
- **Tight within components.** Card internals are compact and purposeful. Don't inflate.
- **Borders, not boxes.** A `1px #2B3450` hairline separates zones — no background colour changes needed.
- **Align to the grid.** Everything at 4px multiples. No 13px, no 22px. This is a craftsmanship brand; it shows.

### Border Radius Scale

| Size | Use |
|---|---|
| `4px` | Inline tags, small inputs, code spans |
| `8px` | Buttons, inputs, code blocks, small cards |
| `12px` | Standard cards, modals |
| `16px` | Large feature cards, hero panels |
| `9999px` | Pills only (badges, avatars) |

Never exceed `16px` on rectangular surfaces. No weird `20px` or `24px`.

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | No border, no shadow | Page background, inline text |
| 1 — Contained | `1px solid #2B3450` | Default card, nav, input |
| 2 — Hover | `1px solid #3A4566` | Interactive card hover |
| 3 — Active | `1px solid #C7CDD4` (Chrome) | Focused, selected, highlighted |
| 4 — Ambient | `0 8px 24px rgba(11,16,32,0.5)` + Level 1 border | Elevated card, dropdown |
| 5 — Deep | `0 24px 60px rgba(0,0,0,0.6)` + `0 0 0 1px #2B3450 inset` | Modal, hero card |

**Philosophy:** Depth is carried by **border colour**, not shadow density. Chrome border = maximum signal. Shadows are warm, diffused, and slow — they sink into the navy, they don't pop off it. Never stack multiple shadows. Never use box-shadow for decoration.

---

## 7. Motion

- **Duration:** default `200ms`, hover `150ms`, modal/page `300ms`. Nothing over `400ms`.
- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out, heavy). Default curve.
- **What animates:** opacity, background-color, border-color, transform (translate/scale by max 2%). **Never** animate height (use max-height or grid).
- **Glow pulse** (logo only): `drop-shadow(0 0 4px rgba(199,205,212,0.2))` → `drop-shadow(0 0 10px rgba(199,205,212,0.35))`, 2.4s ease-in-out infinite.
- **Reduced motion:** honour `prefers-reduced-motion: reduce` — collapse all motion to instant except opacity fades (keep `150ms`).

---

## 8. Do's and Don'ts

### Do
- Use **Midnight Navy** (`#121A2E`) as the canvas. Always with the radial vignette.
- Use **Chrome** (`#C7CDD4`) as the single brand accent — logo, primary CTA gradient, focus rings, active borders.
- Keep text at **Snow** (`#F4F6FA`) for body; reserve **Pure White** for display only.
- Use **border-colour shifts** to communicate state (Hairline → Edge → Signal).
- Use **Space Grotesk** only at display/H1 scale; everything else is **Inter**.
- Pair dark navy with slow, heavy motion — the brand is weight.
- Use JetBrains Mono for code, version numbers, keyboard shortcuts, data — anywhere "technical" is the signal.

### Don't
- Don't use pure black (`#000`) as background. The navy is the brand.
- Don't introduce a second accent colour (no emerald, no cyan, no orange). Chrome is the only accent.
- Don't use coloured gradients on text or buttons other than the Chrome gradient.
- Don't use drop shadows as decoration. Shadows are ambient and heavy, not playful.
- Don't use weight 700+ or weight <400. The palette is 400/500/600 only.
- Don't apply uppercase to headings — only overlines and badges.
- Don't round corners beyond 16px on rectangles. Only pills go to 9999px.
- Don't mix serif or decorative fonts. Inter + Space Grotesk + JetBrains Mono. Nothing else.
- Don't animate faster than 150ms or slower than 400ms.
- Don't stack shadows or use glow liberally. One glow: the logo pulse.

---

## 9. Responsive Behavior

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | `<640px` | Single column, 16px horizontal padding, hero text 36px |
| Tablet | `640–1024px` | 2-column grids, 24px padding, hero text 48px |
| Desktop | `1024–1440px` | Full multi-col, 48px padding, hero text 64px |
| Large | `>1440px` | Max-width 1200px centred, generous margins |

- Hero typography scales: `64px → 48px → 36px` (desktop → tablet → mobile)
- Minimum touch target: `44×44px`
- Horizontal scroll for code blocks on mobile (don't wrap)
- Nav collapses to hamburger below 768px

---

## 10. Agent Prompt Guide

### Quick color reference
- Canvas: "Midnight Navy (#121A2E)"
- Elevated surface: "Deep Navy (#1A2340)"
- Brand accent: "Chrome (#C7CDD4)"
- Logo gradient: "linear-gradient 135deg #E6EAEE → #C7CDD4 → #8A94A3"
- Primary text: "Snow (#F4F6FA)"
- Secondary text: "Fog (#B6BDC8)"
- Border default: "Hairline (#2B3450)"
- Border active: "Chrome (#C7CDD4)"

### Example prompts

> "Build a hero section with a Midnight Navy (#121A2E) background and radial vignette to Deep Navy (#1A2340). Headline in Space Grotesk 64px weight 600, line-height 1.0, letter-spacing -0.04em, colour Pure White. Subhead in Inter 18px weight 400, colour Fog (#B6BDC8), max-width 640px. Primary CTA with Chrome gradient background (#E6EAEE → #C7CDD4), text Midnight Navy, padding 12px 20px, radius 8px."

> "Create a feature card on Deep Navy (#1A2340) with 1px solid Hairline (#2B3450) border, radius 12px, padding 32px. Title in Inter 24px weight 600 Snow. Body in Inter 16px weight 400 Fog. On hover, border shifts to Edge (#3A4566), no transform."

> "Design a form input with Navy Surface (#22304F) background, Hairline border, radius 8px. On focus, border becomes Chrome (#C7CDD4) with a 3px glow at 12% opacity. Placeholder in Slate (#4E5769)."

### Iteration guide

1. **Name colours explicitly.** "Use Fog (#B6BDC8)" beats "make it lighter."
2. **Elevate by border, not shadow.** "Change border to Chrome (#C7CDD4)" = promote to active.
3. **Check the weight ceiling.** If a heading looks wrong, it's probably at weight 700 — drop to 600.
4. **Check font mapping.** Display → Space Grotesk. Anything <36px → Inter.
5. **Radial vignette on body.** If the page looks flat, the vignette is missing.
6. **Motion feels light? Slow it down.** Volat AI is weight, not bounce.
