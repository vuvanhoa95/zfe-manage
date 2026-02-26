# Phase 2 – Views & Progress: List/Board/Gantt & Overdue Logic

## Mục tiêu
- Nâng cấp tab `Công việc` để hỗ trợ các view chính và hiển thị tiến độ/overdue rõ ràng.

## Tasks

- [ ] List View
  - [ ] Thêm/bật các cột: Phase, Discipline, Location, Due date.
  - [ ] Cho phép cấu hình ẩn/hiện cột (tối thiểu trên UI, chưa cần persist user-level).
  - [ ] Inline edit: Status, Progress, Due date.
- [ ] Board View
  - [ ] Kiểm tra lại drag & drop, đảm bảo sync status/column → backend.
  - [ ] Hiển thị thêm: Due date (màu đỏ nếu quá hạn), assignee, progress nhỏ.
- [ ] Gantt/Timeline đơn giản
  - [ ] Reuse logic từ `TaskTab` hiện tại (nếu có) hoặc trích xuất thành component chung.
  - [ ] Hiển thị thanh theo start/end date, highlight overdue tasks.
  - [ ] Chưa cho phép kéo thả chỉnh ngày ở phase này.
- [ ] Header “Tiến độ”
  - [ ] Tính `overallProgress` = trung bình `progress` của các task (đang dùng).
  - [ ] Tính số task quá hạn / tổng số.
  - [ ] Hiển thị progress bar + số % + badge “x task quá hạn”.
- [ ] Helper Overdue
  - [ ] Hàm chung xác định task quá hạn theo timezone VN.
  - [ ] Áp dụng cho List/Board/Gantt (className màu & icon).

