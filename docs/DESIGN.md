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
-
---

## 7. Thiết kế bổ sung – Trường tuỳ chỉnh (Custom Fields) – Xử lý hiển thị

> Ghi chú: phần này mô tả **thiết kế kỹ thuật cho module Trường tuỳ chỉnh** đã bắt đầu được implement (Settings → `CustomFieldsSettings`, API `/api/custom-fields`, `/api/custom-fields/values`, models `CustomField*`). Scope chính: **xử lý hiển thị** (UI/UX + mapping dữ liệu) cho màn cấu hình và màn nhập công việc. Vẫn được coi là phần mở rộng sau Phase 1 core.

### 7.1 Data model liên quan

- Prisma (đã tồn tại):

```startLine:endLine:prisma/schema.prisma
479:enum CustomFieldEntityType {
480:  PROJECT
481:  TASK
482:}
484:enum CustomFieldType {
485:  TEXT
486:  NUMBER
487:  DATE
488:  SELECT
489:  MULTI_SELECT
490:  BOOLEAN
491:}
494:model CustomField {
495:  id          String                 @id @default(uuid())
496:  name        String
497:  key         String                 @unique
498:  description String?
499:  entityType  CustomFieldEntityType
500:  fieldType   CustomFieldType
501:  group       String?
505:  sortOrder   Int                    @default(0)
507:  isRequired  Boolean                @default(false)
509:  isActive    Boolean                @default(true)
512:  options     CustomFieldOption[]
513:  values      CustomFieldValue[]
514:
515:  @@index([entityType])
516:  @@index([isActive])
517:  @@map("custom_fields")
518:}
520:model CustomFieldOption {
521:  id            String       @id @default(uuid())
523:  customFieldId String
524:  label         String
526:  value         String?
528:  color         String?
529:  sortOrder     Int          @default(0)
530:  customField   CustomField  @relation(fields: [customFieldId], references: [id], onDelete: Cascade)
533:}
536:model CustomFieldValue {
537:  id            String                @id @default(uuid())
539:  customFieldId String
541:  entityType    CustomFieldEntityType
543:  entityId      String
545:  /// TEXT / SELECT / MULTI_SELECT → stringValue (MULTI_SELECT có thể là JSON string của string[])
549:  stringValue   String?
550:  numberValue   Float?
551:  dateValue     DateTime?
552:  boolValue     Boolean?
555:  customField   CustomField           @relation(fields: [customFieldId], references: [id], onDelete: Cascade)
558:  @@index([entityType, entityId])
559:}
```

- Validation (Zod – `lib/validation/custom-field.ts`):
  - Bảo vệ:
    - `name`, `key` không rỗng, `key` chỉ chữ/số/`_`/`-`.
    - `fieldType` là một trong `TEXT | NUMBER | DATE | SELECT | MULTI_SELECT | BOOLEAN`.
    - Với `SELECT`/`MULTI_SELECT` thì **phải có ít nhất 1 option sống**.
  - Schema cho giá trị:
    - `CustomFieldValueUpsertInput.values` là map `{ [customFieldId]: string | number | boolean | string[] | null }`.

### 7.2 API surface cho custom fields

- `GET /api/custom-fields?entityType=TASK|PROJECT&includeInactive=true?`
  - **Input**:
    - `entityType` bắt buộc (`TASK`/`PROJECT`).
    - `includeInactive?: boolean` – nếu `false` (mặc định) chỉ trả về `isActive = true`.
  - **Output**: `{ success: true, data: CustomFieldDTO[] }`, mỗi item gồm:
    - Thuộc tính chính của `CustomField` (id, name, key, description, entityType, fieldType, group, sortOrder, isRequired, isActive).
    - Mảng `options` (nếu là SELECT/MULTI_SELECT) đã sort theo `sortOrder`.
  - **Ordering mặc định**: nhóm theo `group` (null → "Mặc định") rồi sort theo `sortOrder`, fallback theo `createdAt`.

- `POST /api/custom-fields` / `PUT /api/custom-fields/:id` / `DELETE /api/custom-fields/:id`
  - Sử dụng schemas `customFieldCreateSchema` và `customFieldUpdateSchema`.
  - Đảm bảo format response chuẩn `{ success, data?, error? }`.

- `GET /api/custom-fields/values?entityType=TASK&entityId=:taskId`
  - Trả về danh sách giá trị hiện tại cho 1 entity; mỗi row tối thiểu:
    - `customFieldId`, `stringValue`, `numberValue`, `dateValue`, `boolValue`.
  - FE sẽ map sang value hiển thị dựa trên `field.fieldType`.

