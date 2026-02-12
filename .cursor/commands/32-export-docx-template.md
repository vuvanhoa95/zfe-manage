# Export DOCX Template Guide

⚠️ **Lưu ý:** File này không phù hợp với dự án WebZfenix hiện tại. Dự án WebZfenix là website về BIM services, không có tính năng export DOCX quotations.

## Mô tả
File này được giữ lại từ template cũ. Nếu cần tính năng export trong tương lai, có thể tham khảo.

## Template Location
`quotation-app/templates/quotation-template.docx`

## Template Tags

### Simple Tags
- `{location}` - Địa điểm
- `{day}`, `{month}`, `{year}` - Ngày tháng năm
- `{title}` - Tiêu đề báo giá
- `{projectName}` - Tên dự án
- `{customerName}` - Tên khách hàng
- `{totalBeforeVat}` - Tổng trước VAT
- `{vatRate}` - Thuế suất VAT (%)
- `{vatAmount}` - Số tiền VAT
- `{totalAfterVat}` - Tổng sau VAT
- `{totalInWords}` - Tổng bằng chữ

### Loop Tags
```
{#lines}
{itemNo} | {title} | {qty} | {unit} | {unitPrice} | {total}
{/lines}

{#paymentMilestones}
{no}. {title}: {percent}%
{/paymentMilestones}
```

## Tạo Template

1. Tạo file Word với layout mong muốn
2. Thay thế các giá trị bằng template tags
3. Lưu file vào `templates/quotation-template.docx`
4. Template sẽ được sử dụng tự động khi export

## Lưu ý
- Template phải match với structure trong `lib/docx-generator.ts`
- Sử dụng docxtemplater syntax cho loops và conditionals
- Test template với sample data trước khi deploy
