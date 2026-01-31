# Kế hoạch phát triển tính năng Quản lý dự án

## Tổng quan

Hệ thống hiện tại đã có:
- ✅ Quản lý dự án cơ bản (CRUD, status, budget)
- ✅ Quản lý dòng tiền (Cash Flow)
- ✅ Quản lý hóa đơn (Billing)
- ✅ Liên kết với Báo giá (Quotations)

**Mục tiêu**: Bổ sung các tính năng quản lý dự án chuyên nghiệp để theo dõi tiến độ, phân công công việc, và quản lý team.

---

## Phase 1: Quản lý công việc (Tasks) và Phân công nhân sự

**Mục tiêu**: Cho phép chia nhỏ dự án thành các công việc cụ thể và phân công nhân sự.

### 1.1. Database Schema - Tasks & Assignments

**File**: `prisma/schema.prisma`

Thêm các models:

#### Task Model
```prisma
model Task {
  id            String   @id @default(uuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Basic info
  title         String
  description   String?
  status        String   @default("TODO") // TODO, IN_PROGRESS, DONE, BLOCKED, CANCELLED
  priority      String   @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  progress      Int      @default(0) // 0-100
  
  // Dates
  dueDate       DateTime?
  startDate     DateTime?
  completedDate DateTime?
  
  // Time tracking
  estimatedHours Float?
  actualHours    Float?
  
  // Hierarchy
  parentTaskId  String?
  parentTask    Task?    @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subtasks      Task[]   @relation("TaskHierarchy")
  
  // Assignment
  assignedToId  String?
  assignedTo    User?    @relation("TaskAssignee", fields: [assignedToId], references: [id])
  
  // Tracking
  createdById  String
  createdBy    User      @relation("TaskCreator", fields: [createdById], references: [id])
  order        Int       @default(0) // Display order
  
  // Relations
  comments     TaskComment[]
  attachments  TaskAttachment[]
  dependencies TaskDependency[] @relation("DependentTask")
  dependents   TaskDependency[] @relation("DependsOnTask")
  milestones   TaskMilestone[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("tasks")
  @@index([projectId])
  @@index([status])
  @@index([assignedToId])
  @@index([parentTaskId])
  @@index([dueDate])
}
```

#### TaskAssignment Model
```prisma
model TaskAssignment {
  id              String   @id @default(uuid())
  projectId       String
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  role            String   // PROJECT_MANAGER, TEAM_MEMBER, CONSULTANT, REVIEWER, etc.
  startDate       DateTime?
  endDate         DateTime?
  allocationPercent Int?   @default(100) // 0-100
  hourlyRate      Float?
  notes           String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([projectId, userId])
  @@map("task_assignments")
  @@index([projectId])
  @@index([userId])
}
```

#### TaskComment Model
```prisma
model TaskComment {
  id        String   @id @default(uuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  content   String   // Rich text/HTML
  isEdited  Boolean  @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("task_comments")
  @@index([taskId])
  @@index([createdAt])
}
```

#### TaskAttachment Model
```prisma
model TaskAttachment {
  id           String   @id @default(uuid())
  taskId       String
  task         Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  fileName     String
  fileUrl      String
  fileSize     Int      // bytes
  mimeType     String?
  
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  
  createdAt DateTime @default(now())
  
  @@map("task_attachments")
  @@index([taskId])
}
```

**Cập nhật Project model**:
```prisma
model Project {
  // ... existing fields ...
  
  // Relations
  tasks          Task[]
  taskAssignments TaskAssignment[]
  projectMilestones ProjectMilestone[]
  activities    ProjectActivity[]
}
```

**Cập nhật User model**:
```prisma
model User {
  // ... existing fields ...
  
  // Relations
  assignedTasks    Task[]            @relation("TaskAssignee")
  createdTasks     Task[]            @relation("TaskCreator")
  taskAssignments  TaskAssignment[]
  taskComments     TaskComment[]
  taskAttachments  TaskAttachment[]
}
```

**Migration**: Tạo migration mới với các bảng trên

### 1.2. API Routes - Tasks

**Files**: 

#### `app/api/projects/[id]/tasks/route.ts`
- `GET` - List tasks với filters (status, priority, assignee, search)
- `POST` - Tạo task mới

#### `app/api/projects/[id]/tasks/[taskId]/route.ts`
- `GET` - Lấy chi tiết task (với comments, attachments, dependencies)
- `PUT` - Cập nhật task
- `DELETE` - Xóa task

