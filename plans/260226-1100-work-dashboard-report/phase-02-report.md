# Phase 2 – Report: Báo cáo tiến độ & khối lượng công việc

## Mục tiêu

- Xây dựng tab `Report` trong module Công việc với các loại báo cáo chính: theo giai đoạn, theo bộ môn, theo nhân sự.
- Hỗ trợ filter linh hoạt và layout in phục vụ họp tuần/tháng.

## Tasks

- [ ] **Kiến trúc & routing cho tab Report**
  - [ ] Thêm tab `Report` cạnh `Dashboard` và `Task` trong module Công việc.
  - [ ] Tạo component `TaskReportTab` (hoặc tên tương tự) để chứa toàn bộ logic report.

- [ ] **Bộ lọc chung cho Report**
  - [ ] Chọn loại báo cáo (radio hoặc segmented control):
    - [ ] `Tiến độ theo giai đoạn`.
    - [ ] `Tiến độ theo bộ môn`.
    - [ ] `Công việc theo nhân sự`.
  - [ ] Bộ lọc chung:
    - [ ] Khoảng thời gian (Due date / Completed date).
    - [ ] Trạng thái.
    - [ ] Mức ưu tiên.
  - [ ] Nút "Áp dụng" và "Xóa lọc".

- [ ] **API & dataset cho từng loại báo cáo**
  - [ ] Thiết kế 1 endpoint/dịch vụ chung nhận tham số `groupBy`, `dateRange`, `filters` và trả về dữ liệu:
    - [ ] `groupBy = phase`: tổng số task, số task theo trạng thái, % hoàn thành.
    - [ ] `groupBy = discipline`: tương tự, group theo bộ môn.
    - [ ] `groupBy = assignee`: số task, số task quá hạn, % hoàn thành theo nhân sự.
  - [ ] Đảm bảo endpoint lọc theo project hiện tại.

- [ ] **UI – Bảng báo cáo**
  - [ ] Thiết kế bảng cho từng loại báo cáo, ví dụ:
    - [ ] `Tiến độ theo giai đoạn`: Cột Phase, Tổng task, Đang thực hiện, Hoàn thành, Quá hạn, % hoàn thành.
    - [ ] `Tiến độ theo bộ môn`: Discipline, Tổng task, Hoàn thành, Quá hạn, % hoàn thành.
    - [ ] `Công việc theo nhân sự`: Tên nhân sự, Tổng task, Đang thực hiện, Quá hạn, % hoàn thành.
  - [ ] Thêm hàng tổng (Total) ở cuối bảng khi phù hợp.
  - [ ] Hỗ trợ sort theo % hoàn thành hoặc số task quá hạn.

- [ ] **Ghi chú & metadata báo cáo**
  - [ ] Vùng text area "Ghi chú / Nhận xét" cho PM nhập trước khi in.
  - [ ] Hiển thị metadata: Tên dự án, Khoảng thời gian, Ngày giờ tạo báo cáo, Người tạo.

- [ ] **Layout in (Print)**
  - [ ] Thiết kế layout in riêng cho tab Report (CSS `@media print`):
    - [ ] Ẩn header/sidebar không cần thiết.
    - [ ] Hiển thị logo, tên dự án, loại báo cáo, người tạo, ngày giờ.
    - [ ] Bảng báo cáo + ghi chú gọn gàng, vừa trang A4.
  - [ ] Nút `In báo cáo` gọi `window.print()` với layout tối ưu.

- [ ] **Export Excel (Nice-to-have)**
  - [ ] Nếu hệ thống đã có helper xuất Excel, tái sử dụng cho Report.
  - [ ] Dữ liệu Excel phải tương ứng chính xác với dataset đang hiển thị (sau khi áp filter).

- [ ] **Kiểm thử & hoàn thiện**
  - [ ] Kiểm tra dữ liệu giữa Report và Dashboard/Task trùng khớp.
  - [ ] Test với nhiều kích thước dataset (ít, vừa, lớn).
  - [ ] Thu feedback từ PM/Lead về cấu trúc báo cáo và tinh chỉnh nếu cần.

