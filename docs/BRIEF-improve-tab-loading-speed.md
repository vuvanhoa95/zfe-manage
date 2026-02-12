# BRIEF: Cải Thiện Tốc Độ Load Data Khi Chuyển Tab

**Ngày tạo:** 2025-01-27  
**Workflow:** `/brainstorm` → `/plan` → `/code`

---

## 📌 VẤN ĐỀ

### Hiện trạng
Khi người dùng chuyển qua lại giữa các tab trong Quotation Editor (Data, Preview, Catalog), hệ thống phải load lại data mỗi lần, gây ra:
- ⏱️ **Delay khi chuyển tab** - Phải đợi API response
- 🔄 **Fetch data trùng lặp** - Cùng một data được fetch nhiều lần
- 😞 **Trải nghiệm người dùng kém** - Loading spinner xuất hiện liên tục
- 📊 **Tốn bandwidth** - Request không cần thiết

### Đối tượng bị ảnh hưởng
- **Người dùng chính:** Nhân viên tạo/chỉnh sửa báo giá
- **Tần suất sử dụng:** Cao (chuyển tab nhiều lần trong một session)
- **Pain point:** Phải đợi mỗi lần chuyển tab, gián đoạn workflow

---

## 🎯 GIẢI PHÁP

### Mục tiêu
Cải thiện tốc độ load data khi chuyển tab để:
- ✅ **Chuyển tab tức thì** - Không delay, không loading spinner
- ✅ **Cache data thông minh** - Chỉ fetch khi cần thiết
- ✅ **Trải nghiệm mượt mà** - Giữ state khi chuyển tab
- ✅ **Giảm API calls** - Tối ưu network requests

---

## 🔍 NGHIÊN CỨU HIỆN TRẠNG

### Cấu trúc hiện tại

#### 1. **DataTab** (`components/quotation/DataTab.tsx`)
```typescript
// Fetch mỗi lần component mount
useEffect(() => {
    fetchCustomers(); // /api/customers
    fetchProjects();   // /api/projects
    fetchOutsourceStaff(); // /api/outsourcing-staff
    fetchCatalog(); // /api/catalog
}, []); // Empty dependency = fetch mỗi lần mount
```

**Vấn đề:**
- Mỗi lần chuyển sang tab Data → fetch lại tất cả
- Không có cache giữa các lần mount/unmount

#### 2. **PreviewTab** (`components/quotation/PreviewTab.tsx`)
```typescript
// Có cache nhưng vẫn fetch lại
let companyProfileCache: { data: CompanyProfile | null; timestamp: number } | null = null;
const COMPANY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

useEffect(() => {
    fetchData(); // Fetch company profile và customer
}, [data.customerId]); // Re-fetch khi customerId thay đổi
```

**Vấn đề:**
- Cache chỉ trong memory, mất khi component unmount
- Vẫn fetch lại khi tab được mount lại

#### 3. **AnimatedTabPanels** (`components/ui/AnimatedTabPanels.tsx`)
```typescript
// Render tất cả tabs nhưng chỉ hiển thị tab active
{render(currentKey)} // Render cả 3 tabs
```

**Vấn đề:**
- Component có thể unmount khi chuyển tab (tùy React)
- Không có keep-alive mechanism

---

## 💡 BRAINSTORM TÍNH NĂNG

### Nhóm 1: Caching & State Management

#### 1.1. **Shared Context Cache** ⭐ MVP
- Tạo `QuotationDataContext` để share data giữa các tabs
- Cache customers, projects, outsource staff, catalog
- Tự động invalidate khi data thay đổi

**Lợi ích:**
- ✅ Data chỉ fetch 1 lần cho toàn bộ session
- ✅ Tất cả tabs dùng chung cache
- ✅ Dễ implement với React Context

**Độ khó:** 🟢 DỄ (1-2 ngày)

#### 1.2. **React Query / SWR** 🎁 Nice-to-have
- Sử dụng thư viện caching chuyên nghiệp
- Auto refetch, background updates
- Built-in loading states

**Lợi ích:**
- ✅ Caching mạnh mẽ, có sẵn nhiều tính năng
- ✅ DevTools để debug
- ✅ Optimistic updates

**Độ khó:** 🟡 TRUNG BÌNH (3-5 ngày)

#### 1.3. **LocalStorage Cache** 🎁 Nice-to-have
- Cache data vào localStorage
- Persist giữa các sessions
- TTL (Time To Live) cho từng loại data

**Lợi ích:**
- ✅ Data vẫn còn khi refresh page
- ✅ Giảm API calls đáng kể

**Độ khó:** 🟢 DỄ (1 ngày)

---

### Nhóm 2: Lazy Loading & Keep-Alive

#### 2.1. **Lazy Load Tabs** ⭐ MVP
- Chỉ fetch data khi tab được mở lần đầu tiên
- Sử dụng flag `hasLoaded` để track

**Lợi ích:**
- ✅ Giảm initial load time
- ✅ Chỉ load data khi cần

