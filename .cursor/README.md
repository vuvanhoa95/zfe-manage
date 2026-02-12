# Cursor Configuration - WebZfenix

Cấu hình Cursor IDE cho dự án WebZfenix - Website về BIM Services, Projects và Solutions.

## 📁 Cấu trúc

```
.cursor/
├── README.md                    # File này
├── QUICK_COMMANDS.md           # Quick reference commands
└── commands/                    # Chi tiết các commands
    ├── README.md
    ├── setup-database.md
    ├── generate-prisma-client.md
    ├── run-migrations.md
    ├── start-development.md
    ├── build-production.md
    ├── lint-code.md
    ├── open-prisma-studio.md
    ├── reset-database.md
    ├── export-docx-template.md
    └── deployment-checklist.md
```

## 🎯 Mục đích

Thư mục này chứa:
1. **Cursor Rules** (`.cursorrules` ở root): Quy tắc coding và best practices
2. **Commands**: Các commands hữu ích cho development và deployment
3. **Quick Reference**: Tổng hợp commands thường dùng

## 📖 Cách sử dụng

### 1. Cursor Rules (`.cursorrules`)

File `.cursorrules` ở root của workspace chứa các quy tắc mà Cursor AI sẽ follow khi:
- Generate code
- Suggest code changes
- Refactor code
- Answer questions về codebase

**Lưu ý**: Cursor sẽ tự động đọc file này, không cần cấu hình thêm.

### 2. Commands

Các file trong `.cursor/commands/` chứa hướng dẫn chi tiết về:
- Database operations
- Development workflows
- Deployment procedures
- Troubleshooting

**Cách sử dụng**:
- Đọc file `.md` để xem chi tiết
- Copy commands vào terminal
- Hoặc sử dụng Cursor Command Palette để tìm kiếm

### 3. Quick Commands

File `QUICK_COMMANDS.md` chứa tổng hợp các commands thường dùng nhất:
- Development commands
- Database commands
- Git commands
- Troubleshooting

## 🔧 Customization

### Thêm Rules mới

Chỉnh sửa file `.cursorrules` ở root để thêm:
- Coding conventions mới
- Best practices
- Project-specific rules

### Thêm Commands mới

1. Tạo file `.md` mới trong `.cursor/commands/`
2. Format theo template:
   ```markdown
   # Command Name
   
   ## Mô tả
   Mô tả ngắn gọn về command
   
   ## Command
   ```bash
   command here
   ```
   
   ## Lưu ý
   Các lưu ý quan trọng
   ```
3. Update `commands/README.md` để thêm vào danh sách

## 📚 Tài liệu liên quan

- **Project README**: `README.md`
- **GitHub Repository**: `https://github.com/vuvanhoa95/WebZfenix.git`

## 🆘 Troubleshooting

### Cursor không nhận rules

1. Đảm bảo file `.cursorrules` ở root của workspace
2. Restart Cursor IDE
3. Check Cursor settings để đảm bảo rules được enable

### Commands không hoạt động

1. Đảm bảo đang ở đúng directory (root của project `web/`)
2. Check Node.js và npm đã được cài đặt
3. Verify dependencies đã được install (`npm install`)

## 💡 Tips

1. **Sử dụng Cursor AI**: Nhờ Cursor AI giúp generate code theo rules đã định nghĩa
2. **Quick Commands**: Giữ `QUICK_COMMANDS.md` mở để copy commands nhanh
3. **Command Palette**: Sử dụng `Ctrl+Shift+P` để tìm commands trong Cursor
4. **Auto-complete**: Cursor sẽ suggest commands dựa trên context

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-28  
**Maintained by**: Development Team
