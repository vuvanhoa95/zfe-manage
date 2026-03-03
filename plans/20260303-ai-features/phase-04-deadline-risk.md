# Phase 04: AI Deadline Risk Detector
**Status:** ⬜ Pending  
**Depends on:** Phase 03 (cần có task data đủ)  
**Estimated:** 1 session

---

## 🎯 Mục tiêu

Tự động tính toán "Risk Score" cho mỗi dự án đang chạy → Hiển thị badge màu (🟢🟡🔴) trên:
1. Danh sách dự án (`/projects`)
2. Dashboard alerts
3. Header của từng project page

**Không cần AI LLM** — tính toán thuần túy dựa trên data thực tế. Nhanh, rẻ, không tốn API call.

---

## 📋 Requirements

### Functional
- [ ] Badge Risk Score hiển thị trên Project List card
- [ ] Tooltip giải thích nguyên nhân risk: "Đã qua 60% thời gian nhưng chỉ hoàn thành 30% task"
- [ ] Dashboard section "Dự án cần chú ý" — liệt kê các dự án 🔴
- [ ] Tự động tính lại khi: task status thay đổi, endDate thay đổi
- [ ] Không hiển thị risk cho dự án COMPLETED / CANCELLED / PLANNING

### Non-Functional
- [ ] Client-side calculation (không cần API call riêng) — dùng data đã fetch
- [ ] Fallback: Nếu không có task → hiển thị ⚪ (N/A)
- [ ] Cache: Tính lại mỗi 5 phút hoặc khi có mutation

---

## 🧮 Risk Calculation Logic

```typescript
function calcProjectRisk(project: Project, tasks: Task[]): RiskLevel {
  const now = Date.now();
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  
  // Không có deadline → không tính được
  if (!project.startDate || !project.endDate) return 'NA';
  
  // Dự án chưa bắt đầu hoặc đã xong
  if (now < start) return 'NA';
  if (now > end) return tasks.every(t => t.status === 'DONE') ? 'DONE' : 'OVERDUE';
  
  const totalTasks = tasks.filter(t => t.status !== 'CANCELLED').length;
  if (totalTasks === 0) return 'NA';
  
  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const timeElapsedRatio = (now - start) / (end - start);  // 0→1
  const tasksDoneRatio = doneTasks / totalTasks;             // 0→1
  
  // riskRatio: nếu > 1 thì đang chậm so với deadline
  const riskRatio = tasksDoneRatio === 0
    ? (timeElapsedRatio > 0.2 ? 999 : 0) // Chưa làm task nào nhưng đã qua 20% thời gian
    : timeElapsedRatio / tasksDoneRatio;
  
  if (riskRatio < 1.0) return 'ON_TRACK';    // 🟢 Đang đúng tiến độ
  if (riskRatio < 1.3) return 'AT_RISK';     // 🟡 Có nguy cơ trễ
  return 'BEHIND';                            // 🔴 Đang trễ tiến độ
}
```

---

## 🛠️ Implementation Steps

### Step 1: Utility Function
- [ ] Tạo `lib/ai/project-risk.ts` — export `calcProjectRisk()`, `getRiskLabel()`, `getRiskColors()`

### Step 2: RiskBadge Component
- [ ] Tạo `components/project/RiskBadge.tsx`
- [ ] Props: `risk: RiskLevel, tooltip?: string, size?: 'sm' | 'md'`
- [ ] Hiển thị: icon + màu + label
  ```
  🟢 Đúng tiến độ
  🟡 Có nguy cơ
  🔴 Đang trễ
  ⚫ Chưa có dữ liệu
  ```

### Step 3: Tích hợp vào Project List
- [ ] `app/(dashboard)/projects/page.tsx` — fetch tasks summary cùng với projects
- [ ] Hoặc: thêm `_riskData: { total, done }` vào API `/api/projects` response
- [ ] Render `<RiskBadge>` trong mỗi project card

### Step 4: Dashboard Alert Section
- [ ] `app/api/dashboard/alerts/route.ts` — thêm alert type `project-behind`
- [ ] Hiển thị trong Dashboard: "⚠️ 3 dự án đang trễ tiến độ"

---

## 📁 Files to Create/Modify

- `lib/ai/project-risk.ts` ← **TẠO MỚI** (utility, không cần AI API)
- `components/project/RiskBadge.tsx` ← **TẠO MỚI**
- `app/(dashboard)/projects/page.tsx` ← **SỬA** (thêm risk badge)
- `app/api/projects/route.ts` ← **SỬA** (thêm task summary trong response)
- `app/api/dashboard/alerts/route.ts` ← **SỬA** (thêm project-behind alert)

---

## 🧪 Test Criteria

- [ ] Dự án: 30 ngày, đã qua 20 ngày, hoàn thành 5/10 task → 🟡 AT_RISK
- [ ] Dự án: 30 ngày, đã qua 10 ngày, hoàn thành 8/10 task → 🟢 ON_TRACK
- [ ] Dự án: 30 ngày, đã qua 25 ngày, hoàn thành 2/10 task → 🔴 BEHIND
- [ ] Dự án không có endDate → hiển thị ⚫ N/A
- [ ] Tooltip hiển thị đúng: "Đã qua X% thời gian, hoàn thành Y% task"

---

Next Phase: [Phase 05 — AI Cash Flow Forecast](./phase-05-cashflow-forecast.md)
