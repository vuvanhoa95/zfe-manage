# Phase 1: Context Setup

**Status:** ✅ Completed  
**Estimated Time:** 1 ngày  
**Priority:** ⭐⭐⭐ Must Have

---

## 🎯 Objective

Tạo QuotationDataContext để share data giữa các tabs, giảm số lần fetch data.

---

## 📋 Tasks

### 1. Tạo Context Structure
- [ ] Tạo file `lib/contexts/QuotationDataContext.tsx`
- [ ] Define interface `QuotationDataContextValue`
- [ ] Define types cho data: `Customer`, `Project`, `OutsourcingStaff`, `CatalogItem`
- [ ] Export `QuotationDataProvider` component
- [ ] Export `useQuotationData` hook

### 2. Implement Provider Logic
- [ ] Setup state cho customers, projects, outsourceStaff, catalog
- [ ] Setup loading states cho từng data type
- [ ] Setup error state
- [ ] Implement `fetchInitialData()` function
- [ ] Implement `refresh()` function để invalidate cache

### 3. Data Fetching
- [ ] Fetch customers từ `/api/customers`
- [ ] Fetch projects từ `/api/projects`
- [ ] Fetch outsource staff từ `/api/outsourcing-staff?isActive=true`
- [ ] Fetch catalog từ `/api/catalog`
- [ ] Handle errors gracefully
- [ ] Show loading state khi fetch

### 4. Integration
- [ ] Wrap `QuotationEditor` với `QuotationDataProvider`
- [ ] Test context cung cấp data đúng
- [ ] Verify không có circular dependencies

---

## 💻 Code Structure

### Context Interface
```typescript
interface QuotationDataContextValue {
  // Data
  customers: Customer[];
  projects: Project[];
  outsourceStaff: OutsourcingStaff[];
  catalog: CatalogItem[];
  
  // Loading states
  isLoadingCustomers: boolean;
  isLoadingProjects: boolean;
  isLoadingOutsourceStaff: boolean;
  isLoadingCatalog: boolean;
  isLoading: boolean; // Overall loading
  
  // Error
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshOutsourceStaff: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
}
```

### Provider Component
```typescript
export function QuotationDataProvider({ children }: { children: React.ReactNode }) {
  // States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  // ... more states
  
  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  // Context value
  const value: QuotationDataContextValue = {
    customers,
    projects,
    // ... more data
    refresh: fetchInitialData,
  };
  
  return (
    <QuotationDataContext.Provider value={value}>
      {children}
    </QuotationDataContext.Provider>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Context cung cấp data đúng format
- [ ] Loading states hoạt động đúng
- [ ] Error handling hoạt động
- [ ] Refresh function hoạt động
- [ ] Không có memory leaks
- [ ] Performance: fetch chỉ 1 lần khi mount

---

## 📝 Notes

- Context sẽ fetch data ngay khi provider mount
- Data được cache trong memory
- Có thể invalidate và fetch lại khi cần
- Error state để handle API failures

---

## 🔗 Dependencies

- `app/api/customers/route.ts`
- `app/api/projects/route.ts`
- `app/api/outsourcing-staff/route.ts`
- `app/api/catalog/route.ts`

---

## ✅ Definition of Done

- [ ] Context created và tested
- [ ] Provider wraps QuotationEditor
- [ ] Data fetch thành công
- [ ] Loading states hoạt động
- [ ] Error handling hoạt động
- [ ] Code review passed

---

**Next:** Phase 2 - Refactor Tabs
