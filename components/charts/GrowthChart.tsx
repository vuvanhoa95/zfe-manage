'use client';

import { memo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type GrowthChartProps = {
    data: Array<{
        month: string;
        value: number;
    }>;
    growthPercentage?: number;
};

const GrowthChart = memo(function GrowthChart({ data, growthPercentage = 120 }: GrowthChartProps) {
    return (
        <div className="chart-card group relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zf-accent to-zf-accent-light flex items-center justify-center shadow-lg">
                        <span className="text-xl">📈</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tăng trưởng</h3>
                </div>

                {/* Growth Badge */}
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                        <span className="text-2xl font-bold text-emerald-600">
                            +{growthPercentage}%
                        </span>
                        <span className="text-emerald-600 text-xl">↑</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">So với quý trước</p>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#178AF3" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#178AF3" stopOpacity={0.1} />
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
                        tickFormatter={(value) => `${value}%`}
                    />

                    <Tooltip
                        contentStyle={{
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(5,54,99,0.1)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: number | undefined) => (value ? `${value}%` : '0%')}
                    />

                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#178AF3"
                        strokeWidth={3}
                        fill="url(#growthGradient)"
                        animationDuration={800}
                        animationEasing="ease-in-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
});

export default GrowthChart;
