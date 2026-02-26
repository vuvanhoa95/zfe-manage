# 📋 MÔ TẢ CHỨC NĂNG - MODULE QUẢN LÝ DỰ ÁN ZFENIX

> **Phiên bản:** 1.0  
> **Ngày tạo:** 26/02/2026  
> **Mục tiêu:** Xây dựng hệ thống quản lý dự án toàn diện cho các dự án xây dựng/BIM, tích hợp vào hệ sinh thái ZFENIX.

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mục tiêu
Cung cấp nền tảng quản lý dự án chuyên biệt cho ngành xây dựng Việt Nam, hỗ trợ đội ngũ triển khai BIM theo dõi tiến độ, phân công công việc, và cộng tác hiệu quả.

### 1.2 Cấu trúc phân cấp dữ liệu

```
Workspace (Không gian làm việc)
  └── Space (Không gian dự án)
       └── Folder (Thư mục / Hạng mục)
            └── List (Danh sách công việc)
                 └── Task (Công việc)
                      ├── Subtask (Công việc con)
                      │    └── Subtask lồng nhau (tối đa 3 cấp)
                      └── Checklist (Danh sách kiểm tra)
                           └── Checklist Item (Mục kiểm tra)
```

### 1.3 Đối tượng sử dụng
- **Admin (Quản trị viên):** Quản lý toàn bộ workspace, phân quyền
- **Project Manager (Quản lý dự án):** Tạo/quản lý dự án, theo dõi tiến độ tổng thể
- **Team Lead (Trưởng nhóm):** Phân công task, review công việc
- **Member (Thành viên):** Thực hiện task, cập nhật tiến độ
- **Guest (Khách):** Xem dự án, comment (quyền hạn chế)
- **Client (Khách hàng):** Xem tiến độ dự án (quyền chỉ đọc)

---

## 2. QUẢN LÝ WORKSPACE & SPACE

### 2.1 Workspace (Không gian làm việc)
| Chức năng | Mô tả |
|-----------|-------|
| Tạo Workspace | Tạo không gian làm việc cho tổ chức/công ty |
| Cài đặt chung | Logo, tên, múi giờ, ngôn ngữ (Tiếng Việt mặc định) |
| Quản lý thành viên | Mời, xóa, phân quyền thành viên |
| Billing & Gói dịch vụ | Quản lý gói sử dụng, thanh toán |
| Tùy chỉnh branding | Màu sắc, logo theo thương hiệu công ty |

### 2.2 Space (Không gian dự án)
| Chức năng | Mô tả |
|-----------|-------|
| Tạo Space | Tạo không gian cho từng dự án hoặc phòng ban |
| Template Space | Tạo từ template có sẵn (Dự án xây dựng, BIM Coordination, QTO...) |
| Cài đặt Status | Tùy chỉnh trạng thái công việc cho từng Space |
| Cài đặt Priority | Tùy chỉnh mức ưu tiên |
| Custom Fields | Định nghĩa trường dữ liệu tùy chỉnh cho Space |
| Phân quyền Space | Ai được xem/sửa/xóa trong Space |
| Archive Space | Lưu trữ Space đã hoàn thành |

### 2.3 Folder & List
| Chức năng | Mô tả |
|-----------|-------|
| Tạo Folder | Nhóm các List theo hạng mục (VD: Kiến trúc, Kết cấu, MEP) |
| Tạo List | Danh sách công việc trong Folder hoặc trực tiếp trong Space |
| Sắp xếp Drag & Drop | Kéo thả để sắp xếp thứ tự Folder/List |
| Nhân bản | Duplicate Folder/List kèm cấu trúc task |
| Template | Lưu và áp dụng template cho Folder/List |

---

## 3. QUẢN LÝ TASK (CÔNG VIỆC) — CORE MODULE

### 3.1 Tạo & Chỉnh sửa Task

#### Thông tin cơ bản
| Trường | Mô tả | Bắt buộc |
|--------|-------|----------|
| Tên Task | Tiêu đề công việc | ✅ |
| Mô tả | Rich text editor (hỗ trợ markdown, hình ảnh, bảng, code block) | ❌ |
| Trạng thái (Status) | Trạng thái hiện tại của task | ✅ |
| Người được giao (Assignee) | Một hoặc nhiều người thực hiện | ❌ |
| Người theo dõi (Watcher) | Nhận thông báo khi task thay đổi | ❌ |
| Mức ưu tiên (Priority) | Khẩn cấp / Cao / Trung bình / Thấp / Không ưu tiên | ❌ |
| Ngày bắt đầu | Start date | ❌ |
| Ngày hết hạn (Due date) | Deadline hoàn thành | ❌ |
| Ước lượng thời gian | Time estimate (giờ/ngày) | ❌ |
| Tags | Nhãn phân loại (VD: BIM, Revit, Clash, QTO) | ❌ |
| Dependencies | Quan hệ phụ thuộc với task khác | ❌ |

