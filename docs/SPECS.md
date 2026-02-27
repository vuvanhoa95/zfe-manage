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

---

## 6. Phase 2 – Dashboard & Report cho tab Công việc

### 6.1 User stories bổ sung

#### US6 – Dashboard tổng quan tiến độ công việc theo dự án
Là **Project Manager hoặc Team Lead**, tôi muốn xem nhanh một màn hình tổng quan tiến độ của tất cả công việc trong dự án (số lượng, phân bổ theo trạng thái, quá hạn, theo giai đoạn/bộ môn, theo nhân sự) để biết ngay chỗ nào đang có rủi ro.

**Acceptance Criteria**
- [ ] Trong tab `Công việc` có 3 tab con: `Dashboard`, `Task`, `Report`.
- [ ] Tab mặc định là `Dashboard` (có thể cấu hình sau, phase này hard-code).
- [ ] Dashboard hiển thị tối thiểu 4 thẻ KPI:
  - [ ] Tổng số công việc.
  - [ ] Số công việc đang thực hiện.
  - [ ] Số công việc đã hoàn thành.
  - [ ] Số công việc quá hạn.
- [ ] Có ít nhất 2 biểu đồ:
  - [ ] Biểu đồ 1: Số lượng task theo trạng thái.
  - [ ] Biểu đồ 2: Số lượng task theo giai đoạn (`Phase`) hoặc bộ môn (`Discipline`).
- [ ] Có bảng "Công việc sắp đến hạn & quá hạn" (top 10):
  - [ ] Cột tối thiểu: Tên công việc, Giai đoạn, Bộ môn, Người phụ trách, Ngày hết hạn, Trạng thái, % tiến độ.
  - [ ] Click vào một dòng sẽ điều hướng sang tab `Task` và highlight task tương ứng (hoặc scroll tới đúng vị trí).
- [ ] Dashboard luôn lọc theo **1 dự án hiện tại**, hỗ trợ filter thêm theo:
  - [ ] Bộ môn.
  - [ ] Người phụ trách.
  - [ ] Khoảng thời gian (Due date trong 7 ngày / 30 ngày / Tất cả).

#### US7 – Báo cáo tiến độ & khối lượng công việc có thể in / xuất file
Là **PM hoặc Ban Giám đốc**, tôi muốn xuất báo cáo tiến độ công việc theo giai đoạn, bộ môn và nhân sự để phục vụ họp tuần/tháng và lưu trữ.

**Acceptance Criteria**
- [ ] Tab `Report` nằm cùng cấp với `Dashboard` và `Task`.
- [ ] Có chọn **loại báo cáo** tối thiểu:
  - [ ] `Tiến độ theo giai đoạn` (Phase).
  - [ ] `Tiến độ theo bộ môn` (Discipline).
  - [ ] `Công việc theo nhân sự`.
- [ ] Có bộ lọc chung: Khoảng thời gian (theo Due date hoặc Completed date), Trạng thái, Mức ưu tiên.
- [ ] Mỗi loại báo cáo hiển thị 1 bảng tổng hợp + số liệu tổng:
  - [ ] Ví dụ: `Tiến độ theo giai đoạn` hiển thị số task/từng trạng thái, % hoàn thành theo Phase.
  - [ ] `Công việc theo nhân sự` hiển thị số task, số task quá hạn, % hoàn thành theo từng người.
- [ ] Có phần "Ghi chú / Nhận xét" (text area) để PM nhập nội dung trước khi in/xuất.
- [ ] Có nút:
  - [ ] `In báo cáo` – mở layout in đơn giản, 1–2 trang A4 thân thiện (ẩn header/sidebar, giữ logo & thông tin dự án).
  - [ ] `Xuất Excel` – tải file `.xlsx` với dữ liệu đang filter (có thể đánh dấu là **Nice to have** nếu cần đẩy sang phase sau).

---

### 6.2 Phạm vi kỹ thuật Phase 2 (Dashboard & Report)

1. **Data layer & API**
   - [ ] Bổ sung các API aggregate cho task theo dự án: tổng số task, theo trạng thái, theo phase/discipline, theo assignee.
   - [ ] Endpoint lấy danh sách task sắp đến hạn & quá hạn cho Dashboard.
   - [ ] Endpoint tạo dataset cho từng loại báo cáo (hoặc tái sử dụng chung một endpoint với tham số `groupBy`).

2. **UI – Tab con trong module Công việc**
   - [ ] Refactor component `TaskTab` (hoặc tương đương) để hỗ trợ 3 tab nhỏ: `Dashboard`, `Task`, `Report`.
   - [ ] Giữ nguyên logic hiện tại cho tab `Task` (List/Board/Gantt), chỉ di chuyển vào tab con.
   - [ ] Thiết kế Dashboard theo phong cách charts hiện tại (reuse components từ module Dashboard/Charts nếu có).

3. **Dashboard**
   - [ ] Tạo layout lưới 2x2 cho biểu đồ / bảng, responsive.
   - [ ] Card KPI sử dụng màu thương hiệu ZFENIX, icon rõ ràng.
   - [ ] Bảng công việc sắp đến hạn có phân trang đơn giản (hoặc giới hạn top 10).

4. **Report**
   - [ ] Tạo component chọn loại báo cáo + bộ lọc chung.
   - [ ] Xây dựng 3 layout bảng báo cáo (Phase, Discipline, Assignee).
   - [ ] Thiết kế layout in (CSS `@media print`) cho tab Report.
   - [ ] (Optional) Module export Excel tái sử dụng từ các phần khác nếu đã có.

---

### 6.3 Ưu tiên Phase 2

**Must Have**
- [ ] 3 tab con `Dashboard` / `Task` / `Report` trong module Công việc.
- [ ] Dashboard có KPI + ít nhất 1 biểu đồ + bảng công việc sắp đến hạn/quá hạn.
- [ ] Report có tối thiểu 1 loại báo cáo (`Tiến độ theo giai đoạn`) với filter cơ bản và layout in.

**Should Have**
- [ ] Đủ 3 loại báo cáo.
- [ ] Ít nhất 2 biểu đồ trên Dashboard (trạng thái, giai đoạn/bộ môn).
- [ ] Export Excel cho Report.

**Nice to Have**
- [ ] Lưu cấu hình Dashboard/Report ưa thích cho từng user.
- [ ] Chia sẻ link report chỉ đọc cho khách hàng (Public share link với token).
