# Design System — E‑Learning Managerment

Phiên bản: 1.0.0

## Tổng quan
- Mục tiêu: Xây dựng một Design System cho nền tảng E‑Learning hiện đại, hướng đến trải nghiệm tươi sáng, chuyên nghiệp, phù hợp sinh viên và giảng viên. Gợi cảm giác sản phẩm giống Udemy / Coursera / Notion / Linear / Stripe Dashboard.
- Phong cách: Bright Modern, glassmorphism nhẹ (backdrop blur + semi-transparent surfaces), gradient tươi sáng, typography rõ ràng, micro-interactions tinh tế.
- Nguyên tắc: Accessibility (WCAG AA), responsive, tokens hóa (CSS variables / JSON tokens), hỗ trợ Dark Mode và `prefers-reduced-motion`.

---

## 1. Color Palette (Tokens)
Sử dụng CSS variables theo cấu trúc `--color-{role}-{scale}`.

Light (root)
- `--color-primary-50: #F6F8FF`
- `--color-primary-100: #E9EEFF`
- `--color-primary-300: #9FB4FF`
- `--color-primary-500: #6366F1` (Primary)
- `--color-primary-700: #4F46E5`

Secondary
- `--color-secondary-50: #FFF8F6`
- `--color-secondary-100: #FFEFE9`
- `--color-secondary-300: #FFB6A2`
- `--color-secondary-500: #FF6B4A`

Status
- `--color-success-500: #10B981`
- `--color-warning-500: #F59E0B`
- `--color-error-500: #EF4444`

Neutral / Text / Surface
- `--color-bg: #F8FAFF`
- `--color-surface-100: rgba(255,255,255,0.8)`
- `--color-surface-200: #FFFFFF`
- `--color-text-default: #0F172A`
- `--color-muted-500: #6B7280`

Glassmorphism tokens
- `--glass-bg: rgba(255,255,255,0.6)`
- `--glass-blur: 8px`

Gradients
- `--gradient-primary: linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)`
- `--gradient-accent: linear-gradient(90deg,#FF6B4A 0%,#FFB6A2 100%)`

Dark mode (override)
- `--dm-bg: #0B1220`
- `--dm-surface: rgba(20,25,35,0.6)`
- `--dm-text-default: #E6EEF8`
- `--dm-primary-500: #7C9CFF`
- `--dm-glass: rgba(255,255,255,0.04)`

Contrast: đảm bảo text chính >= 4.5:1 trên background; các nút dùng filled variants để dễ đạt contrast.

---

## 2. Typography
Fonts (Google):
- Primary UI: `Inter` (variable)
- Headings (optional accent): `Poppins` hoặc `Sora`

Import example
```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@500;600;700&display=swap');
```

Scale & tokens
- `--font-family-sans: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`
- Headings
  - `H1`: 40px / 2.5rem — 700 — lh 1.1
  - `H2`: 32px / 2rem — 600 — lh 1.15
  - `H3`: 24px / 1.5rem — 600 — lh 1.2
  - `H4`: 20px / 1.25rem — 600 — lh 1.25
- Body
  - `Body Large`: 18px / 1.125rem — 400 — lh 1.6
  - `Body Regular`: 16px / 1rem — 400 — lh 1.6
  - `Caption`: 14px / 0.875rem — 400 — lh 1.4

Nguyên tắc: dùng `rem`, base = 16px; độ dài dòng 60–75 ch.

---

## 3. Spacing System
- Base unit: 4px.
- Tokens:
  - `--space-1: 4px`
  - `--space-2: 8px`
  - `--space-3: 12px`
  - `--space-4: 16px`
  - `--space-6: 24px`
  - `--space-8: 32px`
  - `--space-12: 48px`
  - `--space-16: 64px`
- Layout: 12-column grid; gutter = `--space-4`.

---

## 4. Border Radius
- `--radius-xs: 4px`
- `--radius-sm: 8px`
- `--radius-md: 12px`
- `--radius-lg: 16px`
- `--radius-pill: 9999px`

Usage: inputs `--radius-sm`, cards `--radius-md`, modals `--radius-lg`, pill buttons `--radius-pill`.

---

## 5. Shadow System
Lightning, multi-layer shadows; tokens:

Light mode
- `--elev-1: 0 1px 2px rgba(12,15,23,0.04), 0 1px 3px rgba(12,15,23,0.06)`
- `--elev-2: 0 6px 18px rgba(12,15,23,0.06)`
- `--elev-3: 0 20px 40px rgba(12,15,23,0.08)`
- `--elev-glass: 0 6px 24px rgba(99,102,241,0.08)`

