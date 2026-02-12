'use client';

import { memo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type QuotationChartProps = {
    data: Array<{
        month: string;
        count: number;
    }>;
};

const QuotationChart = memo(function QuotationChart({ data }: QuotationChartProps) {
    return (
        <div className="chart-card group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center shadow-lg">
                        <span className="text-xl">📊</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Số lượng Báo giá theo tháng</h3>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                        dataKey="month"
                        stroke="#6B7280"
                        style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis
                        stroke="#6B7280"
                        style={{ fontSize: '12px', fontWeight: 500 }}
                    />

                    <Tooltip
                        contentStyle={{
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(5,54,99,0.1)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        }}
                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
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
                            style={{
                                fill: '#6B7280',
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});

export default QuotationChart;
