# BRIEF – Module Công việc & Tiến độ (ZFENIX Project Management)

## 1. Vấn đề & Bối cảnh

- Các công ty BIM/xây dựng tại Việt Nam thường quản lý công việc bằng Excel, Zalo, email hoặc tool generic (Jira, Trello, ClickUp) nên:
  - Khó bám sát tiến độ thực tế theo cấu trúc dự án xây dựng (giai đoạn, hạng mục, bộ môn, tầng/khu vực).
  - Thiếu liên kết với báo giá, dòng tiền, BIM model và các chuẩn Việt Nam (TCVN, lịch nghỉ lễ).
  - Thiếu chế độ xem phù hợp cho từng vai trò (PM, kỹ sư BIM, hiện trường, khách hàng).

## 2. Giải pháp tổng quát

- Xây một module **Công việc & Tiến độ** xoay quanh `Task` nhưng:
  - Gắn chặt với cấu trúc dự án (Phase → Hạng mục → Bộ môn → Task).
  - Cho phép theo dõi tiến độ đa tầng: Task → List/Folder → Phase → Dự án.
  - Hỗ trợ nhiều “góc nhìn tiến độ”: Kanban, Gantt, Calendar, Timeline, Workload, Dashboard.
  - Tự động hoá cập nhật % hoàn thành, cảnh báo chậm tiến độ, và đồng bộ với dòng tiền/báo giá.

## 3. Đối tượng & Nhu cầu riêng cho “Công việc & Tiến độ”

- **PM / Director**: Muốn xem nhanh:
  - Dự án đang ở phase nào, % hoàn thành theo phase/hạng mục.
  - Task chậm tiến độ, bottleneck theo bộ môn/nhân sự.
- **BIM Coordinator / Team Lead**:
  - Lập plan chi tiết (WBS) theo bộ môn, tầng, giai đoạn.
  - Quản lý clash issues, review vòng lặp, giao việc rõ cho từng người.
- **Member (Modeler, Engineer)**:
  - Danh sách việc rõ ràng theo ngày/tuần.
  - Biết ưu tiên, deadline, phụ thuộc; update tiến độ nhanh.
- **Client / Consultant**:
  - Xem **view tiến độ đã rút gọn**, không bị “quá technical”.

## 4. Gợi ý mở rộng Plan hiện tại – Tập trung vào Công việc & Tiến độ

### 4.1 Mở rộng mô hình Task/Phase cho dự án xây dựng

- Thêm các chiều phân loại chuyên cho xây dựng:
  - `Phase` (Khảo sát, Thiết kế cơ sở, Thiết kế kỹ thuật, Thiết kế bản vẽ thi công, Triển khai shopdrawing, Thi công, Bàn giao…).
  - `Discipline` (ARC/STR/MEP/Infra).
  - `Location` (Tầng, khu vực, grid).
  - `Package` (Gói thầu, hạng mục công trình).
- Định nghĩa **WBS template** cho từng loại dự án:
  - Ví dụ: “BIM Coordination cho công trình dân dụng 30 tầng” → auto tạo cấu trúc Folder/List/Subtask chuẩn.

### 4.2 Tiến độ đa tầng (Roll-up Progress)

- Xác định rõ rule tính % tiến độ:
  - Task: từ checklist/subtask (mặc định: trung bình có trọng số, cho phép override tay).
  - List/Folder: trung bình có trọng số theo effort hoặc số task.
  - Phase / Dự án: tổng hợp từ các Folder/List đã gắn phase.
- Đề xuất thêm:
  - **Progress type** cho task: `manual` vs `auto_from_subtasks`.
  - Hiển thị **“Confidence level”** của % tiến độ (ví dụ: đủ log time, đủ checklist thì “Đáng tin cậy”).

### 4.3 Tích hợp tiến độ với thời gian (Schedule)

