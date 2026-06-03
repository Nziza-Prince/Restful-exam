# Design System: FEMS Sentinel

## 1. Visual Theme & Atmosphere

A restrained, authoritative command-center interface — dense enough to be productive, airy enough to breathe. Think industrial precision married to modern SaaS composure. The sidebar is always dark, a fixed anchor of contrast against the warm zinc content surface. Navigation is text-first, icon-assisted, never emoji. Numbers render in monospace. Every interactive element responds with tactile subtlety. No decorations that don't earn their place.

- Density: 6/10 — Daily App Balanced
- Variance: 5/10 — Offset Asymmetric  
- Motion: 4/10 — Fluid CSS, purposeful only

## 2. Color Palette & Roles

- **Ink** (`#18181B`) — Zinc-950. Sidebar background, primary text in dark contexts
- **Charcoal** (`#27272A`) — Zinc-800. Secondary sidebar surfaces, dark borders
- **Smoke** (`#71717A`) — Zinc-500. Secondary text, descriptions, metadata
- **Canvas** (`#F4F4F5`) — Zinc-100. Page background in light mode
- **Surface** (`#FFFFFF`) — Cards, modals, inputs
- **Whisper** (`#E4E4E7`) — Zinc-200. Borders, dividers
- **Copper** (`#B45309`) — Amber-700. Single accent. CTAs, active states, focus rings, logo
- **Copper Deep** (`#92400E`) — Amber-800. Hover state for copper accent
- **Danger** (`#DC2626`) — Red-600. Errors, EXPIRED status, delete actions
- **Caution** (`#D97706`) — Amber-600. Warnings, EXPIRING_SOON status
- **Safe** (`#16A34A`) — Green-600. Success, ACTIVE/RENEWED status
- **Info** (`#2563EB`) — Blue-600. Neutral informational states

No purple. No neon. No pure black (`#000000`). Saturation stays below 80% on all accents.

## 3. Typography Rules

- **Display/UI:** `Outfit` — Geometric, distinct, not generic. Weight 400–700. Never Inter.
- **Body:** `Outfit` — Relaxed leading (1.6), 65ch max-width on prose
- **Mono:** `JetBrains Mono` — All numbers in data tables, timestamps, serial numbers, code
- **Scale:** Display 2xl/3xl (track-tight), Body sm/base, Meta xs (track-wide uppercase)
- **Banned:** Inter, system-ui as primary, any generic serif

## 4. Component Stylings

- **Buttons:** Solid flat fill. Primary: copper bg, white text, hover copper-deep, active translate-y-px. No gradients, no outer glows. Secondary: white bg with zinc border. Danger: red-600.
- **Cards:** 1px zinc-200 border, white bg, rounded-xl, shadow-sm. Header has a border-b. StatCards use a 3px left accent border instead of gradient text.
- **Inputs:** Label above, helper text optional, error text below in red. Focus ring 2px copper/20 opacity. 1px zinc-300 border default.
- **Tables:** Striped rows via hover-only. Zinc-50 thead background. Compact 3px top border in thead. Clean pagination — Previous/Next text buttons.
- **Badges:** Rounded-md (not full pill). Reduced padding. Muted background tones.
- **Modals:** Zinc-950/70 backdrop, no blur. Clean dialog: white bg, zinc border, rounded-xl.
- **Loaders:** Inline "Loading…" in zinc-500 italic. No circular spinners.
- **Empty States:** Centered text + subtle description. No icons or illustrations needed.

## 5. Layout Principles

- Sidebar always dark (zinc-950), 240px, fixed on md+. Main content scrolls independently.
- Auth pages: Split layout on lg+ (dark brand panel left, white form right). Centered card on mobile.
- Page content: max-w-7xl container, px-4 sm:px-6 lg:px-8, py-6.
- Stat cards: grid layout, not 4 equal boxes. Use asymmetric sizing where content allows.
- No overlapping elements, no absolute-positioned decorations stacking on content.
- Full-height sections use min-h-[100dvh], never h-screen.

## 6. Motion & Interaction

- Transitions: 150ms ease for color/bg, 100ms for transforms. Nothing slower than 300ms.
- Button active: transform translate-y-px (tactile press). Hover: bg shift only.
- Nav links: 150ms color/bg transition. Active state appears immediately (no animation needed).
- No perpetual animations on dashboard components. Data breathes; it doesn't bounce.
- No spring physics in this context — this is software UI, not a landing page.

## 7. Anti-Patterns (Banned)

- No emojis anywhere — navigation, logos, badges, headers, anywhere
- No Inter font
- No gradient buttons or gradient text on data-heavy views
- No decorative blur blobs or radial gradients as page backgrounds
- No pure black (#000000)
- No neon outer-glow shadows
- No 3-column equal stat-card rows without intentional hierarchy
- No custom mouse cursors
- No AI copywriting ("Elevate", "Seamless", "Unleash")
- No filler scroll indicators or animated chevrons
- No oversaturated accents above 80% saturation
- No fabricated statistics or metric cards with invented data
- No LABEL // YEAR typographic convention
- No gradient logo badges with emoji inside
