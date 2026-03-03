# Phase 06: AI Customer Quick Lookup
**Status:** ⬜ Pending  
**Depends on:** Độc lập (có thể làm song song với Phase 02)  
**Estimated:** 1-2 sessions

---

## 🎯 Mục tiêu

Khi tạo/sửa **khách hàng**, Admin gõ tên công ty → AI tìm kiếm thông tin thực tế của công ty trên internet → Hiển thị **danh sách gợi ý** (dropdown) để chọn đúng → Tự động điền: Mã số thuế, Địa chỉ, Email, Website, SĐT.

Tránh nhầm lẫn khi có nhiều công ty tên giống nhau (VD: "Vingroup", "Vingroup JSC", "Tập đoàn Vingroup").

---

## 🖥️ UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Tên công ty: [Hòa Bình____________]                          │
│                ↓ Gõ > 3 ký tự → gọi API tìm kiếm          │
│              ┌──────────────────────────────────────┐       │
│              │ 🔍 Đang tìm kiếm...                  │       │
│              ├──────────────────────────────────────┤       │
│              │ ✅ CTCP Xây dựng Hòa Bình (HBC)      │       │
│              │    MST: 0301234567 • TP.HCM           │       │
│              ├──────────────────────────────────────┤       │
│              │ ✅ Tập đoàn Hòa Bình Holdings         │       │
│              │    MST: 0100234567 • Hà Nội           │       │
│              ├──────────────────────────────────────┤       │
│              │ ✅ Hòa Bình Minh - Nhà thầu cơ điện  │       │
│              │    MST: 0305678901 • Bình Dương       │       │
│              └──────────────────────────────────────┘       │
│ → Click chọn → Auto-fill toàn bộ form                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Requirements

### Functional
- [ ] Trigger tìm kiếm khi user gõ **≥ 3 ký tự** vào field "Tên công ty"
- [ ] Debounce 600ms để không spam API khi đang gõ nhanh
- [ ] Hiển thị **tối đa 5 gợi ý**, mỗi gợi ý có: Tên đầy đủ + MST + Địa chỉ tỉnh/thành
- [ ] Click vào gợi ý → **Auto-fill**: Tên, MST, Địa chỉ, Email, SĐT, Website (nếu tìm được)
- [ ] Badge "✨ AI" nhỏ cạnh các field được auto-fill (để admin biết dữ liệu từ AI, có thể sai)
- [ ] Vẫn có thể nhập thủ công bình thường (AI là optional)
- [ ] Nút "✕ Bỏ gợi ý" để tắt dropdown

### Non-Functional
- [ ] Debounce 600ms, cancel request cũ nếu gõ tiếp
- [ ] Loading spinner trong input khi đang tìm
- [ ] Nếu không tìm thấy → hiện "Không tìm thấy công ty nào. Nhập thủ công hoặc thử từ khóa khác."
- [ ] Cache kết quả theo keyword trong session (không gọi lại nếu đã tìm rồi)

---

## 🛠️ Implementation Steps

### Step 1: API Route — Company Lookup
- [ ] Tạo `app/api/ai/company-lookup/route.ts`
- [ ] Input: `{ query: string }` (tên công ty user đang gõ)
- [ ] Flow:
  1. GPT dịch query → search keywords tiếng Việt chuẩn
  2. Serper.dev search Google: `"[company name]" mã số thuế địa chỉ`
  3. GPT Vision/Text bóc tách thông tin từ search results
  4. Trả về array công ty với thông tin chuẩn hóa
- [ ] Output: `CompanyInfo[]`

### Step 2: Component — CompanyAutocomplete
- [ ] Tạo `components/customers/CompanyAutocomplete.tsx`
- [ ] Props: `value, onChange, onSelect(company: CompanyInfo)`
- [ ] Internal states: `query, suggestions, isLoading, isOpen`
- [ ] Dùng `useRef` + `useEffect` để handle click-outside đóng dropdown
- [ ] Keyboard navigation: ↑↓ để di chuyển trong dropdown, Enter để chọn

