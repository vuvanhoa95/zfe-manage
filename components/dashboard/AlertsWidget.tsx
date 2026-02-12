'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'deadline' | 'overdue' | 'low-cash' | 'pending-quotation';
  title: string;
  message: string;
  link?: string;
  severity: 'high' | 'medium' | 'low';
  date?: Date;
}

export default function AlertsWidget() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const response = await fetch('/api/dashboard/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🔔 Thông báo</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🔔 Thông báo</h3>
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Không có thông báo mới</p>
        </div>
      </div>
    );
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'deadline':
      case 'overdue':
        return <Clock className="w-5 h-5" />;
      case 'low-cash':
        return <DollarSign className="w-5 h-5" />;
      case 'pending-quotation':
        return <FileText className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🔔 Thông báo</h3>
        <span className="text-sm text-gray-500">{alerts.length} mục</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${getAlertColor(alert.severity)} transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1">{alert.title}</h4>
                <p className="text-sm opacity-90">{alert.message}</p>
                {alert.date && (
                  <p className="text-xs mt-1 opacity-75">
                    {format(new Date(alert.date), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                )}
              </div>
              {alert.link && (
                <Link
                  href={alert.link}
                  className="flex-shrink-0 text-sm font-medium hover:underline"
                >
                  Xem →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
