import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { buildAiSystemPrompt } from '@/lib/ai/system-prompt';
import { prisma } from '@/lib/prisma';
import { formatVNDWithSymbol } from '@/lib/number-to-words-vn';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(20_000),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
});

type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function normalizeVietnameseQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function tryHandleDataQuery(message: string): Promise<string | null> {
  const q = normalizeVietnameseQuery(message);

  const mentionsProject = /\b(dự án|du an)\b/.test(q);
  const mentionsReport = /\b(báo cáo|bao cao)\b/.test(q);

  const wantsProjectRanking =
    mentionsProject &&
    (/\b(cao nhất|cao nhat)\b/.test(q) || /\b(sắp xếp|sap xep)\b/.test(q) || /\b(xếp hạng|xep hang)\b/.test(q));

  const wantsProfit = /\b(lợi nhuận|loi nhuan)\b/.test(q) || /\b(lãi|lai)\b/.test(q);
  const wantsRevenue = /\b(doanh thu)\b/.test(q) || /\b(tổng thu|tong thu)\b/.test(q);
  const wantsCost = /\b(chi phí|chi phi)\b/.test(q) || /\b(tổng chi|tong chi)\b/.test(q);

  // Total income / revenue across all projects
  const wantsIncome =
    /\b(tổng|tong)\b/.test(q) &&
    (/\b(doanh thu)\b/.test(q) ||
      /\bthu\b/.test(q) ||
      /\bđang thu\b/.test(q) ||
      /\bthu được\b/.test(q));

  // Total expense across all projects
  const wantsExpense =
    /\b(tổng|tong)\b/.test(q) && (/\bchi\b/.test(q) || /\bchi phí\b/.test(q) || /\bđang chi\b/.test(q));

  // Net profit-ish (income - expense)
  const wantsNet =
    /\b(tổng|tong)\b/.test(q) &&
    (/\b(lợi nhuận)\b/.test(q) || /\b(lai)\b/.test(q) || /\b(net)\b/.test(q) || /\bchênh lệch\b/.test(q));

  const wantsAnyProjectReport = mentionsProject && mentionsReport;

  // ===== BASIC PROJECT STATUS / SUMMARY REPORT =====
  if (wantsAnyProjectReport) {
    const onlyActive =
      /\b(đang triển khai|dang trien khai)\b/.test(q) ||
      /\b(active)\b/.test(q) ||
      /\b(tình trạng dự án|tinh trang du an)\b/.test(q);

    const projects = await prisma.project.findMany({
      where: onlyActive ? { status: 'ACTIVE' } : undefined,
      include: {
        finalQuotation: {
          select: {
            totalAfterVat: true,
            outsourceCost: true,
            taxCost: true,
            commissionCost: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (projects.length === 0) {
      return onlyActive
        ? 'Hiện tại chưa có dự án nào đang ở trạng thái “đang triển khai” (ACTIVE).'
        : 'Hiện tại hệ thống chưa có dữ liệu dự án để lập báo cáo.';
    }

    const rows = projects.map((p) => {
      const fq = p.finalQuotation ?? null;
      const revenue = fq?.totalAfterVat ?? 0;
      const cost = (fq?.outsourceCost ?? 0) + (fq?.taxCost ?? 0) + (fq?.commissionCost ?? 0);
      const profit = revenue - cost;
      return { projectNo: p.projectNo, name: p.name, revenue, cost, profit };
    });

    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
    const totalProfit = rows.reduce((sum, r) => sum + r.profit, 0);

    const topByProfit = [...rows].sort((a, b) => b.profit - a.profit).slice(0, 3);

    const lines = topByProfit.map(
      (r, idx) =>
        `${idx + 1}. ${r.projectNo} – ${r.name}: Lợi nhuận ~ ${formatVNDWithSymbol(r.profit)} (Doanh thu ${formatVNDWithSymbol(
          r.revenue,
        )}, Chi phí ${formatVNDWithSymbol(r.cost)})`,
    );

    return [
      onlyActive
        ? 'Dạ, em tổng hợp nhanh báo cáo các dự án ĐANG TRIỂN KHAI như sau:'
        : 'Dạ, em tổng hợp nhanh báo cáo tổng quan các dự án như sau:',
      onlyActive
        ? `- Số dự án đang triển khai: ${projects.length}`
        : `- Tổng số dự án: ${projects.length}`,
      `- Tổng doanh thu (ước tính theo báo giá chốt): ${formatVNDWithSymbol(totalRevenue)}`,
      `- Tổng chi phí (outsourcing + thuế + hoa hồng): ${formatVNDWithSymbol(totalCost)}`,
      `- Tổng lợi nhuận ước tính: ${formatVNDWithSymbol(totalProfit)}`,
      '',
      `Top 3 dự án theo lợi nhuận ước tính:`,
      lines.join('\n'),
    ].join('\n');
  }

  if (!wantsIncome && !wantsExpense && !wantsNet && !wantsProjectRanking && !wantsAnyProjectReport) return null;

  if (wantsProjectRanking && (wantsProfit || wantsRevenue || wantsCost)) {
    // Use the same computed logic as /api/projects: financial numbers come from finalQuotation only.
    const projects = await prisma.project.findMany({
      include: {
        finalQuotation: {
          select: {
            totalAfterVat: true,
            outsourceCost: true,
            taxCost: true,
            commissionCost: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = projects.map((p) => {
      const fq = p.finalQuotation ?? null;
      const revenue = fq?.totalAfterVat ?? 0;
      const cost = (fq?.outsourceCost ?? 0) + (fq?.taxCost ?? 0) + (fq?.commissionCost ?? 0);
      const profit = revenue - cost;
      return { id: p.id, projectNo: p.projectNo, name: p.name, revenue, cost, profit };
    });

    const metric: 'profit' | 'revenue' | 'cost' = wantsProfit ? 'profit' : wantsRevenue ? 'revenue' : 'cost';
    const metricLabel = metric === 'profit' ? 'lợi nhuận' : metric === 'revenue' ? 'doanh thu' : 'chi phí';

    const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);

    // If asking for highest, return top 1; else return top 10 list
    const wantsTop1 = /\b(cao nhất|cao nhat)\b/.test(q) && !/\b(sắp xếp|sap xep)\b/.test(q);
    if (sorted.length === 0) {
      return 'Hiện chưa có dữ liệu dự án để xếp hạng.';
    }

    if (wantsTop1) {
      const top = sorted[0]!;
      return `Dự án có ${metricLabel} cao nhất hiện tại: ${top.projectNo} – ${top.name} (${metricLabel}: ${formatVNDWithSymbol(
        top[metric],
      )}).`;
    }

    const topN = sorted.slice(0, 10);
    const lines = topN.map(
      (r, idx) => `${idx + 1}. ${r.projectNo} – ${r.name}: ${formatVNDWithSymbol(r[metric])}`,
    );
    return `Danh sách dự án theo ${metricLabel} (cao → thấp):\n${lines.join('\n')}`;
  }

  // Aggregate from CashFlow as the source of truth
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.cashFlow.aggregate({ where: { type: 'INCOME' }, _sum: { amount: true } }),
    prisma.cashFlow.aggregate({ where: { type: 'EXPENSE' }, _sum: { amount: true } }),
  ]);

  const income = incomeAgg._sum.amount ?? 0;
  const expense = expenseAgg._sum.amount ?? 0;
  const net = income - expense;

  if (wantsIncome) {
    return `Tổng thu (INCOME) hiện tại: ${formatVNDWithSymbol(income)}.`;
  }

  if (wantsExpense) {
    return `Tổng chi (EXPENSE) hiện tại: ${formatVNDWithSymbol(expense)}.`;
  }

  return `Tổng thu: ${formatVNDWithSymbol(income)}\nTổng chi: ${formatVNDWithSymbol(expense)}\nChênh lệch (thu - chi): ${formatVNDWithSymbol(net)}.`;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function callOpenAIChatCompletion(args: {
  apiKey: string;
  model: string;
  messages: OpenAIChatMessage[];
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: args.model,
        messages: args.messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI API error: ${res.status} ${res.statusText} ${text}`);
    }

    const json: unknown = await res.json();
    const content = z
      .object({
        choices: z
          .array(
            z.object({
              message: z.object({
                content: z.string().nullable().optional(),
              }),
            })
          )
          .min(1),
      })
      .parse(json).choices[0]?.message?.content;

    return (content ?? '').trim();
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const bodyUnknown: unknown = await request.json();
    const body = ChatRequestSchema.parse(bodyUnknown);

    // If the user asks for system numbers, answer directly from DB (no OpenAI call)
    const lastUserMessage = [...body.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const dataAnswer = await tryHandleDataQuery(lastUserMessage);
    if (dataAnswer) {
      return NextResponse.json({ success: true, data: { message: dataAnswer } });
    }

    const apiKey = getRequiredEnv('OPENAI_API_KEY');
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

    const systemPrompt = buildAiSystemPrompt({
      userEmail: session.user.email ?? undefined,
      userName: session.user.name ?? undefined,
    });

    const userMessages: OpenAIChatMessage[] = body.messages
      .filter((m) => m.role !== 'system')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    const assistantText = await callOpenAIChatCompletion({
      apiKey,
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
    });

    return NextResponse.json({
      success: true,
      data: {
        message: assistantText,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    const message = error instanceof Error ? error.message : 'AI chat failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

