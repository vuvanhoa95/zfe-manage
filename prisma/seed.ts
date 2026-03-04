// @ts-nocheck
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function nextSequenceNo(lastNo: string | null | undefined, prefix: string, year?: number) {
    const currentYear = year || new Date().getFullYear();

    if (!lastNo) {
        return `${prefix}-${currentYear}-0001`;
    }

    const parts = String(lastNo).split('-');
    if (parts.length !== 3) {
        return `${prefix}-${currentYear}-0001`;
    }

    const lastYear = parseInt(parts[1]);
    const lastSeq = parseInt(parts[2]);

    if (Number.isNaN(lastYear) || Number.isNaN(lastSeq) || lastYear !== currentYear) {
        return `${prefix}-${currentYear}-0001`;
    }

    return `${prefix}-${currentYear}-${(lastSeq + 1).toString().padStart(4, '0')}`;
}

async function generateNextProjectNo() {
    const currentYear = new Date().getFullYear();
    const lastProject = await prisma.project.findFirst({
        where: { projectNo: { startsWith: `PRJ-${currentYear}-` } },
        orderBy: { projectNo: 'desc' },
        select: { projectNo: true },
    });

    return nextSequenceNo(lastProject?.projectNo || null, 'PRJ', currentYear);
}

async function generateNextQuotationNo(forYear?: number) {
    const year = forYear || new Date().getFullYear();
    const lastQuotation = await prisma.quotation.findFirst({
        where: { quotationNo: { startsWith: `BG-${year}-` } },
        orderBy: { quotationNo: 'desc' },
        select: { quotationNo: true },
    });

    return nextSequenceNo(lastQuotation?.quotationNo || null, 'BG', year);
}

