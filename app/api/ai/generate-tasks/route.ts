import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCompletion } from '@/lib/ai/openai';

interface GeneratedTask {
    title: string;
    description?: string;
    phase?: string;
    discipline?: string;
    priority?: string;
    estimatedDays?: number;
    subtasks?: GeneratedSubTask[];
}

interface GeneratedSubTask {
    title: string;
    discipline?: string;
    estimatedDays?: number;
}

/**
 * POST /api/ai/generate-tasks
 * Body: { projectName, description, location, totalArea, projectType? }
 * Returns: { tasks: GeneratedTask[] }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectName, description, location, totalArea, projectType } = await req.json() as {
            projectName?: string;
            description?: string;
            location?: string;
            totalArea?: number;
            projectType?: string;
        };

        if (!projectName?.trim()) {
            return NextResponse.json({ error: 'Cần nhập tên dự án' }, { status: 400 });
        }

        const prompt = `Bạn là chuyên gia BIM với 15 năm kinh nghiệm các dự án xây dựng tại Việt Nam.
Tạo danh sách công việc BIM chi tiết cho dự án sau:

Tên dự án: ${projectName}
${description ? `Mô tả: ${description}` : ''}
${location ? `Vị trí: ${location}` : ''}
${totalArea ? `Diện tích: ${totalArea.toLocaleString('vi-VN')} m²` : ''}
${projectType ? `Loại công trình: ${projectType}` : ''}

Tạo 5-8 công việc cha (giai đoạn chính), mỗi công việc có 3-5 subtask.
Các giai đoạn BIM thường gặp: Khảo sát, Thiết kế kiến trúc, Thiết kế kết cấu, Thiết kế MEP, Coordination, Shopdrawing, BIM As-built.
Bộ môn (discipline): ARC (kiến trúc), STR (kết cấu), MEP (cơ điện), CIV (hạ tầng).

Trả về JSON array (KHÔNG markdown, KHÔNG giải thích):
[
  {
    "title": "Tên giai đoạn/công việc cha",
    "description": "Mô tả ngắn 1 câu",
    "phase": "Tên giai đoạn (Khảo sát / Thiết kế / Shopdrawing / ...)",
    "discipline": "ARC|STR|MEP|ALL",
    "priority": "HIGH|MEDIUM|LOW",
    "estimatedDays": 14,
    "subtasks": [
      {
        "title": "Tên subtask cụ thể",
        "discipline": "ARC|STR|MEP",
        "estimatedDays": 5
      }
    ]
  }
]`;

        const response = await generateCompletion(
            [{ role: 'user', content: prompt }],
            { temperature: 0.4, maxTokens: 2000, model: 'gpt-4o' }
        );

        let tasks: GeneratedTask[] = [];
        try {
            const cleaned = response.trim()
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '');
            tasks = JSON.parse(cleaned);
            if (!Array.isArray(tasks)) tasks = [];
        } catch {
            return NextResponse.json({ error: 'AI trả về dữ liệu không hợp lệ' }, { status: 500 });
        }

        return NextResponse.json({ success: true, tasks });
    } catch (error: any) {
        console.error('[GenerateTasks] Error:', error);
        return NextResponse.json({ error: error.message || 'Không thể tạo tasks' }, { status: 500 });
    }
}
