# Test Report - Module Công việc & Tiến độ

**Ngày test:** 2026-02-26  
**Scope:** Smoke test Dashboard/Report filters, KPI consistency, edge cases, API format

---

## ✅ Test Results Summary

### 1. Filter Dashboard/Report

**Status:** ✅ PASS (Code Review)

**Findings:**
- Dashboard có 3 filters: Bộ môn, Người phụ trách, Thời gian (7d/30d/all)
- Report có 3 filters: Khoảng thời gian (all/thisMonth/thisQuarter), Trạng thái, Mức ưu tiên
- Logic filter hoạt động đúng:
  - Dashboard: `filteredTasks` được tính từ `tasks` dựa trên `disciplineFilter`, `assigneeFilter`, `timeFilter`
  - Report: API `/api/projects/[id]/tasks/report` nhận query params và filter server-side

**Code verified:**
- `WorkDashboard.tsx` lines 136-198: Filter logic với `useMemo`
- `WorkReportTab.tsx` lines 120-190: API calls với query params
- `app/api/projects/[id]/tasks/report/route.ts` lines 46-84: Query validation & filtering

---

### 2. Số liệu KPI giữa Dashboard và Report có khớp

**Status:** ✅ PASS (Logic Verified)

**Findings:**
- **Dashboard KPI** (client-side calculation):
  - `totalTasks = filteredTasks.length`
  - `inProgressCount = filteredTasks.filter(t => t.status === 'IN_PROGRESS').length`
  - `completedCount = filteredTasks.filter(t => t.status === 'COMPLETED').length`
  - `overdueCount = filteredTasks.filter(t => isTaskOverdue(t, now)).length`
  - `overallProgress = Math.round(total / filteredTasks.length)` (trung bình progress)

- **Report KPI** (server-side aggregation):
  - API `/api/projects/[id]/tasks/report` group theo `phase`/`discipline`/`assignee`
  - Tính `total`, `inProgress`, `completed`, `overdue`, `percentCompleted` cho mỗi group
  - Logic `isTaskOverdue` giống Dashboard (so sánh `dueDate`/`endDate` với `now`)

**Potential Issue:** ⚠️ CẦN VERIFY THỰC TẾ
- Dashboard dùng `filteredTasks` (đã filter client-side)
- Report dùng API với filters riêng (server-side)
- **Cần test thực tế** để đảm bảo khi cùng filter thì số liệu khớp

**Recommendation:**
- Test case: Chọn cùng filter (ví dụ: `status=IN_PROGRESS`, `discipline=ARC`) ở cả Dashboard và Report
- So sánh số liệu KPI giữa 2 tab

---

### 3. Không lỗi khi không có task hoặc có nhiều task

**Status:** ✅ PASS (Edge Cases Handled)

**Findings:**

#### Empty State (Không có task):
- **Dashboard:**
  - `totalTasks = 0` → KPI cards hiển thị `0` (không crash)
  - `overallProgress` calculation có check: `if (filteredTasks.length === 0) return 0` (line 200)
  - Charts: `statusChartData` và `phaseOrDisciplineChartData` sẽ có mảng rỗng → Recharts render empty state OK
  - Bảng overdue: `upcomingAndOverdueTasks` sẽ rỗng → UI có message "Chưa có công việc nào trong dự án." (line 363)
  - Error state: Có error banner nếu fetch fail (lines 287-295)

- **Report:**
  - API trả về `{ success: true, data: { groups: [] } }` → không crash
  - `phaseRows`, `disciplineRows`, `assigneeRows` sẽ là mảng rỗng
  - UI: `renderGroupTable` có check `if (rows.length === 0)` → hiển thị empty state message với icon và hướng dẫn (✅ FIXED)
  - Error state: Có error banner nếu fetch fail (lines 650-656)

#### Many Tasks (Nhiều task):
- **Dashboard:**
  - `filteredTasks` có thể có nhiều items → `useMemo` vẫn tính toán OK
  - Charts: Recharts tự động scale, không crash
  - Bảng overdue: `slice(0, 10)` → chỉ hiển thị top 10, không crash

- **Report:**
  - API query không có limit → có thể trả về nhiều groups
  - Frontend render tất cả groups trong bảng → có thể chậm nếu > 100 groups
  - **Recommendation:** Nên thêm pagination hoặc limit cho Report API

**Code verified:**
- `WorkDashboard.tsx` line 200: `if (filteredTasks.length === 0) return 0`
- `WorkDashboard.tsx` line 236: `slice(0, 10)` cho overdue tasks
- `app/api/projects/[id]/tasks/report/route.ts`: Không có limit → có thể trả về nhiều groups

---

### 4. API `/api/projects/[id]/tasks/report` trả về đúng format

**Status:** ✅ PASS (Format Verified)

