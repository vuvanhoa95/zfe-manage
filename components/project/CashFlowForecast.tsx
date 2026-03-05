'use client';

/**
 * Phase 05: AI Cash Flow Forecast
 * Dự báo dòng tiền tương lai dựa trên dữ liệu thực + AI phân tích xu hướng
 * Không cần LLM call — tính toán thuần JS + recharts visualization
 */

import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CashFlow {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    date: string | null;
    description?: string | null;
    category?: string | null;
}

interface ForecastPoint {
    month: string;         // "Th3/26"
    income: number;        // Thu thực tế
    expense: number;       // Chi thực tế
    cumulativeBalance: number; // Số dư tích lũy
    forecastIncome?: number;   // Thu dự báo
    forecastExpense?: number;  // Chi dự báo
    forecastBalance?: number;  // Số dư dự báo
    isFuture: boolean;
}

interface AIForecastResult {
    nextMonthIncome: number;
    nextMonthExpense: number;
    trend: 'POSITIVE' | 'NEGATIVE' | 'STABLE';
    burnRate: number;           // Tốc độ chi tiêu trung bình/tháng
    estimatedCompletionMonths: number | null; // NULL nếu không có timeline
    insights: string[];
    alerts: string[];
}

function monthKey(date: Date) {
    return `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(2)}`;
}

function calcForecast(cashflows: CashFlow[]): { chartData: ForecastPoint[]; forecast: AIForecastResult } {
    if (cashflows.length === 0) {
        return {
            chartData: [],
            forecast: {
                nextMonthIncome: 0, nextMonthExpense: 0,
                trend: 'STABLE', burnRate: 0,
                estimatedCompletionMonths: null,
                insights: ['Chưa có dữ liệu dòng tiền để phân tích.'],
                alerts: [],
            },
        };
    }

    // ── 1. Nhóm theo tháng ────────────────────────────────────────────
    const byMonth: Map<string, { income: number; expense: number; date: Date }> = new Map();

    // Filter out cashflows without dates (can't plot on timeline)
    const datedCashflows = cashflows.filter(cf => cf.date != null);

    for (const cf of datedCashflows) {
        const d = new Date(cf.date!);
        const key = monthKey(d);
        const existing = byMonth.get(key) || { income: 0, expense: 0, date: d };
        if (cf.type === 'INCOME') existing.income += cf.amount;
        else existing.expense += cf.amount;
        byMonth.set(key, existing);
    }

    // Sort by date
    const months = Array.from(byMonth.entries()).sort(
        (a, b) => a[1].date.getTime() - b[1].date.getTime()
    );

    // ── 2. Tính số dư tích lũy ─────────────────────────────────────────
    let cumulativeBalance = 0;
    const historyPoints: ForecastPoint[] = months.map(([key, val]) => {
        cumulativeBalance += val.income - val.expense;
        return {
            month: key,
            income: val.income,
            expense: val.expense,
            cumulativeBalance,
            isFuture: false,
        };
    });

    // ── 3. Tính trung bình 3 tháng gần nhất để dự báo ──────────────────
    const recentMonths = months.slice(-3);
    const avgIncome = recentMonths.length > 0
        ? recentMonths.reduce((s, [, v]) => s + v.income, 0) / recentMonths.length
        : 0;
    const avgExpense = recentMonths.length > 0
        ? recentMonths.reduce((s, [, v]) => s + v.expense, 0) / recentMonths.length
        : 0;

    // Xu hướng: so sánh 3 tháng gần nhất vs 3 tháng trước đó
    const prevMonths = months.slice(-6, -3);
    const prevAvgNet = prevMonths.length > 0
        ? prevMonths.reduce((s, [, v]) => s + v.income - v.expense, 0) / prevMonths.length
        : 0;
    const currAvgNet = avgIncome - avgExpense;
    const trend: AIForecastResult['trend'] =
        currAvgNet > prevAvgNet * 1.1 ? 'POSITIVE' :
        currAvgNet < prevAvgNet * 0.9 ? 'NEGATIVE' : 'STABLE';

    // ── 4. Dự báo 3 tháng tiếp theo ─────────────────────────────────────
    const now = new Date();
    let forecastBalance = cumulativeBalance;
    const forecastPoints: ForecastPoint[] = [];

    for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const key = monthKey(futureDate);
        // Dự báo income tăng nhẹ 2%/tháng nếu xu hướng tốt
        const incomeMult = trend === 'POSITIVE' ? 1.02 : trend === 'NEGATIVE' ? 0.98 : 1.0;
        const fIncome = avgIncome * Math.pow(incomeMult, i);
        const fExpense = avgExpense;
        forecastBalance += fIncome - fExpense;
        forecastPoints.push({
            month: key,
            income: 0,
            expense: 0,
            cumulativeBalance: 0,
            forecastIncome: Math.round(fIncome),
            forecastExpense: Math.round(fExpense),
            forecastBalance: Math.round(forecastBalance),
            isFuture: true,
        });
    }

    // ── 5. Insights tự động ───────────────────────────────────────────────
    const insights: string[] = [];
    const alerts: string[] = [];

    const totalIncome = cashflows.filter(c => c.type === 'INCOME').reduce((s, c) => s + c.amount, 0);
    const totalExpense = cashflows.filter(c => c.type === 'EXPENSE').reduce((s, c) => s + c.amount, 0);
    const netBalance = totalIncome - totalExpense;

    if (netBalance > 0) {
        insights.push(`Số dư hiện tại dương: +${(netBalance / 1e6).toFixed(0)}M VNĐ`);
    } else {
        alerts.push(`Số dư âm: ${(netBalance / 1e6).toFixed(0)}M VNĐ — cần chú ý dòng tiền`);
    }

    if (avgExpense > avgIncome * 1.2) {
        alerts.push('Chi tiêu cao hơn thu nhập >20% — rủi ro dòng tiền');
    }

    if (trend === 'POSITIVE') {
        insights.push('Xu hướng dòng tiền tích cực 3 tháng gần nhất');
    } else if (trend === 'NEGATIVE') {
        alerts.push('Xu hướng dòng tiền đang giảm so với quý trước');
    }

    if (avgIncome === 0 && months.length > 2) {
        alerts.push('Chưa có khoản thu — kiểm tra tiến độ thanh toán');
    }

    return {
        chartData: [...historyPoints, ...forecastPoints],
        forecast: {
            nextMonthIncome: Math.round(avgIncome),
            nextMonthExpense: Math.round(avgExpense),
            trend,
            burnRate: Math.round(avgExpense),
            estimatedCompletionMonths: null,
            insights,
            alerts,
        },
    };
}

