# Hướng dẫn áp dụng Design System cho toàn bộ trang

## 🎯 Mục tiêu
Áp dụng design system Tech Premium v2.0 cho tất cả 14 trang trong ứng dụng ZFENIX Manage.

---

## ✅ Đã hoàn thành

### 1. **Components tái sử dụng**
- ✅ `components/ui/PageHeader.tsx` - Header component với glassmorphism
- ✅ `components/ui/ContentCard.tsx` - Card component với premium styling
- ✅ `app/globals.css` - Design system CSS với utilities
- ✅ `app/(dashboard)/page.tsx` - Dashboard đã áp dụng design mới

### 2. **Design System**
- ✅ Glassmorphism effects
- ✅ Gradient accents
- ✅ Premium shadows
- ✅ Micro-animations
- ✅ Responsive utilities

---

## 📋 Danh sách trang cần áp dụng

### Đã áp dụng (1/14):
1. ✅ `(dashboard)/page.tsx` - Dashboard

### Cần áp dụng (13/14):
2. ⏳ `(dashboard)/quotations/page.tsx` - Danh sách báo giá
3. ⏳ `(dashboard)/quotations/new/page.tsx` - Tạo báo giá mới
4. ⏳ `(dashboard)/quotations/[id]/edit/page.tsx` - Sửa báo giá
5. ⏳ `(dashboard)/quotations/[id]/versions/page.tsx` - Lịch sử phiên bản
6. ⏳ `(dashboard)/quotations/quick-form/page.tsx` - Form nhanh
7. ⏳ `(dashboard)/customers/page.tsx` - Danh sách khách hàng
8. ⏳ `(dashboard)/projects/page.tsx` - Danh sách dự án
9. ⏳ `(dashboard)/projects/new/page.tsx` - Tạo dự án mới
10. ⏳ `(dashboard)/projects/[id]/page.tsx` - Chi tiết dự án
11. ⏳ `(dashboard)/outsourcing-staff/page.tsx` - Nhân sự outsource
12. ⏳ `(dashboard)/company-profile/page.tsx` - Hồ sơ công ty
13. ⏳ `(dashboard)/reports/page.tsx` - Báo cáo
14. ⏳ `(dashboard)/settings/page.tsx` - Cài đặt

---

## 🔧 Cách áp dụng cho mỗi trang

### **Pattern 1: Trang danh sách (List Pages)**
Áp dụng cho: Quotations, Customers, Projects, Outsourcing Staff

```tsx
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';
import Link from 'next/link';

export default function ListPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header với icon và action button */}
      <PageHeader
        title="Tên trang"
        description="Mô tả ngắn gọn"
        icon="📄"  // Emoji phù hợp
        actions={
          <Link href="/path/new" className="btn-premium">
            ➕ Tạo mới
          </Link>
        }
      />

      {/* Content card chứa filters và table */}
      <ContentCard>
        {/* Search & Filters */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <input
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm min-w-[280px] focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent transition-all"
            placeholder="🔍 Tìm kiếm..."
          />
          <select className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent transition-all">
            <option>Lọc...</option>
          </select>
        </div>

        {/* Table với premium styling */}
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Column 1</th>
                {/* ... */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {/* Rows với hover effect */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">Data</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600 pt-4">
            <div className="font-medium">Trang {page} / {totalPages}</div>
            <div className="inline-flex gap-2">
              <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-zf-accent transition-all font-medium">
                ← Trước
              </button>
              <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-zf-accent transition-all font-medium">
                Sau →
              </button>
            </div>
          </div>
        )}
      </ContentCard>
    </div>
  );
}
```

### **Pattern 2: Trang form (Form Pages)**
Áp dụng cho: New Quotation, Edit Quotation, New Project, Settings

```tsx
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';

export default function FormPage() {
  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Tạo/Sửa"
        description="Mô tả"
        icon="✏️"
      />

      <ContentCard>
        <form className="space-y-6">
          {/* Form sections */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Label
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-zf-accent focus:border-transparent transition-all"
              placeholder="Nhập..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button type="submit" className="btn-premium">
              💾 Lưu
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all font-medium"
            >
              ❌ Hủy
            </button>
          </div>
        </form>
      </ContentCard>
    </div>
  );
}
```

### **Pattern 3: Trang chi tiết (Detail Pages)**
Áp dụng cho: Project Detail, Quotation Versions

