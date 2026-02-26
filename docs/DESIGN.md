# Thiết kế kỹ thuật – Phase 1: Module Công việc & Tiến độ (ZFENIX)

Phiên bản: 1.0  
Dựa trên: `docs/SPECS.md`, `plans/240226-0930-project-tasks-mvp/*`, `prisma/schema.prisma`, `app/api/projects/[id]/tasks/route.ts`, `app/api/tasks/[taskId]/route.ts`, `components/project/TaskTab.tsx`.

---

## 1. Thiết kế dữ liệu (Data Model)

### 1.1 Entities liên quan

- `Project` (đã có): Dự án BIM/xây dựng.
- `Task` (đã có, cần mở rộng nhẹ): Công việc trong một `Project`.
- (Phase 1 không thêm bảng mới; `Phase/Discipline/Location` sẽ là **fields bổ sung** trên `Task`.)

### 1.2 Model `Task` hiện tại (rút gọn)

```startLine:endLine:prisma/schema.prisma
346:model Task {
347:  id          String   @id @default(uuid())
348:  projectId   String
349:  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
350:  title       String
351:  description String?
352:  startDate   DateTime?
353:  endDate     DateTime?
354:  status      String   @default("TODO") // TODO, IN_PROGRESS, COMPLETED, DELAYED
355:  priority    String   @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL
356:  progress    Int      @default(0) // 0-100
357:  assignedTo  String? // Name of assignee
358:  createdAt   DateTime @default(now())
359:  updatedAt   DateTime @updatedAt
360:
361:  @@index([projectId])
362:  @@map("tasks")
363:}
```

### 1.3 Mở rộng schema `Task` cho Phase 1

**Yêu cầu từ SPECS:**
- Thêm các chiều phân loại:
  - `phase` – giai đoạn (Khảo sát, Thiết kế, Shopdrawing, Thi công…).
  - `discipline` – bộ môn (ARC/STR/MEP/OTHER).
  - `location` – vị trí/tầng/khu vực (text tự do).
- Bổ sung trường `dueDate` tách biệt khỏi `endDate` (để rõ nghĩa “hạn hoàn thành”).

**Đề xuất schema mới (Prisma – concept, chưa apply):**

```prisma
model Task {
  id          String   @id @default(uuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  title       String
  description String?

  startDate   DateTime?
  endDate     DateTime?   // Có thể giữ như hiện tại: ngày kết thúc thực tế / kế hoạch
  dueDate     DateTime?   // Hạn chót dùng cho logic quá hạn (Phase 1 có thể map = endDate nếu UI chỉ dùng 1 trường)

  status      String   @default("TODO")    // TODO, IN_PROGRESS, COMPLETED, DELAYED
  priority    String   @default("MEDIUM")  // LOW, MEDIUM, HIGH, CRITICAL
  progress    Int      @default(0)         // 0-100

  assignedTo  String?                      // Tên người phụ trách

  // Phân loại phục vụ BIM/xây dựng
  phase       String?                      // Ví dụ: "KHAO_SAT", "THIET_KE", "SHOPDRAWING", "THI_CONG"
  discipline  String?                      // ARC / STR / MEP / OTHER
  location    String?                      // Tầng/khu vực (text tự do)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([status])
  @@index([priority])
  @@index([assignedTo])
  @@index([phase])
  @@index([dueDate])
}
```

> Ghi chú:
> - Phase 1 **chỉ thêm field** trên bảng `tasks`, chưa làm hệ thống cấu hình custom field động.
> - `dueDate` có thể reuse UI field “Ngày kết thúc” hiện tại để tránh đổi quá nhiều cho user; nhưng backend nên tách rõ để future-friendly.

### 1.4 Validation (Zod) – `lib/validation/task.ts`

Hiện tại schema chưa có các field mới:

```startLine:endLine:lib/validation/task.ts
3:export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DELAYED'] as const;
4:export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
9:const baseTaskSchema = z.object({
10:    title: z.string().trim().min(1, 'Tên công việc là bắt buộc'),
...
25:    status: z.enum(TASK_STATUSES).default('TODO'),
26:    priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
27:    progress: z
...
33:    assignedTo: z
...
39:});
```

**Mở rộng cho Phase 1:**

- Thêm các field optional:
  - `phase`: `z.string().trim().max(100).optional().nullable()`
  - `discipline`: `z.enum(['ARC','STR','MEP','OTHER']).optional().nullable()` (hoặc string thường nếu muốn linh hoạt hơn).
  - `location`: `z.string().trim().max(255).optional().nullable()`
  - `dueDate`: giống `startDate/endDate` (union string/date, optional/nullable).
- `taskCreateSchema` và `taskUpdateSchema` tự hưởng field mới từ `baseTaskSchema`.

---

## 2. Thiết kế API

### 2.1 Tổng quan endpoints Phase 1

- `GET /api/projects/:id/tasks`
  - Lấy danh sách task của một dự án (đã tồn tại, sẽ mở rộng filter + fields).
- `POST /api/projects/:id/tasks`
  - Tạo task mới cho dự án.