#### Trạng thái mặc định (có thể tùy chỉnh)
```
📝 Chờ xử lý (To Do)
🔄 Đang thực hiện (In Progress)
👀 Chờ review (In Review)
🔁 Cần chỉnh sửa (Revision)
✅ Hoàn thành (Done)
🚫 Hủy bỏ (Cancelled)
⏸️ Tạm dừng (On Hold)
```

#### Mức ưu tiên
```
🔴 Khẩn cấp (Urgent)
🟠 Cao (High)
🟡 Trung bình (Normal)
🔵 Thấp (Low)
⚪ Không ưu tiên (None)
```

### 3.2 Subtask (Công việc con)
| Chức năng | Mô tả |
|-----------|-------|
| Tạo Subtask | Tạo task con bên trong task cha (tối đa 3 cấp lồng) |
| Kế thừa thuộc tính | Subtask có thể kế thừa Status, Priority từ task cha |
| Độc lập | Subtask cũng có đầy đủ thuộc tính như task thường |
| Tiến độ tự động | % hoàn thành của task cha tính từ subtask |
| Chuyển đổi | Chuyển subtask thành task chính và ngược lại |

### 3.3 Checklist (Danh sách kiểm tra)
| Chức năng | Mô tả |
|-----------|-------|
| Tạo Checklist | Tạo nhiều checklist trong 1 task |
| Checklist Item | Thêm các mục kiểm tra với checkbox |
| Giao việc từng item | Assign người cho từng checklist item |
| Due date cho item | Đặt deadline cho từng mục |
| Tiến độ | Thanh progress bar hiển thị % hoàn thành |
| Template Checklist | Lưu và tái sử dụng checklist (VD: Checklist nghiệm thu, QC checklist) |

### 3.4 Dependencies (Quan hệ phụ thuộc)
| Loại | Mô tả |
|------|-------|
| Blocking | Task A chặn Task B (B không thể bắt đầu cho đến khi A xong) |
| Waiting on | Task A đang chờ Task B hoàn thành |
| Linked | Task A liên quan đến Task B (không ràng buộc) |
| Finish-to-Start | Bắt đầu B sau khi kết thúc A |
| Start-to-Start | A và B bắt đầu cùng lúc |
| Finish-to-Finish | A và B kết thúc cùng lúc |

### 3.5 Custom Fields (Trường tùy chỉnh)
| Loại Field | Mô tả | Ví dụ |
|------------|-------|-------|
| Text | Văn bản tự do | Ghi chú kỹ thuật |
| Number | Số | Số lượng cấu kiện |
| Dropdown | Danh sách chọn | Bộ môn (Kiến trúc/Kết cấu/MEP) |
| Date | Ngày tháng | Ngày nghiệm thu |
| Checkbox | Đánh dấu | Đã phê duyệt? |
| Currency | Tiền tệ (VNĐ) | Chi phí ước tính |
| Email | Email | Email liên hệ CĐT |
| Phone | Số điện thoại | SĐT liên hệ |
| URL | Đường dẫn | Link file BIM trên cloud |
| Rating | Đánh giá sao | Mức độ phức tạp |
| Progress | Thanh tiến độ | % hoàn thành mô hình |
| File | Đính kèm file | Bản vẽ PDF |
| Relationship | Liên kết task khác | Task liên quan |
| Formula | Công thức tính | Tổng khối lượng |
| Location | Vị trí | Vị trí công trình |
| Label | Nhãn nhiều màu | Phân loại lỗi clash |
| Auto-increment ID | Mã tự tăng | Mã công việc: TASK-001 |

#### 3.5.1 Cấu hình Custom Fields (Custom Settings kiểu ClickUp)
- Mỗi **Workspace / Space** có một khu vực **Settings → Custom Fields**:
  - Tạo / sửa / xóa field, chọn loại field trong danh sách trên (tương tự ClickUp).
  - Thiết lập:
    - Tên hiển thị, mô tả ngắn, icon/màu.
    - Phạm vi áp dụng: Toàn Space, chỉ 1 Folder/List, hay chỉ 1 loại task.
    - Thuộc tính: bắt buộc/không bắt buộc, giá trị mặc định, có cho phép nhiều giá trị không (tags, label).
    - Quyền: ai được chỉnh sửa (Admin / Lead / Member).
