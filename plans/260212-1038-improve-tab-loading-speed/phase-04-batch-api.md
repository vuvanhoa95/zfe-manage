# Phase 4: Batch API Requests

**Status:** ✅ Completed  
**Estimated Time:** 2 ngày  
**Priority:** ⭐⭐ Should Have

---

## 🎯 Objective

Gộp nhiều API requests thành 1 batch request để giảm network overhead và tăng tốc độ load.

---

## 📋 Tasks

### 1. Create Batch Endpoint
- [ ] Tạo file `app/api/quotation/initial-data/route.ts`
- [ ] Implement GET handler
- [ ] Fetch customers, projects, outsourceStaff trong parallel với `Promise.all`
- [ ] Return combined response: `{ customers, projects, outsourceStaff }`
- [ ] Add error handling
- [ ] Add TypeScript types

### 2. Update Context
- [ ] Update `QuotationDataProvider` để dùng batch endpoint
- [ ] Replace multiple fetch calls với 1 batch call
- [ ] Update loading states
- [ ] Update error handling

### 3. Performance Testing
- [ ] Measure time: multiple requests vs batch request
- [ ] Verify network requests giảm
- [ ] Test với slow network (throttle)
- [ ] Compare before/after metrics

### 4. Backward Compatibility
- [ ] Ensure existing code vẫn hoạt động
- [ ] Update documentation
- [ ] Consider deprecating old endpoints (nếu cần)

---

## 💻 Code Structure

### Batch Endpoint
```typescript
// app/api/quotation/initial-data/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [customers, projects, outsourceStaff] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.project.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.outsourcingStaff.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        customers,
        projects,
        outsourceStaff,
      },
    });
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch initial data',
      },
      { status: 500 }
    );
  }
}
```

### Updated Context
```typescript
const fetchInitialData = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const res = await fetch('/api/quotation/initial-data');
    const result = await res.json();
    
    if (result.success) {
      setCustomers(result.data.customers);
      setProjects(result.data.projects);
      setOutsourceStaff(result.data.outsourceStaff);
    } else {
      setError(result.error || 'Failed to fetch data');
    }
  } catch (err) {
    setError('Network error');
    console.error('Failed to fetch initial data:', err);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🧪 Testing Checklist

- [ ] Batch endpoint trả về đúng format
- [ ] All data được fetch đúng
- [ ] Error handling hoạt động
- [ ] Performance: batch request nhanh hơn multiple requests
- [ ] Network requests giảm từ 3-4 xuống 1
- [ ] Context hoạt động đúng với batch data
- [ ] Tabs hiển thị data đúng

---

## 📊 Performance Metrics

### Before
- Requests: 3-4 separate calls
- Total time: ~800ms (sequential) hoặc ~400ms (parallel)
- Network overhead: 3-4x headers, connections

### After
- Requests: 1 batch call
- Total time: ~300ms (single request)
- Network overhead: 1x header, connection

**Expected improvement:** ~25-40% faster

---

## 📝 Notes

- Batch endpoint có thể thêm catalog sau nếu cần
- Consider caching response ở server-side nếu data ít thay đổi
- Có thể thêm pagination nếu data lớn
- Consider GraphQL nếu cần flexibility hơn

---

## 🔗 Dependencies

- Phase 1: Context Setup (completed)
- `app/api/customers/route.ts` (reference)
- `app/api/projects/route.ts` (reference)
- `app/api/outsourcing-staff/route.ts` (reference)

---

## ✅ Definition of Done

- [ ] Batch endpoint created và tested
- [ ] Context updated để dùng batch endpoint
- [ ] Performance improved (25-40% faster)
- [ ] Network requests giảm
- [ ] No breaking changes
- [ ] Code review passed

---

**Next:** Phase 5 - LocalStorage Cache (Optional)
