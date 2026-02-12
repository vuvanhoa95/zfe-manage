# Phase 3: Keep-Alive Tabs

**Status:** ⏳ Pending  
**Estimated Time:** 1 ngày  
**Priority:** ⭐⭐⭐ Must Have

---

## 🎯 Objective

Giữ tất cả tab components mounted khi chuyển tab để state được preserve và không cần re-fetch data.

---

## 📋 Tasks

### 1. Modify AnimatedTabPanels Usage
- [ ] Review current implementation trong `QuotationEditor.tsx`
- [ ] Thay đổi cách render tabs để keep-alive
- [ ] Sử dụng conditional rendering với `display: none` thay vì unmount
- [ ] Test tabs không bị unmount khi chuyển

### 2. State Preservation
- [ ] Verify form inputs được giữ nguyên khi chuyển tab
- [ ] Verify scroll position được giữ (nếu cần)
- [ ] Verify selected items được giữ (nếu có)
- [ ] Test với nhiều lần chuyển tab

### 3. Performance Optimization
- [ ] Monitor re-renders với React DevTools
- [ ] Optimize với `React.memo` nếu cần
- [ ] Verify không có unnecessary re-renders
- [ ] Test memory usage

### 4. Edge Cases
- [ ] Test với tabs có heavy components
- [ ] Test với tabs có animations
- [ ] Test với tabs có timers/intervals
- [ ] Cleanup timers/intervals khi cần

---

## 💻 Code Changes

### Current Implementation
```typescript
<AnimatedTabPanels activeKey={activeTab}>
  {(key) => {
    if (key === 'data') return <DataTab />;
    if (key === 'preview') return <PreviewTab />;
    if (key === 'catalog') return <CatalogTab />;
    return null;
  }}
</AnimatedTabPanels>
```

### Keep-Alive Implementation
```typescript
<AnimatedTabPanels activeKey={activeTab}>
  {(key) => (
    <div 
      key={key}
      style={{ display: key === activeTab ? 'block' : 'none' }}
      className="h-full"
    >
      {key === 'data' && <DataTab />}
      {key === 'preview' && <PreviewTab />}
      {key === 'catalog' && <CatalogTab />}
    </div>
  )}
</AnimatedTabPanels>
```

**Hoặc render tất cả tabs:**
```typescript
<div className="relative h-full">
  <div style={{ display: activeTab === 'data' ? 'block' : 'none' }} className="h-full">
    <DataTab />
  </div>
  <div style={{ display: activeTab === 'preview' ? 'block' : 'none' }} className="h-full">
    <PreviewTab />
  </div>
  <div style={{ display: activeTab === 'catalog' ? 'block' : 'none' }} className="h-full">
    <CatalogTab />
  </div>
</div>
```

---

## 🧪 Testing Checklist

- [ ] Tabs không bị unmount khi chuyển
- [ ] State được preserve (form inputs, selections)
- [ ] Scroll position được giữ (nếu có)
- [ ] Không có unnecessary re-renders
- [ ] Memory usage không tăng đáng kể
- [ ] Performance: tab switch < 50ms
- [ ] Animations hoạt động đúng (nếu có)

---

## 📝 Notes

- Keep-alive có thể tốn memory nếu tabs có nhiều data
- Cần monitor memory usage
- Có thể cần cleanup khi tab không được dùng lâu
- Consider virtual scrolling nếu tabs có nhiều items

---

## 🔗 Dependencies

- Phase 1: Context Setup (completed)
- Phase 2: Refactor Tabs (completed)
- `components/ui/AnimatedTabPanels.tsx`

---

## ✅ Definition of Done

- [ ] Tabs được keep-alive
- [ ] State được preserve
- [ ] Performance tốt (< 50ms switch time)
- [ ] Memory usage acceptable
- [ ] No breaking changes
- [ ] Code review passed

---

**Next:** Phase 4 - Batch API (Optional)
