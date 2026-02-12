# ZFENIX Design System v2.0 - Tech Premium

## 🎨 Color Palette (ZFENIX Brand Identity)

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **ZF Navy** | `#053663` | `5, 54, 99` | Primary brand, headers, CTAs |
| **ZF Navy Light** | `#0B4A80` | `11, 74, 128` | Hover states, lighter accents |
| **ZF Navy Dark** | `#042A4C` | `4, 42, 76` | Deep backgrounds, shadows |
| **ZF Blue** | `#178AF3` | `23, 138, 243` | Interactive elements, links |
| **ZF Blue Light** | `#4DA3F6` | `77, 163, 246` | Hover, active states |
| **ZF Blue Dark** | `#0F6FC9` | `15, 111, 201` | Pressed states |
| **ZF Graphite** | `#2F343A` | `47, 52, 58` | Text, dark UI elements |

### Gradient Palette (NEW)
| Name | CSS Value | Usage |
|------|-----------|-------|
| **Ocean Depth** | `linear-gradient(135deg, #053663 0%, #0B4A80 50%, #178AF3 100%)` | Hero sections, cards |
| **Sky Glow** | `linear-gradient(135deg, #178AF3 0%, #4DA3F6 100%)` | Buttons, accents |
| **Midnight** | `linear-gradient(180deg, #042A4C 0%, #053663 100%)` | Dark backgrounds |
| **Glass Tint** | `linear-gradient(135deg, rgba(23,138,243,0.1) 0%, rgba(77,163,246,0.05) 100%)` | Glassmorphism overlays |

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#10B981` | Success states, positive metrics |
| **Warning** | `#F59E0B` | Warnings, pending states |
| **Error** | `#EF4444` | Errors, destructive actions |
| **Info** | `#3B82F6` | Information, tips |

### Neutral Colors
| Name | Hex | Usage |
|------|-----|-------|
| **White** | `#FFFFFF` | Backgrounds, text on dark |
| **Gray 50** | `#F9FAFB` | Light backgrounds |
| **Gray 100** | `#F3F4F6` | Borders, dividers |
| **Gray 200** | `#E5E7EB` | Disabled states |
| **Gray 300** | `#D1D5DB` | Placeholders |
| **Gray 400** | `#9CA3AF` | Secondary text |
| **Gray 500** | `#6B7280` | Muted text |
| **Gray 600** | `#4B5563` | Body text |
| **Gray 700** | `#374151` | Headings |
| **Gray 800** | `#1F2937` | Dark text |
| **Gray 900** | `#111827` | Darkest text |

---

## 📝 Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale
| Element | Size | Weight | Line Height | Letter Spacing | Usage |
|---------|------|--------|-------------|----------------|-------|
| **Display** | 64px | 800 | 1.1 | -0.02em | Hero titles |
| **H1** | 48px | 700 | 1.2 | -0.01em | Page titles |
| **H2** | 36px | 600 | 1.3 | -0.005em | Section headers |
| **H3** | 24px | 600 | 1.4 | 0 | Subsection headers |
| **H4** | 20px | 600 | 1.5 | 0 | Card titles |
| **Body Large** | 18px | 400 | 1.6 | 0 | Intro paragraphs |
| **Body** | 16px | 400 | 1.6 | 0 | Default text |
| **Body Small** | 14px | 400 | 1.5 | 0 | Secondary text |
| **Caption** | 12px | 500 | 1.4 | 0.01em | Labels, captions |
| **Overline** | 11px | 600 | 1.3 | 0.08em | Uppercase labels |

---

## 📐 Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight spacing, icon gaps |
| `sm` | 8px | Small gaps |
| `md` | 16px | Default spacing |
| `lg` | 24px | Section gaps |
| `xl` | 32px | Large sections |
| `2xl` | 48px | Page sections |
| `3xl` | 64px | Hero spacing |
| `4xl` | 96px | Extra large gaps |

---

## 🔲 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0px | Sharp edges |
| `sm` | 4px | Small elements |
| `md` | 8px | Buttons, inputs |
| `lg` | 12px | Cards |
| `xl` | 16px | Large cards |
| `2xl` | 24px | Modals, panels |
| `3xl` | 32px | Hero cards |
| `full` | 9999px | Pills, avatars |