```tsx
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';

export default function DetailPage() {
  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Chi tiết"
        description="Thông tin chi tiết"
        icon="📋"
        actions={
          <div className="flex gap-2">
            <button className="btn-premium">✏️ Sửa</button>
            <button className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all font-medium">
              🗑️ Xóa
            </button>
          </div>
        }
      />

      {/* Multiple content cards */}
      <ContentCard>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Section 1</h2>
        {/* Content */}
      </ContentCard>

      <ContentCard>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Section 2</h2>
        {/* Content */}
      </ContentCard>
    </div>
  );
}
```

---

## 🎨 CSS Classes quan trọng

### Layout
```css
.p-8                    /* Padding cho page */
.space-y-6              /* Spacing giữa sections */
```

### Inputs & Selects
```css
.px-4 .py-2.5           /* Padding */
.rounded-xl             /* Border radius */
.border .border-gray-200 /* Border */
.focus:ring-2 .focus:ring-zf-accent /* Focus state */
.transition-all         /* Smooth transitions */
```

### Buttons
```css
.btn-premium            /* Primary button (gradient) */
.px-4 .py-2.5 .rounded-xl .border /* Secondary button base */
.hover:bg-gray-50       /* Hover state */
```

### Tables
```css
.bg-gradient-to-r .from-gray-50 .to-gray-100  /* Header gradient */
.hover:bg-gray-50 .transition-colors          /* Row hover */
.divide-y .divide-gray-100                    /* Row dividers */
```

### Cards
```css
.card-premium           /* Auto hover effect */
.stat-card              /* Dashboard stats */
.glass-card             /* Glassmorphism */
```

---

## 🚀 Quy trình áp dụng nhanh

### Bước 1: Import components
```tsx
import PageHeader from '@/components/ui/PageHeader';
import ContentCard from '@/components/ui/ContentCard';
```

### Bước 2: Wrap content
```tsx
<div className="p-8 space-y-6">
  <PageHeader ... />
  <ContentCard>
    {/* Existing content */}
  </ContentCard>
</div>
```

### Bước 3: Update styles
- Replace `bg-white rounded-xl shadow-sm` → Đã có trong `ContentCard`
- Replace `border-gray-300` → `border-gray-200`
- Replace `rounded-lg` → `rounded-xl`
- Add `transition-all` cho interactive elements
- Add `hover:border-zf-accent` cho inputs/buttons

### Bước 4: Update colors
- Replace `blue-500` → `zf-accent`
- Replace `blue-600` → `zf-accent-dark`
- Replace `gray-50` → Keep (neutral)

---

## 📊 Icon suggestions

| Trang | Icon |
|-------|------|
| Dashboard | 🏠 hoặc logo |
| Quotations | 📄 |
| Customers | 👥 |
| Projects | 📁 |
| Outsourcing Staff | 👨‍💼 |
| Company Profile | 🏢 |
| Reports | 📊 |
| Settings | ⚙️ |
| New/Create | ➕ |
| Edit | ✏️ |
| Delete | 🗑️ |
| Save | 💾 |
| Cancel | ❌ |

---

## ⚡ Quick wins (Áp dụng nhanh nhất)

### 1. Settings page (Đơn giản nhất)
- Chỉ cần wrap form trong ContentCard
- Add PageHeader
- Update button styles

### 2. Company Profile
- Static content, ít logic
- Dễ test

### 3. Reports
- Mostly charts, ít interaction
- Focus vào card styling

---

## 🔄 Testing checklist

Sau khi áp dụng cho mỗi trang:
- [ ] PageHeader hiển thị đúng
- [ ] ContentCard có shadow và hover effect
- [ ] Inputs có focus ring màu zf-accent
- [ ] Buttons có hover effect
- [ ] Table rows có hover background
- [ ] Responsive trên mobile
- [ ] No console errors

---

## 📝 Notes

- **Không cần thay đổi logic** - Chỉ update UI/styling
- **Giữ nguyên functionality** - Tất cả features hoạt động như cũ
- **Progressive enhancement** - Áp dụng từng trang, test kỹ
- **Reuse components** - Dùng PageHeader và ContentCard ở mọi nơi có thể

---

**Version**: 1.0  
**Last Updated**: 2026-02-01  
**Author**: Antigravity Creative Director
