# Phase 2: Refactor Tabs

**Status:** ✅ Completed  
**Estimated Time:** 1 ngày  
**Priority:** ⭐⭐⭐ Must Have

---

## 🎯 Objective

Refactor các tab components (DataTab, PreviewTab, CatalogTab) để sử dụng data từ QuotationDataContext thay vì fetch riêng.

---

## 📋 Tasks

### 1. Refactor DataTab
- [ ] Import `useQuotationData` hook
- [ ] Remove local `useState` cho customers, projects, outsourceStaff
- [ ] Remove local `useEffect` fetch calls
- [ ] Use data từ context: `const { customers, projects, outsourceStaff } = useQuotationData()`
- [ ] Update loading states để dùng từ context
- [ ] Test component hoạt động đúng

### 2. Refactor PreviewTab
- [ ] Import `useQuotationData` hook
- [ ] Remove local cache cho company profile (giữ lại nếu cần)
- [ ] Use customers từ context nếu cần
- [ ] Update loading states
- [ ] Test component hoạt động đúng

### 3. Refactor CatalogTab
- [ ] Import `useQuotationData` hook
- [ ] Remove local cache cho catalog
- [ ] Use catalog từ context
- [ ] Update loading states
- [ ] Test component hoạt động đúng

### 4. Cleanup
- [ ] Remove unused imports
- [ ] Remove unused state variables
- [ ] Remove unused fetch functions
- [ ] Update comments/documentation

---

## 💻 Code Changes

### Before (DataTab.tsx)
```typescript
const [customers, setCustomers] = useState<Customer[]>([]);
const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

useEffect(() => {
  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const result = await res.json();
      if (result.success) {
        setCustomers(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  void fetchCustomers();
}, []);
```

### After (DataTab.tsx)
```typescript
const { customers, projects, outsourceStaff, isLoadingCustomers, isLoadingProjects, isLoadingOutsourceStaff } = useQuotationData();

// No useEffect needed - data comes from context
```

---

## 🧪 Testing Checklist

- [ ] DataTab hiển thị data từ context
- [ ] PreviewTab hiển thị data từ context
- [ ] CatalogTab hiển thị data từ context
- [ ] Loading states hoạt động đúng
- [ ] Không có duplicate API calls
- [ ] Components re-render khi context data thay đổi
- [ ] Error handling hoạt động

---

## 📝 Notes

- Tabs sẽ không fetch data nữa, chỉ consume từ context
- Loading states từ context sẽ được sử dụng
- Có thể giữ local state cho UI-specific data (như form inputs)
- CatalogTab có thể cần refetch khi user thêm/sửa catalog items

---

## 🔗 Dependencies

- Phase 1: Context Setup (completed)
- `lib/contexts/QuotationDataContext.tsx`

---

## ✅ Definition of Done

- [ ] Tất cả tabs sử dụng data từ context
- [ ] Không còn duplicate fetch calls
- [ ] Loading states hoạt động đúng
- [ ] Components hoạt động như trước
- [ ] Code review passed
- [ ] No breaking changes

---

**Next:** Phase 3 - Keep-Alive Implementation