#### `app/api/projects/[id]/tasks/[taskId]/assign/route.ts`
- `POST` - Assign/unassign user cho task

#### `app/api/projects/[id]/tasks/[taskId]/comments/route.ts`
- `GET` - List comments
- `POST` - Thêm comment

#### `app/api/projects/[id]/tasks/[taskId]/attachments/route.ts`
- `GET` - List attachments
- `POST` - Upload attachment
- `DELETE` - Xóa attachment

#### `app/api/projects/[id]/team/route.ts`
- `GET` - List team members của project
- `POST` - Thêm team member
- `PUT` - Cập nhật team member assignment
- `DELETE` - Xóa team member

**Validation**: Tạo `lib/validation/task.ts` với Zod schemas:
- `createTaskSchema`
- `updateTaskSchema`
- `taskAssignmentSchema`

### 1.3. UI Components - Tasks Tab

**File**: `components/project/TasksTab.tsx`

Features:
- Danh sách tasks với filter (status, priority, assignee, search)
- Tạo/sửa/xóa task
- Drag & drop để sắp xếp thứ tự (sử dụng `@dnd-kit/core`)
- Hiển thị progress bar cho mỗi task
- Subtasks (nested tasks với expand/collapse)
- Quick actions: assign, change status, add comment
- Kanban board view (tùy chọn)

**File**: `components/project/TaskCard.tsx` - Component hiển thị một task card

**File**: `components/project/TaskForm.tsx` - Form tạo/sửa task với validation

**File**: `components/project/TaskFilters.tsx` - Component filter tasks

### 1.4. UI Components - Team Assignment

**File**: `components/project/TeamTab.tsx`

Features:
- Danh sách team members của dự án
- Thêm/xóa team member
- Hiển thị role, allocation, hourly rate
- Timeline hiển thị thời gian tham gia dự án
- Tổng số tasks được assign cho mỗi member

**File**: `components/project/TeamMemberForm.tsx` - Form thêm/sửa team member

**File**: `components/project/TeamMemberCard.tsx` - Card hiển thị team member

### 1.5. Integration với ProjectEditor

**File**: `components/project/ProjectEditor.tsx`

Thêm tab mới:
- Tab "Công việc" → TasksTab
- Tab "Nhân sự" → TeamTab

Cập nhật ProjectEditor để hiển thị:
- Tổng số tasks
- Tasks đang làm (IN_PROGRESS)
- Tasks hoàn thành (DONE)
- Progress tổng thể của dự án

---

## Phase 2: Timeline và Milestones

**Mục tiêu**: Cung cấp view timeline/Gantt chart và quản lý milestones.

### 2.1. Database Schema - Project Milestones

**File**: `prisma/schema.prisma`

Thêm models:

#### ProjectMilestone Model
```prisma
model ProjectMilestone {
  id          String   @id @default(uuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  title       String
  description String?
  targetDate  DateTime
  actualDate  DateTime?
  status      String   @default("PLANNED") // PLANNED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED
  progress    Int      @default(0) // 0-100, calculated from linked tasks
  order       Int      @default(0)
  
  tasks       TaskMilestone[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("project_milestones")
  @@index([projectId])
  @@index([targetDate])
  @@index([status])
}
```

#### TaskMilestone Model (Many-to-Many)
```prisma
model TaskMilestone {
  taskId      String
  task        Task            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  milestoneId String
  milestone   ProjectMilestone @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
  
  @@id([taskId, milestoneId])
  @@map("task_milestones")
}
```

**Migration**: Tạo migration cho milestones

### 2.2. Timeline Component

**File**: `components/project/TimelineTab.tsx`

Features:
- Gantt chart view (sử dụng `recharts` hoặc custom component)
- Hiển thị tasks theo timeline với bars
- Hiển thị milestones như markers
- Drag để thay đổi start date và duration
- Zoom in/out (day, week, month view)
- Filter theo team member, status
- Critical path highlighting

**File**: `components/project/GanttChart.tsx` - Component Gantt chart chính

**File**: `components/project/TimelineTaskBar.tsx` - Component bar cho một task

**File**: `components/project/MilestoneMarker.tsx` - Component marker cho milestone

### 2.3. Milestones Management

**File**: `components/project/MilestonesTab.tsx`

Features:
- Danh sách milestones với timeline view
- Tạo/sửa/xóa milestone
- Link tasks với milestones (many-to-many)
- Hiển thị progress của milestone dựa trên linked tasks
- Status tracking (PLANNED → IN_PROGRESS → COMPLETED)

