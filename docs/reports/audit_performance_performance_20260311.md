# Performance Audit Report - 2026-03-11

## Summary
- 🔴 Critical Performance Issues: 1 (Missing Indexes for Delete Operation)
- 🟡 Warnings: 1 (Bulk API Loading without Pagination)
- 🟢 Suggestions: 2 (Caching for License Lists, Selective Data Fetching)

## 🔴 Critical Issues (Nguy hiểm - Phải sửa ngay)
### 1. Thiếu chỉ mục (Index) trên bảng mã kích hoạt (RevitLicenseKey)
- **File:** `prisma/schema.prisma`
- **Nguy hại:** Khi thực hiện xóa User (Staff hoặc Khách Revit), lệnh `updateMany` tìm kiếm theo `usedBy`. Vì không có Index, Database phải thực hiện "Full Table Scan". Càng nhiều License Key, lệnh xóa càng chậm, có thể gây treo Database (DB Lock) trong vài giây.
- **Cách sửa:** Thêm `@@index([usedBy])` vào model `RevitLicenseKey`.

## 🟡 Warnings (Nên sửa)
### 1. Tải danh sách quá lớn (Legacy Bulk Loading)
- **File:** `app/api/users/route.ts` & `app/api/revit-users/route.ts`
- **Triệu chứng:** API đang tải 1000 hồ sơ cùng lúc kèm theo rất nhiều trường dữ liệu (Revit License info, v.v.).
- **Nguy hại:** Tốn băng thông (Bandwidth), làm UI bị giật lag khi render bảng lớn.
- **Cách sửa:** Chuyển sang dùng phân trang (Pagination) hoặc chỉ lấy các trường cần thiết khi hiển thị danh sách.

## 🟢 Suggestions (Đề xuất tối ưu)
### 1. Chỉ lấy những gì cần dùng
- Trong trang Revit License, khi lấy danh sách nhân sự có quyền Revit, nên lọc bớt những trường không cần thiết (như bankAccount, taxCode) để làm nhẹ gói tin API.

---
## Phác đồ điều trị đề xuất:
1. Thêm Index vào Database ngay.
2. Tối ưu lại API `findMany` để chỉ lấy 10-20 người/trang.
