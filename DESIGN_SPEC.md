# OFA Sticker Generator - Design Specification

## 🎨 Design Principles

### Anti-AI Aesthetic Guidelines

This project specifically avoids common "AI-generated" design patterns in favor of a professional, industrial tool aesthetic.

#### ❌ What We Avoid

1. **Rounded Everything**
   - No `rounded-full` or excessive border-radius
   - No pill-shaped buttons
   - No circular containers

2. **Excessive Visual Effects**
   - No drop shadows (except minimal functional ones)
   - No glows or blur effects
   - No gradient backgrounds
   - No animated transitions beyond functional feedback

3. **Generic Modern SaaS Look**
   - No pastel color schemes
   - No "friendly" illustrations
   - No excessive whitespace
   - No decorative elements

#### ✅ What We Embrace

1. **Sharp, Functional Design**
   - Right angles and straight edges
   - 1px solid borders
   - Minimal border-radius (0-2px max)
   - Clean rectangular containers

2. **Industrial Color Palette**
   - Dark backgrounds (#121212, #181818)
   - White text on dark
   - Single accent color (OFA red #B93939)
   - High contrast (4.5:1 minimum)

3. **Utilitarian Typography**
   - System font stack
   - Monospace for data/numbers
   - Clear size hierarchy
   - No decorative fonts

4. **Purposeful Spacing**
   - Consistent padding/margins
   - Grid-based layout
   - Dense information display
   - No excessive gaps

## 📐 Component Specifications

### Grid Blocks

```css
.sticker-block {
  border: 1px solid #333;        /* Subtle, sharp border */
  border-radius: 0;               /* NO rounding */
  background: #1a1a1a;            /* Dark, utilitarian */
  transition: border-color 0.15s; /* Minimal, fast */
}

.sticker-block:hover {
  border-color: #555;             /* Subtle feedback only */
}

.sticker-block.selected {
  background: #B93939;            /* Bold, clear selection */
  border-color: #B93939;
}
```

### Containers

```css
.container {
  background: #181818;
  border: 1px solid #333;
  border-radius: 0;               /* Sharp corners */
  padding: 1.25rem;               /* 20px - functional spacing */
}
```

### Buttons

```css
button {
  background: #B93939;
  color: white;
  border: none;
  border-radius: 0;               /* Sharp, industrial */
  padding: 0.875rem 1.5rem;       /* Comfortable, not excessive */
  font-weight: 600;               /* Clear, readable */
  transition: background-color 0.15s; /* Fast, purposeful */
}

button:hover {
  background: #a33232;            /* Simple darkening */
}
```

### Input Fields

```css
textarea {
  background: #121212;
  border: 1px solid #4a4a4a;
  border-radius: 0;               /* Sharp edges */
  font-family: monospace;         /* For numbers/data */
  transition: border-color 0.15s;
}

textarea:focus {
  border-color: #B93939;          /* OFA red accent */
  outline: none;
}
```

### Scrollbar (Custom)

```css
.preview-scroll::-webkit-scrollbar {
  width: 8px;                     /* Thin, unobtrusive */
}

.preview-scroll::-webkit-scrollbar-track {
  background: #181818;            /* Dark track */
}

.preview-scroll::-webkit-scrollbar-thumb {
  background: #B93939;            /* OFA red thumb */
  border-radius: 2px;             /* Minimal rounding */
}
```

## 🎯 Color Usage Rules

### OFA Red (#B93939)
**Use sparingly for:**
- Primary action buttons
- Selected states
- Important labels (e.g., "Document 1")
- Scrollbar thumb
- Focus indicators

**DO NOT use for:**
- Large background areas
- Body text
- Decorative elements

### Dark Backgrounds
- `#121212` - Page background, deepest
- `#181818` - Container background, medium
- `#1a1a1a` - Grid blocks, lightest dark

### Borders
- `#333` - Default borders
- `#4a4a4a` - Input borders
- `#555` - Hover borders
- `#2d5a2d` - Filled block borders (green)

### Text
- `#ffffff` - Primary text
- `#a0a0a0` - Secondary text (#gray-400)
- `#6b6b6b` - Tertiary text (#gray-500)

## 📱 Responsive Behavior

### Desktop (>1024px)
- 2-column grid layout
- Grid on left, controls on right
- Fixed width containers (max-w-7xl)

### Tablet (768px - 1024px)
- 2-column layout maintained
- Smaller gaps between elements
- Grid scales proportionally

### Mobile (<768px)
- Single column stack
- Grid above controls
- Full-width elements
- Minimum 44px tap targets

## ⚡ Interaction Design

### Transitions
- Duration: 150ms (fast, functional)
- Easing: default (no complex curves)
- Properties: `border-color`, `background-color` only

### Hover States
- Subtle color changes only
- No scale transforms
- No shadow additions
- No position shifts

### Click Feedback
- Immediate background color change
- No ripple effects
- No bounce animations

## 🔤 Typography Scale

```css
/* Header */
h1: 3rem (48px), bold, white
subtitle: 1rem (16px), normal, #a0a0a0

/* Section Headers */
h2: 1.125rem (18px), semibold, white

/* Body */
body: 0.875rem (14px), normal, white

/* Small Text */
small: 0.75rem (12px), normal, #6b6b6b

/* Data/Numbers */
monospace: 0.7rem (11.2px), Courier New
```

## 🎨 Spacing System

```
0.5rem = 8px   - Tight spacing (grid gaps)
0.75rem = 12px - Small padding
1rem = 16px    - Standard spacing
1.25rem = 20px - Container padding
1.5rem = 24px  - Section gaps
2rem = 32px    - Large margins
```

## ✅ Accessibility

- Minimum contrast ratio: 4.5:1
- Focus indicators: OFA red border
- Keyboard navigation: full support
- Screen reader: semantic HTML
- Touch targets: minimum 44px

## 🎯 Success Criteria

A successful design:
- ✅ Looks like a professional internal tool
- ✅ Feels fast and responsive
- ✅ Has high contrast and readability
- ✅ Uses OFA brand sparingly but effectively
- ✅ Avoids looking "AI-generated"
- ✅ Prioritizes function over decoration

---

**Remember:** This is a tool, not a product. Make it work well, look professional, and get out of the user's way.