**File**: `components/project/MilestoneForm.tsx` - Form tạo/sửa milestone

**File**: `components/project/MilestoneCard.tsx` - Card hiển thị milestone

### 2.4. API Routes - Milestones

**Files**:
- `app/api/projects/[id]/milestones/route.ts` - GET (list), POST (create)
- `app/api/projects/[id]/milestones/[milestoneId]/route.ts` - GET, PUT, DELETE
- `app/api/projects/[id]/milestones/[milestoneId]/tasks/route.ts` - POST (link task), DELETE (unlink)

**Validation**: Thêm `milestoneSchema` vào `lib/validation/project.ts`

---

## Phase 3: Theo dõi tiến độ và Báo cáo

**Mục tiêu**: Dashboard tiến độ và báo cáo chi tiết.

### 3.1. Progress Tracking

**File**: `components/project/ProgressTab.tsx`

Features:
- Dashboard tổng quan tiến độ dự án
- Biểu đồ % hoàn thành theo thời gian (line chart)
- So sánh planned vs actual dates
- Burndown chart (tasks remaining over time)
- Velocity tracking (tasks completed per week/month)
- Progress by team member
- Progress by priority/status

**File**: `components/project/ProgressChart.tsx` - Component biểu đồ tiến độ

**File**: `components/project/BurndownChart.tsx` - Component burndown chart

**File**: `components/project/VelocityChart.tsx` - Component velocity chart

### 3.2. Task Dependencies

**File**: `prisma/schema.prisma`

Thêm model:
```prisma
model TaskDependency {
  id              String   @id @default(uuid())
  taskId          String
  task            Task      @relation("DependentTask", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOnTaskId String
  dependsOnTask   Task      @relation("DependsOnTask", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)
  
  type            String   // BLOCKS, BLOCKED_BY, RELATES_TO, PRECEDES
  description     String?
  
  createdAt DateTime @default(now())
  
  @@unique([taskId, dependsOnTaskId])
  @@map("task_dependencies")
  @@index([taskId])
  @@index([dependsOnTaskId])
}
```

**Migration**: Thêm bảng dependencies

**UI**: 
- Hiển thị dependencies trong TaskCard
- Visual dependency graph trong Timeline
- Warning khi có circular dependencies
- Auto-calculate task start date dựa trên dependencies

**File**: `components/project/TaskDependencyGraph.tsx` - Component hiển thị dependency graph

### 3.3. Activity Log

**File**: `prisma/schema.prisma`

Thêm model:
```prisma
model ProjectActivity {
  id          String   @id @default(uuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  action      String   // CREATED, UPDATED, DELETED, COMMENTED, ASSIGNED, STATUS_CHANGED, etc.
  entityType  String   // TASK, MILESTONE, TEAM_MEMBER, etc.
  entityId    String?
  entityTitle String?
  
  details     String?  // JSON string with additional info
  oldValue    String?  // For updates
  newValue    String?  // For updates
  
  createdAt DateTime @default(now())
  
  @@map("project_activities")
  @@index([projectId])
  @@index([createdAt])
  @@index([entityType, entityId])
}
```

**File**: `components/project/ActivityTab.tsx` - Hiển thị activity log với:
- Filter theo action, entity type, user, date range
- Group by date
- Expand để xem chi tiết

**File**: `components/project/ActivityItem.tsx` - Component hiển thị một activity item

### 3.4. Reports

**File**: `app/(dashboard)/reports/projects/page.tsx`

Features:
- Báo cáo tiến độ dự án (theo thời gian, theo status)
- Báo cáo workload của team members
- Báo cáo tasks theo status/priority
- Báo cáo tasks overdue
- Báo cáo time tracking (estimated vs actual)
- Export Excel/PDF

**File**: `components/reports/ProjectProgressReport.tsx`
**File**: `components/reports/TeamWorkloadReport.tsx`
**File**: `components/reports/TaskStatusReport.tsx`

**API**: `app/api/reports/projects/route.ts` - Generate report data

---

## Phase 4: Nâng cao và Tối ưu

**Mục tiêu**: Hoàn thiện hệ thống với các tính năng nâng cao.

### 4.1. Notifications

**File**: `prisma/schema.prisma`

