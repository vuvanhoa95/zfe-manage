# Hướng dẫn tạo Template DOCX

## Vị trí file
Đặt file template tại: `templates/quotation-template.docx`

## Cấu trúc Template

### 1. HEADER (Tiêu đề)
```
Logo (nếu dùng dạng URL): {companyLogoUrl}
Slogan dự án: {projectSlogan}
{location}, ngày {day} tháng {month} năm {year}

BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM
{title}

{intro}
```

### 2. THÔNG TIN DỰ ÁN
```
Kính gửi: {customerName}
Địa chỉ: {customerAddress}
MST: {customerTaxCode}

Dự án: {projectName}
Hạng mục: {projectItem}
{projectNotes}
```

### 3. PHẠM VI CÔNG VIỆC
```
PHẠM VI CÔNG VIỆC

Bao gồm: {scope}
```

### 4. SẢN PHẨM BÀN GIAO
```
SẢN PHẨM BÀN GIAO VÀ NỘI DUNG THỰC HIỆN

{deliverables}
```

### 5. BẢNG ĐƠN GIÁ (Table format)

Tạo bảng với các cột:

| STT/Mã | NỘI DUNG CÔNG VIỆC | KHỐI LƯỢNG CV | ĐƠN VỊ | ĐƠN GIÁ (VNĐ) | THÀNH TIỀN (VNĐ) | GHI CHÚ |
|--------|-------------------|---------------|---------|---------------|------------------|---------|
| {#lines}{itemNo} | {title} | {qty} | {unit} | {unitPrice} | {total} | {note}{/lines} |

**Lưu ý**: 
- Dòng đầu tiên trong table là header
- Dòng thứ 2 chứa tag loop: `{#lines}...{/lines}`
- Các dòng group header sẽ có `isGroupHeader = true`, có thể format đậm

### 6. TỔNG CỘNG
```
Tổng cộng (chưa VAT):           {totalBeforeVat} VNĐ
VAT ({vatRate}%):                {vatAmount} VNĐ
───────────────────────────────────────────────
TỔNG CỘNG (đã VAT):             {totalAfterVat} VNĐ

Bằng chữ: {totalInWords}
```

### 7. TIẾN ĐỘ THỰC HIỆN
```
TIẾN ĐỘ THỰC HIỆN

{schedule}
```

### 8. TIẾN ĐỘ THANH TOÁN (Table)

| STT | NỘI DUNG | TỈ LỆ |
|-----|----------|-------|
| {#paymentMilestones}{no} | {title} | {percent}%{/paymentMilestones} |

### 9. CHỮ KÝ & LIÊN HỆ
```
Thay mặt
{companyName}

______________________
{signerName}
{signerTitle}


───────────────────────────────────────
THÔNG TIN LIÊN HỆ

{companyName}
Địa chỉ: {companyAddress}
MST: {companyTaxCode}
Email: {companyEmail}
Website: {companyWebsite}
Điện thoại: {companyPhone}

Số báo giá: {quotationNo}
```

## Styling Guidelines

### Font
- Tiêu đề chính: Arial, 16pt, Bold, Center
- Tiêu đề section: Arial, 14pt, Bold
- Nội dung: Arial, 12pt
- Table: Arial, 11pt

### Spacing
- Margin: 2cm (top/bottom/left/right)
- Line spacing: 1.15
- Space after paragraph: 6pt

### Colors
- Headers: Blue (#0066CC)
- Group headers in table: Light gray background (#F0F0F0)
- Text: Black
- Table borders: Gray (#CCCCCC)

### Table Formatting
- Border: 1pt solid gray
- Cell padding: 5pt
- Header row: Bold, background color
- Align numbers to right
- Align text to left

## Ví dụ Template Tags

### Loop qua lines:
```
{#lines}
{itemNo} | {title} | {qty} | {unit} | {unitPrice} | {total} | {note}
{/lines}
```

### Conditional (nếu cần):
```
{#projectNotes}
Ghi chú: {projectNotes}
{/projectNotes}
```

## Testing Template

1. Tạo file Word mới: `quotation-template.docx`
2. Copy cấu trúc trên vào file
3. Format theo styling guidelines
4. Lưu file vào folder `templates/`
5. Test bằng cách export một báo giá mẫu

## Tips

- **Không xóa tags**: Giữ nguyên các tags `{...}` trong template
- **Table loops**: Đảm bảo tags `{#lines}...{/lines}` nằm trong dòng table
- **Line breaks**: Docxtemplater tự động handle line breaks
- **HTML in deliverables**: HTML sẽ bị strip, chỉ giữ text
- **Numbers**: Đã được format với dấu phẩy (10,000,000)

## Sample Data để test

```json
{
  "location": "Hà Nội",
  "day": "28",
  "month": "01",
  "year": "2026",
  "title": "BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM",
  "projectName": "Tòa nhà văn phòng ABC",
  "customerName": "Công ty TNHH XYZ",
  "totalBeforeVat": "50,000,000",
  "vatRate": "8",
  "vatAmount": "4,000,000",
  "totalAfterVat": "54,000,000",
  "totalInWords": "Năm mươi bốn triệu đồng chẵn"
}
```
