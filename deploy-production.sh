#!/bin/bash
# Deploy Production Script cho ZfeManage
# Usage: ./deploy-production.sh [--skip-build] [--skip-seed] [--preview]

set -e

SKIP_BUILD=false
SKIP_SEED=false
PREVIEW=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-seed)
            SKIP_SEED=true
            shift
            ;;
        --preview)
            PREVIEW=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🚀 Bắt đầu deploy production cho ZfeManage"
echo ""

# Bước 0: Kiểm tra prerequisites
echo "📋 Bước 0: Kiểm tra prerequisites..."
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI chưa được cài đặt. Chạy: npm i -g vercel"
    exit 1
fi
echo "✅ Vercel CLI đã được cài đặt"

if ! vercel whoami &> /dev/null; then
    echo "❌ Chưa login vào Vercel. Chạy: vercel login"
    exit 1
fi
echo "✅ Đã login vào Vercel"

if [ ! -d ".vercel" ]; then
    echo "⚠️  Project chưa được link với Vercel. Đang link..."
    vercel link
fi

# Bước 1: Pull environment variables
echo ""
echo "📥 Bước 1: Pull environment variables..."
vercel env pull .env.local

if [ ! -f ".env.local" ]; then
    echo "❌ Không thể pull environment variables"
    exit 1
fi
echo "✅ Đã pull environment variables"

# Bước 2: Install dependencies
echo ""
echo "📦 Bước 2: Install dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi
echo "✅ Dependencies đã sẵn sàng"

# Bước 3: Generate Prisma Client
echo ""
echo "🔧 Bước 3: Generate Prisma Client..."
npx prisma generate
echo "✅ Prisma Client đã được generate"

# Bước 4: Run migrations
echo ""
echo "🗄️  Bước 4: Run database migrations..."
echo "⚠️  CẢNH BÁO: Migrations có thể thay đổi cấu trúc database!"
echo "⚠️  Đảm bảo đã backup database trước khi tiếp tục!"
read -p "Bạn có chắc chắn muốn chạy migrations? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Đã hủy. Vui lòng backup database trước khi chạy migrations."
    exit 1
fi

# Kiểm tra migrations có DROP TABLE không
echo "🔍 Đang kiểm tra migrations có DROP TABLE..."
migrations_with_drop=$(grep -r "DROP TABLE" prisma/migrations/*.sql 2>/dev/null | cut -d: -f1 | sort -u)
if [ -n "$migrations_with_drop" ]; then
    echo "⚠️  PHÁT HIỆN MIGRATIONS CÓ DROP TABLE!"
    echo "   Các file sau có chứa DROP TABLE:"
    echo "$migrations_with_drop" | sed 's/^/   - /'
    echo ""
    echo "⚠️  CẢNH BÁO: DROP TABLE có thể XÓA DỮ LIỆU!"
    read -p "Bạn có CHẮC CHẮN muốn tiếp tục? (yes/no): " confirm_drop
    if [ "$confirm_drop" != "yes" ]; then
        echo "❌ Đã hủy. Vui lòng kiểm tra migrations trước."
        exit 1
    fi
fi

npx prisma migrate deploy
echo "✅ Migrations đã được apply"

# Bước 5: Seed database
if [ "$SKIP_SEED" = false ]; then
    echo ""
    echo "🌱 Bước 5: Seed database..."
    read -p "Bạn có muốn seed database? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma db seed || echo "⚠️  Seed có thể đã có lỗi (có thể đã có dữ liệu)"
    fi
fi

# Bước 6: Test build local
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "🏗️  Bước 6: Test build locally..."
    npm run build
    echo "✅ Build local thành công"
fi

# Bước 7: Deploy
echo ""
if [ "$PREVIEW" = true ]; then
    echo "🚀 Bước 7: Deploy preview to Vercel..."
    vercel --yes
else
    echo "🚀 Bước 7: Deploy production to Vercel..."
    vercel --prod --yes
fi

echo ""
echo "✅ Deploy thành công!"
echo ""
echo "📋 Checklist sau khi deploy:"
echo "  [ ] Kiểm tra Build Logs trên Vercel Dashboard"
echo "  [ ] Kiểm tra Function Logs"
echo "  [ ] Test đăng nhập"
echo "  [ ] Test các features chính"