- Trên Task:
  - Chỉ hiển thị các custom field đã bật cho Space/Folder/List hiện tại.
  - Có cơ chế sắp xếp thứ tự field, gom theo nhóm (VD: “Thông tin BIM”, “Thông tin hiện trường”).
- Template:
  - Có thể lưu **bộ custom fields** thành template và áp dụng cho Space mới (VD: “Dự án BIM dân dụng”, “Dự án hạ tầng”).

### 3.6 Thao tác hàng loạt (Bulk Actions)
| Chức năng | Mô tả |
|-----------|-------|
| Chọn nhiều task | Checkbox để chọn nhiều task |
| Thay đổi Status hàng loạt | Đổi trạng thái nhiều task cùng lúc |
| Gán người hàng loạt | Assign nhiều task cho 1 người |
| Thay đổi Priority hàng loạt | Đổi mức ưu tiên |
| Di chuyển hàng loạt | Chuyển task sang List/Folder khác |
| Xóa hàng loạt | Xóa nhiều task |
| Duplicate hàng loạt | Nhân bản nhiều task |
| Set date hàng loạt | Đặt ngày cho nhiều task |

---

## 4. CÁC CHẾ ĐỘ XEM (VIEWS)

### 4.1 List View (Dạng danh sách)
- Hiển thị task dạng bảng với các cột có thể tùy chỉnh
- Sắp xếp theo bất kỳ cột nào (Status, Priority, Due date, Assignee...)
- Nhóm theo (Group by): Status, Priority, Assignee, Tag, Custom field
- Lọc (Filter): Kết hợp nhiều điều kiện (AND/OR)
- Ẩn/hiện cột, thay đổi thứ tự cột
- Inline editing (sửa trực tiếp trên bảng)
- Subtask mở rộng/thu gọn

### 4.2 Board View (Kanban)
- Hiển thị task dạng thẻ trên các cột (mặc định theo Status)
- Kéo thả task giữa các cột
- Nhóm theo: Status, Priority, Assignee, Custom field
- Giới hạn WIP (Work In Progress) cho từng cột
- Swimlane (phân làn theo tiêu chí thứ 2)
- Quick add task trên từng cột
- Card preview: hiển thị thông tin tóm tắt trên thẻ

### 4.3 Gantt Chart View (Biểu đồ Gantt)
- Hiển thị timeline dự án dạng thanh ngang
- Kéo thả để thay đổi ngày bắt đầu/kết thúc
- Hiển thị Dependencies bằng mũi tên liên kết
- Zoom: Ngày / Tuần / Tháng / Quý / Năm
- Critical Path (đường găng): highlight chuỗi task quan trọng nhất
- Baseline comparison: so sánh kế hoạch ban đầu vs thực tế
- Milestone markers: đánh dấu các mốc quan trọng
- Progress bar trên mỗi task
- Resource allocation view: xem tải công việc theo người

### 4.4 Calendar View (Lịch)
- Hiển thị task theo lịch Tháng / Tuần / Ngày
- Kéo thả task để đổi ngày
- Màu sắc theo Status/Priority/Assignee
- Tích hợp với Google Calendar / Outlook (sync 2 chiều)
- Hiển thị ngày nghỉ lễ Việt Nam
- Recurring tasks hiển thị rõ trên lịch

### 4.5 Table View (Bảng tính)
- Giống spreadsheet (Excel-like)
- Sửa trực tiếp từng ô
- Công thức tính toán cơ bản (SUM, COUNT, AVG)
- Copy/paste từ Excel
- Export ra Excel
- Freeze cột/hàng
- Conditional formatting (tô màu có điều kiện)

### 4.6 Timeline View
- Hiển thị task trên trục thời gian
- Nhóm theo người/nhóm/hạng mục
- Phát hiện xung đột thời gian (overload)
- Hiển thị capacity của từng thành viên

### 4.7 Dashboard View
- Widget-based dashboard tùy chỉnh
- Các loại widget:
  - Biểu đồ tiến độ (Pie chart, Bar chart, Line chart)
  - Task theo Status/Priority/Assignee
  - Burndown/Burnup chart
  - Velocity chart
  - Overdue tasks
  - Workload distribution
  - Time tracking summary
  - Custom field aggregation
  - Sprint/Phase progress
  - Activity feed

### 4.8 Mind Map View
- Hiển thị cấu trúc task dạng sơ đồ tư duy
- Tạo task mới bằng cách thêm nhánh
- Kéo thả để tổ chức lại cấu trúc
- Mở rộng/thu gọn các nhánh

### 4.9 Workload View
- Hiển thị khối lượng công việc của từng thành viên
- Phát hiện overload / underload
- Capacity planning theo tuần/tháng
- Drag & drop để cân bằng tải

