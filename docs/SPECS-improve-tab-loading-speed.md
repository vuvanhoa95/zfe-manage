# SPEC: Cải Thiện Tốc Độ Load Data Khi Chuyển Tab

**Status:** Draft → Approved → In Progress → Done  
**Priority:** Must Have  
**Created:** 2025-01-27  
**Estimated Time:** 3-5 ngày (MVP)

---

## 📋 User Story

**Là** nhân viên tạo/chỉnh sửa báo giá,  
**Tôi muốn** chuyển qua lại giữa các tab (Data, Preview, Catalog) mà không phải đợi load data,  
**Để** tôi có thể làm việc nhanh hơn và không bị gián đoạn workflow.

---

## 🎯 Acceptance Criteria

### Phase 1: Quick Wins (Must Have)

#### 1. Shared Context Cache
- [ ] Tạo `QuotationDataContext` để share data giữa các tabs
- [ ] Cache customers, projects, outsource staff, catalog trong context
- [ ] Data chỉ fetch 1 lần khi mở QuotationEditor
- [ ] Tất cả tabs (DataTab, PreviewTab, CatalogTab) sử dụng data từ context
- [ ] Context tự động invalidate khi cần refresh data

#### 2. Keep-Alive Tabs
- [ ] Giữ tất cả tab components mounted khi chuyển tab
- [ ] Sử dụng conditional rendering với `display: none` thay vì unmount
- [ ] State của mỗi tab được giữ nguyên khi chuyển tab
- [ ] Không có re-render không cần thiết

#### 3. Lazy Load Data
- [ ] Chỉ fetch data khi tab được mở lần đầu tiên
- [ ] Sử dụng flag `hasLoaded` để track trạng thái đã load
- [ ] Hiển thị loading state chỉ khi fetch lần đầu
- [ ] Các lần chuyển tab sau không có loading state

### Phase 2: Optimizations (Should Have)

#### 4. Batch API Requests
- [ ] Tạo endpoint `/api/quotation/initial-data`
- [ ] Gộp customers, projects, outsource staff vào 1 request
- [ ] Response format: `{ customers, projects, outsourceStaff }`
- [ ] Giảm từ 3-4 requests xuống còn 1 request

#### 5. LocalStorage Cache
- [ ] Cache data vào localStorage với TTL
- [ ] TTL cho customers: 5 phút
- [ ] TTL cho projects: 5 phút
- [ ] TTL cho outsource staff: 10 phút
- [ ] TTL cho catalog: 10 phút
- [ ] Auto invalidate khi data thay đổi

---

## 🔧 Technical Notes

### Architecture

```
QuotationEditor
  ├── QuotationDataProvider (Context)
  │   ├── customers: Customer[]
  │   ├── projects: Project[]
  │   ├── outsourceStaff: OutsourcingStaff[]
  │   ├── catalog: CatalogItem[]
  │   └── loading states
  │
  └── AnimatedTabPanels
      ├── DataTab (keep-alive)
      ├── PreviewTab (keep-alive)
      └── CatalogTab (keep-alive)
```

### Implementation Details

#### 1. QuotationDataContext