- `PUT /api/tasks/:taskId`
  - Cập nhật 1 task (status, progress, dates, phase, discipline, location, …).
- `DELETE /api/tasks/:taskId`
  - Xóa task.

Sau Phase 1 có thể thêm:
- `GET /api/my-tasks` – cho view “Công việc của tôi” (hoặc dùng lại `/api/projects/:id/tasks` với query `assignee=me`).

### 2.2 `GET /api/projects/:id/tasks`

**Hiện trạng (rút gọn):**

```startLine:endLine:app/api/projects/[id]/tasks/route.ts
12:export async function GET(
13:    request: NextRequest,
14:    { params }: { params: Promise<{ id: string }> | { id: string } },
15:) {
...
20:        const { searchParams } = new URL(request.url);
21:        const parsedFilter = taskFilterSchema.safeParse({
22:            status: searchParams.get('status') ?? undefined,
23:            priority: searchParams.get('priority') ?? undefined,
24:            assignee: searchParams.get('assignee') ?? undefined,
25:        });
...
38:        const where: { projectId: string; status?: string; priority?: string; assignedTo?: string } = {
39:            projectId,
40:        };
...
54:        const tasks = await prisma.task.findMany({
55:            where,
56:            orderBy: { createdAt: 'desc' },
57:        });
```

**Thiết kế mới Phase 1:**

- **Query params hỗ trợ:**
  - `status?: TaskStatus`
  - `priority?: TaskPriority`
  - `assignee?: string` (tên hiển thị).
  - `phase?: string`
  - (tương lai: `dueFrom`, `dueTo`, `overdueOnly`, nhưng có thể để phase sau).
- `taskFilterSchema` mở rộng thêm:
  - `phase: z.string().trim().optional()`
- `where` mở rộng:
  - `phase` khi filter có giá trị.
- **Response JSON:**
  - `{ success: true, data: Task[] }` – đã phù hợp với SPECS; Task object giờ có thêm `phase`, `discipline`, `location`, `dueDate`.

### 2.3 `POST /api/projects/:id/tasks`

**Hiện trạng (rút gọn):**

```startLine:endLine:app/api/projects/[id]/tasks/route.ts
73:export async function POST(
...
91:        const data: TaskCreateInput = parsed.data;
93:        const task = await prisma.task.create({
94:            data: {
95:                projectId,
96:                title: data.title,
97:                description: data.description ?? null,
98:                startDate: data.startDate ? new Date(data.startDate as string | Date) : null,
99:                endDate: data.endDate ? new Date(data.endDate as string | Date) : null,
100:                status: data.status,
101:                priority: data.priority,
102:                progress: data.progress,
103:                assignedTo: data.assignedTo ?? null,
104:            },
105:        });
```

**Thiết kế mới:**

- Map thêm các field:
  - `phase: data.phase ?? null`
  - `discipline: data.discipline ?? null`
  - `location: data.location ?? null`
  - `dueDate: data.dueDate ? new Date(data.dueDate as string | Date) : null`
- Vẫn trả về `{ success: true, data: task }`.

### 2.4 `PUT /api/tasks/:taskId`

**Hiện trạng:**

```startLine:endLine:app/api/tasks/[taskId]/route.ts
25:        const task = await prisma.task.update({
26:            where: { id: taskId },
27:            data: {
28:                title: data.title,
29:                description: data.description ?? undefined,
30:                startDate: data.startDate
31:                    ? new Date(data.startDate as string | Date)
32:                    : data.startDate === null
33:                      ? null
34:                      : undefined,
35:                endDate: data.endDate
36:                    ? new Date(data.endDate as string | Date)
37:                    : data.endDate === null
38:                      ? null
39:                      : undefined,
40:                status: data.status,
41:                priority: data.priority,
42:                progress: typeof data.progress === 'number' ? data.progress : undefined,
43:                assignedTo: data.assignedTo ?? undefined,
44:            },
45:        });
```

**Thiết kế mới:**

- Mở rộng `data`:
  - `phase: data.phase ?? undefined`
  - `discipline: data.discipline ?? undefined`
  - `location: data.location ?? undefined`
  - `dueDate` mapping tương tự `startDate/endDate`:
    - Nếu `data.dueDate` truthy → `new Date(...)`
    - Nếu `data.dueDate === null` → `null`
    - Ngược lại → `undefined` (không đổi).

### 2.5 Endpoint đề xuất cho “Công việc của tôi” (My Work)

- **Option A (ưu tiên đơn giản):** Reuse `GET /api/projects/:id/tasks` với filter `assignee` và để UI lặp qua tất cả project (nếu cần).
- **Option B (sau này):**  
  - `GET /api/my-tasks?scope=projectId&range=this-week|next-7-days|all`
  - Backend dùng session (`getServerSession`) để biết user hiện tại, join `ProjectMember` hoặc đơn giản filter `assignedTo` theo tên hiển thị trùng `session.user.name`.
  - Phase 1 có thể bắt đầu từ Option A (ít thay đổi backend), Option B để phase Advanced.

---

## 3. Luồng người dùng (User Journey – Phase 1)

### 3.1 PM/Lead quản lý công việc trong 1 dự án