### 4.10 Lưu & Chia sẻ View
- Lưu view với bộ lọc/sắp xếp tùy chỉnh
- Đặt tên cho view
- Chia sẻ view cho team
- Pin view yêu thích
- View cá nhân vs view chia sẻ

---

## 5. BỘ LỌC & TÌM KIẾM

### 5.1 Bộ lọc nâng cao (Advanced Filters)
| Tiêu chí lọc | Toán tử |
|--------------|---------|
| Status | Is / Is not / Is any of |
| Assignee | Is / Is not / Is unassigned |
| Priority | Is / Is not / Is any of |
| Due date | Is / Before / After / Between / Overdue / No date |
| Start date | Is / Before / After / Between |
| Tags | Contains / Does not contain |
| Created by | Is / Is not |
| Created date | Before / After / Between |
| Updated date | Before / After / Between |
| Custom fields | Tùy theo loại field |
| Subtask | Has subtasks / No subtasks |
| Checklist | Complete / Incomplete |
| Time tracked | Has / Has not |
| Dependency | Has blocking / Has waiting |

- Kết hợp điều kiện AND / OR
- Lưu bộ lọc để tái sử dụng
- Chia sẻ bộ lọc cho team

### 5.2 Tìm kiếm
| Chức năng | Mô tả |
|-----------|-------|
| Global Search | Tìm kiếm toàn bộ workspace (task, comment, file, người) |
| Quick Search | Ctrl+K / Cmd+K để mở thanh tìm kiếm nhanh |
| Search trong List | Tìm trong danh sách hiện tại |
| Full-text search | Tìm trong nội dung mô tả, comment |
| Recent searches | Lịch sử tìm kiếm gần đây |
| Saved searches | Lưu truy vấn tìm kiếm |

---

## 6. COMMENTS & CỘNG TÁC

### 6.1 Comments (Bình luận)
| Chức năng | Mô tả |
|-----------|-------|
| Comment trên task | Thảo luận trực tiếp trên task |
| Rich text | Hỗ trợ bold, italic, code, link, bảng, hình ảnh |
| @Mention | Tag người để thông báo (@tên) |
| Đính kèm file | Upload file trong comment |
| Reply thread | Trả lời theo luồng |
| Reaction | Emoji reaction cho comment |
| Pin comment | Ghim comment quan trọng |
| Edit/Delete | Sửa/xóa comment của mình |
| Assigned comment | Giao việc qua comment (tạo action item) |
| Resolve comment | Đánh dấu comment đã giải quyết |

### 6.2 Activity Log (Nhật ký hoạt động)
- Ghi lại mọi thay đổi trên task (ai thay đổi gì, lúc nào)
- Filter activity theo loại (status change, comment, assignment...)
- Phân biệt rõ giữa comment và activity
- Export activity log

### 6.3 Cộng tác thời gian thực
| Chức năng | Mô tả |
|-----------|-------|
| Real-time update | Thấy thay đổi ngay lập tức khi người khác cập nhật |
| Presence indicator | Biết ai đang xem cùng task |
| Collaborative editing | Nhiều người cùng sửa mô tả task |
| Live cursor | Thấy con trỏ của người khác (trong description) |

### 6.4 Proofing & Approval (Phê duyệt)
| Chức năng | Mô tả |
|-----------|-------|
| Request approval | Yêu cầu phê duyệt từ người cụ thể |
| Approve / Reject | Phê duyệt hoặc từ chối |
| Approval workflow | Quy trình phê duyệt nhiều bước |
| Annotation | Ghi chú trực tiếp trên hình ảnh/PDF đính kèm |
| Version comparison | So sánh các phiên bản file |

---

## 7. QUẢN LÝ THỜI GIAN

### 7.1 Time Tracking (Chấm công việc)
| Chức năng | Mô tả |
|-----------|-------|
| Timer | Bấm giờ trực tiếp trên task |
| Manual entry | Nhập thời gian thủ công |
| Time estimate | Ước lượng thời gian cần thiết |
| Actual vs Estimate | So sánh thực tế vs ước lượng |
| Time report | Báo cáo thời gian theo người/dự án/khoảng thời gian |
| Billable hours | Đánh dấu giờ tính phí |
| Timesheet | Bảng chấm công tuần/tháng |
| Export | Xuất báo cáo thời gian |

### 7.2 Recurring Tasks (Công việc lặp lại)
| Chức năng | Mô tả |
|-----------|-------|
| Tần suất | Hàng ngày / tuần / tháng / tùy chỉnh |
| Recurrence rules | Lặp vào ngày cụ thể, sau khi hoàn thành, cron expression |
| Auto-create | Tự động tạo task mới khi đến hạn |
| Skip | Bỏ qua 1 lần lặp |
| End condition | Kết thúc sau N lần hoặc vào ngày cụ thể |

