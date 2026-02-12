# Document Fusion Feature - Implementation Summary

## ✅ Feature Implemented

An experimental feature that allows users to combine multiple Word documents into a single multi-page document.

---

## 🎨 UI Changes

### 1. Excel/CSV Upload Label
**Before:** `Upload Excel/CSV bestand`
**After:** `Upload Excel/CSV bestand (experimental)`

### 2. Preview Section Toggle
A new toggle appears **only when multiple documents will be generated**:

```
┌─────────────────────────────────────┐
│ Preview                             │
│                                     │
│ ○ Fuseer tot 1 document            │ ← New toggle
│   (experimental)                    │
│                                     │
│ Document 1 - 325 stickers           │
│ Document 2 - 325 stickers           │
│ Document 3 - 75 stickers            │
│                                     │
│ [Genereer 1 Document (3 pagina's)] │ ← Dynamic button text
└─────────────────────────────────────┘
```

**Toggle behavior:**
- Hidden when only 1 document will be generated
- Visible when 2+ documents will be generated
- OFF by default (safe fallback to separate files)

### 3. Dynamic Button Text

**Single document:**
- `Genereer Document`

**Multiple documents (toggle OFF):**
- `Genereer 3 Documenten`

**Multiple documents (toggle ON):**
- `Genereer 1 Document (3 pagina's)`

**Generating:**
- `Bezig met genereren...`

---

## 🔧 Technical Implementation

### State Management

Added new state:
```javascript
const [fuseDocuments, setFuseDocuments] = useState(false)
```

### Function Refactoring

Split `generateDocuments()` into three functions:

1. **`generateDocuments()`** - Main entry point
   - Checks `fuseDocuments` state
   - Routes to fusion or separate document generation
   - Handles success/error alerts

2. **`generateSeparateDocuments()`** - Original logic
   - Creates individual .docx files
   - One file per document split
   - Downloads as ZIP if multiple files

3. **`generateFusedDocument()`** - NEW fusion logic
   - Creates single .docx with multiple pages
   - Clones table structure for each page
   - Manages bookmark IDs across pages
   - Inserts page breaks between sections

---

## 📋 Fusion Algorithm

### Step-by-Step Process

```javascript
1. Load template as PizZip
2. Extract document.xml
3. Find and extract table structure (<w:tbl>...</w:tbl>)
4. Process FIRST PAGE:
   → Replace bookmarks in original table (n1-n325 with IDs 0-324)
   → Fill with first batch of values
5. FOR EACH SUBSEQUENT PAGE:
   → Insert page break: <w:p><w:r><w:br w:type="page"/></w:r></w:p>
   → Clone original table structure
   → Update bookmark IDs:
      • Page 2: IDs 325-649 (names still n1-n325)
      • Page 3: IDs 650-974 (names still n1-n325)
      • Formula: newId = originalId + (pageIndex * 325)
   → Fill bookmarks with page's values
   → Clear unused bookmarks (empty strings)
   → Insert before </w:body> tag
6. Update document.xml in ZIP
7. Generate and download single .docx file
```

### Bookmark ID Management

**Critical:** Word requires **unique bookmark IDs** across the entire document, but bookmark **names can repeat**.

**Example with 3 pages:**

| Page | Bookmark | ID Range | Name Range |
|------|----------|----------|------------|
| 1    | n1-n325  | 0-324    | n1-n325    |
| 2    | n1-n325  | 325-649  | n1-n325    |
| 3    | n1-n325  | 650-974  | n1-n325    |

**Implementation:**
```javascript
const bookmarkIdOffset = pageIndex * 325

// Update all IDs in cloned table
newPageTable = newPageTable.replace(/w:id="(\d+)"/g, (match, id) => {
  const numericId = parseInt(id)
  if (numericId >= 0 && numericId <= 324) {
    return `w:id="${numericId + bookmarkIdOffset}"`
  }
  return match
})
```

---

## 🧪 Testing Scenarios

### Test 1: Two Documents (Simple)
**Input:** 400 numbers starting at position 100
**Result:**
- Doc 1: Positions 100-325 (226 stickers)
- Doc 2: Positions 1-174 (174 stickers)

**With fusion ON:**
- Single .docx file: `USB_Stickers_Combined_2pages.docx`
- Page 1: 226 values
- Page break
- Page 2: 174 values

### Test 2: Five Documents (Medium)
**Input:** 1600 numbers starting at position 1
**Result:**
- 5 documents (325 each, last has 275)

**With fusion ON:**
- Single .docx file: `USB_Stickers_Combined_5pages.docx`
- 5 pages with page breaks between each

### Test 3: Ten+ Documents (Stress Test)
**Input:** 3250 numbers starting at position 1
**Result:**
- 10 documents (all 325 stickers)

