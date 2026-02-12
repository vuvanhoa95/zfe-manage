# Phase 03: Game Changers

**Status:** ⬜ Pending  
**Dependencies:** Phase 01, Phase 02  
**Estimated Duration:** 3 tuần (parallel work)  
**Priority:** 🟢 Thấp (Future)

---

## 🎯 Objective

Triển khai 5 tính năng đột phá tạo industry-leading capabilities:
11. Real-time Collaboration
12. Version History & Comparison
13. Interactive Preview (Client View)
14. AI Translation (VN ↔ EN)
15. Smart Sections (AI)

**Why Game Changers?**
- First-to-market features in VN
- Transform quotation process fundamentally
- Premium tier features

---

## 📋 Requirements

### Feature 11: Real-time Collaboration
- [ ] Multiple users edit simultaneously
- [ ] Live cursor tracking (Google Docs-like)
- [ ] Comment threads on sections
- [ ] Presence indicators (who's online)
- [ ] Conflict resolution (operational transformation)

### Feature 12: Version History & Comparison
- [ ] Auto-save versions on major changes
- [ ] Timeline view of all versions
- [ ] Side-by-side diff view
- [ ] Restore previous version
- [ ] Version comments/notes

### Feature 13: Interactive Client View
- [ ] Generate shareable link
- [ ] Client views without login
- [ ] Inline comments from client
- [ ] "Request Changes" button
- [ ] Track view status (opened, viewed time)
- [ ] Email notification when client views

### Feature 14: AI Translation
- [ ] Toggle [🇻🇳 VN] [🇬🇧 EN]
- [ ] Translate entire quotation
- [ ] Cache translations
- [ ] Preserve formatting, numbers
- [ ] Manual override editable

### Feature 15: Smart Sections (AI)
- [ ] AI analyzes quotation context
- [ ] Suggests missing sections
- [ ] Templates for suggested sections
- [ ] One-click add section
- [ ] Learn from user patterns

---

## 🛠️ Implementation Steps

### Step 11: Real-time Collaboration (3-4 tuần)

**⚠️ Complex - requires infrastructure**

**11.1. Choose Solution:**
- Option A: Yjs + WebSocket (self-hosted)
- Option B: Pusher/Ably (managed service) ✅ Recommended

**11.2. Pusher Integration** (1 tuần)
```bash
npm install pusher pusher-js
```

```ts
// lib/collaboration/pusher-client.ts
- Subscribe to quotation channel
- Broadcast cursor position
- Receive remote cursors
```

**11.3. Collaborative Editing** (2 tuần)
```tsx
// components/quotation/preview/CollaborationPanel.tsx
- Show active users
- Display remote cursors
- Handle concurrent edits
```

**11.4. Comment Threads** (1 tuần)
```tsx
// components/quotation/preview/CommentThread.tsx
- Click section to comment
- Thread view
- Resolve comments
```

**Files to create:**
- `lib/collaboration/pusher-client.ts`
- `components/quotation/preview/CollaborationPanel.tsx`
- `components/quotation/preview/CommentThread.tsx`
- `app/api/collaboration/presence/route.ts`

**Cost:** ~$50-100/month for Pusher

---

### Step 12: Version History (2 tuần)

**12.1. Version Storage** (1 tuần)
```ts
// Database schema
table quotation_versions {
  id: string
  quotation_id: string
  version_number: int
  data: jsonb  // Full quotation snapshot
  changed_by: string
  comment: string?
  created_at: timestamp
}
```

**12.2. Version API** (3 ngày)
```ts
// app/api/quotations/[id]/versions/route.ts
GET /api/quotations/{id}/versions  // List all
GET /api/quotations/{id}/versions/{versionId}  // Get specific
POST /api/quotations/{id}/versions/{versionId}/restore
```

**12.3. UI Component** (4 ngày)
```tsx
// components/quotation/preview/VersionHistory.tsx
- Timeline view
- Side-by-side comparison
- Diff highlighting
- Restore button
```

**Files to create:**
- `app/api/quotations/[id]/versions/route.ts`
- `components/quotation/preview/VersionHistory.tsx`
- `lib/diff/compare-quotations.ts`
- Migration: add quotation_versions table

---

### Step 13: Interactive Client View (3 tuần)

**13.1. Share Link Generation** (1 tuần)
```ts
// app/api/quotations/[id]/share/route.ts
POST /api/quotations/{id}/share
Response: { shareLink: string, token: string }

// Public route
GET /share/{token} → Render preview
```

**13.2. Client Interaction** (1 tuần)
```tsx
// app/share/[token]/page.tsx
- Read-only preview
- Inline commenting
- "Request Changes" form
```

**13.3. Analytics** (1 tuần)
```ts
// Track view events
- Opened time
- Time spent
- Sections viewed
```

**Files to create:**
- `app/api/quotations/[id]/share/route.ts`
- `app/share/[token]/page.tsx`
- `components/quotation/preview/ClientViewShare.tsx`
- `lib/analytics/track-view.ts`

---

### Step 14: AI Translation (1 tuần)

**14.1. Translation API** (3 ngày)
```ts
// app/api/quotations/[id]/translate/route.ts
POST /api/quotations/{id}/translate
Body: { targetLang: 'en' | 'vi' }
Response: { translated: QuotationFormData }
```

**14.2. Translation Logic** (2 ngày)
```ts
// lib/ai/translate.ts
async function translateQuotation(data, targetLang) {
  // Translate text fields only
  // Preserve numbers, dates
  // Cache in Redis (1 week TTL)
}
```

**14.3. UI Toggle** (2 ngày)
```tsx
// components/quotation/preview/TranslationToggle.tsx
- Switch [VN] [EN]
- Loading state
- Manual edit translated text
```

**Files to create:**
- `app/api/quotations/[id]/translate/route.ts`
- `lib/ai/translate.ts`
- `components/quotation/preview/TranslationToggle.tsx`

**Cost:** ~$0.50 per translation

---

### Step 15: Smart Sections (1-2 tuần)

**15.1. Section Analysis** (1 tuần)
```ts
// lib/ai/suggest-sections.ts
async function analyzeMissingSections(quotation: QuotationFormData) {
  // AI prompt: "Based on quotation context, suggest missing sections"
  // Return: Array<{ title, reason, template }>
}
```

**15.2. UI Component** (3 ngày)
```tsx
// components/quotation/preview/SmartSectionSuggester.tsx
- Show suggestions panel
- Preview section template
- "Add Section" button
```

**Files to create:**
- `lib/ai/suggest-sections.ts`
- `app/api/quotations/[id]/suggest-sections/route.ts`
- `components/quotation/preview/SmartSectionSuggester.tsx`

---

## 📂 Files Summary

### New Files (18 files)
```
components/quotation/preview/
├── CollaborationPanel.tsx
├── CommentThread.tsx
├── VersionHistory.tsx
├── ClientViewShare.tsx
├── TranslationToggle.tsx
└── SmartSectionSuggester.tsx

lib/
├── collaboration/pusher-client.ts
├── diff/compare-quotations.ts
├── ai/translate.ts
├── ai/suggest-sections.ts
└── analytics/track-view.ts

app/api/
├── collaboration/presence/route.ts
├── quotations/[id]/versions/route.ts
├── quotations/[id]/share/route.ts
├── quotations/[id]/translate/route.ts
└── quotations/[id]/suggest-sections/route.ts

app/share/[token]/page.tsx

prisma/migrations/
└── xxx_add_versions_table.sql
```

---

## 🧪 Test Criteria

### Manual Testing
- [ ] Two users edit simultaneously without conflicts
- [ ] Version restore works correctly
- [ ] Share link accessible without login
- [ ] Translation preserves meaning
- [ ] Smart suggestions are relevant

### Load Testing
- [ ] Real-time collab with 5 concurrent users
- [ ] Share link handles 100 concurrent views

---

## 💰 Monthly Costs (Estimated)

| Service | Cost |
|---------|------|
| Pusher (Collaboration) | ~$50-100 |
| AI Translation | ~$50 (100 translations) |
| AI Smart Sections | ~$30 |
| **Total** | **~$130-180/month** |

---

## ⚠️ Risks

- **Real-time collab complexity:** puede tốn effort hơn 3 tuần
- **Translation accuracy:** May need human review workflow
- **Scalability:** WebSocket connections có thể expensive

---

## 📝 Notes

- Phase 3 là optional - có thể postpone nếu Phase 1/2 đủ value
- Consider phased rollout (feature flags)
- Collect user feedback before full implementation

---

**Implementation Complete!**

Return to: [plan.md](./plan.md)
