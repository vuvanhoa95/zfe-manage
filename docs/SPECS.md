# SPECS – Module Công việc & Tiến độ (Phase 1 – MVP)

Status: Draft  
Scope: Tập trung vào quản lý công việc & tiến độ cho **1 dự án** trong ZFENIX (không làm workspace đa dự án ở phase này).

---

## 1. User Stories chính (Phase 1)

### US1 – PM xem & quản lý tiến độ tổng quan dự án
Là **Project Manager**, tôi muốn xem danh sách công việc của dự án theo nhiều chế độ xem (List, Board, Gantt đơn giản) để theo dõi tiến độ và phát hiện các công việc chậm.

**Acceptance Criteria**
- [ ] Có tab `Công việc` trong chi tiết dự án với:
  - [ ] List view (hiện có) được hoàn thiện cột, filter, search.
  - [ ] Board view (Kanban theo Status).
  - [ ] Gantt/Timeline view đơn giản (task theo trục thời gian).
- [ ] Mỗi view cho phép lọc theo Status, Priority, Assignee, Phase (nếu có).
- [ ] Ở top tab hiển thị:
  - [ ] % tiến độ trung bình của toàn bộ task (overall progress).
  - [ ] Số task chậm tiến độ (Due date < hôm nay & chưa Done).

### US2 – Team Lead lập kế hoạch công việc theo giai đoạn/bộ môn
Là **Team Lead/BIM Coordinator**, tôi muốn tạo và nhóm task theo Phase, Discipline và Location để phản ánh đúng cấu trúc triển khai BIM.

**Acceptance Criteria**
- [ ] Có Custom fields tối thiểu:
  - [ ] `Phase` (enum, config ở mức dự án: ví dụ “Khảo sát”, “Thiết kế”, “Triển khai shopdrawing”, “Thi công”).
  - [ ] `Discipline` (ARC/STR/MEP/OTHER).
  - [ ] `Location` (text/tầng/khu vực).
- [ ] Các field này:
  - [ ] Nhập được trong form tạo/chỉnh sửa task.
  - [ ] Hiển thị được ở List view (có thể bật/tắt cột).
  - [ ] Sử dụng được làm tiêu chí filter & group-by (ít nhất ở List view).

### US3 – Member cập nhật tiến độ và trạng thái công việc
Là **Member**, tôi muốn cập nhật trạng thái, % hoàn thành và ghi chú nhanh để PM/Lead nắm được tình hình mà không phải mở từng màn hình phức tạp.

**Acceptance Criteria**
- [ ] Trạng thái task dùng bộ Status hiện tại (To Do / In Progress / Completed / Delayed / …).
- [ ] Có slider/field % tiến độ trong task:
  - [ ] Cho phép chỉnh tay.
  - [ ] Nếu task có subtask (phase sau) thì có flag để auto tính (Phase 1 có thể chưa cần auto).
- [ ] Từ List view:
  - [ ] Có thể đổi Status và % progress nhanh (inline edit hoặc popup nhẹ).
  - [ ] Có nút “Đánh dấu hoàn thành” nhanh.

### US4 – Tự động phát hiện & đánh dấu công việc chậm tiến độ
Là **PM/Lead**, tôi muốn hệ thống tự đánh dấu và lọc được task chậm để ưu tiên xử lý.

**Acceptance Criteria**
- [ ] Mỗi task có `Due date`.
- [ ] Nếu `Due date < hôm nay` và Status chưa phải “Hoàn thành/Done”:
  - [ ] Task được coi là “Overdue”.
  - [ ] Có visual cue (màu đỏ, icon cảnh báo).
- [ ] Ở tab `Công việc`:
  - [ ] Có filter nhanh “Chỉ hiển thị task quá hạn”.
  - [ ] Ô tổng quan hiển thị số task quá hạn / tổng số task.

### US5 – View “My Work” cho từng người
Là **người dùng bất kỳ**, tôi muốn xem tất cả công việc được giao cho mình trong 1 view riêng để tập trung làm việc.

**Acceptance Criteria**
- [ ] Từ menu/dự án, có view “Công việc của tôi” lọc theo:
  - [ ] Assignee = current user.
  - [ ] Có tùy chọn khoảng thời gian (Tuần này / 7 ngày tới / Tất cả).
- [ ] Mặc định sắp xếp theo Due date tăng dần.
- [ ] Cho phép đổi Status/Progress trực tiếp trong view này.

---

## 2. Phạm vi kỹ thuật Phase 1 (từ BRIEF + PROJECT_MODULE_PLAN)