### Step 3: Tích hợp vào Customer Form
- [ ] `app/(dashboard)/customers/new/page.tsx` — thay `<input>` tên công ty = `<CompanyAutocomplete>`
- [ ] `app/(dashboard)/customers/[id]/edit/page.tsx` — tương tự
- [ ] Khi `onSelect`: auto-fill các fields: `name, taxCode, address, phone, email, website`
- [ ] Hiển thị AI badge nhỏ cạnh các field được fill tự động

---

## 📁 Files to Create/Modify

- `app/api/ai/company-lookup/route.ts` ← **TẠO MỚI**
- `components/customers/CompanyAutocomplete.tsx` ← **TẠO MỚI**
- `app/(dashboard)/customers/new/page.tsx` ← **SỬA**
- `app/(dashboard)/customers/[id]/edit/page.tsx` ← **SỬA** (nếu có)

---

## 📐 API Response Schema

```typescript
interface CompanyInfo {
    name: string;           // Tên đầy đủ (theo đăng ký kinh doanh)
    shortName?: string;     // Tên viết tắt / thương hiệu
    taxCode?: string;       // Mã số thuế (10 hoặc 13 số)
    address?: string;       // Địa chỉ đăng ký
    province?: string;      // Tỉnh/Thành phố (để hiện trong dropdown)
    phone?: string;         // SĐT công ty
    email?: string;         // Email công ty
    website?: string;       // Website
    confidence: number;     // 0-1, độ tin cậy của thông tin
    source?: string;        // Nguồn: "dangkykinhdoanh.gov.vn" / "Google" / ...
}
```

---

## 💡 Search Strategy (Quan trọng)

### Nguồn dữ liệu ưu tiên:
```
1. dangkykinhdoanh.gov.vn  ← Chính xác nhất (cơ quan nhà nước)
2. tracuunnt.gdt.gov.vn     ← Tra cứu MST (Tổng cục thuế)
3. Google search results    ← Fallback khi 2 nguồn trên không có
```

### Search query AI sẽ dùng:
```
"{company name}" site:dangkykinhdoanh.gov.vn OR mã số thuế địa chỉ
```

### Xử lý ambiguity:
- Nếu AI tìm được **1 kết quả** khớp hoàn toàn → Hiện 1 option với badge "Chắc chắn"
- Nếu **2-5 kết quả** → Hiện danh sách lựa chọn có province để phân biệt
- Nếu **> 5 kết quả** → Chỉ lấy 5 kết quả phù hợp nhất

---

## 🧪 Test Criteria

- [ ] Gõ "Vinh Hoa" → Hiện ít nhất 2-3 công ty khác tên để chọn
- [ ] Gõ "Vingroup" → Hiện đúng "Tập đoàn Vingroup - Công ty CP" với MST 0101245486
- [ ] Chọn option → Form auto-fill đầy đủ, không bị ghi đè khi user đang edit
- [ ] Gõ "xyz123abc" → Hiện thông báo không tìm thấy, form vẫn nhập bình thường
- [ ] Debounce: gõ nhanh 5 ký tự → chỉ gọi API 1 lần (sau khi dừng 600ms)
- [ ] AI badge "✨" hiện cạnh các field được auto-fill, biến mất khi user tự sửa

---

## ⚠️ Lưu ý triển khai

> **Thông tin từ AI có thể không 100% chính xác** (địa chỉ, email). Badge "✨ AI" giúp admin biết để xác nhận lại trước khi lưu. Đây là tính năng **hỗ trợ nhập nhanh**, không phải nguồn dữ liệu chính thức.

> **API cost:** Dùng `gpt-4o-mini` + Serper.dev. Mỗi lần gõ debounced = 1 Serper credit + ~500 tokens GPT. Ổn với free tier.

---

Next Phase: Tất cả phases hoàn thành → `/deploy`
