# Plan: Preview Enhancement - Full Suite

**Created:** 2026-02-04 00:20  
**Status:** 🟡 In Progress  
**Type:** Major Feature Enhancement  
**Estimated Duration:** 6-8 weeks

---

## 📋 Overview

Comprehensive upgrade của Preview Tab với 15 tính năng mới, chia làm 3 phases:
- **Phase 1:** Quick Wins (5 features) - Impact cao, effort thấp
- **Phase 2:** Power Features (5 features) - Competitive advantages
- **Phase 3:** Game Changers (5 features) - Industry-leading capabilities

**Base File:** `components/quotation/PreviewTab.tsx` (503 lines)

---

## 🎯 Objectives

### Business Goals
- Giảm 50% thời gian tạo/chỉnh sửa báo giá
- Tăng tỷ lệ chuyển đổi (quotation → deal) nhờ presentation chuyên nghiệp
- Tạo competitive advantage vs đối thủ (unique AI features)

### Technical Goals
- Modular architecture cho dễ maintain
- Responsive và performant
- AI integration seamless
- Export capabilities đa dạng

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (existing)
- **Next.js 14** (existing)
- **TailwindC** (existing)
- **react-beautiful-dnd** (NEW - for drag & drop)
- **html-docx-js** (NEW - Word export)
- **xlsx** (NEW - Excel export)

### Backend/AI
- **OpenAI GPT-4o** (existing - expand usage)
- **Vercel AI SDK** (existing)

### Infrastructure
- **WebSocket** (Phase 3 - real-time collab)
- **Redis** (Phase 3 - caching collaboration state)

---

## 📅 Phases

| Phase | Name | Features | Status | Progress | Timeline |
|-------|------|----------|--------|----------|----------|
| 01 | Quick Wins | 5 features | ✅ Complete | 100% | Week 1-2 |
| 02 | Power Features | 5 features | ⬜ Pending | 0% | Week 3-5 |
| 03 | Game Changers | 5 features | ⬜ Pending | 0% | Week 6-8 |

---

## 📦 Phase 1: Quick Wins (2 tuần)

### Features:
1. ✏️ **Inline Editing** (3-5 ngày)
2. 📄 **Export to Word** (2-3 ngày)
3. 📱 **Preview Modes Toggle** (2 ngày)
4. 📋 **Quick Copy Buttons** (1 ngày)
5. 🎨 **Color Theme Picker** (2 ngày)

**Total Effort:** 10-12 ngày  
**Files:** `phase-01-quick-wins.md`

---

## 📦 Phase 2: Power Features (3 tuần)

### Features:
6. 📑 **Template System** (1 tuần)
7. 🔀 **Section Reordering** (3-4 ngày)
8. 🖼️ **Rich Media Embeds** (1 tuần)
9. 🤖 **AI Review & Suggestions** (5-7 ngày)
10. 📊 **Export to Excel** (2-3 ngày)

**Total Effort:** ~3 tuần  
**Files:** `phase-02-power-features.md`

---

## 📦 Phase 3: Game Changers (3 tuần)

### Features:
11. 👥 **Real-time Collaboration** (3-4 tuần)
12. 📜 **Version History & Comparison** (2 tuần)
13. 🌐 **Interactive Preview (Client View)** (3 tuần)
14. 🌍 **AI Translation (VN ↔ EN)** (1 tuần)
15. 💡 **Smart Sections (AI)** (1-2 tuần)

**Total Effort:** ~3 tuần (parallel work)  
**Files:** `phase-03-game-changers.md`

---

## 🗂️ Files to Create/Modify

### New Components
```
components/quotation/preview/
├── InlineEditor.tsx           # Feature 1
├── ExportWordButton.tsx       # Feature 2
├── PreviewModeToggle.tsx      # Feature 3
├── QuickCopyButtons.tsx       # Feature 4
├── ThemePicker.tsx            # Feature 5
├── TemplateSelector.tsx       # Feature 6
├── SectionDragDrop.tsx        # Feature 7
├── MediaUploader.tsx          # Feature 8
├── AIReviewer.tsx             # Feature 9
├── ExportExcelButton.tsx      # Feature 10
├── CollaborationPanel.tsx     # Feature 11
├── VersionHistory.tsx         # Feature 12
├── ClientViewShare.tsx        # Feature 13
├── TranslationToggle.tsx      # Feature 14
└── SmartSectionSuggester.tsx  # Feature 15
```

### Modified Files
```
components/quotation/
├── PreviewTab.tsx             # Main integration
└── QuotationEditor.tsx        # Add new toolbar items

types/
└── quotation.ts               # Add new types

lib/
├── export/
│   ├── word-export.ts         # Feature 2
│   └── excel-export.ts        # Feature 10
├── ai/
│   ├── review-quotation.ts    # Feature 9
│   ├── translate.ts           # Feature 14
│   └── suggest-sections.ts    # Feature 15
└── collaboration/
    ├── websocket.ts           # Feature 11
    └── version-control.ts     # Feature 12
```

### New API Routes
```
app/api/
├── quotations/[id]/
│   ├── export-word/route.ts
│   ├── export-excel/route.ts
│   ├── ai-review/route.ts
│   ├── translate/route.ts
│   └── versions/route.ts
└── collaboration/
    ├── ws/route.ts
    └── share/route.ts
```

---

## 🔗 Dependencies

### Phase 1 → Phase 2
- Theme Picker (P1) → Template System (P2)
- Inline Editing (P1) → Section Reordering (P2)

### Phase 2 → Phase 3
- Template System (P2) → Version History (P3)
- AI Review (P2) → Smart Sections (P3)

### Critical Path
```
Inline Editing → Section Reordering → Real-time Collab
```

---

## 🧪 Testing Strategy

### Unit Tests
- Each component có test riêng
- Export functions test với sample data

### Integration Tests
- Preview render correctly với tất cả features
- AI features handle errors gracefully

### E2E Tests
- User flow: Create quotation → Enable features → Export

---

## 🚀 Quick Commands

```bash
# Start Phase 1
/code plans/260204-0020-preview-enhancements/phase-01-quick-wins.md

# Check progress
/next

# Save context
/save-brain
```

---

## 📊 Success Metrics

### Phase 1
- [ ] Inline editing giảm 30% clicks
- [ ] Word export success rate >95%
- [ ] Preview modes render correctly trên 3 devices

### Phase 2
- [ ] Template switch <1s
- [ ] AI Review accuracy >80%
- [ ] Drag & drop smooth (60fps)

### Phase 3
- [ ] Real-time sync latency <500ms
- [ ] Translation accuracy (GPT-4o) >90%
- [ ] Version restore success rate 100%

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI API cost cao | 💰💰 | Cache aggressively, rate limit |
| WebSocket infra phức tạp | ⏱️ | Use managed service (Pusher/Ably) |
| Performance degradation | 🐌 | Lazy load components, optimize renders |
| Translation accuracy thấp | 😕 | Human review workflow, allow manual edit |

---

## 📝 Notes

- **Parallel Development:** Phase 1 có thể làm song song với Smart Input (Phase 2 hiện tại)
- **Incremental Rollout:** Mỗi feature deploy độc lập, có feature flag
- **User Feedback Loop:** Thu thập feedback sau Phase 1 để adjust Phase 2/3

---

## 🔄 Next Steps

1. Review phase-01-quick-wins.md
2. User approve
3. Start implementation: `/code phase-01-quick-wins`

---

**Last Updated:** 2026-02-04 00:20  
**Updated By:** Antigravity AI