### 7.3 Milestones (Mốc quan trọng)
| Chức năng | Mô tả |
|-----------|-------|
| Tạo Milestone | Đánh dấu mốc quan trọng trong dự án |
| Diamond icon | Hiển thị dạng hình thoi trên Gantt |
| Ngày mốc | Ngày deadline của milestone |
| Linked tasks | Các task cần hoàn thành trước milestone |
| Notification | Thông báo khi milestone sắp đến hạn |

### 7.4 Sprints / Phases (Giai đoạn)
| Chức năng | Mô tả |
|-----------|-------|
| Tạo Sprint/Phase | Chia dự án thành các giai đoạn |
| Sprint planning | Kéo task vào sprint |
| Sprint dates | Ngày bắt đầu và kết thúc giai đoạn |
| Burndown chart | Biểu đồ tiến độ sprint |
| Sprint review | Tổng kết sprint |
| Velocity tracking | Theo dõi tốc độ hoàn thành qua các sprint |
| Backlog | Danh sách task chưa phân vào sprint |

---

## 8. TỆP ĐÍNH KÈM & TÀI LIỆU

### 8.1 File Management
| Chức năng | Mô tả |
|-----------|-------|
| Upload file | Kéo thả hoặc chọn file để upload |
| Giới hạn | Tối đa 100MB/file (có thể cấu hình) |
| Preview | Xem trước PDF, hình ảnh, video ngay trong app |
| Version control | Lưu nhiều phiên bản của cùng 1 file |
| Cloud storage | Tích hợp Google Drive, OneDrive, Dropbox |
| File search | Tìm kiếm file theo tên, loại |
| Organize | Sắp xếp file theo thư mục trong task |

### 8.2 Docs (Tài liệu nội bộ)
| Chức năng | Mô tả |
|-----------|-------|
| Tạo Doc | Tạo tài liệu rich text trong workspace |
| Collaborative editing | Nhiều người cùng chỉnh sửa |
| Nested pages | Tạo trang con trong doc |
| Link to task | Liên kết doc với task |
| Template doc | Mẫu tài liệu (biên bản họp, báo cáo tuần...) |
| Export | Xuất PDF, Word |
| Share | Chia sẻ doc với link |

---

## 9. THÔNG BÁO (NOTIFICATIONS)

### 9.1 Loại thông báo
| Sự kiện | Mô tả |
|---------|-------|
| Task assigned | Được giao task mới |
| Status changed | Task thay đổi trạng thái |
| Comment | Có comment mới trên task đang theo dõi |
| @Mention | Được tag trong comment |
| Due date approaching | Sắp đến hạn (1 ngày, 1 giờ trước) |
| Overdue | Task quá hạn |
| Subtask completed | Subtask con hoàn thành |
| File uploaded | File mới được upload |
| Approval request | Yêu cầu phê duyệt |
| Dependency resolved | Task đang chờ đã hoàn thành |

### 9.2 Kênh thông báo
| Kênh | Mô tả |
|------|-------|
| In-app | Thông báo trong ứng dụng (bell icon) |
| Email | Gửi email tổng hợp (real-time hoặc digest) |
| Push notification | Thông báo đẩy trên mobile |
| Zalo | Tích hợp gửi thông báo qua Zalo OA |
| Telegram | Tích hợp gửi thông báo qua Telegram Bot |

### 9.3 Cài đặt thông báo
- Bật/tắt từng loại thông báo
- Chế độ "Do Not Disturb" (không làm phiền)
- Lịch trình thông báo (chỉ trong giờ làm việc)
- Notification digest (tổng hợp theo giờ/ngày)
- Tùy chỉnh theo Space/Project

---

## 10. AUTOMATION (TỰ ĐỘNG HÓA)

### 10.1 Trigger (Điều kiện kích hoạt)
| Trigger | Mô tả |
|---------|-------|
| Status changes | Khi task đổi sang trạng thái X |
| Task created | Khi task mới được tạo |
| Assignee changes | Khi thay đổi người được giao |
| Due date arrives | Khi đến hạn |
| Priority changes | Khi thay đổi mức ưu tiên |
| Checklist completed | Khi checklist hoàn thành 100% |
| All subtasks done | Khi tất cả subtask hoàn thành |
| Custom field changes | Khi trường tùy chỉnh thay đổi |
| Comment added | Khi có comment mới |
| Time tracked | Khi có log thời gian |