- `POST /api/custom-fields/values`
  - Body tuân theo `customFieldValueUpsertSchema`.
  - Backend:
    - Upsert theo `(entityType, entityId, customFieldId)`.
    - Với `MULTI_SELECT`, `values[cfId]` là `string[]` → lưu JSON string vào `stringValue`.

### 7.3 Logic hiển thị trong màn Settings → Trường tuỳ chỉnh

Tham chiếu component: `components/settings/CustomFieldsSettings.tsx`.

- **Thanh filter phía trên**:
  - `Áp dụng cho` (`entityType`):
    - Bind trực tiếp vào query `entityType` khi gọi `GET /api/custom-fields`.
    - Mặc định `TASK`, user có thể chuyển sang `PROJECT`.
  - `Hiện cả trường đã tắt`:
    - Nếu **bật** → thêm `includeInactive=true` để BE trả thêm `isActive = false`.
    - Nếu **tắt** → chỉ hiển thị `isActive = true` (logic filter có thể xử lý ở BE để đồng nhất).
  - `Tìm theo tên / key / nhóm`:
    - FE filter trên kết quả `fields` đã load:
      - Ghép chuỗi `${name} ${key} ${group}` về lowercase, `.includes(search)`.

- **Bảng listing**:
  - Mỗi dòng hiển thị:
    - Tên + Nhóm (group rỗng → text `Mặc định`).
    - `key` (mono).
    - `fieldType` hiển thị bằng label tiếng Việt (map `FIELD_TYPE_LABEL`).
    - Cột `Bắt buộc` (`isRequired`) và `Bật` (`isActive`) dạng dấu ✓.
  - Thứ tự:
    - FE nên sort fields trước khi render:
      - `group` (null → `'__DEFAULT__'`) asc, sau đó `sortOrder` asc, cuối cùng `name` asc.
    - Trạng thái kéo thả (`GripVertical`) chỉ là gợi ý UI; nếu sau này support drag-sort thì:
      - Khi reorder, FE gửi danh sách `{ id, sortOrder }` lên endpoint riêng (vd: `POST /api/custom-fields/reorder`).

- **Modal tạo/sửa**:
  - Luôn hiển thị:
    - `Tên trường`, `Key`, `Nhóm / Phân loại`, `Mô tả`, `Bắt buộc`, `Đang bật`, `Thứ tự`.
  - `Kiểu dữ liệu` (select):
    - Khi đổi `fieldType`:
      - Nếu type mới là `SELECT`/`MULTI_SELECT`:
        - Giữ nguyên `options` hiện có (nếu có).
      - Nếu **không** phải `SELECT`/`MULTI_SELECT`:
        - Reset `options` về `[]` (tránh gửi option thừa xuống BE).
  - Khối `Tuỳ chọn` chỉ hiển thị khi `fieldType` là `SELECT` hoặc `MULTI_SELECT`:
    - Mỗi option cho phép nhập:
      - `label` (bắt buộc).
      - `color` (optional, string hex hoặc token Tailwind).
    - FE map thành payload:
      - `value`: nếu user không nhập explicit thì dùng `normalizeOptionValue(label, value)` → default = label trimmed.
      - `sortOrder`: index hiện tại trong mảng.
    - Xoá option:
      - Với field mới (chưa lưu) → remove trực tiếp khỏi mảng.
      - Với field đã tồn tại:
        - Có thể dùng cờ `_deleted: true` để BE biết cần xoá record tương ứng (đã được schema cho phép).

### 7.4 Logic hiển thị trong modal Công việc (Task)

Tham chiếu các đoạn chính trong `TaskTab.tsx`:

