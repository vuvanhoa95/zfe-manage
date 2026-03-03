# Phase 03: AI Auto-Task Generator
**Status:** ⬜ Pending  
**Depends on:** Phase 02  
**Estimated:** 2-3 sessions

---

## 🎯 Mục tiêu

Admin mở tab **"Công việc"** của dự án → Bấm **"✨ AI tạo task"** → Modal hiển thị danh sách task BIM phân cấp được AI đề xuất → Admin duyệt/bỏ bớt → Bấm "Import" → Task được tạo vào DB.

---

## 📋 Requirements

### Functional
- [ ] Nút "✨ AI tạo task" trong tab Công việc (ẩn nếu đã có >5 task)
- [ ] Modal preview: hiện cây task (parent → children) trước khi import
- [ ] Checkbox cho từng task: Admin chọn/bỏ chọn trước khi import
- [ ] Import xong: Refresh danh sách task, hiện toast "Đã tạo X task"
- [ ] Phát hiện bộ môn từ mô tả dự án (ARC, STR, MEP...) hoặc cho Admin chọn

### Non-Functional
- [ ] Gọi API 1 lần, không streaming (vì cần JSON output cấu trúc)
- [ ] Timeout: 45s (response có thể lớn)
- [ ] Model: GPT-4o (cần reasoning tốt để tạo task tree đúng)

---

## 🛠️ Implementation Steps

### Step 1: API Route — Generate Tasks
- [ ] Tạo `app/api/ai/generate-tasks/route.ts`
- [ ] Input: `{ projectId, projectName, description, totalArea, disciplines[] }`
- [ ] GPT tạo JSON array task tree với cấu trúc chuẩn
- [ ] Validate JSON output trước khi trả về client

### Step 2: API Route — Import Tasks
- [ ] Tạo hoặc tái dùng `app/api/projects/[id]/tasks` với batch import
- [ ] Accept `tasks[]` với `parentId` hỗ trợ
- [ ] Tạo parent task trước → lấy ID → tạo children với parentId

### Step 3: Component AITaskGenerator
- [ ] Tạo `components/project/AITaskGenerator.tsx`
- [ ] Step 1: Dialog chọn disciplines (ARC / STR / MEP / All)
- [ ] Step 2: Loading → call API generate
- [ ] Step 3: Preview tree với checkbox từng task
- [ ] Nút "Import tất cả" / "Import đã chọn" / "Hủy"

### Step 4: Tích hợp vào WorkTabsContainer
- [ ] Thêm nút "✨ AI tạo task" vào toolbar của tab task
- [ ] Ẩn nếu `tasks.length > 5` (đã có task rồi)
- [ ] Sau import: gọi callback `onTasksCreated()` để refresh

---

## 📁 Files to Create/Modify

- `app/api/ai/generate-tasks/route.ts` ← **TẠO MỚI**
- `components/project/AITaskGenerator.tsx` ← **TẠO MỚI**
- `components/project/WorkTabsContainer.tsx` ← **SỬA** (thêm nút + trigger)
- `app/api/projects/[id]/tasks/route.ts` ← **SỬA** (thêm batch import)

---

## 📐 Task Tree Schema (AI Output)

```json
{
  "disciplines": ["ARC", "STR"],
  "tasks": [
    {
      "title": "KIẾN TRÚC (ARC)",
      "priority": "HIGH",
      "estimatedDays": 30,
      "order": 1,
      "children": [
        { "title": "Khảo sát & Thu thập tài liệu", "estimatedDays": 3, "order": 1 },
        { "title": "Modeling LOD 200 - Sơ bộ", "estimatedDays": 7, "order": 2 },
        { "title": "Modeling LOD 300 - Chi tiết", "estimatedDays": 12, "order": 3 },
        { "title": "Shopdrawing & Xuất bản vẽ", "estimatedDays": 5, "order": 4 },
        { "title": "Review & Chỉnh sửa tổng hợp", "estimatedDays": 3, "order": 5 }
      ]
    },
    {
      "title": "KẾT CẤU (STR)",
      "priority": "HIGH",
      "estimatedDays": 25,
      "order": 2,
      "children": [...]
    }
  ]
}
```

---

## 🧪 Test Criteria

- [ ] Dự án "Nhà phố 3 tầng, 200m2" → AI tạo đúng task cho nhà phố (không sinh task không liên quan)
- [ ] Dự án "Tòa nhà văn phòng 20 tầng, ARC + STR + MEP" → AI tạo 3 nhóm task
- [ ] Preview modal hiện đúng cây parent-children
- [ ] Bỏ chọn 1 parent → tất cả children cũng bị bỏ chọn
- [ ] Import thành công → Task xuất hiện đúng trong danh sách, có parentId

---

## 💡 Discipline Mapping

| Viết tắt | Tên đầy đủ | Task types điển hình |
|----------|------------|----------------------|
| ARC | Kiến trúc | Modeling, Shopdrawing, Hoàn thiện |
| STR | Kết cấu | Phân tích, Modeling, Detailing |
| MEP | Cơ điện lạnh | M&E, Plumbing, HVAC, Fire |
| INT | Nội thất | Concept, 3D, FF&E |
| SITE | Hạ tầng | Cổng, Sân, Cây xanh |

---

Next Phase: [Phase 04 — AI Deadline Risk Detector](./phase-04-deadline-risk.md)
