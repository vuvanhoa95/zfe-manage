# Design Specs – Tab Công việc (Dashboard / Task / Report)

## 1. Phạm vi & bối cảnh

- Màn hình: **Chi tiết dự án → Tab "Công việc"**.
- Bên trong tab "Công việc" có 3 tab con:
  - `Dashboard` – Tổng quan tiến độ công việc.
  - `Task` – Danh sách/Board/Gantt như hiện tại (reuse UI).
  - `Report` – Báo cáo tiến độ & khối lượng công việc (in/xuất file).
- Thiết kế bám theo **Tech Premium v2.0** và brand ZFENIX (Navy/Blue/Graphite, glassmorphism nhẹ).

---

## 2. Layout tổng thể tab "Công việc"

- **Header trang (PageHeader)**
  - Tiêu đề: `Công việc & Tiến độ`.
  - Mô tả: `Quản lý công việc, theo dõi tiến độ theo giai đoạn và bộ môn`.
  - Icon: `✅` hoặc `📋` (tùy style chung trong app).
  - Actions bên phải: nút `➕ Thêm công việc` (btn-premium) + menu `⚙️ Cài đặt` (icon button).

- **Thanh tab con** (ngay dưới PageHeader, full width trong ContentCard):
  - Kiểu segmented tabs bo tròn, nền glassmorphism:
    - Container: `flex gap-2 p-1 rounded-2xl bg-white/70 backdrop-blur border border-zf-primary/10 shadow-sm`.
    - Tab item:
      - Normal: `px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-zf-primary hover:bg-zf-primary/5 transition-all`.
      - Active: `bg-zf-primary text-white shadow-[0_6px_18px_rgba(5,54,99,0.35)]`.
  - Thứ tự tab: `Dashboard` (mặc định) → `Task` → `Report`.

- **Vùng nội dung tab**:
  - Bọc bởi `ContentCard`:
    - Padding trong: `p-5 md:p-6 lg:p-8`.
    - Nền: `bg-white/80` trên desktop, `bg-white` trên mobile.
    - Khoảng cách giữa các block: `space-y-6 md:space-y-8`.

---

## 3. Tab `Dashboard` – UI chi tiết

### 3.1 Bộ lọc & summary (hàng đầu)

- Hàng trên cùng bên trong Dashboard:
  - Bên trái: **bộ lọc**:
    - Dropdown `Bộ môn` (Discipline).
    - Dropdown `Người phụ trách` (Assignee).
    - Dropdown `Thời gian` với các option: `7 ngày tới`, `30 ngày tới`, `Tất cả`.
    - Style input/filter:
      - `h-10 md:h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent transition-all`.
  - Bên phải: nhãn tóm tắt nhỏ:
    - Ví dụ: `24 công việc · 6 quá hạn` (text-gray-500, icon cảnh báo đỏ nhỏ cho phần quá hạn).

### 3.2 Hàng KPI (4 cards)