Dark mode
- `--dm-elev-1: 0 1px 2px rgba(0,0,0,0.6)` (reduce spread)

Glass: combine `backdrop-filter: blur(var(--glass-blur))` + `background: var(--glass-bg)` + `box-shadow: var(--elev-glass)`.

---

## 6. Dark Mode Support
- Implement bằng attribute `[data-theme="dark"]` hoặc class `.theme-dark` để override token map.
- Tránh dùng `#000` thuần; dùng near-black `#0B1220`.
- Kiểm tra contrast cho mọi token interactive.

---

## 7. Component Specifications
Tất cả component export token-based styles; ghi ngắn gọn các variants, sizes, states.

Button
- Variants: `primary`, `secondary`, `ghost`, `outline`, `danger`.
- Sizes: `sm` (32px), `md` (40px), `lg` (48px).
- Tokens: `--btn-radius: var(--radius-sm)`, `--btn-font-weight: 600`.
- States: hover (elevate + darken 8–12%), active (translateY(1px) + scale(0.995)), focus (4px ring `rgba(99,102,241,0.16)`), disabled (opacity 0.5).

Input (text/select)
- Default height 40px, bg `--input-bg`, border `--input-border`.
- Focus: border `--color-primary-500`, ring `--input-focus-ring`.
- Error: border `--color-error-500` + `aria-invalid`.

Modal
- Overlay: `rgba(2,6,23,0.6)`; container: `--surface`, `--radius-lg`, `--elev-3`.
- Accessibility: focus trap, `Esc` to close, `role="dialog"` + `aria-modal="true"`.

Card
- Variants: `default`, `ghost`, `interactive`.
- Padding `--space-4`/`--space-6`, radius `--radius-md`, shadow `--elev-1`.

Table
- Header sticky, row hover highlight `--color-primary-50`, optional zebra.
- Cell padding `--space-3`, accessible sorting attributes.

Sidebar
- Width: collapsed 72px, expanded 240px.
- Active indicator: left accent bar `--color-primary-500`.

Navbar
- Height 64px, glass background, left brand, center search, right user menu.

---

## 8. Animation System (Framer Motion + CSS)
Nguyên tắc: micro-interactions ngắn, page transitions mượt, tuân `prefers-reduced-motion`.

Durations & easings
- XS: 80ms (press)
- SM: 150ms (hover)
- MD: 320ms (modal open)
- LG: 500ms (page transitions)
- `--ease-standard: cubic-bezier(.4,0,.2,1)`

Framer Motion variants (ví dụ)
- Fade In Up (nội dung)
  - initial: `{ opacity: 0, y: 8 }`
  - animate: `{ opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeInOut' } }`
  - exit: `{ opacity: 0, y: -8, transition: { duration: 0.22 } }`

- Button
  - hover: `{ scale: 1.02, transition: { duration: 0.12 } }`
  - tap: `{ scale: 0.98, transition: { duration: 0.08 } }`

- Modal
  - initial: `{ opacity: 0, scale: 0.98 }`
  - animate: `{ opacity: 1, scale: 1, transition: { duration: 0.32, ease: 'easeOut' } }`
  - exit: `{ opacity: 0, scale: 0.98, transition: { duration: 0.24 } }`

CSS keyframes (fallbacks)
- Skeleton shimmer: `@keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }`
- Fade-up fallback: `@keyframes fadeUp { from { opacity:0; transform:translateY(8px)} to {opacity:1; transform:none}}`

Accessibility
- Respects `prefers-reduced-motion: reduce` — chuyển animation thành fade-only hoặc tắt.

---

## Tokens & Implementation Tips
- Export tokens as CSS variables (`tokens.css`) và JSON (`tokens.json`) cho Figma Tokens / Style Dictionary.
- Cung cấp `theme.ts` cho frontend libs (styled-components / emotion / tailwind config).
- Ưu tiên componentized styles; tránh utility classes lộn xộn.

## Accessibility & UX Rules (tóm tắt)
- Focus ring phải rõ ràng (ít nhất 3–4px).
- Keyboard navigation hợp lý; forms có `aria-live` cho status.
- Kiểm tra contrast toàn bộ giao diện trước khi release.

## Deliverables đề xuất
- `DESIGN_SYSTEM.md` (file tài liệu này)
- `tokens.css` — CSS variables
- `tokens.json` — Figma/Style Dictionary
- Demo React components (Button, Modal, Card) dùng Framer Motion

---

Chọn tiếp: `tokens.css` / `tokens.json` / `react-demo`.
