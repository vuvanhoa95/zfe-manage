# 🚀 Hướng dẫn Setup Auto-Deploy với Vercel

## 📋 Tình trạng hiện tại

- ✅ **Deploy thủ công**: Đã deploy thành công lên Vercel
- ❌ **Auto-deploy**: Chưa được setup
- ✅ **Git repository**: Đã có Git local nhưng chưa có remote

## 🎯 Cách hoạt động của Auto-Deploy

Khi bạn **push code lên GitHub/GitLab**, Vercel sẽ **tự động**:
1. Detect changes
2. Build project
3. Deploy lên production

**Không cần chạy script deploy thủ công nữa!**

---

## 🔧 Setup Auto-Deploy (3 bước)

### Bước 1: Push code lên GitHub

```powershell
# 1. Tạo repository mới trên GitHub (nếu chưa có)
#    Vào: https://github.com/new
#    Tên: zfe-manage (hoặc tên bạn muốn)
#    Chọn: Private (khuyến nghị)

# 2. Thêm remote và push code
cd "E:\ZFENIX\Zfenix - Data\10.Code\07.Web_Zfenix BaoGia\ZfeManage"

# Thêm remote (thay YOUR_USERNAME và REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Commit các thay đổi hiện tại (nếu có)
git add .
git commit -m "Initial commit - Setup auto-deploy"

# Push lên GitHub
git push -u origin main
```

### Bước 2: Link GitHub với Vercel

1. Vào **Vercel Dashboard**: https://vercel.com/dashboard
2. Vào project **zfe-manage**
3. Vào **Settings** → **Git**
4. Click **Connect Git Repository**
5. Chọn **GitHub** và authorize
6. Chọn repository **zfe-manage** của bạn
7. Click **Connect**

### Bước 3: Cấu hình Auto-Deploy

Sau khi link Git, Vercel sẽ tự động:
- ✅ Deploy mỗi khi push lên `main` branch → **Production**
- ✅ Deploy mỗi khi tạo Pull Request → **Preview**

**Không cần làm gì thêm!**

---

## ✅ Sau khi setup xong

### Workflow mới:

```powershell
# 1. Chỉnh sửa code
# ... làm việc với code ...

# 2. Commit và push
git add .
git commit -m "Fix: Update feature X"
git push origin main

# 3. Vercel tự động deploy! 🎉
#    Không cần chạy script deploy nữa
```

### Kiểm tra deployment:

- Vào **Vercel Dashboard** → **Deployments**
- Sẽ thấy deployment mới tự động được tạo
- Click vào deployment để xem logs

---

## 🔄 Deploy Preview (cho Pull Requests)

Khi bạn tạo **Pull Request** trên GitHub:
- Vercel tự động tạo **Preview Deployment**
- URL preview sẽ được comment vào PR
- Test trước khi merge vào `main`

---

## ⚙️ Cấu hình nâng cao (Tùy chọn)

### Chỉ deploy khi có thay đổi ở thư mục cụ thể:

Tạo file `.vercelignore`:

```
# Chỉ deploy khi có thay đổi ở các thư mục này
!app/**
!components/**
!lib/**
!prisma/**
!public/**
```

### Deploy từ branch khác:

1. Vào **Vercel Dashboard** → **Settings** → **Git**
2. Chọn **Production Branch**: `main` (hoặc branch bạn muốn)
3. Save

### Environment Variables:

- Environment variables đã được set trên Vercel sẽ tự động được dùng khi deploy
- Không cần pull về local nữa

---

## 🆚 So sánh: Manual vs Auto-Deploy

| Feature | Manual Deploy | Auto-Deploy |
|---------|---------------|-------------|
| **Cách deploy** | Chạy script `deploy-production.ps1` | Push code lên Git |
| **Tốc độ** | Phải chờ script chạy | Tự động, nhanh hơn |
| **Preview** | Phải chạy với flag `-Preview` | Tự động cho mỗi PR |
| **Lịch sử** | Không track được | Track đầy đủ trên Vercel |
| **Rollback** | Khó | Dễ dàng trên Dashboard |

---

## 🐛 Troubleshooting

### Vercel không detect changes?

1. Kiểm tra Git remote đã đúng chưa:
   ```powershell
   git remote -v
   ```

2. Kiểm tra branch đang push:
   ```powershell
   git branch
   ```

3. Kiểm tra Vercel Dashboard → Settings → Git → Production Branch

### Build fail trên Vercel?

1. Xem build logs trên Vercel Dashboard
2. Kiểm tra Environment Variables đã đúng chưa
3. Kiểm tra `vercel.json` config

### Muốn deploy thủ công lại?

Vẫn có thể dùng script cũ:
```powershell
.\deploy-production.ps1 -SkipSeed
```

---

## 📚 Tài liệu tham khảo

- [Vercel Git Integration](https://vercel.com/docs/concepts/git)
- [Vercel Auto-Deploy](https://vercel.com/docs/deployments/overview)
- [GitHub Actions với Vercel](https://vercel.com/docs/concepts/git/vercel-for-github)

---

## ✅ Checklist Setup

- [ ] Tạo repository trên GitHub
- [ ] Push code lên GitHub
- [ ] Link GitHub với Vercel
- [ ] Test push code → Kiểm tra auto-deploy hoạt động
- [ ] (Tùy chọn) Tạo Pull Request → Test preview deployment

---

**👉 Khuyến nghị**: Setup auto-deploy để tiết kiệm thời gian và tránh quên deploy sau khi chỉnh sửa code!
