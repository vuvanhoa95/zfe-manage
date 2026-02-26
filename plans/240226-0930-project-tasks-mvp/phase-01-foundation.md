# Phase 1 – Foundation: Model & API cho Công việc & Tiến độ

## Mục tiêu
- Hoàn thiện model Task + API nền tảng để hỗ trợ các view (List/Board/Gantt đơn giản) và logic tiến độ.

## Tasks

- [ ] Rà soát bảng `Task` trong Prisma:
  - [ ] Đảm bảo có: `title`, `description`, `status`, `priority`, `startDate`, `endDate` (hoặc `dueDate`), `progress`, `assignedTo`, `projectId`.
  - [ ] Thêm fields: `phase` (string/enum), `discipline`, `location`.
  - [ ] Tạo migration.
- [ ] Bổ sung index:
  - [ ] `status`, `assignee/assignedTo`, `projectId`, `endDate/dueDate`.
- [ ] Cập nhật type dùng trong frontend (`types/` nếu có) cho Task.
- [ ] Cập nhật API:
  - [ ] `/api/projects/[id]/tasks` – trả về đủ các field mới.
  - [ ] `/api/projects/[id]/tasks` – nhận filter cơ bản: status, assignee, priority, phase.
  - [ ] `/api/tasks/[taskId]` – cho phép cập nhật: status, progress, start/end date, phase, discipline, location.
- [ ] Viết unit test đơn giản cho logic tính `overallProgress` (nếu có helper riêng).

