# Plan: Cải Thiện Tốc Độ Load Data Khi Chuyển Tab

**Created:** 2025-01-27 10:38  
**Status:** 🟡 In Progress  
**Type:** Performance Optimization  
**Estimated Duration:** 3-5 ngày (MVP)

---

## 📋 Overview

Cải thiện tốc độ load data khi chuyển tab trong Quotation Editor bằng cách:
- **Shared Context Cache** - Cache data trong React Context
- **Keep-Alive Tabs** - Giữ components mounted
- **Lazy Load** - Chỉ fetch khi cần
- **Batch API** - Gộp requests
- **LocalStorage Cache** - Persist data

**Base Files:**
- `components/quotation/QuotationEditor.tsx`
- `components/quotation/DataTab.tsx`
- `components/quotation/PreviewTab.tsx`
- `components/quotation/CatalogTab.tsx`

---

## 🎯 Objectives

### Performance Goals
- ⚡ Tab switch time: **< 50ms** (từ 500-1000ms)
- 🔄 API calls per switch: **0** (từ 4-5)
- 📦 Network payload: **0KB** (từ ~200KB)
- 😊 User experience: **Instant, no loading**

### Technical Goals
- Modular architecture với Context API
- Memory efficient (keep-alive không tốn quá nhiều)
- Error handling robust
- Backward compatible

---

## 📊 Phases

### Phase 1: Context Setup (1 ngày) ⭐ MVP
- Tạo QuotationDataContext
- Setup provider
- Initial data fetching

### Phase 2: Refactor Tabs (1 ngày) ⭐ MVP
- Refactor DataTab
- Refactor PreviewTab
- Refactor CatalogTab

### Phase 3: Keep-Alive Implementation (1 ngày) ⭐ MVP
- Modify AnimatedTabPanels
- Test state preservation
- Verify performance

### Phase 4: Batch API (2 ngày) 🎁 Should Have
- Create batch endpoint
- Update context
- Test improvements

### Phase 5: LocalStorage Cache (1 ngày) 🎁 Should Have
- Implement cache utility
- Integrate với context
- Test TTL

---

## 🛠️ Tech Stack

### Frontend
- **React Context API** (existing)
- **Next.js 16** (existing)
- **TypeScript** (existing)

### Backend
- **Next.js API Routes** (existing)
- **Prisma** (existing)

### Storage
- **localStorage** (browser API)

---

## 📈 Success Metrics

### Before
- Tab switch: 500-1000ms
- API calls: 4-5 per switch
- Network: ~200KB per switch

### After (MVP)
- Tab switch: < 50ms
- API calls: 0 per switch
- Network: 0KB per switch

---

## 🔗 Related Docs

- [SPECS](../docs/SPECS-improve-tab-loading-speed.md)
- [BRIEF](../docs/BRIEF-improve-tab-loading-speed.md)

---

## ✅ Checklist

- [ ] Phase 1: Context Setup
- [ ] Phase 2: Refactor Tabs
- [ ] Phase 3: Keep-Alive
- [ ] Phase 4: Batch API
- [ ] Phase 5: LocalStorage Cache
- [ ] Testing & Performance Validation
- [ ] Documentation

---

**Next:** Bắt đầu với Phase 1