Thêm model:
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskId    String?
  task      Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  type      String   // TASK_ASSIGNED, TASK_DUE_SOON, TASK_OVERDUE, MILESTONE_APPROACHING, COMMENT_ADDED, etc.
  title     String
  message   String
  read      Boolean  @default(false)
  
  createdAt DateTime @default(now())
  
  @@map("notifications")
  @@index([userId, read])
  @@index([createdAt])
}
```

**File**: `components/layout/NotificationBell.tsx` - Component thông báo với:
- Badge số lượng unread
- Dropdown list notifications
- Mark as read
- Link đến project/task

**File**: `app/api/notifications/route.ts` - GET (list), PATCH (mark as read)

**File**: `app/api/notifications/[id]/read/route.ts` - PATCH (mark single as read)

### 4.2. Project Templates

**File**: `prisma/schema.prisma`

Thêm model:
```prisma
model ProjectTemplate {
  id          String   @id @default(uuid())
  name        String
  description String?
  category    String?  // BIM_MODELING, CONSULTING, DESIGN, etc.
  
  // Template data (JSON)
  defaultTasks      String?  // JSON array of task templates
  defaultMilestones String?  // JSON array of milestone templates
  defaultTeamRoles  String?  // JSON array of team role templates
  
  isPublic    Boolean  @default(false)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("project_templates")
  @@index([category])
  @@index([isPublic])
}
```

**File**: `components/project/ProjectTemplateSelector.tsx` - Chọn template khi tạo dự án với:
- List templates theo category
- Preview template (tasks, milestones, team roles)
- Apply template button

**File**: `app/api/project-templates/route.ts` - GET (list), POST (create)
**File**: `app/api/project-templates/[id]/route.ts` - GET, PUT, DELETE

### 4.3. File Management

**File**: `app/api/projects/[id]/files/route.ts` - API upload/download files

**File**: `components/project/FilesTab.tsx` - Quản lý files của dự án với:
- List files (group by task or general)
- Upload multiple files
- Preview (images, PDFs)
- Download
- Delete

**File**: `components/project/FileUploader.tsx` - Component upload files

### 4.4. Search & Filters

Nâng cấp search trong ProjectTab và TasksTab:
- Search tasks (title, description)
- Filter theo nhiều tiêu chí (status, priority, assignee, date range, tags)
- Saved filters
- Quick filters (My Tasks, Overdue, High Priority)

**File**: `components/project/AdvancedTaskFilters.tsx` - Component filter nâng cao

### 4.5. Mobile Responsive

Tối ưu UI cho mobile:
- Responsive tables (scrollable hoặc card view)
- Touch-friendly drag & drop
- Mobile-optimized forms
- Bottom sheet cho actions
- Swipe gestures

---

## Implementation Order

### Priority 1 (Phase 1 - Core Features) - Tuần 1-2
1. ✅ Database schema cho Tasks và TaskAssignment
2. ✅ Migration và test
3. ✅ API routes cho Tasks (CRUD)
4. ✅ API routes cho Team assignment
5. ✅ TasksTab component với basic UI
6. ✅ TeamTab component
7. ✅ Integration vào ProjectEditor

### Priority 2 (Phase 2 - Timeline) - Tuần 3-4
1. ✅ Database schema cho Milestones
2. ✅ TimelineTab với Gantt chart (basic)
3. ✅ MilestonesTab
4. ✅ API routes cho Milestones
5. ✅ Drag & drop trong timeline

### Priority 3 (Phase 3 - Tracking) - Tuần 5-6
1. ✅ ProgressTab với charts
2. ✅ Task dependencies
3. ✅ Activity log
4. ✅ Basic reports

### Priority 4 (Phase 4 - Polish) - Tuần 7-8
1. ✅ Notifications
2. ✅ Templates
3. ✅ File management improvements
4. ✅ Mobile optimization

---

## Technical Considerations

### Libraries to Consider
- **Gantt Chart**: `recharts` (đã có) hoặc custom với SVG
- **Drag & Drop**: `@dnd-kit/core` (modern, accessible)
- **Charts**: `recharts` (đã có trong project)
- **Date Picker**: Native HTML5 hoặc `react-datepicker`
- **Rich Text Editor**: Có thể dùng `react-quill` hoặc `tiptap` cho comments

### Database Indexes
- Index trên `Task.projectId`, `Task.status`, `Task.assignedToId`, `Task.dueDate`
- Index trên `TaskAssignment.projectId`, `TaskAssignment.userId`
- Index trên `ProjectActivity.projectId`, `ProjectActivity.createdAt`
- Index trên `Notification.userId`, `Notification.read`

### Performance
- Pagination cho tasks list (20-50 items per page)
- Lazy loading cho subtasks (load on expand)
- Virtual scrolling cho long lists (nếu cần)
- Cache API responses với `lib/cache.ts` (30s-5min tùy endpoint)
- Debounce search input (300ms)

### Security
- Validate user permissions (can edit project?)
- Validate task ownership/assignment
- Sanitize HTML trong comments
- File upload validation (type, size)

---

## Files to Create/Modify

### New Files

#### Database
- `prisma/migrations/XXXXXX_add_tasks_and_team/migration.sql`

#### Validation
- `lib/validation/task.ts`

#### Components
- `components/project/TasksTab.tsx`
- `components/project/TaskCard.tsx`
- `components/project/TaskForm.tsx`
- `components/project/TaskFilters.tsx`
- `components/project/TeamTab.tsx`
- `components/project/TeamMemberForm.tsx`
- `components/project/TeamMemberCard.tsx`
- `components/project/TimelineTab.tsx`
- `components/project/GanttChart.tsx`
- `components/project/TimelineTaskBar.tsx`
- `components/project/MilestoneMarker.tsx`
- `components/project/MilestonesTab.tsx`
- `components/project/MilestoneForm.tsx`
- `components/project/MilestoneCard.tsx`
- `components/project/ProgressTab.tsx`
- `components/project/ProgressChart.tsx`
- `components/project/BurndownChart.tsx`
- `components/project/VelocityChart.tsx`
- `components/project/TaskDependencyGraph.tsx`
- `components/project/ActivityTab.tsx`
- `components/project/ActivityItem.tsx`
- `components/project/FilesTab.tsx`
- `components/project/FileUploader.tsx`
- `components/project/AdvancedTaskFilters.tsx`
- `components/layout/NotificationBell.tsx`
- `components/project/ProjectTemplateSelector.tsx`

#### API Routes
- `app/api/projects/[id]/tasks/route.ts`
- `app/api/projects/[id]/tasks/[taskId]/route.ts`
- `app/api/projects/[id]/tasks/[taskId]/assign/route.ts`
- `app/api/projects/[id]/tasks/[taskId]/comments/route.ts`
- `app/api/projects/[id]/tasks/[taskId]/attachments/route.ts`
- `app/api/projects/[id]/team/route.ts`
- `app/api/projects/[id]/milestones/route.ts`
- `app/api/projects/[id]/milestones/[milestoneId]/route.ts`
- `app/api/projects/[id]/milestones/[milestoneId]/tasks/route.ts`
- `app/api/notifications/route.ts`
- `app/api/notifications/[id]/read/route.ts`
- `app/api/project-templates/route.ts`
- `app/api/project-templates/[id]/route.ts`
- `app/api/projects/[id]/files/route.ts`
- `app/api/reports/projects/route.ts`

#### Pages
- `app/(dashboard)/reports/projects/page.tsx`

### Modified Files

#### Database
- `prisma/schema.prisma` - Thêm models mới và relations

#### Components
- `components/project/ProjectEditor.tsx` - Thêm tabs mới (Tasks, Team, Timeline, Milestones, Progress, Activity)
- `components/project/ProjectTab.tsx` - Hiển thị task stats trong project cards
- `components/project/ProjectQuotationsPanel.tsx` - (Không thay đổi)

#### API
- `app/api/projects/[id]/route.ts` - Include tasks, team, milestones trong response
- `app/api/projects/route.ts` - Include task counts trong list response

#### Layout
- `components/layout/Header.tsx` - Thêm NotificationBell component

---

## Success Metrics

### Functional
- ✅ Users có thể tạo và quản lý tasks trong dự án
- ✅ Team members được phân công và theo dõi
- ✅ Timeline/Gantt chart hiển thị chính xác tiến độ
- ✅ Progress tracking cung cấp insights hữu ích
- ✅ Tasks có thể link với milestones
- ✅ Dependencies giữa tasks được quản lý

### Performance
- ✅ System performance tốt với 100+ tasks per project
- ✅ API response time < 500ms cho list endpoints
- ✅ Smooth drag & drop (60fps)

### UX
- ✅ Intuitive UI, dễ sử dụng
- ✅ Mobile responsive
- ✅ Loading states rõ ràng
- ✅ Error messages tiếng Việt, dễ hiểu

---

## Notes

- Tất cả text UI phải bằng tiếng Việt
- Tuân theo coding conventions trong `.cursorrules`
- Sử dụng brand colors (zf-primary, zf-accent)
- Validation với Zod schemas
- Error handling đầy đủ
- Type-safe với TypeScript

---

**Ngày tạo**: 2026-01-29  
**Phiên bản**: 1.0  
**Trạng thái**: Draft - Chờ duyệt
