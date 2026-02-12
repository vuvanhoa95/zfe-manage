# Phase 5: LocalStorage Cache

**Status:** ✅ Completed  
**Estimated Time:** 1 ngày  
**Priority:** ⭐⭐ Should Have

---

## 🎯 Objective

Cache data vào localStorage để persist giữa sessions và giảm API calls khi refresh page.

---

## 📋 Tasks

### 1. Create Cache Utility
- [ ] Tạo file `lib/cache/localStorageCache.ts`
- [ ] Implement `getCached<T>(key, ttl)` function
- [ ] Implement `setCached<T>(key, data, ttl)` function
- [ ] Implement `clearCache(key)` function
- [ ] Implement `clearAllCache()` function
- [ ] Add TypeScript types

### 2. Integrate với Context
- [ ] Update `QuotationDataProvider` để check localStorage trước
- [ ] Load từ cache nếu valid
- [ ] Fetch từ API nếu cache expired hoặc không có
- [ ] Save vào cache sau khi fetch
- [ ] Handle localStorage errors (quota exceeded, disabled)

### 3. Cache Strategy
- [ ] TTL cho customers: 5 phút
- [ ] TTL cho projects: 5 phút
- [ ] TTL cho outsource staff: 10 phút
- [ ] TTL cho catalog: 10 phút
- [ ] Auto invalidate khi data thay đổi (nếu có mutation)

### 4. Testing
- [ ] Test cache save/load
- [ ] Test TTL expiration
- [ ] Test cache invalidation
- [ ] Test với localStorage disabled
- [ ] Test với quota exceeded

---

## 💻 Code Structure

### Cache Utility
```typescript
// lib/cache/localStorageCache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function getCached<T>(key: string, ttl: number): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;
    
    if (age > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.error('Failed to read cache:', error);
    return null;
  }
}

export function setCached<T>(key: string, data: T, ttl: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Failed to save cache:', error);
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearAllCache();
    }
  }
}

export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export function clearAllCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
}
```

### Updated Context
```typescript
const CACHE_KEYS = {
  customers: 'quotation-data-customers',
  projects: 'quotation-data-projects',
  outsourceStaff: 'quotation-data-outsource-staff',
  catalog: 'quotation-data-catalog',
};

const TTL = {
  customers: 5 * 60 * 1000, // 5 minutes
  projects: 5 * 60 * 1000,
  outsourceStaff: 10 * 60 * 1000, // 10 minutes
  catalog: 10 * 60 * 1000,
};

const fetchInitialData = async () => {
  setIsLoading(true);
  setError(null);
  
  // Try load from cache first
  const cachedCustomers = getCached<Customer[]>(CACHE_KEYS.customers, TTL.customers);
  const cachedProjects = getCached<Project[]>(CACHE_KEYS.projects, TTL.projects);
  const cachedOutsourceStaff = getCached<OutsourcingStaff[]>(CACHE_KEYS.outsourceStaff, TTL.outsourceStaff);
  
  if (cachedCustomers && cachedProjects && cachedOutsourceStaff) {
    setCustomers(cachedCustomers);
    setProjects(cachedProjects);
    setOutsourceStaff(cachedOutsourceStaff);
    setIsLoading(false);
    
    // Fetch in background to update cache
    fetchAndUpdateCache();
    return;
  }
  
  // Fetch from API
  try {
    const res = await fetch('/api/quotation/initial-data');
    const result = await res.json();
    
    if (result.success) {
      setCustomers(result.data.customers);
      setProjects(result.data.projects);
      setOutsourceStaff(result.data.outsourceStaff);
      
      // Save to cache
      setCached(CACHE_KEYS.customers, result.data.customers, TTL.customers);
      setCached(CACHE_KEYS.projects, result.data.projects, TTL.projects);
      setCached(CACHE_KEYS.outsourceStaff, result.data.outsourceStaff, TTL.outsourceStaff);
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

- [ ] Cache save/load hoạt động
- [ ] TTL expiration hoạt động
- [ ] Cache được load khi refresh page
- [ ] Background fetch update cache
- [ ] Error handling với localStorage disabled
- [ ] Error handling với quota exceeded
- [ ] Performance: instant load từ cache

---

## 📊 Performance Metrics

### Before
- Initial load: ~400ms (API call)
- Refresh page: ~400ms (API call again)

### After
- Initial load: ~400ms (API call, save cache)
- Refresh page: **< 10ms** (load from cache)
- Background update: ~400ms (không block UI)

**Expected improvement:** 40x faster on refresh

---

## 📝 Notes

- localStorage có giới hạn ~5-10MB
- Cần handle quota exceeded gracefully
- TTL có thể điều chỉnh tùy use case
- Consider IndexedDB nếu cần cache lớn hơn
- Cache có thể invalidate khi user logout

---

## 🔗 Dependencies

- Phase 1: Context Setup (completed)
- Phase 4: Batch API (recommended, not required)

---

## ✅ Definition of Done

- [ ] Cache utility created và tested
- [ ] Context integrated với cache
- [ ] TTL hoạt động đúng
- [ ] Error handling robust
- [ ] Performance improved (instant load từ cache)
- [ ] Code review passed

---

**Next:** Testing & Performance Validation
