# 💡 BRIEF: Phase 2 - Smart Input Features

**Ngày tạo:** 2026-02-03
**Trạng thái:** Brainstorming

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT
Việc nhập liệu báo giá hiện tại vẫn tốn nhiều thời gian và công sức gõ phím. Đặc biệt khi đi gặp khách hàng, việc lưu thông tin liên hệ và tạo nhanh bản nháp báo giá bằng tay là một rào cản lớn.

## 2. GIẢI PHÁP ĐỀ XUẤT
Tận dụng công nghệ AI và trợ lý ảo để biến các thao tác nhập liệu thủ công thành các thao tác tự động/bằng giọng nói:
1. **Voice-to-Quotation**: Nhấn nút và nói nội dung dự án để AI tự động điền vào các trường tương ứng.
2. **Business Card Scanner**: Chụp ảnh danh thiếp để AI tự động trích xuất thông tin khách hàng và tạo bản ghi khách hàng mới.

## 3. ĐỐI TƯỢNG SỬ DỤNG
- **Nhân viên kinh doanh**: Đi gặp khách hàng trực tiếp, cần lưu thông tin nhanh.
- **Quản lý dự án**: Cần tạo nhanh khung báo giá khi đang trao đổi qua điện thoại hoặc họp.

## 4. NGHIÊN CỨU KỸ THUẬT
- **Voice Recognition**: Sử dụng Web Speech API (Free) hỗ trợ tốt tiếng Việt (`vi-VN`) trên Chrome/Edge.
- **Data Parsing**: Sử dụng GPT-4o-mini để chuyển văn bản thô từ giọng nói thành dữ liệu JSON cấu trúc (Project Name, Customer, Items, etc.).
- **OCR (Business Card)**: Sử dụng OpenAI Vision API (GPT-4o) để trích xuất thông tin từ ảnh chụp danh thiếp.

## 5. TÍNH NĂNG

### 🚀 MVP (Bắt buộc có):
- [ ] **Voice Button**: Nút micro trong Quotation Editor để bắt đầu ghi âm.
- [ ] **Voice-to-Form**: Tự động điền Tên dự án, Vị trí và Ghi chú từ giọng nói.
- [ ] **Scan Button**: Nút scan trong danh sách khách hàng.
- [ ] **Card OCR**: Trích xuất Tên, Công ty, Email, SĐT từ danh thiếp.

### 🎁 Phase 2 Plus (Làm sau):
- [ ] **Voice Commands**: "Thêm 3 nhân sự BIM Modeler", "Set chi phí hoa hồng 5%".
- [ ] **Multi-language support**: Nhận diện cả tiếng Anh và tiếng Việt trộn lẫn.

## 6. ƯỚC TÍNH SƠ BỘ
- **Độ phức tạp**: Trung bình (Cần xử lý mượt mà phần UI/UX và xử lý lỗi nhận diện).
- **Rủi ro**: Tiếng Việt vùng miền có thể ảnh hưởng đến độ chính xác của Web Speech API (Khắc phục bằng cách cho phép user sửa lại dữ liệu sau khi AI điền).

## 7. BƯỚC TIẾP THEO
→ Chạy `/plan` để lên thiết kế chi tiết các component `VoiceInput` và `BusinessCardScanner`.
