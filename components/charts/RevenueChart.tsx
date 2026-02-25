'use client';

import { memo } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type RevenueChartProps = {
    data: Array<{
        month: string;
        revenue: number;
        profit: number;
    }>;
};

const RevenueChart = memo(function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="chart-card group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zf-accent to-zf-accent-light flex items-center justify-center shadow-lg">
                        <span className="text-xl">📈</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                        Doanh thu & Lợi nhuận theo tháng
                    </h3>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        {/* Revenue Gradient */}
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#178AF3" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#178AF3" stopOpacity={0.1} />
                        </linearGradient>

                        {/* Profit Gradient */}
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 52, 58, 0.1)" />
                    <XAxis
                        dataKey="month"
                        stroke="var(--zf-graphite)"
                        style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-inter)' }}
                    />
                    <YAxis
                        stroke="var(--zf-graphite)"
                        style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-technical)' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />

                    <Tooltip
                        contentStyle={{
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(5,54,99,0.1)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: number | undefined) =>
                            value
                                ? new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                }).format(value)
                                : '0 ₫'
                        }
                    />

                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px',
                        }}
                        iconType="circle"
                    />

                    {/* Revenue Line */}
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Doanh thu"
                        stroke="#178AF3"
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                        dot={{ fill: '#178AF3', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                    />

                    {/* Profit Line */}
                    <Line
                        type="monotone"
                        dataKey="profit"
                        name="Lợi nhuận"
                        stroke="#10B981"
                        strokeWidth={3}
                        fill="url(#profitGradient)"
                        dot={{ fill: '#10B981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});

export default RevenueChart;
