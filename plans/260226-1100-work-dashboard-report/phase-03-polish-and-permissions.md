# Phase 3 – Polish, hiệu năng & phân quyền Dashboard/Report

## Mục tiêu

- Hoàn thiện UX, tối ưu hiệu năng cho Dashboard/Report.
- Thiết lập quy tắc phân quyền xem/chỉnh sửa phù hợp với từng vai trò.

## Tasks

- [ ] **Hiệu năng & UX**
  - [ ] Kiểm tra số lượng query và thời gian phản hồi của API Dashboard/Report với dự án lớn.
  - [ ] Thêm caching hợp lý (ISR/SWR hoặc equivalent) cho các thống kê không cần realtime tuyệt đối.
  - [ ] Đảm bảo khi chuyển tab `Dashboard` ↔ `Task` ↔ `Report` không bị nháy loading thô.
  - [ ] Tối ưu skeleton/loading-state cho KPI, charts và bảng.

- [ ] **Phân quyền & bảo mật**
  - [ ] Xác định roles được phép truy cập Dashboard/Report (ví dụ: Admin, PM, Lead; Member chỉ xem một số phần).
  - [ ] Ẩn/disable tab hoặc một phần dữ liệu nếu user không có quyền.
  - [ ] Đảm bảo API aggregate không trả về dữ liệu nhạy cảm cho user không có quyền (nếu có thêm thông tin chi phí giờ công...).

- [ ] **Trải nghiệm in & export**
  - [ ] Tinh chỉnh lại layout in sau khi dùng thực tế (font, margin, ngắt trang).
  - [ ] Kiểm tra export Excel (nếu có) với bộ lọc phức tạp.

- [ ] **Monitoring & feedback**
  - [ ] Thêm logging nhẹ cho các lỗi Dashboard/Report.
  - [ ] Ghi nhận feedback từ người dùng pilot, tổng hợp backlog cải tiến cho phase tiếp theo.