1. **Model & DB**
   - [ ] Bổ sung/kiểm tra lại bảng `Task` (nếu chưa đủ):
     - [ ] Các field cơ bản (title, description, status, priority, startDate, endDate/dueDate, progress, assignedTo…).
     - [ ] Thêm các field: `phase`, `discipline`, `location`.
   - [ ] Đảm bảo index hợp lý cho lọc theo status, assignee, phase, dueDate.

2. **API**
   - [ ] Mở rộng API `/api/projects/[id]/tasks`:
     - [ ] Nhận & trả về các field mới (phase/discipline/location/progress/dueDate).
     - [ ] Hỗ trợ query cơ bản: filter by status/assignee/priority/phase.
   - [ ] API update task đơn lẻ `/api/tasks/[taskId]`:
     - [ ] Cho phép cập nhật progress, status, dueDate, phase, discipline, location.

3. **UI – Tab Công việc trong chi tiết dự án**
   - [ ] Hoàn thiện List view hiện tại:
     - [ ] Bổ sung cột Phase/Discipline/Location/Due date (có thể cấu hình ẩn/hiện).
     - [ ] Inline edit đơn giản cho Status/Progress/Due date.
   - [ ] Tinh chỉnh Board view:
     - [ ] Đảm bảo drag & drop mượt, hiển thị thêm ngày & assignee.
   - [ ] Gantt/Timeline đơn giản:
     - [ ] Dùng dữ liệu startDate/endDate để vẽ thanh.
     - [ ] Chưa cần edit trực tiếp trên Gantt (kéo thả) ở phase 1; tập trung read-only + highlight overdue.

4. **Overdue logic & tổng quan**
   - [ ] Hàm helper xác định task quá hạn (sử dụng timezone VN).
   - [ ] Badge/label “Quá hạn” và màu đỏ trong List/Board/Gantt.
   - [ ] Ô “Tiến độ” trên header tab:
     - [ ] % trung bình của `progress`.
     - [ ] Số task quá hạn / tổng task.

5. **View “My Work”**
   - [ ] Route/view mới hoặc filter có sẵn:
     - [ ] Lọc theo assignee = current user.
     - [ ] Reuse List view layout, nhưng ẩn bớt thông tin không cần thiết (Project đã rõ).

---

## 3. Ưu tiên (Must / Should / Nice)

### Must Have (Phase 1)
- [ ] List view ổn định với filter + cột mới.
- [ ] Board view sử dụng tốt trong thực tế.
- [ ] Progress tổng quan & đếm task quá hạn.
- [ ] Custom fields Phase/Discipline/Location ở mức đơn giản.
- [ ] View My Work.

### Should Have
- [ ] Gantt/Timeline read-only.
- [ ] Inline edit thân thiện (ít popup nhất có thể).
- [ ] Tooltip/legend giải thích trạng thái & tiến độ.

### Nice to Have
- [ ] Lưu bộ filter/view yêu thích cho từng user.
- [ ] Nhắc quá hạn qua notification (in-app).

---

## 4. Ràng buộc & Ghi chú

- Tất cả UI text: tiếng Việt, phù hợp ngữ cảnh BIM/xây dựng.
- Không làm workspace đa dự án phức tạp ở phase 1; tập trung **1 dự án** có tab Công việc mạnh trước.
- Tận dụng tối đa component/tab hiện có trong `TaskTab` để tránh double-implementation.

---

## 5. Hướng mở rộng – Custom Fields Settings kiểu ClickUp (Ngoài phạm vi Phase 1)

- Về lâu dài, module Công việc & Tiến độ sẽ có:
  - Màn hình **Settings → Custom Fields** cho từng Workspace/Space để:
    - Tạo/sửa/xóa custom field với đầy đủ loại field giống danh sách trong `PROJECT_MODULE_PLAN.md` (Text, Number, Dropdown, Date, Checkbox, Currency, Email, Phone, URL, Rating, Progress, File, Relationship, Formula, Location, Label, Auto-increment ID…).
    - Cấu hình phạm vi áp dụng (toàn Space / Folder / List), bắt buộc hay không, giá trị mặc định, quyền chỉnh sửa.
    - Lưu bộ custom fields thành template để áp dụng cho Space mới.
- Phase 1 chỉ triển khai **một số field cố định** (`Phase`, `Discipline`, `Location`, `Due date`) như đã mô tả ở trên; phần Custom Settings đầy đủ sẽ được tách thành kế hoạch riêng ở các phase sau (Enhanced/Advanced).

