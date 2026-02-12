'use client';

import { memo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type CostChartProps = {
    data: Array<{
        name: string;
        value: number;
    }>;
};

const CostChart = memo(function CostChart({ data }: CostChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="chart-card group relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center shadow-lg">
                        <span className="text-xl">🎯</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Phân bổ Chi phí</h3>
                </div>
            </div>

            {/* Chart */}
            <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <defs>
                            <linearGradient id="outsourceGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#F59E0B" />
                                <stop offset="100%" stopColor="#FBBF24" />
                            </linearGradient>
                            <linearGradient id="commissionGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#60A5FA" />
                            </linearGradient>
                            <linearGradient id="taxGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#EF4444" />
                                <stop offset="100%" stopColor="#F87171" />
                            </linearGradient>
                        </defs>

                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                            animationDuration={800}
                            animationEasing="ease-in-out"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.name === 'Outsource'
                                            ? 'url(#outsourceGradient)'
                                            : entry.name === 'Hoa hồng'
                                                ? 'url(#commissionGradient)'
                                                : 'url(#taxGradient)'
                                    }
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>

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

                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{
                                paddingTop: '20px',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{total}%</p>
                        <p className="text-sm text-gray-500 mt-1">Tổng</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CostChart;