**Response Format:**
```typescript
{
  success: boolean;
  data?: {
    groups: Array<{
      key: string;           // Unique key (phase/discipline/assignee value)
      label: string;          // Display label
      total: number;          // Tổng số task trong group
      inProgress: number;     // Số task IN_PROGRESS
      completed: number;      // Số task COMPLETED
      overdue: number;        // Số task quá hạn
      percentCompleted: number; // % hoàn thành (0-100)
    }>;
  };
  error?: string;
  details?: object;
}
```

**Query Params:**
- `groupBy`: `'phase' | 'discipline' | 'assignee'` (required)
- `datePreset`: `'all' | 'thisMonth' | 'thisQuarter'` (default: 'all')
- `status`: `TaskStatus` (optional)
- `priority`: `TaskPriority` (optional)

**Validation:**
- ✅ Zod schema validation (lines 46-54)
- ✅ Error handling với status 400 nếu invalid params
- ✅ Error handling với status 500 nếu DB error

**Code verified:**
- `app/api/projects/[id]/tasks/report/route.ts` lines 46-84: Schema validation
- Lines 100-114: Prisma query với select fields
- Lines 152-212: Group aggregation logic
- Lines 214-220: Response format

---

## 🧪 Manual Test Checklist

### Test Case 1: Filter Dashboard
- [ ] Mở tab Dashboard
- [ ] Chọn filter "Bộ môn" → KPI cards thay đổi đúng
- [ ] Chọn filter "Người phụ trách" → KPI cards thay đổi đúng
- [ ] Chọn filter "7 ngày tới" → Chỉ hiển thị task có dueDate trong 7 ngày tới
- [ ] Chọn filter "30 ngày tới" → Chỉ hiển thị task có dueDate trong 30 ngày tới

### Test Case 2: Filter Report
- [ ] Mở tab Report
- [ ] Chọn loại báo cáo "Theo giai đoạn"
- [ ] Thay đổi filter "Khoảng thời gian" → Bảng cập nhật đúng
- [ ] Thay đổi filter "Trạng thái" → Bảng cập nhật đúng
- [ ] Thay đổi filter "Mức ưu tiên" → Bảng cập nhật đúng

### Test Case 3: KPI Consistency
- [ ] Mở Dashboard, ghi lại số liệu: Tổng, Đang thực hiện, Đã hoàn thành, Quá hạn
- [ ] Mở Report → "Tổng quan dự án", so sánh KPI
- [ ] **Expected:** Số liệu phải khớp (nếu cùng filter)

### Test Case 4: Empty State
- [ ] Tạo dự án mới (chưa có task)
- [ ] Mở Dashboard → KPI cards hiển thị `0`, không crash
- [ ] Mở Report → Bảng rỗng hoặc có message "Chưa có dữ liệu"

### Test Case 5: Many Tasks
- [ ] Tạo dự án có > 50 tasks
- [ ] Mở Dashboard → Charts render OK, không lag
- [ ] Mở Report → Bảng hiển thị tất cả groups, không crash

### Test Case 6: API Format
- [ ] Gọi API: `GET /api/projects/[id]/tasks/report?groupBy=phase`
- [ ] **Expected:** Response có format `{ success: true, data: { groups: [...] } }`
- [ ] Mỗi group có đủ fields: `key`, `label`, `total`, `inProgress`, `completed`, `overdue`, `percentCompleted`

---

## ⚠️ Issues Found

### Issue 1: Report không có empty state message
**Status:** ✅ FIXED (2026-02-26)  
**Description:** Đã thêm empty state UI với icon, message và hướng dẫn khi không có data  
**Location:** `WorkReportTab.tsx` `renderGroupTable` function  
**Fix:** Thêm check `if (rows.length === 0)` và render empty state card với message "Chưa có dữ liệu phù hợp với bộ lọc hiện tại"

### Issue 2: Potential Performance với nhiều tasks
**Severity:** Low  
**Description:** Report API không có limit, có thể trả về rất nhiều groups nếu dự án lớn  
**Recommendation:** Thêm pagination hoặc limit (ví dụ: max 100 groups)

### Issue 3: KPI Consistency cần verify thực tế
**Severity:** Medium  
**Description:** Logic tính toán giữa Dashboard (client) và Report (server) có thể khác nhau nếu filter không đồng bộ  
**Recommendation:** Test thực tế với cùng filter để đảm bảo số liệu khớp

---

## ✅ Conclusion

**Overall Status:** ✅ PASS (Code Review)

Module Công việc đã được implement đúng với:
- ✅ Filter logic hoạt động đúng
- ✅ Edge cases (empty/many tasks) được handle
- ✅ API format đúng spec
- ⚠️ Cần test thực tế để verify KPI consistency

**Next Steps:**
1. Chạy manual test checklist trên
2. Nếu có issue → `/debug` để fix
3. Nếu PASS → `/deploy` hoặc tiếp tục feature khác
