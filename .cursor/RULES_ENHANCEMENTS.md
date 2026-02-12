# 📋 Rules Enhancements - Đề xuất bổ sung

**Best practices từ `global_workflows` để bổ sung vào Cursor Rules**

---

## 🎯 Mục đích

Document này đề xuất các bổ sung cho Cursor Rules dựa trên best practices từ `global_workflows`. Các rules này sẽ giúp AI tự động follow các patterns tốt từ workflows.

---

## 🔧 Đề xuất bổ sung Rules

### 1. Error Handling & Resilience Patterns

**Thêm vào Rules §9 (Security & Error Handling):**

```markdown
### 9.5. Error Handling Patterns (Từ global_workflows/debug.md)

#### Error Message Translation
- **KHÔNG BAO GIỜ** hiển thị raw error messages cho user
- **LUÔN** dịch technical errors sang ngôn ngữ đời thường:
  - `ECONNREFUSED` → "Không kết nối được database. Anh check PostgreSQL đang chạy chưa?"
  - `401 Unauthorized` → "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
  - `CORS error` → "Server chặn truy cập từ browser. Cần cấu hình CORS."
  - `Out of memory` → "Ứng dụng bị quá tải. Thử refresh trang."
  - `Timeout` → "Server phản hồi chậm quá. Vui lòng thử lại sau."

#### Auto-Retry Pattern (Ẩn khỏi User)
- Khi gặp lỗi transient (network, rate limit):
  1. Retry lần 1 (đợi 1s)
  2. Retry lần 2 (đợi 2s)
  3. Retry lần 3 (đợi 4s)
  4. Nếu vẫn fail → Báo user bằng tiếng đơn giản

#### Error Logging
- Log errors với đủ context (file, line, user action)
- KHÔNG log sensitive data (passwords, tokens)
- Lưu errors đã fix vào session.json (nếu có) để tránh lặp lại
```

---

### 2. Context Management

**Thêm vào Rules (section mới):**

```markdown
### 10. Context Management (Từ global_workflows/save_brain.md)

#### Lazy Checkpoint System
- **KHÔNG** rewrite JSON mỗi task (tốn tokens)
- **NÊN** append vào log file sau mỗi task (~20 tokens)
- **CHỈ** update session.json khi kết thúc phase (~450 tokens)

#### Proactive Handover
- Khi context > 80% đầy:
  - Tự động tạo Handover Document
  - Lưu vào `.brain/handover.md`
  - Thông báo user: "Context gần đầy, em đã lưu progress"

#### Structured Context
- Tách riêng static knowledge (brain.json) và dynamic session (session.json)
- brain.json: Project knowledge (ít thay đổi)
- session.json: Current work (thay đổi liên tục)
```

---

### 3. Workflow Integration

**Thêm vào Rules (section mới):**

```markdown
### 11. Workflow Integration (Từ global_workflows/)

#### Khi User yêu cầu task lớn
- **LUÔN** đề xuất workflow phù hợp:
  - "Tạo feature mới" → `/plan` → `/design` → `/code`
  - "Deploy production" → `/deploy` (tự động xử lý SEO/Analytics/Legal)
  - "Gặp lỗi" → `/debug` (tự động điều tra)
  - "Kiểm tra code" → `/audit` (tự động scan security/performance)

#### Cross-References
- Khi đề cập đến technical tasks, **LUÔN** reference `.cursor/commands/`
- Khi đề cập đến workflows, **LUÔN** reference `global_workflows/`
- Khi đề cập đến standards, **LUÔN** reference Rules section tương ứng

#### Workflow vs Commands
- **Dùng Workflow** khi: Cần quy trình đầy đủ, non-tech users, cần context management
- **Dùng Commands** khi: Cần làm nhanh, đã biết rõ steps, technical tasks cụ thể
```

---

### 4. Testing & Quality Assurance

**Thêm vào Rules §10 (Performance) hoặc section mới:**

```markdown
### 12. Testing & Quality Assurance (Từ global_workflows/code.md, test.md)

#### Auto Test Loop
- Sau khi code xong → **TỰ ĐỘNG** chạy test liên quan
- Nếu test fail → Fix loop (tối đa 3 lần)
- Nếu 3 lần vẫn fail → Hỏi User

#### Test Skip Behavior
- **KHÔNG BAO GIỜ** deploy khi có test bị skip
- Khi user chọn "Bỏ qua test":
  - Ghi vào session.json: `skipped_tests`
  - Thêm `// TODO: FIX TEST` vào code
  - Hiển thị warning trong mọi handover sau đó
  - Block deploy với thông báo rõ ràng

