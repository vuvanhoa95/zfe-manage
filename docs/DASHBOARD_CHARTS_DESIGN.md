# 🎨 DESIGN: Dashboard Charts Redesign - Tech Premium

**Ngày tạo:** 2026-02-01  
**Version:** 2.0  
**Dựa trên:** Design System v2.0

---

## 📊 **MỤC TIÊU THIẾT KẾ**

### **Vấn đề hiện tại:**
- ❌ Biểu đồ đơn giản, thiếu điểm nhấn
- ❌ Không có glassmorphism effects
- ❌ Thiếu animations và interactions
- ❌ Layout cơ bản, không tận dụng không gian

### **Mục tiêu mới:**
- ✅ **Tech Premium aesthetic** - Glassmorphism, gradients
- ✅ **Interactive charts** - Hover effects, tooltips
- ✅ **Smooth animations** - Fade in, draw animations
- ✅ **Modern layout** - 2x2 grid, balanced spacing
- ✅ **Better data visualization** - Donut chart, area chart

---

## 🎨 **THIẾT KẾ CHI TIẾT**

### **1. Layout Grid (2x2)**

```
┌─────────────────────────────────────────────────────────┐
│  Tab: Biểu đồ                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │ 📈 Doanh thu &       │  │ 📊 Số lượng          │   │
│  │    Lợi nhuận         │  │    Báo giá           │   │
│  │                      │  │                      │   │
│  │  Line Chart          │  │  Bar Chart           │   │
│  │  (Gradient fill)     │  │  (Gradient bars)     │   │
│  └──────────────────────┘  └──────────────────────┘   │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │ 🎯 Phân bổ           │  │ 📈 Tăng trưởng       │   │
│  │    Chi phí           │  │                      │   │
│  │                      │  │                      │   │
│  │  Donut Chart         │  │  Area Chart          │   │
│  │  (Center stats)      │  │  (Growth %)          │   │
│  └──────────────────────┘  └──────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Grid CSS:**
```css
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 24px;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 📈 **BIỂU ĐỒ 1: DOANH THU & LỢI NHUẬN**

### **Loại:** Line Chart (Recharts)
### **Dữ liệu:** Monthly revenue & profit

### **Design Specs:**

```tsx
<LineChart data={monthlyData}>
  <defs>
    {/* Revenue Gradient */}
    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#178AF3" stopOpacity={0.8}/>
      <stop offset="100%" stopColor="#178AF3" stopOpacity={0.1}/>
    </linearGradient>
    
    {/* Profit Gradient */}
    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
      <stop offset="100%" stopColor="#10B981" stopOpacity={0.1}/>
    </linearGradient>
  </defs>
  
  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
  <XAxis dataKey="month" stroke="#6B7280" />
  <YAxis stroke="#6B7280" />
  
  <Tooltip 
    contentStyle={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(5,54,99,0.1)',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
    }}
  />
  
  <Legend 
    wrapperStyle={{
      paddingTop: '20px'
    }}
  />
  
  {/* Revenue Line */}
  <Line 
    type="monotone" 
    dataKey="revenue" 
    stroke="#178AF3"
    strokeWidth={3}
    fill="url(#revenueGradient)"
    dot={{ fill: '#178AF3', r: 5 }}
    activeDot={{ r: 7 }}
    animationDuration={800}
    animationEasing="ease-in-out"
  />
  
  {/* Profit Line */}
  <Line 
    type="monotone" 
    dataKey="profit" 
    stroke="#10B981"
    strokeWidth={3}
    fill="url(#profitGradient)"
    dot={{ fill: '#10B981', r: 5 }}
    activeDot={{ r: 7 }}
    animationDuration={800}
    animationEasing="ease-in-out"
  />
</LineChart>
```

### **Features:**
- ✅ Smooth curves (type="monotone")
- ✅ Gradient fill dưới đường
- ✅ Interactive dots on hover
- ✅ Glassmorphism tooltip
- ✅ Animated on load (800ms)
- ✅ Legend có toggle on/off

---

## 📊 **BIỂU ĐỒ 2: SỐ LƯỢNG BÁO GIÁ**

### **Loại:** Bar Chart (Recharts)
### **Dữ liệu:** Monthly quotation count

### **Design Specs:**

```tsx
<BarChart data={quotationData}>
  <defs>
    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
      <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.8}/>
    </linearGradient>
  </defs>
  
  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
  <XAxis dataKey="month" stroke="#6B7280" />
  <YAxis stroke="#6B7280" />
  
  <Tooltip 
    contentStyle={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(5,54,99,0.1)',
      borderRadius: '12px'
    }}
  />
  
  <Bar 
    dataKey="count" 
    fill="url(#barGradient)"
    radius={[8, 8, 0, 0]}
    animationDuration={800}
    animationEasing="ease-in-out"
  >
    <LabelList 
      dataKey="count" 
      position="top" 
      style={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
    />
  </Bar>
</BarChart>
```