**With fusion ON:**
- Single .docx file: `USB_Stickers_Combined_10pages.docx`
- Bookmark IDs range from 0 to 3249

### Test 4: Single Document (Toggle Hidden)
**Input:** 100 numbers starting at position 1
**Result:**
- Toggle doesn't appear (only 1 document)
- Normal generation (no fusion needed)

---

## ⚠️ Known Limitations

### 1. Large Document Count
- **Issue:** 100+ documents may exceed Word's internal limits
- **Likelihood:** Very rare (would need 32,500+ stickers)
- **Mitigation:** No hard limit implemented yet

### 2. Table Structure Dependency
- **Issue:** Template MUST contain `<w:tbl>` structure
- **Current template:** ✅ Has table with 325 bookmarks
- **Fallback:** Error thrown if table not found

### 3. Bookmark ID Range
- **Issue:** Word bookmark IDs are integers
- **Max safe:** Practically unlimited for our use case
- **Example:** 100 pages = IDs 0-32,499 (safe)

### 4. File Size
- **Issue:** Larger file with many pages
- **Impact:** Minimal (Word documents compress well)
- **Example:** 10 pages ≈ same size as 10 separate files

---

## 🐛 Error Handling

### Template Table Not Found
```javascript
const tableMatch = documentXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)
if (!tableMatch) {
  throw new Error('Could not find table structure in template')
}
```
**User sees:** "❌ Fout bij genereren. Check de console voor details."

### General Fusion Failure
```javascript
try {
  await generateFusedDocument()
} catch (error) {
  console.error('Error generating documents:', error)
  alert('❌ Fout bij genereren. Check de console voor details.')
}
```

**Recovery:** User can toggle OFF and generate separate documents

---

## 📦 File Naming

**Separate documents:**
- Single: `USB_Stickers.docx`
- Multiple: `USB_Stickers_1.docx`, `USB_Stickers_2.docx`, etc.
- ZIP: `USB_Stickers_All.zip`

**Fused document:**
- `USB_Stickers_Combined_Xpages.docx`
- Where X = number of pages (e.g., `USB_Stickers_Combined_3pages.docx`)

---

## 🔍 Code Locations

**State:**
```javascript
// Line ~9
const [fuseDocuments, setFuseDocuments] = useState(false)
```

**UI Toggle:**
```javascript
// Line ~470 (Preview section)
{documentSplits.length > 1 && (
  <div className="toggle-container mb-3">
    <label className="toggle-switch">
      <input type="checkbox" checked={fuseDocuments} ... />
    </label>
  </div>
)}
```

**Main Logic:**
```javascript
// Line ~156
const generateDocuments = async () => {
  if (fuseDocuments && documentSplits.length > 1) {
    await generateFusedDocument()
  } else {
    await generateSeparateDocuments()
  }
}
```

**Fusion Implementation:**
```javascript
// Line ~220
const generateFusedDocument = async () => {
  // Extract table
  // Process first page
  // Clone and add subsequent pages with page breaks
  // Update bookmark IDs
  // Generate single file
}
```

---

## ✨ Why This Is Experimental

1. **Complex Word XML manipulation** - relies on specific template structure
2. **Bookmark ID management** - must be perfect or Word corrupts
3. **Limited testing** - edge cases may exist with unusual data
4. **Template dependency** - different templates may break it
5. **Performance** - untested with 100+ documents

**Recommendation:** Use separate documents for production, fusion for convenience.

---

## 🚀 Future Enhancements

Possible improvements if fusion becomes stable:

1. **Progress indicator** for large fusions
2. **Page break customization** (spacing, section breaks)
3. **Header/footer support** per page
4. **Table of contents** generation
5. **Bookmark name customization** per page (optional)

---

## 📝 User Instructions

### How to Use Fusion

1. **Enter data** (paste or upload Excel)
2. **Verify preview** shows multiple documents
3. **Toggle ON:** "Fuseer tot 1 document"
4. **Check button:** Should say "Genereer 1 Document (X pagina's)"
5. **Generate:** Click button
6. **Result:** Single .docx file with multiple pages

### How to Disable Fusion

1. **Toggle OFF:** Uncheck "Fuseer tot 1 document"
2. **Button changes:** "Genereer X Documenten"
3. **Generate:** Creates separate files (or ZIP)

### When to Use Each Mode

**Use Separate Documents (Toggle OFF):**
- ✅ Production/critical work
- ✅ Need individual files
- ✅ Sharing specific documents
- ✅ Maximum compatibility

**Use Fusion (Toggle ON):**
- ✅ Personal convenience
- ✅ Single printout
- ✅ Easier file management
- ✅ Testing/preview

---

**Implementation Status:** ✅ Complete and ready for testing

**Development Server:** http://localhost:5173/

**Test with:** Various data sizes (2 docs, 5 docs, 10+ docs)
