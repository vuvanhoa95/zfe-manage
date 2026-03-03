# Phase 05: AI Cash Flow Forecast
**Status:** ⬜ Pending  
**Depends on:** Phase 04  
**Estimated:** 2 sessions

---

## 🎯 Mục tiêu

Trang Dashboard có section **"Dự báo dòng tiền"** — biểu đồ bar chart hiển thị thu/chi dự kiến 6 tháng tới, tính từ các milestone thanh toán của các dự án đang chạy.

Cảnh báo ngay nếu tháng nào có nguy cơ âm dòng tiền.

---

## 📋 Requirements

### Functional
- [ ] Biểu đồ bar chart: trục X là tháng (6 tháng tới), trục Y là VND
- [ ] Mỗi cột có 2 màu: xanh (thu dự kiến) + đỏ (chi dự kiến)
- [ ] Đường tích lũy: balance dự báo cuối mỗi tháng
- [ ] Cảnh báo 🔴 nếu balance tháng nào <= 0
- [ ] Click vào tháng → xem chi tiết các khoản thu/chi của tháng đó
- [ ] Toggle: "Chỉ xem tháng có dữ liệu" / "6 tháng liên tục"

### Non-Functional
- [ ] Không cần AI LLM — aggregate data từ CashFlow table
- [ ] Refresh mỗi 10 phút hoặc khi có CashFlow mutation
- [ ] Responsive: mobile chỉ hiện 3 tháng, desktop 6 tháng

---

## 🛠️ Implementation Steps

### Step 1: API — Forecast Data
- [ ] Tạo `app/api/dashboard/cashflow-forecast/route.ts`
- [ ] Query: `CashFlow` records có `expectedDate` trong 6 tháng tới, status != CANCELLED
- [ ] Group by month, aggregate expected amounts
- [ ] Phân loại: INCOME (thu) vs EXPENSE (chi) dựa trên `type` field

### Step 2: Chart Component  
- [ ] Tạo `components/dashboard/CashFlowForecastChart.tsx`
- [ ] Dùng **Recharts** (đã có sẵn trong project nếu có, hoặc cài thêm)
- [ ] Alternately dùng Chart.js nếu đã import trước
- [ ] Hiện tooltip khi hover: danh sách các CashFlow items trong tháng đó

### Step 3: Integrate vào Dashboard
- [ ] `app/(dashboard)/page.tsx` — thêm section CashFlow Forecast
- [ ] Fetch parallel với các data khác
- [ ] Skeleton loading trong khi fetch

### Step 4: Alert Badge
- [ ] Nếu balance dự báo tháng nào <= 0 → thêm vào Dashboard alerts
- [ ] `app/api/dashboard/alerts/route.ts` — loại alert `cashflow-negative`

---

## 📁 Files to Create/Modify

- `app/api/dashboard/cashflow-forecast/route.ts` ← **TẠO MỚI**
- `components/dashboard/CashFlowForecastChart.tsx` ← **TẠO MỚI**
- `app/(dashboard)/page.tsx` ← **SỬA** (thêm chart section)
- `app/api/dashboard/alerts/route.ts` ← **SỬA** (thêm cashflow-negative alert)

---

## 📊 API Response Format

```json
{
  "success": true,
  "data": {
    "months": [
      {
        "month": "2026-03",
        "label": "Tháng 3/2026",
        "income": 150000000,
        "expense": 80000000,
        "net": 70000000,
        "cumulativeBalance": 270000000,
        "items": [
          { "id": "cf_123", "project": "Landmark 81", "type": "INCOME", "amount": 150000000, "description": "Đợt 2" }
        ]
      }
    ],
    "summary": {
      "totalIncome6M": 800000000,
      "totalExpense6M": 400000000,
      "lowestBalance": 50000000,
      "negativeMonths": []
    }
  }
}
```

---

## 🧪 Test Criteria

- [ ] Có 3 CashFlow income trong tháng 4 → tháng 4 hiển thị tổng đúng
- [ ] Balance tháng 5 âm → badge cảnh báo 🔴 trên chart
- [ ] Tooltip hover tháng 3 → hiện danh sách CashFlow items
- [ ] Mobile: chart responsive, không bị overflow
- [ ] Không có CashFlow nào → hiện empty state "Chưa có dữ liệu dòng tiền"

---

Next: **Tất cả phases hoàn thành** → `/deploy` để lên production