1. Vào `Dự án` → chọn 1 dự án → tab `Công việc`.
2. Ở header:
   - Thấy % tiến độ trung bình và số task quá hạn.
3. Ở filter bar:
   - Lọc theo trạng thái, ưu tiên, người phụ trách.
4. Ở List view:
   - Xem cột: Tên, Status, Priority, Assignee, Thời gian (start–end/due), Progress.
   - Mở nhanh modal để chỉnh chi tiết hoặc chỉnh Status/Progress inline.
5. Chuyển sang Board view:
   - Kéo thả task giữa các cột để đổi trạng thái.
6. Chuyển sang Gantt view:
   - Xem timeline theo ngày; task quá hạn được highlight đỏ.

### 3.2 Member cập nhật công việc

1. Vào view “Công việc của tôi” (hoặc tab Công việc + filter Assignee = mình).
2. Xem danh sách task theo Due date.
3. Cập nhật:
   - Tiến độ (%), trạng thái (To Do → In Progress → Completed).
   - Nếu cần chỉnh ngày hoặc mô tả → mở modal edit task.

---

## 4. Logic tiến độ & quá hạn

### 4.1 Tính `overallProgress` (đã có)

- Logic hiện tại trong `TaskTab`:

```startLine:endLine:components/project/TaskTab.tsx
590:    const overallProgress = useMemo(() => {
591:        if (tasks.length === 0) return 0;
592:        const total = tasks.reduce((sum, task) => sum + task.progress, 0);
593:        return Math.round(total / tasks.length);
594:    }, [tasks]);
```

- Phase 1 giữ nguyên, chỉ đảm bảo `task.progress` luôn nằm 0–100 (Zod đã enforce).

### 4.2 Xác định task quá hạn (Overdue)

- Định nghĩa:
  - Task có `dueDate` (hoặc `endDate` nếu chưa tách trường) và `status !== 'COMPLETED'`.
  - `overdue = dueDate < today (VN timezone)` – có thể dùng `startOfDay` cho chính xác.
- Thiết kế helper (pseudo-code):

```ts
function isTaskOverdue(task: TaskLike, now = new Date()): boolean {
  if (!task.dueDate && !task.endDate) return false;
  if (task.status === 'COMPLETED') return false;

  const due = new Date(task.dueDate ?? task.endDate!);
  const todayVN = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  // So sánh theo ngày, không tính giờ
  const ymd = (d: Date) => [d.getFullYear(), d.getMonth(), d.getDate()] as const;
  const [y1, m1, d1] = ymd(due);
  const [y2, m2, d2] = ymd(todayVN);

  if (y1 < y2) return true;
  if (y1 > y2) return false;
  if (m1 < m2) return true;
  if (m1 > m2) return false;
  return d1 < d2;
}
```

- Sử dụng helper này ở:
  - List view: tô màu đỏ Due date, badge “Quá hạn”.
  - Board view: icon cảnh báo trên card.
  - Gantt: thanh màu đỏ hoặc border đỏ.
  - Header: đếm số task thoả điều kiện `isTaskOverdue`.

---

## 5. Acceptance Criteria kỹ thuật (tương ứng SPECS)

### 5.1 Model & DB

- [ ] Prisma `Task` có thêm các field: `phase?`, `discipline?`, `location?`, `dueDate?`.
- [ ] Đã tạo migration và apply thành công.
- [ ] Zod schemas (`taskCreateSchema`, `taskUpdateSchema`) hỗ trợ đầy đủ field mới.
- [ ] Không có TypeScript error ở các nơi sử dụng `Task`.

### 5.2 API

- [ ] `GET /api/projects/:id/tasks` trả về đầy đủ field mới, hỗ trợ filter `status/priority/assignee/phase`.
- [ ] `POST /api/projects/:id/tasks` lưu chính xác các field mới, validate lỗi rõ ràng (tiếng Việt).
- [ ] `PUT /api/tasks/:taskId` cập nhật được riêng lẻ từng field, không ghi đè ngoài ý muốn.
- [ ] Tất cả response theo format chuẩn `{ success: boolean, data?, error? }`.

### 5.3 UI – Tab Công việc

- [ ] List view hiển thị đúng các cột mặc định, filter hoạt động.
- [ ] Board view kéo thả mượt, status & progress sync với backend.
- [ ] Gantt/Timeline hiển thị task theo ngày, đổi filter không lỗi.
- [ ] Header hiển thị đúng `% tiến độ` và số task quá hạn trong mọi chế độ view.

### 5.4 View “Công việc của tôi”

- [ ] Có view/filter cho phép xem nhanh các task có `assignedTo = current user`.
- [ ] Có thể đổi status/progress trực tiếp mà không reload toàn trang.

---

## 6. Out of Scope (Phase 1)

- Hệ thống **Custom Fields Settings** kiểu ClickUp (màn hình cấu hình field động).
- S-curve, Earned Value, advanced reporting.
- Automation phức tạp (chỉ giữ các rule đơn giản nội bộ FE/BE nếu cần).
- Tích hợp sâu với BIM (link element, clash issue auto-sync).