---

## 🌫️ Shadows & Elevation

### Shadow Scale
```css
/* Subtle */
--shadow-xs: 0 1px 2px rgba(5, 54, 99, 0.05);
--shadow-sm: 0 1px 3px rgba(5, 54, 99, 0.1), 0 1px 2px rgba(5, 54, 99, 0.06);

/* Medium */
--shadow-md: 0 4px 6px rgba(5, 54, 99, 0.07), 0 2px 4px rgba(5, 54, 99, 0.06);
--shadow-lg: 0 10px 15px rgba(5, 54, 99, 0.1), 0 4px 6px rgba(5, 54, 99, 0.05);

/* Strong */
--shadow-xl: 0 20px 25px rgba(5, 54, 99, 0.1), 0 10px 10px rgba(5, 54, 99, 0.04);
--shadow-2xl: 0 25px 50px rgba(5, 54, 99, 0.15);

/* Colored Glow */
--shadow-blue-glow: 0 8px 32px rgba(23, 138, 243, 0.25);
--shadow-success-glow: 0 8px 32px rgba(16, 185, 129, 0.25);
```

---

## ✨ Glassmorphism Effects

### Glass Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(5, 54, 99, 0.1);
}
```

### Glass Card Dark
```css
.glass-card-dark {
  background: rgba(5, 54, 99, 0.15);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(23, 138, 243, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

---

## 🎭 Animations & Transitions

### Timing Functions
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Duration Scale
| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 100ms | Micro-interactions |
| `fast` | 200ms | Hovers, small changes |
| `normal` | 300ms | Default transitions |
| `slow` | 500ms | Page transitions |
| `slower` | 700ms | Complex animations |

### Keyframe Animations
```css
/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Shimmer (Loading) */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* Pulse Glow */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(23, 138, 243, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(23, 138, 243, 0.6);
  }
}
```

---

## 🎯 Component Patterns

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #178AF3 0%, #4DA3F6 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(23, 138, 243, 0.3);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(23, 138, 243, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}
```

### Cards
```css
/* Premium Card */
.card-premium {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(5, 54, 99, 0.07);
  border: 1px solid rgba(5, 54, 99, 0.05);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card-premium:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(5, 54, 99, 0.12);
  border-color: rgba(23, 138, 243, 0.2);
}
```

### Stat Cards (Dashboard)
```css
.stat-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 28px;
  border: 1px solid rgba(23, 138, 243, 0.1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(23, 138, 243, 0.1) 0%, transparent 70%);
  pointer-events: none;
}
```

---

## 📱 Breakpoints

| Name | Min Width | Description |
|------|-----------|-------------|
| `mobile` | 0px | Mobile phones |
| `tablet` | 768px | Tablets |
| `desktop` | 1024px | Small desktops |
| `wide` | 1280px | Large desktops |
| `ultrawide` | 1536px | Ultra-wide screens |

---

## 🎨 Dark Mode (Future Ready)

### Dark Palette
| Name | Hex | Usage |
|------|-----|-------|
| **BG Primary** | `#0A0E1A` | Main background |
| **BG Secondary** | `#131829` | Cards, panels |
| **BG Tertiary** | `#1E2438` | Elevated surfaces |
| **Text Primary** | `#F1F5F9` | Main text |
| **Text Secondary** | `#94A3B8` | Secondary text |
| **Border** | `#2D3548` | Borders, dividers |

---

## ♿ Accessibility

### Color Contrast
- **AA Standard**: Minimum 4.5:1 for normal text
- **AAA Standard**: Minimum 7:1 for normal text
- All color combinations tested with WCAG guidelines

### Focus States
```css
.focus-visible {
  outline: 2px solid #178AF3;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎯 Implementation Priority

1. ✅ **Phase 1**: Update color variables & gradients
2. ✅ **Phase 2**: Implement glassmorphism cards
3. ✅ **Phase 3**: Add micro-animations
4. ✅ **Phase 4**: Enhance dashboard stats
5. ⏳ **Phase 5**: Dark mode (future)

---

**Version**: 2.0  
**Last Updated**: 2026-02-01  
**Designer**: Antigravity Creative Director