- Mở rộng phần Gantt/Timeline:
  - Cho phép **Baseline** cho từng phase/hạng mục (khóa lại plan ban đầu).
  - Tự động tính:
    - `Delay (ngày)` = Today – Planned End (cho task chưa Done).
    - `Ahead/Behind schedule` theo % tiến độ so với baseline.
  - View “**Critical path light**” ở mức đơn giản: highlight các task không có slack trong 1 phase.
- Thêm **Construction Calendar**:
  - Ngày nghỉ lễ Việt Nam, lịch làm việc (5/6 ngày/tuần), ca làm việc.
  - Ảnh hưởng trực tiếp đến tính toán Due date / Duration.

### 4.4 Công việc hiện trường & cập nhật tiến độ thực tế

- Tách 2 luồng:
  - **Office/BIM tasks**: Model, clash, drawing, review.
  - **Site tasks**: Nghiệm thu, chụp ảnh, báo cáo hiện trường.
- Gợi ý chi tiết cho Site task:
  - Check-in theo vị trí (QR code tại khu vực, hoặc chọn từ bản đồ/tầng).
  - Upload ảnh trước/sau, đánh dấu khối lượng hoàn thành (%, hoặc số lượng).
  - Tự động log thời gian thực hiện (start/stop).

### 4.5 Rule tự động cho “Công việc & Tiến độ”

- Bổ sung category Automation chuyên cho tiến độ:
  - Khi `% complete < X` nhưng đã qua `Due date` → tự chuyển trạng thái “Chậm tiến độ” + ping PM.
  - Khi tất cả subtask “In Review” đã “Approved” → chuyển task cha sang “Done”.
  - Khi task thuộc phase hiện tại hoàn thành 100% → tự move sang phase kế tiếp / tạo phase tiếp theo.
  - Khi log thời gian thực tế > 150% estimate → flag “Overrun” để PM xem.

### 4.6 View dành riêng cho quản lý tiến độ

- **Progress Dashboard theo phase/hạng mục**:
  - Widget: S-curve đơn giản (planned vs actual % complete).
  - Heatmap theo bộ môn/tầng (màu càng đậm = càng chậm).
- **Workload & Focus view cho member**:
  - View “My Week”: tất cả task của 1 người trong tuần, chia theo ngày/buổi.
  - Quick action: “Hoàn thành hôm nay”, “Dời sang ngày mai”.

### 4.7 Liên kết với báo giá & dòng tiền

- Dù module tài chính đã có, nên đóng khung thêm:
  - Cho phép map **Phase / Hạng mục** → **Gói chi phí** trong báo giá.
  - Dashboard “Tiến độ vs Thanh toán”:
    - % tiến độ thực tế của hạng mục.
    - % tiền đã thu / đã xuất hóa đơn.
  - Rule automation: Khi phase đạt X% và không có issue critical → gợi ý PM tạo đợt thanh toán mới.

## 5. Đề xuất ưu tiên (MVP cho Công việc & Tiến độ)

- **MVP mở rộng cho plan hiện tại**:
  1. Chuẩn hóa mô hình Task/Phase/Discipline/Location (custom fields + template).
  2. Roll-up progress đa tầng (Task → List → Phase → Project) + hiển thị rõ trên Dashboard dự án.
  3. Gantt/Timeline với Baseline đơn giản + tính Delay & Overdue theo phase.
  4. Automation cơ bản cho quá hạn, hoàn tất subtask/checklist, và thay đổi phase.
  5. View “My Work / My Week” cho từng user để cập nhật tiến độ nhanh.

- **Phase sau**:
  - S-curve, Earned Value kiểu “nhẹ” (không cần full PMBOK).
  - Tích hợp sâu với BIM (Clash → Task → Progress → Report).

---

**Next:** Khi anh ok với các ý trên, em có thể giúp tách thành `/plan` chi tiết cho Phase 1 (MVP “Công việc & Tiến độ”) dựa trên `plans/PROJECT_MODULE_PLAN.md`.***
