# Phase 3 – My Work & UX Polish

## Mục tiêu
- Hoàn thiện trải nghiệm người dùng cá nhân (My Work) và tối ưu UX cho việc cập nhật tiến độ hàng ngày.

## Tasks

- [ ] View “Công việc của tôi”
  - [ ] Tạo route/view (hoặc filter preset) hiển thị tất cả task có assignee = current user.
  - [ ] Bộ lọc thời gian nhanh: “Tất cả”, “Tuần này”, “7 ngày tới”.
  - [ ] Sắp xếp mặc định theo Due date tăng dần.
  - [ ] Cho phép đổi Status/Progress trực tiếp (inline).
- [ ] Shortcut cập nhật nhanh
  - [ ] Thêm action “Đánh dấu hoàn thành hôm nay”.
  - [ ] Thêm action “Dời sang ngày mai” (tăng Due date +1 ngày) cho task chưa Done.
- [ ] UX/Copywriting
  - [ ] Rà lại toàn bộ text UI trong tab Công việc để thống nhất từ ngữ (Tiến độ, Quá hạn, Giai đoạn…).
  - [ ] Tooltip giải thích icon màu sắc (overdue, tiến độ).
- [ ] Performance & QA
  - [ ] Test với dự án có 200–500 task: đảm bảo List/Board không lag quá 1–1.5s khi load.
  - [ ] Viết checklist test tay cho các view chính (List/Board/Gantt/My Work).