### 10.2 Actions (Hành động thực thi)
| Action | Mô tả |
|--------|-------|
| Change status | Tự động đổi trạng thái |
| Change assignee | Tự động giao cho người khác |
| Change priority | Tự động đổi mức ưu tiên |
| Add comment | Tự động thêm comment |
| Send notification | Gửi thông báo tùy chỉnh |
| Create task | Tự động tạo task mới |
| Move task | Chuyển task sang List khác |
| Add tag | Thêm tag |
| Set custom field | Cập nhật trường tùy chỉnh |
| Send webhook | Gọi API bên ngoài |
| Send email | Gửi email tự động |

### 10.3 Automation Templates (Mẫu có sẵn)
- Khi task "Hoàn thành" → Giao task review cho Team Lead
- Khi tất cả subtask xong → Chuyển task cha sang "Chờ review"
- Khi task quá hạn → Đổi priority thành "Khẩn cấp" + Thông báo PM
- Khi task được tạo trong "Clash Detection" → Tự động gán tag "Clash" + Giao cho BIM Coordinator
- Khi approval bị từ chối → Chuyển về "Cần chỉnh sửa" + Thông báo assignee

---

## 11. BÁO CÁO & THỐNG KÊ

### 11.1 Báo cáo tổng hợp
| Báo cáo | Mô tả |
|---------|-------|
| Project Overview | Tổng quan dự án: % hoàn thành, task theo status |
| Workload Report | Khối lượng công việc từng thành viên |
| Time Report | Báo cáo thời gian làm việc |
| Overdue Report | Danh sách task quá hạn |
| Sprint Report | Tổng kết sprint/giai đoạn |
| Productivity Report | Năng suất theo thời gian |
| Custom Report | Tạo báo cáo tùy chỉnh với bộ lọc |

### 11.2 Biểu đồ & Metrics
| Loại | Mô tả |
|------|-------|
| Burndown Chart | Biểu đồ cháy (tasks còn lại theo thời gian) |
| Burnup Chart | Biểu đồ tích lũy (tasks hoàn thành theo thời gian) |
| Velocity Chart | Tốc độ hoàn thành qua các sprint |
| Cumulative Flow | Biểu đồ luồng tích lũy theo status |
| Cycle Time | Thời gian trung bình hoàn thành 1 task |
| Lead Time | Thời gian từ tạo đến hoàn thành |
| Throughput | Số task hoàn thành/tuần |
| Task Distribution | Phân bố task theo người/status/priority |

### 11.3 Export & Chia sẻ
- Export báo cáo ra PDF, Excel, CSV
- Lên lịch gửi báo cáo tự động (hàng ngày/tuần/tháng)
- Chia sẻ dashboard qua link (public hoặc private)
- Embed dashboard vào trang web khác

---

## 12. TEMPLATE (MẪU)

### 12.1 Task Templates
| Template | Mô tả |
|----------|-------|
| Mẫu task thường | Lưu task với subtask, checklist, custom fields |
| Áp dụng nhanh | 1 click để tạo task từ template |
| Quản lý template | Tạo, sửa, xóa, phân loại template |

### 12.2 Project Templates (Mẫu dự án)
| Template | Mô tả |
|----------|-------|
| Dự án xây dựng | Cấu trúc folder/list cho dự án xây dựng chuẩn |
| BIM Coordination | Quy trình phối hợp BIM với clash detection |
| Quantity Takeoff | Quy trình bóc tách khối lượng |
| Design Review | Quy trình rà soát thiết kế |
| Construction Inspection | Quy trình nghiệm thu |
| Tùy chỉnh | Tạo template từ dự án hiện có |

### 12.3 Checklist Templates
- QC Checklist cho từng bộ môn (Kiến trúc, Kết cấu, MEP)
- Checklist nghiệm thu theo TCVN
- Checklist bàn giao mô hình BIM
- Checklist kiểm tra clash

---

## 13. TÍCH HỢP (INTEGRATIONS)

### 13.1 Tích hợp nội bộ ZFENIX
| Tích hợp | Mô tả |
|----------|-------|
| ZFENIX BIM Viewer | Mở model BIM trực tiếp từ task |
| ZFENIX Clash Detection | Tự động tạo task từ clash report |
| ZFENIX QTO | Liên kết task với bảng khối lượng |
| ZFENIX Revit Add-in | Sync task với Revit model elements |

