import Link from 'next/link';

import { formatVND } from '@/lib/number-to-words-vn';

export type PaymentMilestoneItem = {
  id: string;
  quotationId: string;
  quotationNo: string;
  customerName: string;
  projectName: string;
  no: number;
  title: string;
  percent: number;
  expectedAmount: number;
  expectedDate?: string | null;
};

interface Props {
  items: PaymentMilestoneItem[];
}

type MilestoneGroup = {
  quotationId: string;
  quotationNo: string;
  customerName: string;
  projectName: string;
  milestones: PaymentMilestoneItem[];
};

function groupByQuotation(items: PaymentMilestoneItem[]): MilestoneGroup[] {
  const map = new Map<string, MilestoneGroup>();

  for (const item of items) {
    const existing = map.get(item.quotationId);
    if (!existing) {
      map.set(item.quotationId, {
        quotationId: item.quotationId,
        quotationNo: item.quotationNo,
        customerName: item.customerName,
        projectName: item.projectName,
        milestones: [item],
      });
      continue;
    }
    existing.milestones.push(item);
  }

  const groups = Array.from(map.values());
  for (const g of groups) {
    g.milestones.sort((a, b) => {
      const aTime = a.expectedDate ? new Date(a.expectedDate).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.expectedDate ? new Date(b.expectedDate).getTime() : Number.POSITIVE_INFINITY;
      if (aTime !== bTime) return aTime - bTime;
      return a.no - b.no;
    });
  }

  groups.sort((a, b) => a.quotationNo.localeCompare(b.quotationNo, 'vi'));
  return groups;
}

export default function PaymentMilestonesTimeline({ items }: Props) {
  const groups = groupByQuotation(items);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section
          key={group.quotationId}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link
                  href={`/quotations/${group.quotationId}`}
                  className="font-mono text-sm font-semibold text-zf-accent hover:underline"
                >
                  {group.quotationNo}
                </Link>
                <span className="text-sm font-semibold text-gray-900">{group.projectName}</span>
              </div>
              <p className="mt-1 truncate text-sm text-gray-600">{group.customerName}</p>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{group.milestones.length}</span> mốc
            </div>
          </div>

          <div className="px-5 py-4">
            <ol className="relative space-y-4">
              {group.milestones.map((m, idx) => {
                const isLast = idx === group.milestones.length - 1;
                const expectedDateLabel = m.expectedDate
                  ? new Date(m.expectedDate).toLocaleDateString('vi-VN')
                  : 'Chưa đặt ngày';
                return (
                  <li key={m.id} className="relative pl-8">
                    {/* Line */}
                    {!isLast && (
                      <span
                        className="absolute left-[11px] top-[18px] h-full w-px bg-gray-200"
                        aria-hidden="true"
                      />
                    )}

                    {/* Dot */}
                    <span className="absolute left-0 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-zf-accent/15">
                      <span className="h-2.5 w-2.5 rounded-full bg-zf-accent" aria-hidden="true" />
                    </span>

                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            Đợt {m.no}: <span className="font-medium">{m.title}</span>
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>
                              Tỉ lệ: <span className="font-medium text-gray-700">{m.percent.toFixed(1)}%</span>
                            </span>
                            <span className="text-gray-300" aria-hidden="true">
                              •
                            </span>
                            <span className={m.expectedDate ? 'font-medium text-gray-700' : 'italic text-gray-500'}>
                              {expectedDateLabel}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatVND(m.expectedAmount)}</p>
                          <p className="mt-0.5 text-xs text-gray-500">VNĐ (dự kiến)</p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}

