# Phase 02: Power Features

**Status:** ✅ Complete  
**Dependencies:** Phase 01 (Inline Editing, Theme Picker)  
**Estimated Duration:** 3 tuần  
**Priority:** 🟡 Trung bình

---

## 🎯 Objective

Triển khai 5 tính năng nâng cao tạo competitive advantage:
6. Template System
7. Section Reordering (Drag & Drop)
8. Rich Media Embeds
9. AI Review & Suggestions
10. Export to Excel

**Why Power Features?**
- Differentiate from competitors
- Advanced customization capabilities
- AI-powered quality assurance

---

## 📋 Requirements

### Feature 6: Template System
- [ ] 3 built-in templates: Standard, Minimalist, Detailed
- [ ] Template preview thumbnails
- [ ] Switch template preserves data
- [ ] Custom template creator (admin only)
- [ ] Template saved with quotation

### Feature 7: Section Reordering
- [ ] Drag & drop sections (Scope, Deliverables, Pricing, etc.)
- [ ] Visual drag indicator
- [ ] Save new order
- [ ] Responsive on mobile (touch events)

### Feature 8: Rich Media Embeds
- [ ] Upload images (size limit: 5MB)
- [ ] Embed YouTube videos (URL input)
- [ ] Add charts (integration with Chart.js)
- [ ] Image gallery view
- [ ] Remove/replace media

### Feature 9: AI Review & Suggestions
- [ ] Button "🤖 AI Review"
- [ ] Check: Grammar, pricing consistency, missing info
- [ ] Suggestion list with priority (high/medium/low)
- [ ] Accept/Dismiss suggestions
- [ ] Confidence score per suggestion

### Feature 10: Export to Excel
- [ ] Export pricing table only
- [ ] Columns: STT, Nội dung, KL, Đơn giá, Thành tiền, Ghi chú
- [ ] Format: Currency, numbers
- [ ] Filename: `{quotationNo}_pricing.xlsx`

---

## 🛠️ Implementation Steps

### Step 6: Template System (1 tuần)

**6.1. Design Templates** (2 ngày)
- Standard: Current layout
- Minimalist: Single column, minimal borders
- Detailed: Include project photos, detailed breakdown

**6.2. Template Selector Component** (2 ngày)
```tsx
// components/quotation/preview/TemplateSelector.tsx
- Grid of template previews
- Click to switch
- Confirm if data may be affected
```

**6.3. Template Renderer** (3 ngày)
```tsx
// templates/
├── StandardTemplate.tsx
├── MinimalistTemplate.tsx
└── DetailedTemplate.tsx

// Dynamic import based on selected template
```

**Files to create:**
- `components/quotation/preview/TemplateSelector.tsx`
- `components/templates/StandardTemplate.tsx`
- `components/templates/MinimalistTemplate.tsx`
- `components/templates/DetailedTemplate.tsx`

---

### Step 7: Section Reordering (3-4 ngày)

**7.1. Install react-beautiful-dnd** (0.5 ngày)
```bash
npm install react-beautiful-dnd
npm install -D @types/react-beautiful-dnd
```

**7.2. Wrap Sections in DragDrop** (2 ngày)
```tsx
// components/quotation/preview/SectionDragDrop.tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="sections">
    {sections.map((section, index) => (
      <Draggable key={section.id} draggableId={section.id} index={index}>
        {section.component}
      </Draggable>
    ))}
  </Droppable>
</DragDropContext>
```

**7.3. Save Order State** (1 ngày)
- Save to quotation data
- Restore on load

**Files to create:**
- `components/quotation/preview/SectionDragDrop.tsx`

---

### Step 8: Rich Media Embeds (1 tuần)

**8.1. Image Upload Component** (3 ngày)
```tsx
// components/quotation/preview/MediaUploader.tsx
- Drag & drop upload
- Image preview
- Compress images (max 5MB)
- Store in /public/uploads or cloud storage
```

**8.2. Video Embed** (1 ngày)
```tsx
// Extract YouTube video ID
// Render iframe
```

**8.3. Chart Integration** (2 ngày)
```tsx
// Use Chart.js for simple charts
// Predefined: Bar, Pie, Line
```

**Files to create:**
- `components/quotation/preview/MediaUploader.tsx`
- `components/quotation/preview/VideoEmbed.tsx`
- `components/quotation/preview/ChartBuilder.tsx`
- `app/api/upload/image/route.ts`

---

### Step 9: AI Review & Suggestions (5-7 ngày)

**9.1. AI Review API** (3 ngày)
```ts
// app/api/quotations/[id]/ai-review/route.ts
POST /api/quotations/{id}/ai-review

Request body: QuotationFormData
Response: {
  score: number,
  suggestions: Array<{
    type: 'grammar' | 'pricing' | 'missing' | 'improvement',
    severity: 'high' | 'medium' | 'low',
    message: string,
    location: string, // which section
    suggestion: string,
    confidence: number
  }>
}
```

**9.2. AI Review Logic** (2 ngày)
```ts
// lib/ai/review-quotation.ts
- Grammar check (GPT-4o)
- Pricing consistency (compare with market rates)
- Missing information (required fields)
- Improvement suggestions (based on best practices)
```

**9.3. UI Component** (2 ngày)
```tsx
// components/quotation/preview/AIReviewer.tsx
- Button "🤖 AI Review"
- Loading state
- Suggestion list
- Accept/Dismiss actions
```

**Files to create:**
- `lib/ai/review-quotation.ts`
- `app/api/quotations/[id]/ai-review/route.ts`
- `components/quotation/preview/AIReviewer.tsx`

---

### Step 10: Export to Excel (2-3 ngày)

**10.1. Install xlsx library** (0.5 ngày)
```bash
npm install xlsx
```

**10.2. Excel Export Utility** (1 ngày)
```ts
// lib/export/excel-export.ts
export function exportPricingToExcel(lines: QuotationLine[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(lines);
  // Format currency columns
  // Set column widths
  // Create workbook
  // Download
}
```

**10.3. Export Button** (1 ngày)
```tsx
// components/quotation/preview/ExportExcelButton.tsx
```

**Files to create:**
- `lib/export/excel-export.ts`
- `components/quotation/preview/ExportExcelButton.tsx`

---

## 📂 Files Summary

### New Files (15 files)
```
components/quotation/preview/
├── TemplateSelector.tsx
├── SectionDragDrop.tsx
├── MediaUploader.tsx
├── VideoEmbed.tsx
├── ChartBuilder.tsx
├── AIReviewer.tsx
└── ExportExcelButton.tsx

components/templates/
├── StandardTemplate.tsx
├── MinimalistTemplate.tsx
└── DetailedTemplate.tsx

lib/
├── ai/review-quotation.ts
└── export/excel-export.ts

app/api/
├── quotations/[id]/ai-review/route.ts
└── upload/image/route.ts
```

---

## 🧪 Test Criteria

### Manual Testing
- [ ] Template switch preserves all data
- [ ] Drag & drop smooth on desktop and mobile
- [ ] Image upload success rate >95%
- [ ] AI Review returns at least 3 suggestions for incomplete quotations
- [ ] Excel export opens correctly in Excel

### Automated Tests
- [ ] Template rendering produces valid HTML
- [ ] AI Review API returns expected format
- [ ] Excel export produces valid .xlsx file

---

## 📝 Notes

- Templates are first version - can be enhanced in future
- AI Review cost: ~$0.10 per review (monitor usage)
- Media uploads need storage solution (use cloud in production)

---

**Next Phase:** [phase-03-game-changers.md](./phase-03-game-changers.md)
