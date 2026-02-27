# Plan – Dashboard & Report cho module Công việc

## Bối cảnh

Module **Công việc & Tiến độ** hiện tại tập trung vào quản lý và hiển thị danh sách công việc (List/Board/Gantt, My Work).  
Theo yêu cầu mới, khu vực này sẽ được chia thành 3 tab con: `Dashboard`, `Task`, `Report` – trong đó `Task` tái sử dụng toàn bộ logic hiện tại, còn `Dashboard` và `Report` là hai trải nghiệm mới.

## Mục tiêu

- Cung cấp **Dashboard** trực quan giúp PM/Lead nắm tiến độ dự án trong vài giây (KPI + charts + danh sách công việc sắp đến hạn/quá hạn).
- Cung cấp **Report** có thể in/xuất file, tổng hợp theo giai đoạn, bộ môn và nhân sự phục vụ họp tuần/tháng.
- Đảm bảo cấu trúc tab mới không phá vỡ UX hiện tại của phần `Công việc & Tiến độ`.

## Phasing

1. **Phase 1 – Dashboard cho tab Công việc**
   - Thiết lập cấu trúc 3 tab con.
   - Xây dựng các card KPI, biểu đồ và bảng "Công việc sắp đến hạn & quá hạn".
2. **Phase 2 – Report: Báo cáo tiến độ & khối lượng công việc**
   - Xây dựng tab `Report` với các loại báo cáo và bộ lọc.
   - Thiết kế layout in và (nếu kịp) export Excel.
3. **Phase 3 – Polish & Quyền truy cập**
   - Tối ưu hiệu năng, UX, phân quyền xem Dashboard/Report.

> Chi tiết tasks nằm trong các file:  
> - `phase-01-dashboard.md`  
> - `phase-02-report.md`  
> - `phase-03-polish-and-permissions.md`

