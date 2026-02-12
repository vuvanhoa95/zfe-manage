# Cursor Commands - WebZfenix

Tập hợp các commands hữu ích cho việc phát triển và triển khai dự án.

> 💡 **AWF Integration:** Các commands AWF (01-29) có rule tương ứng trong `.cursor/rules/awf-*.mdc`

---

## 📋 Danh sách Commands (theo thứ tự triển khai)

### 🏁 Phase 1: Khởi tạo dự án
| # | Command | Mô tả |
|---|---------|--------|
| 01 | `init-project` | ✨ Khởi tạo dự án mới |
| 02 | `brainstorm-ideas` | 💡 Brainstorm & research ý tưởng |

### 📝 Phase 2: Kế hoạch & Thiết kế
| # | Command | Mô tả |
|---|---------|--------|
| 03 | `plan-features` | 📋 Lên kế hoạch tính năng |
| 04 | `design-technical` | 🎨 Thiết kế kỹ thuật (DB, API, Flow) |
| 05 | `visualize-ui-ux` | 🖼️ Thiết kế UI/UX mockup |

### 🗄️ Phase 3: Database Setup
| # | Command | Mô tả |
|---|---------|--------|
| 06 | `setup-database` | Setup và khởi tạo database |
| 07 | `generate-prisma` | Generate Prisma Client |
| 08 | `run-migrations` | Chạy database migrations |

### 💻 Phase 4: Development
| # | Command | Mô tả |
|---|---------|--------|
| 09 | `code-implement` | 💻 Viết code theo Spec |
| 10 | `start-dev-server` | Khởi động dev server |
| 11 | `run-application` | ▶️ Chạy ứng dụng (auto-detect) |
| 12 | `preview-localhost` | Mở trình duyệt preview |

### 🧪 Phase 5: Quality
| # | Command | Mô tả |
|---|---------|--------|
| 13 | `debug-fix-errors` | 🐛 Tìm và sửa lỗi |
| 14 | `test-application` | ✅ Kiểm thử ứng dụng |
| 15 | `lint-code` | Chạy ESLint |
| 16 | `refactor-code` | 🔧 Dọn dẹp & tối ưu code |

### 🔍 Phase 6: Review & Audit
| # | Command | Mô tả |
|---|---------|--------|
| 17 | `audit-security` | 🔒 Kiểm tra bảo mật + commands |
| 18 | `review-project` | 👀 Tổng quan & bàn giao dự án |

### 🚀 Phase 7: Build & Deploy
| # | Command | Mô tả |
|---|---------|--------|
| 19 | `build-production` | Build cho production |
| 20 | `deployment-checklist` | Checklist trước khi deploy |
| 21 | `commit-changes` | Commit changes vào Git |
| 22 | `deploy-production` | 🚀 Deploy lên production |

### 🧠 Phase 8: Quản lý & Bảo trì
| # | Command | Mô tả |
|---|---------|--------|
| 23 | `recap-context` | 📖 Khôi phục ngữ cảnh |
| 24 | `save-brain` | 💾 Lưu kiến thức dự án |
| 25 | `next-steps` | ➡️ Gợi ý bước tiếp theo |
| 26 | `rollback-recovery` | ⏪ Quay lại phiên bản cũ |

### ⚙️ Phase 9: Tiện ích
| # | Command | Mô tả |
|---|---------|--------|
| 27 | `help-guide` | ❓ Trợ giúp & hướng dẫn |
| 28 | `customize-ai` | ⚙️ Cá nhân hóa AI |
| 29 | `awf-update` | 📦 Cập nhật AWF |
| 30 | `prisma-studio` | Mở Prisma Studio GUI |
| 31 | `reset-database` | Reset database (⚠️ dev only) |
| 32 | `export-docx-template` | Xuất template DOCX |

---

## 🚀 Cách sử dụng

1. Mở Cursor Chat
2. Gõ `/` → chọn command từ danh sách
3. Cursor AI sẽ thực hiện theo workflow tương ứng

## 📝 Thêm Commands mới

Tạo file `.md` mới: `[số]-[tên-command].md` trong `.cursor/commands/`

---

**Lưu ý**: Một số commands có thể cần điều chỉnh dựa trên environment và setup cụ thể của bạn.
