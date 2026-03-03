# Phase 02: AI Description Enhancer
**Status:** ⬜ Pending  
**Depends on:** Phase 01 ✅  
**Estimated:** 1 session

---

## 🎯 Mục tiêu

Khi tạo/sửa dự án, Admin nhập tên dự án + vị trí (các thông tin cơ bản) → Bấm **"✨ AI viết mô tả"** → AI tự động tạo mô tả chuyên nghiệp cho dự án BIM (streaming real-time).

---

## 📋 Requirements

### Functional
- [ ] Nút "✨ AI viết mô tả" hiện ngay cạnh label "Mô tả" trong form dự án
- [ ] Chỉ active khi `projectName` không rỗng (cần tên tối thiểu)
- [ ] Streaming text: chữ xuất hiện từng từ như ChatGPT (không chờ full response)
- [ ] User xem mô tả được tạo → có thể chỉnh sửa thêm trước khi lưu
- [ ] Nút "Thử lại" nếu muốn AI viết lại theo hướng khác

### Non-Functional
- [ ] Timeout: 30s
- [ ] Model: GPT-4o-mini (đủ tốt, rẻ hơn 10x so với GPT-4o)
- [ ] Language: Tiếng Việt, văn phong chuyên nghiệp BIM/xây dựng

---

## 🛠️ Implementation Steps

### Step 1: API Route
- [ ] Tạo `app/api/ai/enhance-project-description/route.ts`
- [ ] Method: POST, dùng **SSE streaming** để text xuất hiện dần
- [ ] Input body: `{ projectName, location, buildingType?, totalArea?, notes? }`
- [ ] Prompt tiếng Việt, chuyên ngành BIM

### Step 2: UI trong ProjectEditor
- [ ] Thêm nút "✨ AI viết mô tả" cạnh label "Mô tả" (không phải thay thế textarea)
- [ ] State: `isGenerating` → show spinner + disabled textarea
- [ ] Streaming: dùng `ReadableStream` để append text vào textarea theo thời gian thực
- [ ] Sau khi xong: textarea có thể edit bình thường

### Step 3: UX Polish
- [ ] Placeholder "AI đang viết mô tả..." khi đang stream
- [ ] Hiển thị số ký tự khi hoàn thành
- [ ] Nút "↩️ Viết lại" nếu muốn generate lần khác

---

## 📁 Files to Create/Modify

- `app/api/ai/enhance-project-description/route.ts` ← **TẠO MỚI**
- `components/project/ProjectEditor.tsx` ← **SỬA** (thêm nút + streaming logic)

---

## 🧪 Test Criteria

- [ ] Nhập "Tòa nhà Landmark 81, Quận Bình Thạnh, TP.HCM" → AI viết mô tả đủ ý, chuyên nghiệp
- [ ] Streaming hoạt động (text xuất hiện từng đoạn, không chờ một lúc rồi hiện hết)
- [ ] Textarea vẫn edit được sau khi AI xong
- [ ] Nếu không có tên dự án → hiện toast warning, không gọi API

---

## 💡 Prompt mẫu cho AI

```
Bạn là chuyên gia BIM tại Việt Nam. Hãy viết mô tả chuyên nghiệp cho dự án sau.

Tên dự án: {projectName}
Vị trí: {location}
Loại công trình: {buildingType} (nếu có)
Tổng diện tích sàn: {totalArea} m² (nếu có)

YÊU CẦU:
- 2-4 câu, ngắn gọn súc tích
- Phong cách chuyên nghiệp BIM/xây dựng
- Bao gồm: mục đích công trình, quy mô, đặc điểm nổi bật
- Viết bằng tiếng Việt
- KHÔNG dùng từ "tôi" hoặc "chúng tôi"
- KHÔNG thêm tiêu đề hay bullet points
```

---

Next Phase: [Phase 03 — AI Auto-Task Generator](./phase-03-auto-task-generator.md)
