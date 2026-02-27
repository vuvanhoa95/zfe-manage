# Phase 1 – Dashboard cho tab Công việc

## Mục tiêu

- Thiết lập cấu trúc 3 tab con `Dashboard` / `Task` / `Report` trong module Công việc của chi tiết dự án.
- Xây dựng Dashboard với KPI + biểu đồ + bảng công việc sắp đến hạn/quá hạn, dùng chung nguồn dữ liệu với tab Task.

## Tasks

- [ ] **Cấu trúc tab & routing**
  - [ ] Xác định component hiện đang render phần `Công việc & Tiến độ` (ví dụ `TaskTab` hoặc tương đương).
  - [ ] Refactor để bọc nội dung thành 3 tab con: `Dashboard`, `Task`, `Report`.
  - [ ] Đảm bảo tab `Task` hiển thị đúng UI hiện tại (List/Board/Gantt/My Work nếu có).
  - [ ] Giữ nguyên toàn bộ API call & logic filter hiện tại cho tab `Task`.

- [ ] **API & dữ liệu cho Dashboard**
  - [ ] Thiết kế helper/service lấy data tổng hợp từ bảng `Task` (tận dụng Prisma hiện có):
    - [ ] Tổng số task theo dự án.
    - [ ] Số task theo trạng thái (To Do / In Progress / Done / Delayed / ...).
    - [ ] Số task theo giai đoạn (`phase`) và bộ môn (`discipline`).
    - [ ] Số task theo người phụ trách (assignee) – số đang mở, số quá hạn.
  - [ ] Hàm xác định task quá hạn (reuse logic overdue hiện có, nếu đã implement).
  - [ ] Endpoint/route (hoặc server action) trả về dataset cho Dashboard (groupBy/status/phase/assignee).

- [ ] **UI – Cards KPI**
  - [ ] Thiết kế 4 card KPI:
    - [ ] Tổng số công việc.
    - [ ] Đang thực hiện.
    - [ ] Đã hoàn thành.
    - [ ] Quá hạn.
  - [ ] Sử dụng màu thương hiệu: `bg-zf-primary`, `text-zf-accent`, icon rõ ràng.
  - [ ] Hover-state và loading-state rõ ràng (skeleton hoặc spinner nhẹ).

- [ ] **UI – Biểu đồ tổng quan**
  - [ ] Reuse chart components hiện có (Recharts + glassmorphism từ `DASHBOARD_CHARTS_DESIGN.md` nếu phù hợp).
  - [ ] Biểu đồ 1: Số lượng task theo trạng thái.
  - [ ] Biểu đồ 2: Số lượng task theo giai đoạn hoặc bộ môn (chọn cái nào dễ implement trước, tách config rõ ràng).
  - [ ] Đảm bảo responsive: 2x2 grid trên desktop, 1 cột trên mobile.

- [ ] **UI – Bảng "Công việc sắp đến hạn & quá hạn"**
  - [ ] Lấy top 10 task theo Due date (ưu tiên overdue, sau đó đến hạn trong 7 ngày).
  - [ ] Cột tối thiểu: Tên task, Phase, Discipline, Assignee, Due date, Status, % progress.
  - [ ] Thêm visual cue cho overdue (màu đỏ, icon cảnh báo).
  - [ ] Click vào một dòng:
    - [ ] Điều hướng sang tab `Task`.
    - [ ] Apply filter + scroll/highlight task tương ứng (nếu khả thi trong phase này).

- [ ] **Filter & UX**
  - [ ] Bộ lọc cơ bản trên Dashboard: Bộ môn, Người phụ trách, Khoảng thời gian (7 ngày/30 ngày/Tất cả).
  - [ ] Lưu filter trong URL query hoặc state để có thể share link (Nice-to-have, nếu đơn giản).
  - [ ] Đảm bảo performance: tránh gọi lại API không cần thiết khi chỉ đổi tab con.

- [ ] **Kiểm thử & hoàn thiện**
  - [ ] Test với project chưa có task (empty state thân thiện, tiếng Việt).
  - [ ] Test với project có nhiều task (performance, pagination nếu cần).
  - [ ] Review UI với team: đảm bảo số liệu trên Dashboard khớp với tab Task.