```startLine:endLine:components/project/TaskTab.tsx
605:    // Load custom fields cho TASK (dùng chung cho tất cả task trong project)
606:    useEffect(() => {
607:        const fetchCustomFields = async () => {
608:            try {
609:                const res = await fetch('/api/custom-fields?entityType=TASK');
610:                const result = await res.json();
611:                if (result.success && Array.isArray(result.data)) {
612:                    setTaskCustomFields(result.data);
613:                } else {
614:                    setTaskCustomFields([]);
615:                }
616:            } catch (error) {
617:                console.error('Failed to fetch task custom fields:', error);
618:                setTaskCustomFields([]);
619:            }
620:        };
621:
622:        void fetchCustomFields();
623:    }, []);
634:    const NEW_TASK_CUSTOM_KEY = '__new__';
660:    const handleLoadTaskCustomValues = useCallback(
661:        async (taskId: string) => {
662:            if (!taskCustomFields.length) return;
666:                    `/api/custom-fields/values?entityType=TASK&entityId=${encodeURIComponent(taskId)}`,
667:                );
669:                if (!result.success || !Array.isArray(result.data)) return;
671:                const map: CustomFieldValueMap = {};
672:                (result.data as Array<any>).forEach((row) => {
673:                    if (!row || !row.customFieldId) return;
674:                    const field = taskCustomFields.find((f) => f.id === row.customFieldId);
675:                    if (!field) return;
677:                    if (field.fieldType === 'NUMBER') {
678:                        map[field.id] = row.numberValue ?? null;
679:                    } else if (field.fieldType === 'DATE') {
680:                        map[field.id] = row.dateValue ?? null;
681:                    } else if (field.fieldType === 'BOOLEAN') {
682:                        map[field.id] = row.boolValue ?? null;
683:                    } else if (field.fieldType === 'MULTI_SELECT') {
684:                        if (typeof row.stringValue === 'string' && row.stringValue.trim()) {
685:                            try {
686:                                const parsed = JSON.parse(row.stringValue);
687:                                map[field.id] = Array.isArray(parsed) ? parsed : [];
688:                            } catch {
689:                                map[field.id] = [];
690:                            }
691:                        } else {
692:                            map[field.id] = [];
693:                        }
694:                    } else {
695:                        map[field.id] = row.stringValue ?? null;
696:                    }
697:                });
699:                setTaskCustomValues((prev) => ({
700:                    ...prev,
701:                    [taskId]: map,
702:                }));
703:            } catch (error) {
704:                console.error('Failed to load task custom values:', error);
705:            }
706:        },
707:        [taskCustomFields],
708:    );
1333:                        {taskCustomFields.length > 0 && (
1334:                            <div className="mt-4 border-t border-gray-100 pt-4">
1336:                                    <h4 className="text-sm font-semibold text-gray-800">Trường tuỳ chỉnh (ClickUp-style)</h4>
1343:                                <div className="space-y-3">
1344:                                    {groupCustomFields(taskCustomFields).map(({ groupName, items }) => (
1345:                                        <div key={groupName} className="border border-gray-100 rounded-2xl p-3 bg-gray-50/60">
1349:                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
1350:                                                {items.map((field) => {
1351:                                                    const currentTaskKey = editingTask ? editingTask.id : NEW_TASK_CUSTOM_KEY;
1352:                                                    const valuesForTask = taskCustomValues[currentTaskKey] ?? {};
1353:                                                    const rawValue = valuesForTask[field.id];
1371:                                                            <input
1372:                                                                type="text"
1373:                                                                value={textValue}
1374:                                                                onChange={(e) => {
1375:                                                                    const nextValue = e.target.value;
1376:                                                                    setTaskCustomValues((prev) => ({
1377:                                                                        ...prev,
1378:                                                                        [currentTaskKey]: {
1379:                                                                            ...(prev[currentTaskKey] ?? {}),
1380:                                                                            [field.id]: nextValue,
1381:                                                                        },
1382:                                                                    }));
1383:                                                                }}
1384:                                                                placeholder="Nhập giá trị..."
1385:                                                            />
```

- **Nguyên tắc hiển thị chung**:
  - Chỉ hiển thị các trường:
    - `entityType = TASK`.
    - `isActive = true` (nếu cần, BE có thể đã filter; nếu không thì FE filter tiếp).
  - Group theo `group`:
    - `groupName` rỗng → hiển thị label `"Mặc định"`.
  - Tất cả field đều có:
    - Label = `field.name` (+ dấu `*` nếu `isRequired`).
    - Help text = `field.description` (nếu có).

