import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  iconBgColor = 'bg-[#10243a]',
  iconTextColor = 'text-[#38bdf8]',
  isActive = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-colors ${
        isActive
          ? 'bg-[#0c151a] border-emerald-500/80 shadow-sm shadow-emerald-500/10'
          : 'bg-[#0d1218] border-[#17232e] hover:border-[#243647]'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-slate-100 leading-tight font-mono">
          {value}
        </p>
        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
};