### 13.2 Tích hợp bên ngoài
| Tích hợp | Mô tả |
|----------|-------|
| Google Workspace | Drive, Calendar, Gmail, Sheets |
| Microsoft 365 | OneDrive, Outlook, Teams, Excel |
| Slack | Thông báo và tạo task từ Slack |
| Zalo | Thông báo qua Zalo OA |
| GitHub/GitLab | Liên kết task với code commits |
| Figma | Preview design trong task |
| Zapier/Make | Kết nối với 1000+ ứng dụng |
| Webhook | API webhook cho tích hợp tùy chỉnh |
| BIMcollab | Sync issues từ BIMcollab |
| Autodesk BIM 360 | Tích hợp với BIM 360 |

### 13.3 API
| Chức năng | Mô tả |
|-----------|-------|
| REST API | API đầy đủ cho mọi chức năng |
| Webhooks | Nhận sự kiện real-time |
| API Documentation | Swagger/OpenAPI documentation |
| Rate limiting | Giới hạn request hợp lý |
| API Keys | Quản lý API key |
| OAuth 2.0 | Xác thực chuẩn OAuth |

---

## 14. PHÂN QUYỀN & BẢO MẬT

### 14.1 Hệ thống phân quyền
| Cấp | Quyền |
|-----|-------|
| Workspace Admin | Toàn quyền workspace |
| Space Admin | Toàn quyền trong Space |
| Manager | Tạo/sửa/xóa task, quản lý thành viên trong Space |
| Member | Tạo/sửa task, comment |
| Viewer | Chỉ xem, comment |
| Guest | Xem task được chia sẻ |

### 14.2 Quyền chi tiết
- Quyền theo Space / Folder / List
- Quyền xem / tạo / sửa / xóa riêng biệt
- Quyền export dữ liệu
- Quyền quản lý thành viên
- Quyền tạo automation
- Quyền xem báo cáo

### 14.3 Bảo mật
| Chức năng | Mô tả |
|-----------|-------|
| Two-Factor Authentication | Xác thực 2 yếu tố |
| SSO | Single Sign-On (Google, Microsoft) |
| Session management | Quản lý phiên đăng nhập |
| Audit log | Nhật ký truy cập và thao tác |
| IP Whitelist | Giới hạn IP truy cập |
| Data encryption | Mã hóa dữ liệu |
| Backup | Sao lưu dữ liệu định kỳ |
| GDPR compliance | Tuân thủ quy định bảo vệ dữ liệu |

---

## 15. ỨNG DỤNG DI ĐỘNG (MOBILE APP)

### 15.1 Chức năng mobile
- Xem và quản lý task (đầy đủ chức năng)
- Push notification
- Camera: chụp ảnh và đính kèm vào task
- Offline mode: xem task khi không có mạng
- Quick actions: tạo task nhanh, log thời gian
- Widget: hiển thị task trên màn hình chính
- Dark mode

### 15.2 Nền tảng
- iOS (iPhone, iPad)
- Android (Phone, Tablet)
- Progressive Web App (PWA)

---

## 16. CHỨC NĂNG ĐẶC THÙ NGÀNH XÂY DỰNG

### 16.1 BIM-specific Features
| Chức năng | Mô tả |
|-----------|-------|
| Clash Issue Tracking | Theo dõi và quản lý các lỗi va chạm từ clash detection |
| Model Element Linking | Liên kết task với element cụ thể trong mô hình BIM |
| LOD Tracking | Theo dõi mức độ chi tiết (Level of Development) |
| BIM Deliverable Matrix | Ma trận sản phẩm BIM cần bàn giao |
| CDE Integration | Tích hợp với Common Data Environment |
| IFC Viewer | Xem mô hình IFC ngay trong task |
| BCF Integration | Import/Export BCF issues |

### 16.2 Construction-specific Features
| Chức năng | Mô tả |
|-----------|-------|
| Inspection Checklist | Checklist nghiệm thu theo tiêu chuẩn TCVN |
| Photo Documentation | Chụp ảnh hiện trường và gắn vào task |
| Safety Incident Tracking | Theo dõi sự cố an toàn lao động |
| Material Tracking | Theo dõi vật tư liên quan đến task |
| Weather Integration | Hiển thị thời tiết ảnh hưởng đến tiến độ |
| Location Mapping | Gắn task với vị trí cụ thể trên mặt bằng/bản vẽ |
| Daily/Weekly Report | Tự động tạo báo cáo ngày/tuần từ dữ liệu task |

### 16.3 Tuân thủ tiêu chuẩn
- Hỗ trợ TCVN (Tiêu chuẩn Việt Nam)
- Mẫu báo cáo theo quy định Việt Nam
- Hỗ trợ đơn vị đo lường Việt Nam
- Tích hợp lịch ngày lễ Việt Nam
- Hỗ trợ font chữ tiếng Việt đầy đủ

---

## 17. IMPORT / EXPORT