- **Mapping fieldType → component hiển thị đề xuất**:
  - `TEXT`:
    - Input text 1 dòng (hiện tại đang dùng).
  - `NUMBER`:
    - Input `type="number"`, cho phép step nhỏ (vd: 0.01 nếu tương lai có currency).
    - FE parse `Number(value)` trước khi lưu vào `taskCustomValues`.
  - `DATE`:
    - Input `type="date"` với định dạng `YYYY-MM-DD`, local timezone VN.
    - Khi load, map `Date` → string qua `.toISOString().slice(0, 10)`.
  - `BOOLEAN`:
    - Checkbox hoặc switch:
      - `checked = Boolean(value)`.
      - Khi thay đổi → lưu `true`/`false` vào `taskCustomValues`.
  - `SELECT`:
    - `<select>` 1 lựa chọn:
      - Options lấy từ `field.options`, label = `opt.label`.
      - Value lưu là `opt.id` hoặc `opt.value` (thống nhất 1 kiểu – đề xuất dùng `opt.id` để tránh trùng).
    - Khi lưu:
      - Gửi string (id) → BE vẫn lưu ở `stringValue`.
  - `MULTI_SELECT`:
    - UI kiểu multi-chips:
      - Dropdown + chọn nhiều option, hiển thị tag màu (`opt.color`).
    - Giá trị trong `taskCustomValues` là `string[]` (danh sách optionId).
    - Trước khi gửi BE:
      - JSON.stringify(mảng) → lưu vào `stringValue`.

- **Lifecycle khi mở modal task**:
  1. Lúc mount `TaskTab`:
     - Gọi `GET /api/custom-fields?entityType=TASK` → set `taskCustomFields`.
  2. Khi click **Thêm công việc**:
     - Reset `taskCustomValues[NEW_TASK_CUSTOM_KEY] = {}`.
  3. Khi click **Sửa công việc**:
     - Gọi `handleLoadTaskCustomValues(task.id)`:
       - Map dữ liệu từ `CustomFieldValue` sang kiểu JS tương ứng.
       - Gán vào `taskCustomValues[task.id]`.
  4. Khi `submit` form:
     - Sau khi lưu task core thành công, nếu `taskCustomFields.length > 0`:
       - Lấy `valuesForTask` từ `taskCustomValues[key]` (key = id task hoặc `__new__`).
       - Lọc bỏ các field:
         - Không tồn tại trong `taskCustomFields`.
         - Giá trị rỗng (string rỗng, mảng dài 0, `null`/`undefined`).
       - Gửi 1 lần lên `/api/custom-fields/values` theo `CustomFieldValueUpsertInput`.

### 7.5 User Journey – Trường tuỳ chỉnh & xử lý hiển thị

1. **PM/Lead cấu hình fields**:
   - Vào `Cài đặt` → tab `Trường tuỳ chỉnh`.
   - Chọn `Áp dụng cho: Công việc` hoặc `Dự án`.
   - Tạo các field với kiểu dữ liệu phù hợp (văn bản, số, ngày, chọn 1, chọn nhiều, đúng/sai).
2. **Member/PM sử dụng trong task**:
   - Khi mở modal tạo/sửa công việc, khối `Trường tuỳ chỉnh (ClickUp-style)` hiển thị theo group.
   - Người dùng nhập/chọn giá trị theo type:
     - Text/Number/Date/Checkbox/Select/Multi-select.
   - Khi bấm **Lưu**, giá trị được gửi cùng một lần lên API custom field values.

### 7.6 Acceptance Criteria – Xử lý hiển thị custom fields

- **Dữ liệu & API**:
  - [ ] `GET /api/custom-fields` trả đúng danh sách fields filter theo `entityType`, bao gồm `options` đã sort.
  - [ ] `GET /api/custom-fields/values` trả đúng giá trị mapping theo `fieldType` (NUMBER/DATE/BOOLEAN/MULTI_SELECT/TEXT).
  - [ ] `POST /api/custom-fields/values` lưu được đủ các kiểu; MULTI_SELECT lưu JSON string, load lại không lỗi parse.
- **Màn Settings – Trường tuỳ chỉnh**:
  - [ ] Đổi `Áp dụng cho` hoặc bật `Hiện cả trường đã tắt` → bảng reload, không lỗi.
  - [ ] Thêm/sửa/xoá field với các kiểu dữ liệu khác nhau, validation tiếng Việt rõ ràng.
  - [ ] Kiểu SELECT/MULTI_SELECT bắt buộc có ít nhất 1 tuỳ chọn, UI không cho lưu khi chưa đủ.
- **Modal Công việc**:
  - [ ] Khi mở modal **Thêm công việc**, khối `Trường tuỳ chỉnh` hiển thị đúng danh sách field active, group theo `group`.
  - [ ] Khi chỉnh sửa task đã có giá trị custom, các field hiển thị đúng giá trị hiện tại (bao gồm MULTI_SELECT và BOOLEAN).
  - [ ] Bấm **Lưu** task → giá trị custom được lưu/ cập nhật; mở lại modal vẫn thấy đúng.