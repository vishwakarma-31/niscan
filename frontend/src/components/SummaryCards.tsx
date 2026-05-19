import { LayoutDashboard, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import type { PolicySummary as PolicySummaryType } from '@/types/policy.types';

interface SummaryCardsProps {
  summary: PolicySummaryType | null;
  isLoading: boolean;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Policies',
      key: 'total',
      icon: LayoutDashboard,
      borderColor: 'border-slate-600',
      iconColor: 'text-gray-600',
    },
    {
      label: 'Active',
      key: 'active',
      icon: ShieldCheck,
      borderColor: 'border-green-500',
      iconColor: 'text-green-400',
    },
    {
      label: 'Pending',
      key: 'pending',
      icon: Clock,
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-400',
    },
    {
      label: 'Expired / Cancelled',
      key: 'expired',
      icon: AlertCircle,
      borderColor: 'border-red-500',
      iconColor: 'text-red-400',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="card p-5 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded bg-gray-200 ${card.borderColor} border`} />
              <div>
                <div className="h-8 w-12 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200/50 rounded mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const expiredCount = (summary?.expired || 0) + (summary?.cancelled || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value =
          card.key === 'total'
            ? summary?.total ?? 0
            : card.key === 'active'
            ? summary?.active ?? 0
            : card.key === 'pending'
            ? summary?.pending ?? 0
            : expiredCount;

        return (
          <div
            key={card.key}
            className={`card p-5 border-l-4 ${card.borderColor}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded bg-gray-200/50 flex items-center justify-center ${card.iconColor}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{value.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}