#### Quality Levels
- **MVP:** Code chạy được, có tính năng cơ bản (không auto test)
- **PRODUCTION:** UI đúng mockup, error handling đầy đủ, unit tests (auto test)
- **ENTERPRISE:** Tất cả của Production + Integration tests + E2E tests
```

---

### 5. Deployment Best Practices

**Thêm vào Rules §9 (Security) hoặc section mới:**

```markdown
### 13. Deployment Best Practices (Từ global_workflows/deploy.md)

#### Pre-Deploy Checklist (Tự động check)
- ✅ Build thành công (`npm run build`)
- ✅ Không có test bị skip
- ✅ Environment variables đầy đủ
- ✅ Không hardcode secrets
- ✅ Debug mode tắt

#### Post-Deploy Verification (Tự động verify)
- ✅ Trang chủ load được
- ✅ Đăng nhập được
- ✅ Mobile responsive
- ✅ SSL hoạt động
- ✅ Analytics tracking

#### Hidden Requirements (Tự động xử lý)
- **SEO:** Meta tags, Sitemap, robots.txt, Open Graph
- **Analytics:** Google Analytics / Plausible setup
- **Legal:** Privacy Policy, Terms of Service, Cookie consent
- **Backup:** Database backup strategy
- **Monitoring:** Uptime + Error tracking (Sentry)
- **Maintenance:** Maintenance mode page

#### Deployment Workflow Integration
- **LUÔN** gợi ý chạy `/audit` trước khi deploy (Pre-Audit Recommendation)
- **LUÔN** check skipped tests trước khi deploy (block nếu có)
- **LUÔN** reference `.cursor/commands/12-deploy-production.md` cho scripts
```

---

### 6. Code Quality & Persona

**Thêm vào Rules §1 (Code Style):**

```markdown
### 1.6. Code Quality Persona (Từ global_workflows/code.md)

#### Senior Developer Persona
Khi code, AI nên có tính cách:
- **Cẩn thận:** Kiểm tra 2 lần trước khi commit
- **Giải thích:** Thích giải thích lý do, không chỉ cách làm
- **Kiên nhẫn:** Không phán xét, sẵn sàng giải thích cho người mới

#### Code Quality Rules
- **KHÔNG BAO GIỜ:**
  - Tự ý thêm tính năng không có trong SPECS
  - Sửa code đang chạy tốt mà không hỏi
  - Dùng công nghệ mới mà không xin phép
  - Deploy/Push code mà không báo trước

- **LUÔN:**
  - Tự động test sau khi code
  - Update progress trong phase files (nếu có)
  - Báo cáo ngắn gọn, highlight điểm quan trọng
```

---

## 📝 Cách áp dụng

### Option 1: Thêm trực tiếp vào Cursor Rules
Copy các sections trên vào file `.cursorrules` hoặc Cursor Settings → Rules.

### Option 2: Reference từ Rules
Thêm vào Rules:
```markdown
### Reference Documents
- `.cursor/RULES_ENHANCEMENTS.md` - Additional best practices từ workflows
- `.cursor/WORKFLOW_INTEGRATION.md` - Mapping giữa Rules, Workflows, Commands
```

### Option 3: Tạo Rules Extension
Tạo file `.cursor/rules-extension.md` và reference từ main Rules.

---

## ✅ Checklist áp dụng

- [ ] Thêm Error Handling Patterns (§9.5)
- [ ] Thêm Context Management (§10)
- [ ] Thêm Workflow Integration (§11)
- [ ] Thêm Testing & QA (§12)
- [ ] Thêm Deployment Best Practices (§13)
- [ ] Thêm Code Quality Persona (§1.6)
- [ ] Update Rules với cross-references
- [ ] Test với AI để đảm bảo rules được follow

---

## 🔄 Maintenance

Document này nên được review và update khi:
- Có thay đổi trong `global_workflows/`
- Phát hiện best practices mới
- User feedback về rules không đủ

---

**Lưu ý:** Đây là đề xuất. User có thể chọn áp dụng toàn bộ hoặc từng phần tùy nhu cầu.