### **Features:**
- ✅ Gradient bars (purple)
- ✅ Rounded top corners
- ✅ Value labels on top
- ✅ Hover scale effect
- ✅ Stagger animation

---

## 🎯 **BIỂU ĐỒ 3: PHÂN BỔ CHI PHÍ**

### **Loại:** Donut Chart (Recharts PieChart)
### **Dữ liệu:** Cost breakdown by category

### **Design Specs:**

```tsx
<PieChart>
  <defs>
    <linearGradient id="outsourceGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#F59E0B"/>
      <stop offset="100%" stopColor="#FBBF24"/>
    </linearGradient>
    <linearGradient id="commissionGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#3B82F6"/>
      <stop offset="100%" stopColor="#60A5FA"/>
    </linearGradient>
    <linearGradient id="taxGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#EF4444"/>
      <stop offset="100%" stopColor="#F87171"/>
    </linearGradient>
  </defs>
  
  <Pie
    data={costData}
    cx="50%"
    cy="50%"
    innerRadius={80}
    outerRadius={120}
    paddingAngle={5}
    dataKey="value"
    animationDuration={800}
    animationEasing="ease-in-out"
  >
    {costData.map((entry, index) => (
      <Cell 
        key={`cell-${index}`} 
        fill={`url(#${entry.gradientId})`}
      />
    ))}
  </Pie>
  
  <Tooltip 
    contentStyle={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px'
    }}
  />
  
  <Legend 
    verticalAlign="bottom" 
    height={36}
  />
</PieChart>

{/* Center Label */}
<div className="absolute inset-0 flex items-center justify-center">
  <div className="text-center">
    <p className="text-3xl font-bold text-gray-900">100%</p>
    <p className="text-sm text-gray-500">Tổng</p>
  </div>
</div>
```

### **Features:**
- ✅ Donut shape (innerRadius)
- ✅ Gradient colors per segment
- ✅ Center statistics display
- ✅ Interactive: Click to highlight
- ✅ Padding between segments
- ✅ Smooth rotation animation

### **Data Structure:**
```tsx
const costData = [
  { 
    name: 'Outsource', 
    value: 45, 
    gradientId: 'outsourceGradient',
    color: '#F59E0B'
  },
  { 
    name: 'Hoa hồng', 
    value: 35, 
    gradientId: 'commissionGradient',
    color: '#3B82F6'
  },
  { 
    name: 'Thuế', 
    value: 20, 
    gradientId: 'taxGradient',
    color: '#EF4444'
  }
];
```

---

## 📈 **BIỂU ĐỒ 4: TĂNG TRƯỞNG (MỚI)**

### **Loại:** Area Chart (Recharts)
### **Dữ liệu:** Growth trend over quarters

### **Design Specs:**

```tsx
<AreaChart data={growthData}>
  <defs>
    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#178AF3" stopOpacity={0.8}/>
      <stop offset="100%" stopColor="#178AF3" stopOpacity={0.1}/>
    </linearGradient>
  </defs>
  
  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
  <XAxis dataKey="quarter" stroke="#6B7280" />
  <YAxis stroke="#6B7280" />
  
  <Tooltip 
    contentStyle={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px'
    }}
  />
  
  <Area 
    type="monotone" 
    dataKey="value" 
    stroke="#178AF3"
    strokeWidth={3}
    fill="url(#growthGradient)"
    animationDuration={800}
    animationEasing="ease-in-out"
  />
</AreaChart>

{/* Growth Indicator */}
<div className="absolute top-4 right-4">
  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
    <span className="text-2xl font-bold text-emerald-600">+120%</span>
    <span className="text-emerald-600">↑</span>
  </div>
  <p className="text-xs text-gray-500 mt-1">So với quý trước</p>
