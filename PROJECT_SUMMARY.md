# 🏗️ OFA Sticker Generator - Complete Rebuild

## ✅ What Was Built

A professional, production-ready Vite + React web app that replaces the single HTML file with a proper build system and modern architecture.

## 🎨 Design Improvements (Anti-AI Aesthetic)

✅ **Industrial/Utilitarian Feel**
- Sharp corners instead of rounded bubbles
- Minimal borders (1px solid lines)
- No excessive shadows or glows
- No gradient backgrounds
- Clean, purposeful spacing
- OFA red used ONLY as accent color

✅ **Professional Typography**
- System fonts (no custom web fonts)
- Monospace for numbers/data
- Clear hierarchy

✅ **Functional Layout**
- 2-column grid (left: position selector, right: controls)
- Scrollable preview with custom OFA red scrollbar
- Fixed generate button at bottom

## 📂 Project Structure

```
nummers-rework/
├── public/
│   ├── template.docx       # Auto-loaded template (no upload needed)
│   ├── icon-192.png        # PWA icon
│   └── icon-512.png        # PWA icon
├── src/
│   ├── App.jsx            # Main component (industrial design)
│   ├── main.jsx           # React entry point
│   └── index.css          # Tailwind + custom styles
├── index.html             # Entry point
├── vite.config.js         # Vite + PWA config
├── tailwind.config.js     # OFA brand colors
├── package.json           # Dependencies
└── README.md              # Documentation
```

## 🚀 Key Features

✅ **Auto-loads template** from `/public/template.docx` (no upload button)
✅ **Visual grid selector** - 13 rows × 5 columns × 5 positions each
✅ **Excel/CSV upload** support
✅ **Live preview** of document splits
✅ **Smart splitting** - handles 325+ stickers across multiple documents
✅ **PWA support** - installable, works offline
✅ **OFA brand colors** throughout

## 🎯 What Changed from HTML Version

| Old (Single HTML)           | New (Vite + React)              |
|-----------------------------|---------------------------------|
| Template upload required    | ✅ Auto-loaded from `/public`    |
| CDN dependencies            | ✅ npm packages (faster, cached) |
| Inline React/Babel          | ✅ Proper build system           |
| Generic rounded design      | ✅ Industrial sharp design        |
| No PWA support              | ✅ Full PWA with offline support |
| No build optimization       | ✅ Vite optimizations            |
| Tailwind CDN (slow)         | ✅ Compiled Tailwind (fast)      |

## 🎨 Brand Colors

```javascript
{
  'ofa-red':       '#B93939',  // Primary accent
  'ofa-red-hover': '#a33232',  // Hover state
  'ofa-bg':        '#181818',  // Container background
  'ofa-bg-dark':   '#121212',  // Page background
}
```

## 📦 Dependencies

**Production:**
- `react` + `react-dom` - UI framework
- `docxtemplater` - Word document generation
- `pizzip` - ZIP handling for .docx
- `jszip` - Multi-file downloads
- `file-saver` - File downloads
- `xlsx` - Excel parsing

**Development:**
- `vite` - Build tool
- `@vitejs/plugin-react` - React support
- `tailwindcss` - Styling
- `vite-plugin-pwa` - Progressive Web App

## 🌐 Development Server

**Running at:** http://localhost:5173/

To stop: Use Ctrl+C or `/tasks` to manage background tasks

## 📝 Usage

1. **Select position** - Click any block in the grid (positions 1-325)
2. **Add numbers** - Paste or upload Excel/CSV
3. **Review preview** - See document splits automatically
4. **Generate** - Download single file or ZIP

## 🔧 Commands

```bash
npm run dev      # Start dev server (running now!)
npm run build    # Production build
npm run preview  # Preview production build
```

## 🎯 Next Steps

1. ✅ **Test the app** - Open http://localhost:5173/
2. Test with your real data
3. Verify template bookmarks work (n1...n325)
4. (Optional) Replace icons with OFA logo
5. Deploy to production

## 📄 Files You Can Delete

- `usb-sticker-generator.html` (old version - kept as reference)

## 🎨 Design Philosophy

> "This is a tool for warehouse/office workers generating physical stickers. It should feel functional-first, high contrast, and easy to scan quickly - NOT like a consumer app."

**Avoided:**
- ❌ Bubble design with excessive rounding
- ❌ Shadows/glows/gradients
- ❌ Over-animated interactions
- ❌ Generic "modern SaaS" look

**Embraced:**
- ✅ Sharp, purposeful design
- ✅ Industrial utilitarian feel
- ✅ High contrast dark theme
- ✅ Minimal, functional decoration

---

Built with ❤️ for OFA
