# Phase 01: Quick Wins

**Status:** ⬜ Pending  
**Dependencies:** None  
**Estimated Duration:** 10-12 ngày  
**Priority:** 🔥 Cao

---

## 🎯 Objective

Triển khai 5 tính năng có impact cao nhưng effort thấp để cải thiện UX của Preview Tab ngay lập tức:
1. Inline Editing
2. Export to Word
3. Preview Modes Toggle
4. Quick Copy Buttons  
5. Color Theme Picker

**Why Quick Wins First?**
- Tạo momentum và value ngay
- User feedback sớm để adjust Phase 2/3
- Giảm switching tabs (inline edit) - biggest pain point

---

## 📋 Requirements

### Functional Requirements

#### Feature 1: Inline Editing
- [ ] Click vào Title → contentEditable
- [ ] Click vào Intro Text → textarea popup
- [ ] Click vào Scope/Deliverables → rich text editor
- [ ] Auto-save sau 2s debounce
- [ ] Visual indicator khi đang edit
- [ ] Undo/Redo support

#### Feature 2: Export to Word (.docx)
- [ ] Button "Xuất Word" cạnh "Xuất PDF"
- [ ] Convert HTML preview → .docx format
- [ ] Preserve formatting (bold, tables, lists)
- [ ] Preserve company logo
- [ ] Download với tên file: `{quotationNo}_{date}.docx`

#### Feature 3: Preview Modes Toggle
- [ ] Toggle bar: [Desktop] [Tablet] [Mobile] [Print]
- [ ] Desktop: Full width (default)
- [ ] Tablet: 768px width, centered
- [ ] Mobile: 375px width, centered
- [ ] Print: Remove toolbar, optimize for A4

#### Feature 4: Quick Copy Buttons
- [ ] Button "Copy Summary" → copy AI-generated summary
- [ ] Button "Copy Email" → copy AI-generated email
- [ ] Button "Copy Table" → copy pricing table as markdown
- [ ] Toast notification "Copied!"
- [ ] Fallback for browsers without Clipboard API

#### Feature 5: Color Theme Picker
- [ ] Dropdown với presets:
  - Blue (Professional) - current
  - Green (Eco/Sustainable)
  - Red (Premium)
  - Orange (Creative)
  - Custom (color picker)
- [ ] Apply theme to:
  - Header background
  - Section titles
  - Accent colors
- [ ] Save theme preference per quotation

### Non-Functional Requirements
- [ ] Performance: Inline edit latency <100ms
- [ ] Export Word: Complete trong <5s
- [ ] Theme switch: Instant (<50ms)
- [ ] Mobile responsive: All features work on mobile

---

## 🛠️ Implementation Steps

### Step 1: Inline Editing (3-5 ngày)

**1.1. Create InlineEditor Component** (1 ngày)
```tsx
// components/quotation/preview/InlineEditor.tsx
- Props: value, onChange, type (text | textarea | richtext)
- State: isEditing, tempValue
- Features: 
  - Click to edit
  - Blur to save (debounced)
  - ESC to cancel
  - Loading indicator
```

**1.2. Integrate into PreviewTab** (1 ngày)
- Wrap Title with `<InlineEditor type="text">`
- Wrap Intro Text with `<InlineEditor type="textarea">`
- Wrap Scope/Deliverables with `<InlineEditor type="richtext">`

**1.3. Add Auto-Save Logic** (1 ngày)
```ts
- useDebounce hook (2s delay)
- Call onSave prop from QuotationEditor
- Handle errors (retry logic)
- Show save status indicator
```

**Files to create:**
- `components/quotation/preview/InlineEditor.tsx`
- `hooks/useDebounce.ts` (if not exists)

**Files to modify:**
- `components/quotation/PreviewTab.tsx`

---

### Step 2: Export to Word (2-3 ngày)

**2.1. Install Dependencies** (0.5 ngày)
```bash
npm install html-docx-js file-saver
npm install -D @types/file-saver
```

**2.2. Create Word Export Utility** (1 ngày)
```ts
// lib/export/word-export.ts
export async function exportToWord(htmlContent: string, filename: string) {
  - Clean HTML (remove non-printable elements)
  - Convert to docx blob
  - Download file
  - Error handling
}
```

**2.3. Add Export Button** (0.5 ngày)
```tsx
// components/quotation/preview/ExportWordButton.tsx
- Button component
- Loading state
- Error handling
- Success toast
```

**2.4. Integration** (0.5 ngày)
- Add button to PreviewTab toolbar
- Extract printArea HTML content
- Call exportToWord function

**Files to create:**
- `lib/export/word-export.ts`
- `components/quotation/preview/ExportWordButton.tsx`

**Files to modify:**
- `components/quotation/PreviewTab.tsx`
- `package.json`

---

### Step 3: Preview Modes Toggle (2 ngày)

**3.1. Create PreviewModeToggle Component** (1 ngày)
```tsx
// components/quotation/preview/PreviewModeToggle.tsx
type PreviewMode = 'desktop' | 'tablet' | 'mobile' | 'print';
- Button group for mode selection
- Active state styling
- Icon for each mode
```

**3.2. Add Responsive Wrapper** (1 ngày)
```tsx
// Update PreviewTab.tsx
- State: previewMode
- Wrapper div with dynamic className
- CSS for each mode:
  - desktop: w-full
  - tablet: w-[768px] mx-auto
  - mobile: w-[375px] mx-auto
  - print: @media print styles
```

**Files to create:**
- `components/quotation/preview/PreviewModeToggle.tsx`

**Files to modify:**
- `components/quotation/PreviewTab.tsx`
- `components/quotation/PreviewTab.tsx` (CSS)

---