- Lưới: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5`.
- Mỗi card KPI:
  - Container: `rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 to-zf-primary/5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] p-4 md:p-5 flex flex-col gap-2 relative overflow-hidden`.
  - Nội dung:
    - Label: `text-xs font-semibold tracking-wide text-gray-500 uppercase`.
    - Value: `text-2xl md:text-3xl font-bold text-zf-primary`.
    - Subtext: `text-xs md:text-sm text-gray-500`.
    - Icon tròn góc trên bên phải: vòng tròn gradient `bg-gradient-to-br from-zf-primary to-zf-accent text-white w-8 h-8 flex items-center justify-center rounded-full text-base shadow-md opacity-80`.
  - Hover: scale nhẹ `hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-transform transition-shadow`.
  - KPI cụ thể:
    - Card 1: `Tổng công việc` – màu icon Navy.
    - Card 2: `Đang thực hiện` – icon `⏳`, accent Blue.
    - Card 3: `Đã hoàn thành` – icon `✅`, accent xanh lá nhẹ (class thêm `text-emerald-500`).
    - Card 4: `Quá hạn` – icon `⚠️`, accent đỏ (`text-red-500`, nền gradient có thêm `from-red-50`). Giá trị hiển thị màu đỏ đậm nếu > 0.

### 3.3 Khu vực biểu đồ

- Lưới: `grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 mt-4 md:mt-6`.
- Card biểu đồ chung:
  - Container: `rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 via-slate-50 to-zf-primary/5 p-4 md:p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] flex flex-col gap-3`.
  - Header:
    - Tiêu đề: `text-sm md:text-base font-semibold text-gray-800`.
    - Subtext: `text-xs text-gray-500`.
  - Chart container: `h-56 md:h-64` (Recharts).
  - Áp dụng style glassmorphism cho Tooltip như trong `DASHBOARD_CHARTS_DESIGN.md` (nền trắng mờ, blur, border mỏng).

- **Chart 1 – Task theo trạng thái**
  - Loại: Bar chart hoặc Donut.
  - Màu cột chính: gradient `from-zf-accent to-sky-400`.
  - Legend hiển thị mapping: `Chờ xử lý`, `Đang thực hiện`, `Đã hoàn thành`, `Chậm tiến độ`, v.v.

- **Chart 2 – Task theo giai đoạn hoặc bộ môn**
  - Loại: Bar chart ngang (horizontal) để dễ đọc nhiều label.
  - Màu: Navy/Graphite, thanh active highlight khi hover.
  - Subtext: `Phân bổ công việc theo giai đoạn/bộ môn`.

### 3.4 Bảng "Công việc sắp đến hạn & quá hạn"

- Card full-width bên dưới charts:
  - Title: `Công việc sắp đến hạn & quá hạn`.
  - Note nhỏ: `Top 10 công việc quan trọng theo thời gian` (text-xs gray-500).
  - Bảng:
    - Container: `mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]`.
    - Header: `bg-gradient-to-r from-gray-50 to-gray-100 text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide`.
    - Row: `text-sm text-gray-700 hover:bg-zf-primary/3 transition-colors cursor-pointer`.
    - Cột đề xuất:
      - Tên công việc (bold, 2 dòng, ellipsis, icon trạng thái nhỏ phía trước).
      - Giai đoạn (chip nhỏ màu xám/blue).
      - Bộ môn (chip với màu riêng ARC/STR/MEP).
      - Người phụ trách (avatar initials + tên).
      - Ngày hết hạn (format `dd/MM`, màu đỏ nếu quá hạn).
      - Trạng thái (badge pill).
      - % tiến độ (mini progress bar: `h-1.5 rounded-full bg-gray-100` + `bg-zf-accent`).
  - Empty state:
    - Khi không có task sắp đến hạn/quá hạn:
      - Icon `✅`, text `Tuyệt vời! Hiện không có công việc nào quá hạn hoặc sắp đến hạn.` (text-center, padding 24px).

---

## 4. Tab `Task` – Khung UI sau khi chuyển thành tab con

- **Ý tưởng**: Giữ nguyên toàn bộ giao diện hiện tại, chỉ bọc vào trong vùng nội dung tab `Task`.
- Thanh chọn view (List / Board / Gantt / My Work) vẫn nằm top của ContentCard tab `Task`.
- Cần thống nhất một số điểm visual khi đặt trong thiết kế mới:
  - Nền tổng là `bg-slate-50`, ContentCard `bg-white/90`.
  - Bộ filter, search, toggle view sử dụng cùng style input như Dashboard.
  - Overdue badge, status chip dùng màu consistency:
    - Overdue: pill `bg-red-50 text-red-600 border border-red-100`.
    - Status "Đang thực hiện": `bg-blue-50 text-blue-600`.
    - Status "Hoàn thành": `bg-emerald-50 text-emerald-600`.

---

## 5. Tab `Report` – UI chi tiết

### 5.1 Khu vực bộ lọc & chọn loại báo cáo

- Bố cục hàng trên:
  - Trái: tiêu đề phụ `Báo cáo tiến độ công việc` + mô tả ngắn (`Tổng hợp theo giai đoạn, bộ môn, nhân sự`).
  - Phải: nút `In báo cáo` (btn-premium) + nút `Xuất Excel` (outline).

- Hàng thứ hai: bộ lọc và chọn loại báo cáo (nằm trong ContentCard):
  - **Chọn loại báo cáo** (segmented control):
    - 5 option chính:
      - `Theo giai đoạn`.
      - `Theo bộ môn`.
      - `Theo nhân sự`.
      - `Issue & va chạm` – tập trung các issue, clash, vấn đề phát sinh trong dự án.
      - `Tổng quan dự án` – báo cáo high-level cho Ban Giám đốc (progress + rủi ro chính).
    - Style giống tab con nhưng kích thước nhỏ hơn: `rounded-xl`, height 36–40px.
  - **Bộ lọc chung** (align phải trên desktop, xuống hàng dưới trên mobile):
    - Dropdown `Khoảng thời gian` (Due date / Completed date, với preseted ranges).
    - Dropdown `Trạng thái`.
    - Dropdown `Mức ưu tiên`.

### 5.2 Bảng dữ liệu báo cáo

- Card báo cáo:
  - Header: tên báo cáo theo loại đang chọn, ví dụ `Tiến độ theo giai đoạn`.
  - Subtext: mô tả dataset hiện tại (ví dụ: `Dự án: Vinhomes Grand Park · Khoảng thời gian: 01/03–31/03 · Chỉ hiển thị task đang hoạt động`).
  - Bảng:
    - Container: tương tự bảng ở Dashboard nhưng ưu tiên **đọc in ấn** (font 13–14px, khoảng cách dòng 1.4).
    - Hàng tổng (Total) cuối bảng: nền `bg-slate-50` đậm hơn, chữ đậm.
    - Cho phép sort bằng cách click tiêu đề cột (icon mũi tên nhỏ xám ở bên phải label).

- Cấu trúc cột gợi ý:
  - **Báo cáo theo giai đoạn**
    - Cột: `Giai đoạn`, `Tổng công việc`, `Đang thực hiện`, `Hoàn thành`, `Quá hạn`, `% hoàn thành`.
  - **Báo cáo theo bộ môn**
    - Cột: `Bộ môn`, `Tổng công việc`, `Hoàn thành`, `Quá hạn`, `% hoàn thành`.
  - **Báo cáo theo nhân sự**
    - Cột: `Nhân sự`, `Tổng công việc`, `Đang thực hiện`, `Quá hạn`, `% hoàn thành`.
  - **Báo cáo Issue & va chạm**
    - Dữ liệu lấy từ bảng/nguồn issue hiện có (ví dụ module clash/issue tracking – nếu chưa có thì chuẩn bị để phase sau).
    - Cột gợi ý: `Mã issue`, `Loại vấn đề` (Clash / RFI / Thiếu thông tin / Khác), `Bộ môn`, `Vị trí` (khu vực/tầng), `Mức độ` (Critical/High/Medium/Low), `Trạng thái` (Mới / Đang xử lý / Đã đóng), `Người phụ trách`, `Ngày tạo`, `Hạn xử lý`.
    - Có badge màu nổi cho `Critical`/`High`, icon cảnh báo bên cạnh.
  - **Báo cáo tổng quan dự án**
    - Mục tiêu: 1 trang tóm tắt cho Ban Giám đốc – dễ in, dễ đọc.
    - Phần trên: các chỉ số tổng hợp (không dạng bảng): tổng số công việc, % hoàn thành, số task quá hạn, số issue đang mở, số clash critical.
    - Phần dưới: bảng ngắn (5–10 dòng) liệt kê **các rủi ro/vấn đề chính**, với cột: `Nhóm vấn đề` (Tiến độ / Chất lượng / Thiết kế / Hiện trường), `Mô tả ngắn`, `Mức độ`, `Trạng thái`, `Người phụ trách`, `Hạn xử lý`.
    - Khi chọn loại này, layout có thể 2 phần: block KPI + bảng “Vấn đề trọng tâm” thay vì bảng thuần thống kê số lượng.

### 5.3 Khu vực "Ghi chú / Nhận xét"

- Đặt dưới bảng báo cáo:
  - Tiêu đề: `Ghi chú / Nhận xét cho cuộc họp`.
  - Textarea:
    - `min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent`.
  - Chú thích nhỏ ở góc phải: `Nội dung này sẽ hiển thị trên bản in` (text-xs gray-400).

### 5.4 Layout in (Print)

- Khi bấm `In báo cáo`:
  - Ẩn sidebar, top nav, thanh tab con; chỉ giữ:
    - Logo ZFENIX nhỏ góc trên trái.
    - Tên màn hình: `Báo cáo tiến độ công việc` + tên dự án + ngày giờ.
    - Loại báo cáo + summary filter.
    - Bảng dữ liệu + phần "Ghi chú / Nhận xét` (text inline, không là textarea).
  - Dùng font hệ thống sans-serif, size 11–12pt, margin A4 tiêu chuẩn (20–25mm).
  - Màu sắc giản lược (ưu tiên grayscale + accent Navy) để in rõ trên giấy.

