# Quick Setup Auto-Deploy

## Bước 1: Tạo repo trên GitHub
https://github.com/new
- Name: zfe-manage
- Private: Yes
- Không tích README/.gitignore

## Bước 2: Chạy lệnh này (thay YOUR_USERNAME):
```powershell
.\setup-auto-deploy.ps1 -GitHubRepo "https://github.com/YOUR_USERNAME/zfe-manage.git"
```

## Bước 3: Link Vercel
Vercel Dashboard → Settings → Git → Connect Git Repository → Chọn repo