### Step 4: Quick Copy Buttons (1 ngày)

**4.1. Create QuickCopyButtons Component** (0.5 ngày)
```tsx
// components/quotation/preview/QuickCopyButtons.tsx
- copyToClipboard utility function
- Buttons: Copy Summary, Copy Email, Copy Table
- Toast notifications
- Fallback for non-Clipboard API browsers
```

**4.2. Integrate into PreviewTab** (0.5 ngày)
- Add buttons to AI section
- Wire up with existing summaryText, emailText
- Add "Copy Table" logic (convert table → markdown)

**Files to create:**
- `components/quotation/preview/QuickCopyButtons.tsx`
- `lib/utils/copy-to-clipboard.ts`
- `lib/utils/table-to-markdown.ts`

**Files to modify:**
- `components/quotation/PreviewTab.tsx`

---

### Step 5: Color Theme Picker (2 ngày)

**5.1. Define Theme Presets** (0.5 ngày)
```ts
// lib/themes/quotation-themes.ts
export const QUOTATION_THEMES = {
  blue: { primary: '#3B82F6', accent: '#1E40AF', ... },
  green: { primary: '#10B981', accent: '#059669', ... },
  red: { primary: '#EF4444', accent: '#DC2626', ... },
  orange: { primary: '#F97316', accent: '#EA580C', ... },
};
```

**5.2. Create ThemePicker Component** (1 ngày)
```tsx
// components/quotation/preview/ThemePicker.tsx
- Dropdown with color swatches
- Custom color picker (color input)
- Preview live
- Save to quotation data
```

**5.3. Apply Theme to PreviewTab** (0.5 ngày)
```tsx
// Update PreviewTab.tsx
- Read theme from data.theme
- Generate CSS variables
- Apply to elements with data-theme-color attribute
```

**Files to create:**
- `lib/themes/quotation-themes.ts`
- `components/quotation/preview/ThemePicker.tsx`

**Files to modify:**
- `components/quotation/PreviewTab.tsx`
- `types/quotation.ts` (add theme field)

---

## 📂 Files to Create/Modify

### New Files (8 files)
```
components/quotation/preview/
├── InlineEditor.tsx
├── ExportWordButton.tsx
├── PreviewModeToggle.tsx
├── QuickCopyButtons.tsx
└── ThemePicker.tsx

lib/
├── export/word-export.ts
├── themes/quotation-themes.ts
└── utils/
    ├── copy-to-clipboard.ts
    └── table-to-markdown.ts

hooks/
└── useDebounce.ts (if not exists)
```

### Modified Files (3 files)
```
components/quotation/PreviewTab.tsx  # Main integration
types/quotation.ts                   # Add theme field
package.json                         # New dependencies
```

---

## 🧪 Test Criteria

### Manual Testing
- [ ] **Inline Edit Test:**
  1. Open quotation preview
  2. Click on Title → should become editable
  3. Type new text → wait 2s → check auto-save
  4. Refresh page → changes persisted

- [ ] **Export Word Test:**
  1. Click "Xuất Word" button
  2. File should download within 5s
  3. Open .docx → verify formatting intact
  4. Verify logo, tables, Vietnamese text render correctly

- [ ] **Preview Modes Test:**
  1. Toggle to Tablet → preview should resize to 768px
  2. Toggle to Mobile → preview should resize to 375px
  3. Toggle to Print → toolbar should hide
  4. Toggle back to Desktop → full width

- [ ] **Quick Copy Test:**
  1. Generate AI summary
  2. Click "Copy Summary" → toast appears
  3. Paste in text editor → content matches
  4. Repeat for Email and Table

- [ ] **Theme Picker Test:**
  1. Select "Green" theme
  2. Headers should turn green
  3. Save quotation
  4. Refresh → theme persists

### Automated Tests
- [ ] Unit test: InlineEditor debounce logic
- [ ] Unit test: exportToWord produces valid .docx
- [ ] Unit test: copyToClipboard works with mock Clipboard API
- [ ] Integration test: Theme change reflects in DOM

---

## ⚠️ Edge Cases & Error Handling

### Inline Editing
- **Network failure during save:** Show retry button
- **User navigates away while editing:** Prompt "Unsaved changes"
- **Concurrent edits (multi-user):** Last write wins (acceptable for Phase 1)

### Export Word
- **Large quotations (>50 items):** Show progress indicator
- **Special characters in filename:** Sanitize filename
- **Browser doesn't support download:** Fallback to new tab

### Preview Modes
- **Very long content in Mobile:** Should scroll, not overflow
- **Custom CSS breaks layout:** Ensure @media queries don't conflict

### Copy Buttons
- **Clipboard API not available:** Show "Manual copy" textarea
- **Empty content:** Disable button, show tooltip

### Theme Picker
- **Invalid hex color:** Validation before allowing custom
- **Theme breaks readability:** Enforce minimum contrast

---

## 🔗 Dependencies for Next Phase

Phase 2 will build on:
- **Inline Editing** → Section Reordering (need editable sections first)
- **Theme Picker** → Template System (themes per template)

---

## 📊 Success Metrics

After Phase 1 completion:
- [ ] Inline editing reduces tab switches by 30%
- [ ] Word export success rate >95%
- [ ] Users try Preview Modes within 1 week
- [ ] Copy buttons used >10x per day
- [ ] At least 3 different themes used

---

## 📝 Notes

- Keep UI changes minimal và non-breaking
- All features có feature flag (environment variable) để dễ rollback
- Collect user feedback ngay sau deploy Phase 1

---

**Next Phase:** [phase-02-power-features.md](./phase-02-power-features.md)

**Start Implementation:**
```bash
/code plans/260204-0020-preview-enhancements/phase-01-quick-wins.md
```