---

## 6. Hệ thống thiết kế (áp dụng chung cho 3 tab)

### 6.1 Màu sắc

- **Primary**: `#053663` (ZFENIX Navy) – headings, active tab, icon chính.
- **Accent**: `#178AF3` (ZFENIX Blue) – CTA, link, highlights, progress.
- **Graphite**: `#2F343A` – text đậm, đường phân cách, icon thứ cấp.
- **Nền**: `#F3F4F6` (Slate-100) cho background tổng, `#FFFFFF` cho thẻ.
- **Trạng thái** (gợi ý Tailwind):
  - Thành công: `emerald-500` trên `emerald-50`.
  - Cảnh báo: `amber-500` trên `amber-50`.
  - Lỗi/quá hạn: `red-500` trên `red-50`.

### 6.2 Typography

- Font: sans-serif hệ thống (Inter/Roboto/`system-ui`) – theo app hiện tại.
- Kích thước chính:
  - Tiêu đề trang: `text-2xl md:text-3xl font-bold`.
  - Tiêu đề khối: `text-lg font-semibold`.
  - Body: `text-sm md:text-[15px]`.
  - Caption/label: `text-xs font-semibold uppercase tracking-wide`.

### 6.3 Spacing & radius

- Spacing:
  - Padding trang: `p-6 md:p-8`.
  - Khoảng giữa section: `space-y-6 md:space-y-8`.