```typescript
// lib/contexts/QuotationDataContext.tsx
interface QuotationDataContextValue {
  customers: Customer[];
  projects: Project[];
  outsourceStaff: OutsourcingStaff[];
  catalog: CatalogItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

**Features:**
- Fetch data một lần khi provider mount
- Share data cho tất cả tabs
- Method `refresh()` để invalidate và fetch lại

#### 2. Keep-Alive Tabs

```typescript
// components/quotation/QuotationEditor.tsx
<AnimatedTabPanels activeKey={activeTab}>
  {(key) => (
    <div 
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

**Benefits:**
- Components không bị unmount
- State được giữ nguyên
- Không cần fetch lại

#### 3. Lazy Load với Context

```typescript
// components/quotation/DataTab.tsx
const { customers, projects, outsourceStaff, isLoading } = useQuotationData();

// Chỉ hiển thị loading khi lần đầu fetch
if (isLoading && customers.length === 0) {
  return <LoadingSpinner />;
}
```

#### 4. Batch API Endpoint

```typescript
// app/api/quotation/initial-data/route.ts
export async function GET() {
  const [customers, projects, outsourceStaff] = await Promise.all([
    prisma.customer.findMany(),
    prisma.project.findMany(),
    prisma.outsourcingStaff.findMany({ where: { isActive: true } }),
  ]);

  return NextResponse.json({
    success: true,
    data: { customers, projects, outsourceStaff },
  });
}
```

#### 5. LocalStorage Cache

```typescript
// lib/cache/localStorageCache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

function getCached<T>(key: string, ttl: number): T | null {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  const entry: CacheEntry<T> = JSON.parse(cached);
  if (Date.now() - entry.timestamp > ttl) {
    localStorage.removeItem(key);
    return null;
  }
  
  return entry.data;
}
```

---

## 📊 Performance Metrics

### Before
- ⏱️ Tab switch time: **500-1000ms**
- 🔄 API calls per switch: **4-5 requests**
- 📦 Network payload: **~200KB** per switch
- 😞 User experience: **Loading spinner visible**

### After (MVP)
- ⚡ Tab switch time: **< 50ms** (target)
- 🔄 API calls per switch: **0** (cached)
- 📦 Network payload: **0KB** (cached)
- 😊 User experience: **Instant, no loading**

### After (Full)
- ⚡ Tab switch time: **< 20ms**
- 🔄 API calls per session: **1** (initial load)
- 📦 Network payload: **~200KB** (once)
- 😊 User experience: **Instant, persistent cache**

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] QuotationDataContext cung cấp data đúng
- [ ] Cache invalidation hoạt động
- [ ] LocalStorage cache TTL hoạt động
- [ ] Batch API endpoint trả về đúng format

### Integration Tests
- [ ] DataTab sử dụng data từ context
- [ ] PreviewTab sử dụng data từ context
- [ ] CatalogTab sử dụng data từ context
- [ ] Tabs không unmount khi chuyển tab
- [ ] State được giữ nguyên khi chuyển tab

### E2E Tests
- [ ] Chuyển tab Data → Preview → Catalog không có delay
- [ ] Không có loading spinner khi chuyển tab
- [ ] Data được cache đúng cách
- [ ] Refresh data hoạt động khi cần

### Performance Tests
- [ ] Tab switch time < 50ms
- [ ] Memory usage không tăng đáng kể
- [ ] API calls giảm từ 4-5 xuống 0-1 per session

---

## 🚨 Edge Cases & Error Handling

### 1. API Failures
- **Scenario:** API request fails khi fetch initial data
- **Solution:** Hiển thị error message, cho phép retry
- **Fallback:** Sử dụng localStorage cache nếu có

### 2. Stale Data
- **Scenario:** Data trong cache đã cũ
- **Solution:** TTL-based invalidation, manual refresh button
- **Fallback:** Background refresh khi tab được mở

### 3. Memory Usage
- **Scenario:** Keep-alive tabs có thể tốn memory
- **Solution:** Monitor memory usage, chỉ keep-alive khi cần
- **Fallback:** Unmount tabs sau 5 phút không dùng

### 4. Network Issues
- **Scenario:** User offline hoặc network chậm
- **Solution:** Sử dụng localStorage cache
- **Fallback:** Hiển thị cached data với warning

---

## 📝 Migration Plan

### Step 1: Setup Context (1 ngày)
1. Tạo `QuotationDataContext`
2. Tạo `QuotationDataProvider`
3. Wrap QuotationEditor với provider

### Step 2: Refactor Tabs (1 ngày)
1. Refactor DataTab để dùng context
2. Refactor PreviewTab để dùng context
3. Refactor CatalogTab để dùng context

### Step 3: Keep-Alive Implementation (1 ngày)
1. Sửa AnimatedTabPanels để keep-alive
2. Test state preservation
3. Verify no unnecessary re-renders

### Step 4: Batch API (2 ngày)
1. Tạo endpoint `/api/quotation/initial-data`
2. Update context để dùng batch endpoint
3. Test performance improvements

### Step 5: LocalStorage Cache (1 ngày)
1. Implement localStorage cache utility
2. Integrate với context
3. Test TTL và invalidation

---

## 🔗 Dependencies

### External Libraries
- Không cần thêm library mới (sử dụng React Context API)

### Internal Dependencies
- `components/quotation/QuotationEditor.tsx`
- `components/quotation/DataTab.tsx`
- `components/quotation/PreviewTab.tsx`
- `components/quotation/CatalogTab.tsx`
- `components/ui/AnimatedTabPanels.tsx`
- `app/api/customers/route.ts`
- `app/api/projects/route.ts`
- `app/api/outsourcing-staff/route.ts`
- `app/api/catalog/route.ts`

---

## 📚 References

- [BRIEF](./BRIEF-improve-tab-loading-speed.md)
- [React Context API](https://react.dev/reference/react/createContext)
- [Keep-Alive Pattern](https://react.dev/learn/preserving-and-resetting-state)

---

**Next Steps:**
1. Review và approve SPEC
2. Tạo phases trong `plans/` folder
3. Bắt đầu implement Phase 1
