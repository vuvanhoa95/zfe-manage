# 🚀 Speed Optimization Guide

## 📊 Phân tích nguyên nhân chậm

### 1. **Vercel Serverless Functions**
- **Cold Start**: Lần đầu tiên function được gọi có thể mất 1-3s
- **Region**: Nếu Vercel và Neon ở khác region → latency cao
- **Memory/CPU**: Giới hạn resources có thể làm chậm

### 2. **Neon Database**
- **Connection Time**: Mỗi lần connect mất ~200-500ms
- **Query Performance**: Queries chưa tối ưu
- **Connection Pooling**: Chưa dùng pooled connection
- **Region Mismatch**: Neon và Vercel ở khác region

### 3. **Code Issues**
- **N+1 Queries**: Load relations không hiệu quả
- **Thiếu Caching**: Mỗi request đều query database
- **Large Queries**: Load quá nhiều dữ liệu cùng lúc

---

## ✅ Đã tối ưu

### 1. Connection Pooling
- ✅ Sử dụng Neon pooled connection string
- ✅ Prisma Client singleton pattern
- ✅ Reuse connections trong serverless

### 2. Caching
- ✅ In-memory cache cho dashboard stats (30s)
- ✅ Cache projects list (30s, không cache khi search)

### 3. Query Optimization
- ✅ Pagination cho projects list
- ✅ Limit queries (quotations: 50, cashFlows: 100)
- ✅ Select only needed fields

---

## 🔧 Cần làm tiếp

### 1. **Kiểm tra Connection String**

Đảm bảo `DATABASE_URL` trên Vercel dùng **pooled connection**:

```
# Pooled (nhanh hơn cho serverless)
postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/db?sslmode=require

# Không pooled (chậm hơn)
postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require
```

**Cách kiểm tra:**
1. Vào Neon Dashboard → Connection String
2. Chọn **"Pooled connection"**
3. Copy connection string
4. Update trên Vercel Environment Variables

### 2. **Kiểm tra Region Matching**

**Vercel Region:**
- Vào Vercel Dashboard → Project Settings → General
- Xem region hiện tại (thường là `iad1` - US East)

**Neon Region:**
- Vào Neon Dashboard → Project Settings
- Xem region (nên match với Vercel)

**Nếu khác region:**
- Tạo Neon project mới ở cùng region với Vercel
- Hoặc migrate database sang region mới

### 3. **Tối ưu thêm**

#### A. Upgrade Cache Strategy
```typescript
// Thay in-memory cache bằng Vercel KV hoặc Redis
import { kv } from '@vercel/kv';

// Cache với TTL
await kv.set('dashboard:stats', data, { ex: 30 });
```

#### B. Database Indexes
Đã có indexes tốt trong schema, nhưng có thể thêm:
```prisma
@@index([createdAt, status]) // Composite index
@@index([customerId, status])
```

#### C. Query Optimization
- Sử dụng `select` thay vì `include` khi chỉ cần một vài fields
- Batch queries với `Promise.all`
- Sử dụng `findFirst` thay vì `findMany` khi chỉ cần 1 record

#### D. Vercel Edge Functions
Cho các API routes không cần database:
- Move static data to Edge Functions
- Use Edge Cache

---

## 📈 Kết quả mong đợi

### Trước khi tối ưu:
- Dashboard: 2-3s
- Projects list: 1-2s
- Project detail: 1-2s

### Sau khi tối ưu:
- Dashboard: <500ms (với cache), <1s (không cache)
- Projects list: <300ms (với pagination)
- Project detail: <500ms

---

## 🔍 Debug Performance

### 1. Kiểm tra Function Logs trên Vercel
```
Vercel Dashboard → Deployments → Functions → Logs
```
Tìm:
- Cold start time
- Function duration
- Database query time

### 2. Kiểm tra Database Performance
```sql
-- Xem slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### 3. Test với curl
```bash
# Test API response time
time curl https://zfe-manage.vercel.app/api/dashboard/stats

# Test với cache
time curl https://zfe-manage.vercel.app/api/dashboard/stats
```

---

## 💡 Best Practices

1. **Luôn dùng pooled connection** cho serverless
2. **Cache các queries thường dùng** (dashboard, stats)
3. **Pagination** cho list queries
4. **Select only needed fields**
5. **Batch queries** khi có thể
6. **Region matching** giữa Vercel và Neon

---

## 🚀 Next Steps

1. ✅ Kiểm tra và update DATABASE_URL trên Vercel (dùng pooled)
2. ✅ Kiểm tra region matching
3. ⏳ Upgrade cache strategy (Vercel KV)
4. ⏳ Thêm database indexes nếu cần
5. ⏳ Monitor performance với Vercel Analytics