**Độ khó:** 🟢 DỄ (1 ngày)

#### 2.2. **Keep-Alive Tabs** ⭐ MVP
- Giữ component mounted khi chuyển tab
- Sử dụng `display: none` thay vì unmount

**Lợi ích:**
- ✅ State được giữ nguyên
- ✅ Không cần fetch lại

**Độ khó:** 🟢 DỄ (1 ngày)

#### 2.3. **Prefetch on Hover** 🎁 Nice-to-have
- Prefetch data khi user hover vào tab
- Load data trước khi click

**Lợi ích:**
- ✅ Tab mở tức thì khi click
- ✅ UX tốt hơn

**Độ khó:** 🟡 TRUNG BÌNH (2 ngày)

---

### Nhóm 3: Optimizations

#### 3.1. **Batch API Requests** ⭐ MVP
- Gộp nhiều API calls thành 1 request
- Tạo endpoint `/api/quotation/initial-data`

**Lợi ích:**
- ✅ Giảm số lượng requests
- ✅ Nhanh hơn (1 request thay vì 4-5 requests)

**Độ khó:** 🟡 TRUNG BÌNH (2-3 ngày)

#### 3.2. **Optimistic UI Updates** 🎁 Nice-to-have
- Hiển thị data ngay lập tức (từ cache)
- Update background sau

**Lợi ích:**
- ✅ Perceived performance tốt
- ✅ UX mượt mà

**Độ khó:** 🟡 TRUNG BÌNH (2-3 ngày)

#### 3.3. **Service Worker Cache** ❓ Chưa chắc
- Cache API responses trong Service Worker
- Offline support

**Lợi ích:**
- ✅ Có thể dùng offline
- ✅ Cache mạnh mẽ

**Độ khó:** 🔴 KHÓ (1 tuần+)

---

## 🚀 MVP FEATURES (Ưu tiên cao)

### Phase 1: Quick Wins (1-2 ngày)
1. ✅ **Shared Context Cache**
   - Tạo `QuotationDataContext`
   - Cache customers, projects, outsource staff
   - Tất cả tabs dùng chung

2. ✅ **Keep-Alive Tabs**
   - Giữ component mounted
   - Sử dụng conditional rendering với `display: none`

3. ✅ **Lazy Load Data**
   - Chỉ fetch khi tab được mở lần đầu
   - Flag `hasLoaded` để track

### Phase 2: Optimizations (2-3 ngày)
4. ✅ **Batch API Requests**
   - Endpoint `/api/quotation/initial-data`
   - Gộp customers, projects, outsource staff

5. ✅ **LocalStorage Cache**
   - Cache với TTL
   - Persist giữa sessions

---

## 📊 ƯỚC TÍNH

| Feature | Thời gian | Độ ưu tiên |
|---------|-----------|------------|
| Shared Context Cache | 1-2 ngày | ⭐⭐⭐ |
| Keep-Alive Tabs | 1 ngày | ⭐⭐⭐ |
| Lazy Load Data | 1 ngày | ⭐⭐⭐ |
| Batch API Requests | 2-3 ngày | ⭐⭐ |
| LocalStorage Cache | 1 ngày | ⭐⭐ |
| Prefetch on Hover | 2 ngày | ⭐ |
| React Query | 3-5 ngày | ⭐ |

**Tổng MVP:** 3-5 ngày  
**Tổng Full:** 10-15 ngày

---

## 🎯 KẾT QUẢ MONG ĐỢI

### Trước khi cải thiện:
- ⏱️ Chuyển tab: **500-1000ms** (đợi API)
- 🔄 API calls mỗi lần chuyển tab: **4-5 requests**
- 😞 User experience: **Có loading spinner**

### Sau khi cải thiện (MVP):
- ⚡ Chuyển tab: **< 50ms** (tức thì)
- 🔄 API calls: **1 lần duy nhất** (khi mở editor)
- 😊 User experience: **Mượt mà, không delay**

### Metrics để đo lường:
- Time to Interactive (TTI) khi chuyển tab
- Số lượng API requests per session
- User satisfaction score

---

## 🔗 BƯỚC TIẾP THEO

1. **Review Brief này** - Xác nhận với team
2. **Lên kế hoạch chi tiết** - `/plan` để tạo PRD và technical design
3. **Implement MVP** - Bắt đầu với Phase 1
4. **Test & Measure** - Đo lường performance improvements
5. **Iterate** - Thêm Phase 2 nếu cần

---

## 📝 NOTES

### Technical Considerations
- Cần xem xét memory usage khi keep-alive tabs
- Cache invalidation strategy khi data thay đổi
- Error handling khi API fails

### Future Enhancements
- React Query migration (nếu cần caching phức tạp hơn)
- Service Worker cho offline support
- Real-time updates với WebSocket

---

**Status:** ✅ Ready for `/plan`  
**Next Action:** Review và approve → `/plan` để lên kế hoạch chi tiết