</div>
```

### **Features:**
- ✅ Smooth area fill
- ✅ Gradient ocean blue
- ✅ Growth percentage badge
- ✅ Trend line overlay
- ✅ Comparison indicator

---

## 🎨 **CARD STYLING**

### **Base Card:**

```css
.chart-card {
  position: relative;
  background: linear-gradient(
    135deg, 
    rgba(255,255,255,0.9) 0%, 
    rgba(255,255,255,0.7) 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(5, 54, 99, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(5, 54, 99, 0.15);
}
```

### **Card Header:**

```tsx
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zf-accent to-zf-accent-light flex items-center justify-center">
      <span className="text-xl">📈</span>
    </div>
    <h3 className="text-lg font-bold text-gray-900">
      Doanh thu & Lợi nhuận theo tháng
    </h3>
  </div>
  
  {/* Optional: Time range selector */}
  <select className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
    <option>12 tháng</option>
    <option>6 tháng</option>
    <option>3 tháng</option>
  </select>
</div>
```

---

## 🎨 **COLOR PALETTE**

```css
/* Primary Charts */
--chart-revenue: #178AF3;        /* Blue */
--chart-profit: #10B981;         /* Emerald */
--chart-quotations: #8B5CF6;     /* Purple */
--chart-growth: #178AF3;         /* Blue */

/* Cost Breakdown */
--chart-outsource: #F59E0B;      /* Amber */
--chart-commission: #3B82F6;     /* Blue */
--chart-tax: #EF4444;            /* Red */

/* Gradients */
--gradient-revenue: linear-gradient(180deg, #178AF3 0%, rgba(23,138,243,0.1) 100%);
--gradient-profit: linear-gradient(180deg, #10B981 0%, rgba(16,185,129,0.1) 100%);
--gradient-bar: linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%);
```

---

## 📱 **RESPONSIVE DESIGN**

### **Desktop (> 1024px):**
```css
.charts-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
```

### **Tablet (768px - 1024px):**
```css
.charts-grid {
  grid-template-columns: 1fr;
  gap: 20px;
}

.chart-card {
  padding: 20px;
}
```

### **Mobile (< 768px):**
```css
.charts-grid {
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 16px;
}

.chart-card {
  padding: 16px;
  border-radius: 16px;
}

/* Smaller chart heights */
.recharts-wrapper {
  height: 250px !important;
}
```

---

## ⚡ **ANIMATIONS**

### **On Load:**
```tsx
// Stagger animation for cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

<motion.div
  custom={index}
  initial="hidden"
  animate="visible"
  variants={cardVariants}
  className="chart-card"
>
  {/* Chart content */}
</motion.div>
```

### **Chart Animations:**
```tsx
// All charts
animationDuration={800}
animationEasing="ease-in-out"

// Stagger for bars
animationBegin={index * 50}
```

---

## 🎯 **INTERACTIONS**

### **Hover States:**
- ✅ Card: Lift + enhanced shadow
- ✅ Chart dots: Scale up
- ✅ Bars: Slight scale
- ✅ Pie segments: Pop out effect
- ✅ Tooltips: Glassmorphism background

### **Click Actions:**
- ✅ Legend items: Toggle data series
- ✅ Pie segments: Highlight + show details
- ✅ Time range selector: Reload data

---

## 📊 **DATA STRUCTURE**

### **Monthly Revenue & Profit:**
```tsx
interface MonthlyData {
  month: string;
  revenue: number;
  profit: number;
}

const monthlyData: MonthlyData[] = [
  { month: 'T1', revenue: 150000000, profit: 45000000 },
  { month: 'T2', revenue: 180000000, profit: 54000000 },
  // ...
];
```

### **Quotation Count:**
```tsx
interface QuotationData {
  month: string;
  count: number;
}

const quotationData: QuotationData[] = [
  { month: 'T1', count: 12 },
  { month: 'T2', count: 15 },
  // ...
];
```

### **Cost Breakdown:**
```tsx
interface CostData {
  name: string;
  value: number;
  color: string;
  gradientId: string;
}

const costData: CostData[] = [
  { name: 'Outsource', value: 45, color: '#F59E0B', gradientId: 'outsourceGradient' },
  { name: 'Hoa hồng', value: 35, color: '#3B82F6', gradientId: 'commissionGradient' },
  { name: 'Thuế', value: 20, color: '#EF4444', gradientId: 'taxGradient' }
];
```

---

## ✅ **ACCEPTANCE CRITERIA**

### **Visual:**
- [ ] All charts use glassmorphism cards
- [ ] Gradients applied correctly
- [ ] Smooth animations on load
- [ ] Hover effects work
- [ ] Tooltips have glassmorphism background
- [ ] Responsive on all screen sizes

### **Functional:**
- [ ] Charts load data correctly
- [ ] Legend toggles work
- [ ] Tooltips show accurate data
- [ ] Time range selector updates data
- [ ] No performance issues

### **Accessibility:**
- [ ] Charts have proper ARIA labels
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## 🚀 **IMPLEMENTATION PLAN**

### **Phase 1: Setup**
1. Install Recharts (if not installed)
2. Create chart components folder
3. Setup gradient definitions

### **Phase 2: Build Charts**
1. LineChart component (Revenue & Profit)
2. BarChart component (Quotations)
3. DonutChart component (Cost breakdown)
4. AreaChart component (Growth)

### **Phase 3: Integration**
1. Update Dashboard page
2. Replace old charts tab
3. Add animations
4. Test responsiveness

### **Phase 4: Polish**
1. Fine-tune animations
2. Optimize performance
3. Add loading states
4. Cross-browser testing

---

## 📝 **NOTES**

- **Recharts version:** Use latest stable (2.x)
- **Performance:** Use `ResponsiveContainer` for all charts
- **Data fetching:** Implement loading skeletons
- **Error handling:** Show fallback UI if data fails
- **Caching:** Cache chart data for 5 minutes

---

**Version:** 1.0  
**Created by:** Antigravity Creative Director  
**Date:** 2026-02-01