### 17.1 Import
| Nguồn | Định dạng |
|-------|-----------|
| CSV/Excel | Import task từ file CSV, XLSX |
| ClickUp | Import trực tiếp từ ClickUp |
| Trello | Import từ Trello (JSON) |
| Jira | Import từ Jira |
| Asana | Import từ Asana |
| Microsoft Project | Import file MPP |
| Primavera P6 | Import file XER |

### 17.2 Export
| Loại | Định dạng |
|------|-----------|
| Task list | CSV, Excel, PDF |
| Gantt | PDF, PNG, MPP |
| Report | PDF, Excel |
| Full backup | JSON (toàn bộ dữ liệu workspace) |
| API | RESTful API cho export tùy chỉnh |

---

## 18. HIỆU NĂNG & KỸ THUẬT

### 18.1 Yêu cầu hiệu năng
| Chỉ tiêu | Giá trị |
|-----------|---------|
| Page load time | < 2 giây |
| Real-time update | < 500ms |
| Search response | < 1 giây |
| Concurrent users | 1000+ |
| Task limit | 1,000,000+ tasks/workspace |
| File storage | Scalable (cloud storage) |
| API response | < 500ms |
| Uptime SLA | 99.9% |

### 18.2 Tech Stack gợi ý
| Layer | Công nghệ |
|-------|-----------|
| Frontend | React/Next.js + TypeScript |
| State Management | Redux Toolkit / Zustand |
| Real-time | WebSocket (Socket.io) |
| UI Library | Ant Design / Shadcn UI |
| Backend | Node.js (NestJS) hoặc .NET Core |
| Database | PostgreSQL + Redis (cache) |
| Search | Elasticsearch |
| File Storage | AWS S3 / MinIO |
| Message Queue | RabbitMQ / Redis Streams |
| CI/CD | GitHub Actions / GitLab CI |
| Hosting | AWS / Azure / GCP |
| Mobile | React Native / Flutter |

---

## 19. PHÂN PHA TRIỂN KHAI

### Phase 1 — MVP (3-4 tháng)
- ✅ Workspace, Space, Folder, List cơ bản
- ✅ Task CRUD với Status, Priority, Assignee, Due date
- ✅ Subtask (1 cấp)
- ✅ Checklist
- ✅ List View + Board View (Kanban)
- ✅ Comment cơ bản
- ✅ Thông báo in-app + email
- ✅ Phân quyền cơ bản (Admin, Member, Viewer)
- ✅ File upload cơ bản
- ✅ Tìm kiếm cơ bản
- ✅ Responsive web

### Phase 2 — Enhanced (2-3 tháng)
- 🔲 Gantt Chart View
- 🔲 Calendar View
- 🔲 Custom Fields
- 🔲 Dependencies
- 🔲 Time Tracking
- 🔲 Recurring Tasks
- 🔲 Milestones
- 🔲 Bộ lọc nâng cao
- 🔲 Template (Task + Project)
- 🔲 Activity Log chi tiết
- 🔲 Bulk Actions

### Phase 3 — Advanced (2-3 tháng)
- 🔲 Dashboard & Báo cáo
- 🔲 Automation
- 🔲 Sprints/Phases
- 🔲 Table View (Excel-like)
- 🔲 Workload View
- 🔲 Docs (Tài liệu nội bộ)
- 🔲 Tích hợp Google/Microsoft
- 🔲 API & Webhooks
- 🔲 Advanced permissions
- 🔲 Mobile App (PWA)

### Phase 4 — Industry (2-3 tháng)
- 🔲 BIM-specific features (Clash tracking, BCF)
- 🔲 Tích hợp ZFENIX ecosystem
- 🔲 Construction-specific features
- 🔲 Mind Map View
- 🔲 Timeline View
- 🔲 Approval workflows
- 🔲 Import từ ClickUp/Jira/MS Project
- 🔲 SSO & Advanced security
- 🔲 Native Mobile App
- 🔲 Offline mode

---

## 20. TÓM TẮT SỐ LIỆU

| Hạng mục | Số lượng |
|----------|----------|
| Tổng số chức năng chính | 19 module |
| Số loại View | 10 loại |
| Số loại Custom Field | 17 loại |
| Số loại Automation Trigger | 10 loại |
| Số loại Automation Action | 11 loại |
| Số loại biểu đồ/metrics | 8 loại |
| Số tích hợp bên ngoài | 12+ |
| Thời gian triển khai ước tính | 9-13 tháng (4 phases) |

---

*Tài liệu này là bản mô tả chức năng tổng thể. Chi tiết từng module sẽ được phát triển thêm trong quá trình thiết kế UI/UX và phát triển kỹ thuật.*