function fmtM(val: number | undefined) {
    const v = val ?? 0;
    if (v === 0) return '0';
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
    return `${(v / 1e3).toFixed(0)}K`;
}

interface CashFlowForecastProps {
    cashflows: CashFlow[];
}

export default function CashFlowForecast({ cashflows }: CashFlowForecastProps) {
    const { chartData, forecast } = useMemo(() => calcForecast(cashflows), [cashflows]);

    if (chartData.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                Chưa có dữ liệu dòng tiền để dự báo
            </div>
        );
    }

    const trendIcon = forecast.trend === 'POSITIVE'
        ? <TrendingUp className="w-4 h-4 text-emerald-500" />
        : forecast.trend === 'NEGATIVE'
            ? <TrendingDown className="w-4 h-4 text-red-500" />
            : <TrendingUp className="w-4 h-4 text-gray-400" />;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        📊 Dự báo Dòng Tiền <span className="text-xs text-indigo-500 font-normal bg-indigo-50 px-2 py-0.5 rounded-full">Phase 05 ✨AI</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Phân tích xu hướng + dự báo 3 tháng tới (đường nét đứt)</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    {trendIcon}
                    <span className={forecast.trend === 'POSITIVE' ? 'text-emerald-600' : forecast.trend === 'NEGATIVE' ? 'text-red-600' : 'text-gray-500'}>
                        {forecast.trend === 'POSITIVE' ? 'Tích cực' : forecast.trend === 'NEGATIVE' ? 'Giảm dần' : 'Ổn định'}
                    </span>
                </div>
            </div>

            {/* Stats chips */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="text-xs text-green-600 font-medium mb-0.5">Dự báo thu/tháng</div>
                    <div className="text-lg font-bold text-green-700">{fmtM(forecast.nextMonthIncome)}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                    <div className="text-xs text-red-600 font-medium mb-0.5">Dự báo chi/tháng</div>
                    <div className="text-lg font-bold text-red-700">{fmtM(forecast.nextMonthExpense)}</div>
                </div>
                <div className={`rounded-xl p-3 border ${forecast.nextMonthIncome - forecast.nextMonthExpense >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className="text-xs text-gray-600 font-medium mb-0.5">Net dự báo/tháng</div>
                    <div className={`text-lg font-bold ${forecast.nextMonthIncome - forecast.nextMonthExpense >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                        {forecast.nextMonthIncome - forecast.nextMonthExpense >= 0 ? '+' : ''}{fmtM(forecast.nextMonthIncome - forecast.nextMonthExpense)}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={fmtM} tick={{ fontSize: 10 }} width={45} />
                        <Tooltip
                            formatter={(val: number | undefined, name: string | undefined) => [fmtM(val) + ' VNĐ', name ?? '']}
                            contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e5e7eb' }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />

                        {/* Thực tế */}
                        <Area type="monotone" dataKey="income" name="Thu thực tế" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="expense" name="Chi thực tế" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="cumulativeBalance" name="Số dư tích lũy" stroke="#3b82f6" fill="url(#balanceGrad)" strokeWidth={2} dot={false} />

                        {/* Dự báo — nét đứt */}
                        <Area type="monotone" dataKey="forecastBalance" name="Số dư dự báo" stroke="#6366f1" fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Insights & Alerts */}
            {(forecast.insights.length > 0 || forecast.alerts.length > 0) && (
                <div className="space-y-2">
                    {forecast.alerts.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-3 py-2">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            {a}
                        </div>
                    ))}
                    {forecast.insights.map((ins, i) => (
                        <div key={i} className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl px-3 py-2">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            {ins}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
