# Plan: AI Features Integration
**Created:** 2026-03-03  
**Status:** 🟡 In Progress  
**Folder:** `plans/20260303-ai-features/`

---

## 📌 Tổng quan

Tích hợp AI vào ZfeManage theo 4 tính năng ưu tiên, xây dựng tuần tự để mỗi phase có thể ship độc lập.

### Tech Stack AI
- **LLM:** OpenAI GPT-4o-mini (text) + GPT-4o (complex)
- **Image Search:** Serper.dev (Google Images API)
- **Streaming:** Server-Sent Events cho các tính năng real-time

---

## 🗺️ Phases

| Phase | Tên | Status | Priority |
|-------|-----|--------|----------|
| 01 | ✅ AI Image Search | ✅ DONE | P0 |
| 02 | AI Description Enhancer | ⬜ Pending | P1 |
| 03 | AI Auto-Task Generator | ⬜ Pending | P1 |
| 04 | AI Deadline Risk Detector | ⬜ Pending | P2 |
| 05 | AI Cash Flow Forecast | ⬜ Pending | P2 |
| 06 | AI Customer Quick Lookup | ⬜ Pending | P1 |

---

## Phase 01 — AI Image Search ✅ DONE

**Files đã tạo:**
- `app/api/ai/search-project-images/route.ts`
- `components/project/AIImageSearch.tsx`
- Tích hợp vào `ProjectEditor.tsx`

**Về phần biến môi trường:**
- `SERPER_API_KEY` → Cần đăng ký tại serper.dev

---

## Phase 02 — AI Description Enhancer

**Mô tả:** Sau khi nhập tên dự án + vị trí, bấm "✨ AI viết mô tả" → AI tự viết mô tả chuyên nghiệp cho dự án BIM.

**Files cần tạo:**
- `app/api/ai/enhance-project-description/route.ts`
- UI: Nút "✨ AI viết mô tả" cạnh textarea mô tả trong ProjectEditor

**Input:** `{ projectName, location, buildingType?, totalArea? }`  
**Output:** `{ description: string }` — text streaming real-time

---

## Phase 03 — AI Auto-Task Generator

**Mô tả:** Từ thông tin dự án (tên, mô tả, diện tích, bộ môn BIM), AI sinh ra danh sách task phân cấp (parent → children) phù hợp với dự án BIM.

**Files cần tạo:**
- `app/api/ai/generate-tasks/route.ts`
- `components/project/AITaskGenerator.tsx` — Modal xem/duyệt danh sách task trước khi import
- Nút "✨ AI tạo task" trong tab Công việc của ProjectEditor

**Input:** `{ projectId, projectName, description, totalArea, disciplines[] }`  
**Output:** `{ tasks: TaskTree[] }` — cây task có parentId

**Schema task output:**
```json
[
  {
    "title": "KIẾN TRÚC (ARC)",
    "priority": "HIGH",
    "estimatedDays": 30,
    "children": [
      { "title": "Khảo sát & Thu thập tài liệu", "estimatedDays": 3 },
      { "title": "Modeling LOD 300", "estimatedDays": 15 },
      { "title": "Shopdrawing & Xuất bản vẽ", "estimatedDays": 7 },
      { "title": "Review & Chỉnh sửa", "estimatedDays": 5 }
    ]
  }
]
```

---

## Phase 04 — AI Deadline Risk Detector

**Mô tả:** Hiển thị Risk Score (🟢🟡🔴) trên Dashboard và trang dự án, cho biết nguy cơ trễ tiến độ dựa trên % hoàn thành vs thời gian còn lại.

**Files cần tạo:**
- `app/api/ai/project-risk/route.ts`
- `components/project/RiskBadge.tsx` — Badge hiển thị risk score
- Tích hợp vào Dashboard cards và Project list

**Logic tính Risk:**
```
riskRatio = (daysElapsed / totalDays) / (tasksCompleted / totalTasks)
- riskRatio < 1.0 → 🟢 ON TRACK
- riskRatio 1.0-1.3 → 🟡 AT RISK  
- riskRatio > 1.3  → 🔴 BEHIND SCHEDULE
```

**Không cần gọi LLM** — tính toán thuần túy, nhanh, rẻ.

---

## Phase 05 — AI Cash Flow Forecast

**Mô tả:** Dự báo dòng tiền 3-6 tháng tới dựa trên các milestone thu tiền của dự án đang chạy.

**Files cần tạo:**
- `app/api/ai/cashflow-forecast/route.ts`
- `components/dashboard/CashFlowForecastChart.tsx`
- Hiển thị trong trang Dashboard

**Input:** Lấy từ DB — các CashFlow records có `expectedDate` + `status`  
**Output:** Chart dự báo dòng tiền theo tháng + cảnh báo tháng âm

---

## ⚠️ Env Variables cần thêm

```env
# Serper.dev - Google Image Search (Phase 01)
SERPER_API_KEY=your_key_here

# OpenAI - đã có sẵn
OPENAI_API_KEY=your_key_here
```

---

## 📋 Quick Commands

```bash
# Bắt đầu phase tiếp theo
/code phase-02   # AI Description Enhancer

# Check progress
/next

# Deploy sau mỗi phase
git push origin main
```
