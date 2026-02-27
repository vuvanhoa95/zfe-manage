import { NextRequest, NextResponse } from 'next/server';

type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
type IssueStatus = 'Mới' | 'Đang xử lý' | 'Đã đóng';

type ClashIssue = {
    id: string;
    type: 'Clash' | 'RFI' | 'Thiếu thông tin' | 'Khác';
    discipline: string;
    location: string;
    severity: IssueSeverity;
    status: IssueStatus;
    assignee: string;
    createdAt: string;
    dueDate: string;
    summary: string;
};

const SAMPLE_CLASH_ISSUES: ClashIssue[] = [
    {
        id: 'ISS-001',
        type: 'Clash',
        discipline: 'MEP',
        location: 'Tầng 5 – Khu vệ sinh 5.03',
        severity: 'Critical',
        status: 'Đang xử lý',
        assignee: 'Nguyễn Văn A',
        createdAt: '2026-02-20',
        dueDate: '2026-02-25',
        summary: 'Ống thoát nước Ø90 va chạm dầm chính D5-03, cần điều chỉnh cao độ.',
    },
    {
        id: 'ISS-002',
        type: 'Clash',
        discipline: 'Kết cấu',
        location: 'Tầng hầm B1 – Khu vực ram dốc',
        severity: 'High',
        status: 'Mới',
        assignee: 'Trần Thị B',
        createdAt: '2026-02-22',
        dueDate: '2026-02-28',
        summary: 'Dầm bổ sung không đủ khoảng sáng thông thủy cho ram dốc xe tải.',
    },
    {
        id: 'ISS-003',
        type: 'RFI',
        discipline: 'Kiến trúc',
        location: 'Tầng 10 – Căn hộ 10A-07',
        severity: 'Medium',
        status: 'Đang xử lý',
        assignee: 'Lê Văn C',
        createdAt: '2026-02-18',
        dueDate: '2026-02-26',
        summary: 'Thiếu chi tiết kết thúc len gạch tại cửa ban công, cần xác nhận vật liệu.',
    },
    {
        id: 'ISS-004',
        type: 'Thiếu thông tin',
        discipline: 'MEP',
        location: 'Mái – Phòng máy lạnh',
        severity: 'High',
        status: 'Mới',
        assignee: 'Phạm Thu D',
        createdAt: '2026-02-21',
        dueDate: '2026-02-27',
        summary: 'Chưa có cao độ chuẩn cho giàn nóng VRV, chưa thể chốt routing ống gas.',
    },
    {
        id: 'ISS-005',
        type: 'Khác',
        discipline: 'Hiện trường',
        location: 'Tầng 3 – Hành lang 3B',
        severity: 'Low',
        status: 'Đã đóng',
        assignee: 'Ngô Văn E',
        createdAt: '2026-02-10',
        dueDate: '2026-02-15',
        summary: 'Chênh lệch nhỏ giữa kích thước thực tế và bản vẽ hoàn công (±10mm), đã chấp nhận.',
    },
];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Hiện tại API này trả về dữ liệu mock, không filter theo projectId.
        // Khi có module Issue thực tế, chúng ta sẽ thay bằng dữ liệu từ DB, filter theo params.id.
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        return NextResponse.json({
            success: true,
            data: {
                projectId,
                issues: SAMPLE_CLASH_ISSUES,
            },
        });
    } catch (error) {
        console.error('[GET /api/projects/[id]/issues]:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
            },
            { status: 500 },
        );
    }
}