async function main() {
    // Create/Update main admin user
    const adminEmail = 'hoavv@zfenix.com';
    const adminPassword = 'Zfenix2026';
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: adminHashedPassword,
                name: 'Hoa VV',
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        console.log('✅ Main admin user created: ' + adminEmail + ' / ' + adminPassword);
    } else {
        // Update existing user
        await prisma.user.update({
            where: { email: adminEmail },
            data: {
                password: adminHashedPassword,
                name: 'Hoa VV',
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        console.log('✅ Main admin user updated: ' + adminEmail + ' / ' + adminPassword);
    }

    // Keep old admin user for backward compatibility (optional)
    const oldEmail = 'admin@bimcompany.vn';
    const oldPassword = 'admin';
    const oldHashedPassword = await bcrypt.hash(oldPassword, 10);

    const existingOldUser = await prisma.user.findUnique({
        where: { email: oldEmail },
    });

    if (!existingOldUser) {
        await prisma.user.create({
            data: {
                email: oldEmail,
                password: oldHashedPassword,
                name: 'Admin User',
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        console.log('✅ Legacy admin user created: ' + oldEmail + ' / ' + oldPassword);
    } else {
        console.log('ℹ️ Legacy admin user already exists');
    }

    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) {
        throw new Error('Không tìm thấy admin user sau khi seed. Vui lòng thử lại.');
    }

    // Create default company profile if not exists
    const existingProfile = await prisma.companyProfile.findUnique({
        where: { id: 1 },
    });

    if (!existingProfile) {
        await prisma.companyProfile.create({
            data: {
                id: 1,
                name: 'CÔNG TY CP TƯ VẤN QUẢN LÝ DỰ ÁN BIM',
                taxCode: '0123456789',
                address: 'Số 1, Phố Duy Tân, Cầu Giấy, Hà Nội',
                email: 'info@bimcompany.vn',
                phone: '024 1234 5678',
                projectSlogan: 'Giải pháp BIM chuyên nghiệp cho dự án của bạn',
                signerName: 'Nguyễn Văn A',
                signerTitle: 'Giám đốc',
            },
        });
        console.log('✅ Default company profile created');
    } else {
        console.log('ℹ️ Company profile already exists');
    }

    // Seed Catalog Items for SCOPE (Phạm vi công việc)
    const scopeItems = [
        {
            category: 'SCOPE',
            title: 'GIAI ĐOẠN THIẾT KẾ SƠ BỘ',
            description: 'Tư vấn và xây dựng chiến lược BIM cho dự án\n- Thiết lập BIM Execution Plan (BEP)\n- Xây dựng mô hình BIM 3D sơ bộ từ bản vẽ 2D\n- Phân tích không gian và xung đột sơ bộ\n- Tư vấn tối ưu hóa thiết kế',
            order: 1,
        },
        {
            category: 'SCOPE',
            title: 'GIAI ĐOẠN THIẾT KẾ KỸ THUẬT',
            description: 'Phát triển mô hình BIM đầy đủ cho các hạng mục: Kiến trúc, Kết cấu, MEP (Điện, Nước, Điều hòa)\n- Mô hình hóa chi tiết các hệ thống kỹ thuật\n- Phân tích xung đột (Clash Detection) giữa các hệ thống\n- Tối ưu hóa tuyến ống, cáp và thiết bị\n- Tạo bản vẽ kỹ thuật tự động từ mô hình BIM\n- Báo cáo và đề xuất giải pháp xử lý xung đột',
            order: 2,
        },
        {
            category: 'SCOPE',
            title: 'GIAI ĐOẠN THIẾT KẾ THI CÔNG',
            description: 'Phát triển mô hình BIM chi tiết phục vụ thi công\n- Lập kế hoạch thi công 4D (3D + Thời gian)\n- Mô phỏng trình tự thi công và logistics\n- Tối ưu hóa phương án thi công\n- Tạo bản vẽ shop drawing từ mô hình BIM\n- Tính toán khối lượng chính xác (5D)',
            order: 3,
        },
        {
            category: 'SCOPE',
            title: 'GIAI ĐOẠN THI CÔNG',
            description: 'Hỗ trợ triển khai BIM tại công trường\n- Cập nhật mô hình theo tiến độ thực tế\n- Giám sát chất lượng thi công bằng BIM\n- Quản lý thay đổi và điều chỉnh thiết kế\n- Hỗ trợ giải quyết vấn đề phát sinh',
            order: 4,
        },
        {
            category: 'SCOPE',
            title: 'GIAI ĐOẠN NGHIỆM THU VÀ BÀN GIAO',
            description: 'Hoàn thiện mô hình BIM as-built\n- Tạo tài liệu bàn giao số\n- Đào tạo sử dụng mô hình BIM cho vận hành\n- Chuyển giao dữ liệu BIM cho quản lý tài sản',
            order: 5,
        },
    ];

    // Seed Catalog Items for DELIVERABLES (Sản phẩm bàn giao)
    const deliverablesItems = [
        {
            category: 'DELIVERABLES',
            title: 'Mô hình BIM 3D đầy đủ các hạng mục',
            description: 'Mô hình BIM 3D đầy đủ các hạng mục (Kiến trúc, Kết cấu, MEP) theo tiêu chuẩn quốc tế',
            order: 1,
        },
        {
            category: 'DELIVERABLES',
            title: 'BIM Execution Plan (BEP) và các tài liệu quy trình BIM',
            description: 'BIM Execution Plan (BEP) và các tài liệu quy trình BIM',
            order: 2,
        },
        {
            category: 'DELIVERABLES',
            title: 'Báo cáo phân tích xung đột (Clash Report)',
            description: 'Báo cáo phân tích xung đột (Clash Report) với giải pháp xử lý',
            order: 3,
        },
        {
            category: 'DELIVERABLES',
            title: 'Bản vẽ kỹ thuật tự động từ mô hình BIM',
            description: 'Bản vẽ kỹ thuật tự động từ mô hình BIM (2D drawings)',
            order: 4,
        },
        {
            category: 'DELIVERABLES',
            title: 'Bản vẽ shop drawing chi tiết phục vụ thi công',
            description: 'Bản vẽ shop drawing chi tiết phục vụ thi công',
            order: 5,
        },
        {
            category: 'DELIVERABLES',
            title: 'Mô hình BIM 4D và video mô phỏng',
            description: 'Mô hình BIM 4D (3D + Lịch trình thi công) và video mô phỏng',
            order: 6,
        },
        {
            category: 'DELIVERABLES',
            title: 'Báo cáo tính toán khối lượng (Quantity Take-off)',
            description: 'Báo cáo tính toán khối lượng (Quantity Take-off) từ mô hình BIM',
            order: 7,
        },
        {
            category: 'DELIVERABLES',
            title: 'Mô hình BIM as-built hoàn chỉnh',
            description: 'Mô hình BIM as-built hoàn chỉnh sau khi nghiệm thu',
            order: 8,
        },
        {
            category: 'DELIVERABLES',
            title: 'Tài liệu hướng dẫn sử dụng mô hình BIM',
            description: 'Tài liệu hướng dẫn sử dụng mô hình BIM',
            order: 9,
        },
        {
            category: 'DELIVERABLES',
            title: 'File mô hình BIM các định dạng (IFC, NWD, NWC)',
            description: 'File mô hình BIM định dạng IFC, NWD, NWC và các định dạng khác theo yêu cầu',
            order: 10,
        },
        {
            category: 'DELIVERABLES',
            title: 'Dữ liệu BIM phục vụ quản lý tài sản và vận hành',
            description: 'Dữ liệu BIM phục vụ quản lý tài sản và vận hành (COBie, FM)',
            order: 11,
        },
        {
            category: 'DELIVERABLES',
            title: 'Tài liệu đào tạo và chuyển giao công nghệ BIM',
            description: 'Tài liệu đào tạo và chuyển giao công nghệ BIM',
            order: 12,
        },
    ];

    // Seed Catalog Items for PRICING (Báo giá - Dịch vụ BIM)
    const pricingItems = [
        {
            category: 'PRICING',
            title: 'Tư vấn và xây dựng BIM Execution Plan (BEP)',
            unit: 'gói',
            defaultPrice: 50000000,
            description: 'Tư vấn và xây dựng chiến lược BIM, thiết lập BIM Execution Plan cho dự án',
            order: 1,
        },
        {
            category: 'PRICING',
            title: 'Tạo lập mô hình BIM Kiến trúc',
            unit: 'm²',
            defaultPrice: 15000,
            description: 'Tạo lập mô hình BIM 3D cho hạng mục Kiến trúc từ bản vẽ 2D',
            order: 2,
        },
        {
            category: 'PRICING',
            title: 'Tạo lập mô hình BIM Kết cấu',
            unit: 'm²',
            defaultPrice: 12000,
            description: 'Tạo lập mô hình BIM 3D cho hạng mục Kết cấu',
            order: 3,
        },
        {
            category: 'PRICING',
            title: 'Tạo lập mô hình BIM MEP (Điện, Nước, Điều hòa)',
            unit: 'm²',
            defaultPrice: 18000,
            description: 'Tạo lập mô hình BIM 3D cho hệ thống MEP (Điện, Nước, Điều hòa không khí)',
            order: 4,
        },
        {
            category: 'PRICING',
            title: 'Phân tích xung đột (Clash Detection)',
            unit: 'lần',
            defaultPrice: 10000000,
            description: 'Phân tích và phát hiện xung đột giữa các hệ thống, báo cáo và đề xuất giải pháp',
            order: 5,
        },
        {
            category: 'PRICING',
            title: 'Tối ưu hóa tuyến ống và thiết bị',
            unit: 'gói',
            defaultPrice: 30000000,
            description: 'Tối ưu hóa tuyến ống, cáp và bố trí thiết bị trong mô hình BIM',
            order: 6,
        },
        {
            category: 'PRICING',
            title: 'Tạo bản vẽ Shop Drawing từ mô hình BIM',
            unit: 'bản vẽ',
            defaultPrice: 500000,
            description: 'Tạo bản vẽ shop drawing chi tiết phục vụ thi công từ mô hình BIM',
            order: 7,
        },
        {
            category: 'PRICING',
            title: 'Lập kế hoạch thi công 4D (3D + Thời gian)',
            unit: 'gói',
            defaultPrice: 40000000,
            description: 'Lập kế hoạch thi công 4D, mô phỏng trình tự thi công và logistics',
            order: 8,
        },
        {
            category: 'PRICING',
            title: 'Tính toán khối lượng tự động (Quantity Take-off)',
            unit: 'lần',
            defaultPrice: 15000000,
            description: 'Tính toán khối lượng chính xác từ mô hình BIM (5D)',
            order: 9,
        },
        {
            category: 'PRICING',
            title: 'Hỗ trợ triển khai BIM tại công trường',
            unit: 'tháng',
            defaultPrice: 20000000,
            description: 'Hỗ trợ triển khai BIM tại công trường, cập nhật mô hình theo tiến độ thực tế',
            order: 10,
        },
        {
            category: 'PRICING',
            title: 'Giám sát chất lượng thi công bằng BIM',
            unit: 'tháng',
            defaultPrice: 25000000,
            description: 'Giám sát chất lượng thi công, quản lý thay đổi và điều chỉnh thiết kế',
            order: 11,
        },
        {
            category: 'PRICING',
            title: 'Hoàn thiện mô hình BIM as-built',
            unit: 'gói',
            defaultPrice: 35000000,
            description: 'Hoàn thiện mô hình BIM as-built sau khi nghiệm thu',
            order: 12,
        },
        {
            category: 'PRICING',
            title: 'Đào tạo sử dụng mô hình BIM',
            unit: 'buổi',
            defaultPrice: 5000000,
            description: 'Đào tạo sử dụng mô hình BIM cho vận hành và quản lý tài sản',
            order: 13,
        },
        {
            category: 'PRICING',
            title: 'Chuyển giao dữ liệu BIM cho quản lý tài sản',
            unit: 'gói',
            defaultPrice: 20000000,
            description: 'Chuyển giao dữ liệu BIM định dạng COBie, FM phục vụ quản lý tài sản',
            order: 14,
        },
        {
            category: 'PRICING',
            title: 'Tạo video mô phỏng 4D/5D',
            unit: 'video',
            defaultPrice: 10000000,
            description: 'Tạo video mô phỏng trình tự thi công và tiến độ dự án',
            order: 15,
        },
    ];

    // Insert SCOPE items
    for (const item of scopeItems) {
        const existing = await prisma.catalogItem.findFirst({
            where: {
                category: item.category,
                title: item.title,
            },
        });

        if (!existing) {
            await prisma.catalogItem.create({ data: item });
            console.log(`✅ Created SCOPE item: ${item.title}`);
        }
    }

    // Insert DELIVERABLES items
    for (const item of deliverablesItems) {
        const existing = await prisma.catalogItem.findFirst({
            where: {
                category: item.category,
                title: item.title,
            },
        });

        if (!existing) {
            await prisma.catalogItem.create({ data: item });
            console.log(`✅ Created DELIVERABLES item: ${item.title}`);
        }
    }

    // Insert PRICING items
    for (const item of pricingItems) {
        const existing = await prisma.catalogItem.findFirst({
            where: {
                category: item.category,
                title: item.title,
            },
        });

        if (!existing) {
            await prisma.catalogItem.create({ data: item });
            console.log(`✅ Created PRICING item: ${item.title}`);
        }
    }

    console.log('✅ Catalog items seeding completed');

    // (OutsourcingStaff model removed - staff info now comes from User table)

    // ============================================
    // DEMO DATA for Dashboard (Customers / Projects / Quotations)
    // ============================================
    const DEMO_TAG = 'DEMO_SEED_DASHBOARD';

    // Dọn sạch các dòng tiền demo cũ để tránh trùng/đúp dữ liệu và làm tổng thu vượt giá trị hợp đồng
    await prisma.cashFlow.deleteMany({
        where: {
            OR: [
                { description: { contains: DEMO_TAG } },
                { notes: { contains: DEMO_TAG } },
            ],
        },
    });

    const demoCustomers = [
        {
            name: 'CÔNG TY CP XÂY DỰNG AN PHÁT',
            taxCode: '0101234567',
            address: 'Tầng 8, Tòa nhà An Phát, Cầu Giấy, Hà Nội',
            contactName: 'Nguyễn Minh Anh',
            email: 'contact@anphat.vn',
            phone: '0901 234 567',
        },
        {
            name: 'CÔNG TY TNHH ĐẦU TƯ HÒA BÌNH LAND',
            taxCode: '0312345678',
            address: 'Số 12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
            contactName: 'Trần Quốc Bình',
            email: 'hello@hoabinhland.vn',
            phone: '0902 345 678',
        },
        {
            name: 'BAN QUẢN LÝ DỰ ÁN HẠ TẦNG ĐÔ THỊ',
            taxCode: null,
            address: 'Số 99 Trần Phú, Hà Đông, Hà Nội',
            contactName: 'Lê Thị Hương',
            email: 'bql@hdt.gov.vn',
            phone: '0903 456 789',
        },
    ];

    const customersByName = {};
    for (const c of demoCustomers) {
        let customer = await prisma.customer.findFirst({ where: { name: c.name } });
        if (!customer) {
            customer = await prisma.customer.create({ data: c });
            console.log(`✅ Demo customer created: ${c.name}`);
        } else {
            console.log(`ℹ️ Demo customer already exists: ${c.name}`);
        }
        customersByName[c.name] = customer;
    }

    const demoProjects = [
        {
            name: 'Dự án Chung cư An Phát Riverside',
            code: 'AP-RIV-01',
            description: 'Chung cư cao tầng, triển khai BIM từ TKKT đến thi công',
            customerName: demoCustomers[0].name,
            location: 'Hà Nội',
            totalArea: 18500,
            status: 'ACTIVE',
        },
        {
            name: 'Dự án Tòa nhà văn phòng Hòa Bình Tower',
            code: 'HB-TWR-02',
            description: 'Tòa nhà văn phòng 35 tầng, yêu cầu Clash Detection & Shop Drawing',
            customerName: demoCustomers[1].name,
            location: 'TP. Hồ Chí Minh',
            totalArea: 24000,
            status: 'PLANNING',
        },
        {
            name: 'Dự án Nhà máy An Phát (GĐ 2)',
            code: 'AP-FAC-02',
            description: 'Nhà máy công nghiệp, ưu tiên BIM MEP và 4D',
            customerName: demoCustomers[0].name,
            location: 'Bắc Ninh',
            totalArea: 32000,
            status: 'ACTIVE',
        },
        {
            name: 'Dự án Cải tạo hạ tầng tuyến phố trung tâm',
            code: 'BQL-HT-01',
            description: 'Hạ tầng đô thị, mô hình hóa & bóc tách khối lượng 5D',
            customerName: demoCustomers[2].name,
            location: 'Hà Nội',
            // Diện tích demo để test báo giá theo m²
            totalArea: 87750,
            status: 'COMPLETED',
        },
    ];

    const projectsByCode = {};
    for (const p of demoProjects) {
        let project = await prisma.project.findFirst({ where: { code: p.code } });
        if (!project) {
            const projectNo = await generateNextProjectNo();
            project = await prisma.project.create({
                data: {
                    projectNo,
                    name: p.name,
                    code: p.code,
                    description: p.description,
                    customerId: customersByName[p.customerName]?.id || null,
                    location: p.location,
                    // Preserve 0 as a valid value (don't use `||`).
                    totalArea: p.totalArea ?? null,
                    status: p.status,
                    notes: `Dữ liệu demo phục vụ test dashboard (${DEMO_TAG})`,
                    createdById: adminUser.id,
                },
            });
            console.log(`✅ Demo project created: ${project.projectNo} - ${p.name}`);
        } else {
            console.log(`ℹ️ Demo project already exists: ${p.code} - ${p.name}`);
        }
        // Backfill demo totalArea if project exists but totalArea is null (helps keep Project/Quotation in sync)
        if (project && project.totalArea == null && p.totalArea != null) {
            project = await prisma.project.update({
                where: { id: project.id },
                data: { totalArea: p.totalArea },
            });
            console.log(`✅ Demo project totalArea updated: ${p.code} -> ${p.totalArea} m²`);
        }
        projectsByCode[p.code] = project;
    }

    const buildLines = (area) => {
        const totalArea = typeof area === 'number' ? area : 0;
        return [
            {
                section: 'B - BÁO GIÁ',
                itemNo: null,
                title: 'I. DỊCH VỤ BIM',
                qty: null,
                unit: null,
                unitPrice: null,
                note: null,
                order: 1,
                isGroupHeader: true,
                isChargeable: false,
            },
            {
                section: 'B - BÁO GIÁ',
                itemNo: '1',
                title: 'Tư vấn và xây dựng BIM Execution Plan (BEP)',
                qty: 1,
                unit: 'gói',
                unitPrice: 50000000,
                note: null,
                order: 2,
                isGroupHeader: false,
                isChargeable: true,
            },
            {
                section: 'B - BÁO GIÁ',
                itemNo: '2',
                title: 'Tạo lập mô hình BIM Kiến trúc',
                qty: totalArea ? totalArea : 10000,
                unit: 'm²',
                unitPrice: 15000,
                note: totalArea ? `Tính theo tổng diện tích ${totalArea} m²` : 'Tạm tính theo diện tích chuẩn demo',
                order: 3,
                isGroupHeader: false,
                isChargeable: true,
            },
            {
                section: 'B - BÁO GIÁ',
                itemNo: '3',
                title: 'Phân tích xung đột (Clash Detection)',
                qty: 3,
                unit: 'lần',
                unitPrice: 10000000,
                note: 'Bao gồm báo cáo clash và đề xuất xử lý',
                order: 4,
                isGroupHeader: false,
                isChargeable: true,
            },
        ];
    };

    const demoQuotations = [
        {
            projectCode: 'AP-RIV-01',
            date: new Date(),
            status: 'SENT',
            vatRate: 0.08,
            outsourceCost: 120000000,
            taxRate: 0.02,
            taxCost: 15000000,
            commissionType: 'percentage',
            commissionRate: 0.01,
            commissionCost: 12000000,
            projectItem: 'TKKT + Clash + Shop',
        },
        {
            projectCode: 'AP-RIV-01',
            date: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            status: 'ACCEPTED',
            vatRate: 0.08,
            outsourceCost: 90000000,
            taxRate: 0.02,
            taxCost: 12000000,
            commissionType: 'direct',
            commissionRate: null,
            commissionCost: 8000000,
            projectItem: 'GĐ Thiết kế sơ bộ',
        },
        {
            projectCode: 'HB-TWR-02',
            date: new Date(new Date().setMonth(new Date().getMonth() - 2)),
            status: 'DRAFT',
            vatRate: 0.08,
            outsourceCost: 0,
            taxRate: null,
            taxCost: 0,
            commissionType: null,
            commissionRate: null,
            commissionCost: 0,
            projectItem: 'Đề xuất dịch vụ BIM',
        },
        {
            projectCode: 'AP-FAC-02',
            date: new Date(new Date().setMonth(new Date().getMonth() - 3)),
            status: 'SENT',
            vatRate: 0.08,
            outsourceCost: 160000000,
            taxRate: 0.02,
            taxCost: 18000000,
            commissionType: 'percentage',
            commissionRate: 0.015,
            commissionCost: 18000000,
            projectItem: 'MEP + 4D',
        },
        {
            projectCode: 'BQL-HT-01',
            date: new Date(new Date().setMonth(new Date().getMonth() - 5)),
            status: 'COMPLETED', // will normalize below to ACCEPTED
            vatRate: 0.08,
            outsourceCost: 70000000,
            taxRate: 0.02,
            taxCost: 9000000,
            commissionType: 'direct',
            commissionRate: null,
            commissionCost: 5000000,
            projectItem: 'Bóc tách khối lượng 5D',
        },
        {
            projectCode: 'AP-FAC-02',
            date: new Date(new Date().setMonth(new Date().getMonth() - 7)),
            status: 'REJECTED',
            vatRate: 0.08,
            outsourceCost: 30000000,
            taxRate: 0.02,
            taxCost: 4000000,
            commissionType: null,
            commissionRate: null,
            commissionCost: 0,
            projectItem: 'Phần việc bổ sung',
        },
    ];

    // Giữ danh sách báo giá theo từng project để gán báo giá chốt và đồng bộ số liệu
    const quotationsByProject: Record<string, any[]> = {};

    for (const q of demoQuotations) {
        const project = projectsByCode[q.projectCode];
        if (!project) continue;

        const existing = await prisma.quotation.findFirst({
            where: {
                projectId: project.id,
                notes: { contains: DEMO_TAG },
                projectItem: q.projectItem,
            },
        });

        if (existing) {
            console.log(`ℹ️ Demo quotation already exists for ${q.projectCode}: ${q.projectItem}`);
            continue;
        }

        const quotationNo = await generateNextQuotationNo(new Date(q.date).getFullYear());
        const customerId = project.customerId || customersByName[demoCustomers[0].name].id;
        const lines = buildLines(project.totalArea || 0);

        const totalBeforeVat = lines.reduce((sum, line) => {
            if (!line.isChargeable) return sum;
            const qty = line.qty ?? 1;
            const unitPrice = line.unitPrice ?? 0;
            return sum + qty * unitPrice;
        }, 0);
        const vatAmount = totalBeforeVat * q.vatRate;
        const totalAfterVat = totalBeforeVat + vatAmount;

        const normalizedStatus = q.status === 'COMPLETED' ? 'ACCEPTED' : q.status;

        const created = await prisma.quotation.create({
            data: {
                quotationNo,
                projectId: project.id,
                date: q.date,
                location: project.location || 'Hà Nội',
                customerId,
                projectName: project.name,
                projectItem: q.projectItem,
                projectNotes: 'Dữ liệu demo để test dashboard và biểu đồ thống kê',
                title: 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM',
                introText: 'Cảm ơn Quý khách đã quan tâm đến dịch vụ của ZFENIX. Chúng tôi xin gửi báo giá chi tiết như sau:',
                scopeText: 'Phạm vi công việc được thực hiện theo tiêu chuẩn BIM và yêu cầu dự án.',
                deliverablesText: '<ul><li>Mô hình BIM 3D</li><li>Báo cáo Clash</li><li>Bản vẽ shop drawing (nếu áp dụng)</li></ul>',
                scheduleText: 'Tiến độ dự kiến: 20–45 ngày tùy quy mô và mức độ chi tiết.',
                currency: 'VND',
                vatRate: q.vatRate,
                totalBeforeVat,
                vatAmount,
                totalAfterVat,
                totalInWords: 'Dữ liệu demo',
                outsourceCost: q.outsourceCost,
                taxRate: q.taxRate,
                taxCost: q.taxCost,
                commissionType: q.commissionType,
                commissionRate: q.commissionRate,
                commissionCost: q.commissionCost,
                status: normalizedStatus,
                notes: `Báo giá demo (${DEMO_TAG})`,
                createdById: adminUser.id,
                lines: {
                    create: lines.map((line) => ({
                        section: line.section,
                        itemNo: line.itemNo,
                        title: line.title,
                        qty: line.qty,
                        unit: line.unit,
                        unitPrice: line.unitPrice,
                        total: (line.qty ?? 1) * (line.unitPrice ?? 0),
                        note: line.note,
                        order: line.order,
                        isGroupHeader: line.isGroupHeader,
                        isChargeable: line.isChargeable,
                    })),
                },
                paymentMilestones: {
                    create: [
                        {
                            no: 1,
                            title: 'Tạm ứng khi ký hợp đồng',
                            percent: 40,
                            description: 'Thanh toán trong vòng 05 ngày làm việc',
                            order: 1,
                        },
                        {
                            no: 2,
                            title: 'Thanh toán khi bàn giao mô hình lần 1',
                            percent: 40,
                            description: 'Sau khi nghiệm thu khối lượng giai đoạn',
                            order: 2,
                        },
                        {
                            no: 3,
                            title: 'Thanh toán khi bàn giao hồ sơ cuối cùng',
                            percent: 20,
                            description: 'Sau khi hoàn thành và bàn giao toàn bộ sản phẩm',
                            order: 3,
                        },
                    ],
                },
            },
        });

        // Thu thập báo giá theo project để chọn báo giá chốt
        if (!quotationsByProject[project.id]) {
            quotationsByProject[project.id] = [];
        }
        quotationsByProject[project.id].push({
            quotation: created,
            meta: { totalBeforeVat, vatAmount, totalAfterVat },
        });

        console.log(`✅ Demo quotation created: ${created.quotationNo} (${q.projectCode})`);

        // Seed a couple of cashflows linked to quotation/project (optional but useful for project counts)
        const cashflowExisting = await prisma.cashFlow.findFirst({
            where: { quotationId: created.id, description: { contains: DEMO_TAG } },
        });
        // Không tạo các dòng tiền demo auto nữa để tránh làm tổng thu vượt giá trị hợp đồng.
    }

    // Gán báo giá chốt (finalQuotationId) và đồng bộ số liệu dự án theo báo giá chốt
    for (const projectId of Object.keys(quotationsByProject)) {
        const sorted = quotationsByProject[projectId].sort((a, b) => {
            const rank = (status: string) => {
                if (status === 'ACCEPTED') return 1;
                if (status === 'SENT') return 2;
                if (status === 'DRAFT') return 3;
                return 4; // REJECTED hoặc khác
            };
            return rank(a.quotation.status) - rank(b.quotation.status);
        });

        const final = sorted[0];
        const q = final.quotation;
        const revenue = final.meta.totalAfterVat;
        const cost = (q.outsourceCost ?? 0) + (q.taxCost ?? 0) + (q.commissionCost ?? 0);
        const profit = revenue - cost;

        await prisma.project.update({
            where: { id: projectId },
            data: {
                finalQuotationId: q.id,
                totalBudget: revenue,
                totalRevenue: revenue,
                totalCost: cost,
                totalProfit: profit,
            },
        });

        console.log(`✅ Gán báo giá chốt cho project ${projectId}: ${q.quotationNo}`);
    }

    console.log('✅ Demo dashboard data seeding completed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
