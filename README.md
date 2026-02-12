# OFA USB Sticker Generator

Professional web app voor het genereren van USB sticker documenten voor OFA.

## Features

- ✅ Genereer Word documenten met USB sticker nummers
- ✅ 325 posities per document (automatische splits bij meer nummers)
- ✅ Visuele grid selector voor startpositie
- ✅ Excel/CSV upload ondersteuning
- ✅ Plak nummers direct uit clipboard
- ✅ Live preview van document splits
- ✅ PWA support (offline gebruik)
- ✅ OFA brand styling

## Tech Stack

- **Vite** - Build tool
- **React** - UI framework
- **Tailwind CSS** - Styling
- **docxtemplater** - Word document generatie
- **pizzip** - ZIP handling voor .docx
- **xlsx** - Excel parsing
- **jszip** - Multi-file downloads
- **vite-plugin-pwa** - Progressive Web App

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in je browser.

## Build

```bash
npm run build
```

Dit genereert een productie-klare build in de `dist/` folder.

## Gebruik

1. **Selecteer startpositie**: Klik op een blok in de grid (elk blok = 5 posities)
2. **Voer nummers in**:
   - Plak nummers direct in het tekstveld (één per regel)
   - Of upload een Excel/CSV bestand
3. **Bekijk preview**: Zie hoeveel documenten er gegenereerd worden
4. **Genereer**: Klik op "Genereer Document(en)" om te downloaden

## Document Logica

- Elk document heeft **325 posities** (13 rijen × 5 kolommen × 5 nummers)
- Als je start op positie 100 met 300 nummers:
  - Document 1: posities 100-325 (226 stickers)
  - Document 2: posities 1-74 (74 stickers)
- Meerdere documenten worden automatisch in een ZIP gedownload

## Template

Het `template.docx` bestand moet bookmarks bevatten genaamd `n1`, `n2`, ..., `n325`.

Het template wordt automatisch geladen uit `/public/template.docx`.

## PWA Features

De app werkt offline na eerste bezoek:
- Template wordt gecached
- Alle assets worden lokaal opgeslagen
- Installeerbaar op desktop/mobiel

## Licentie

Proprietary - OFA Internal Tool