- Border radius:
  - Card lớn: `rounded-2xl`.
  - Nút & input: `rounded-xl`.
  - Badge: `rounded-full`.

### 6.4 States & UX

- **Loading**:
  - Dashboard: skeleton cho KPI + chart (thanh hình chữ nhật mờ).
  - Report: skeleton cho bảng (3–4 hàng xám).
- **Empty**:
  - Dashboard: text thân thiện, icon, gợi ý `Thêm công việc đầu tiên`.
  - Report: thông báo `Chưa có dữ liệu phù hợp với bộ lọc hiện tại` + nút `Xóa lọc`.
- **Error**:
  - Banner nhỏ màu đỏ nhạt trên cùng ContentCard: `Không tải được dữ liệu Dashboard. Vui lòng thử lại.` kèm nút `Thử lại`.

---

## 7. Gợi ý component hóa cho /code

- `WorkTabsContainer` – dựng PageHeader + segmented tabs + ContentCard.
- `WorkDashboard` – chứa filters, KPI, charts, overdue table.
- `WorkTaskTab` – wrapper quanh UI Task hiện tại.
- `WorkReportTab` – chứa filters, report table, notes, print/export actions.
- `KpiCard`, `ReportTable`, `OverdueTasksTable`, `ReportFilters` – components con tái sử dụng.

> Các phần trên là chuẩn để team dev áp dụng trực tiếp bằng Tailwind/React. Nếu anh muốn, em có thể tiếp tục cụ thể hóa thành className chi tiết cho từng component trong bước `/code`.

