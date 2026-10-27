import React from 'react';

export type StatusType = 'online' | 'standby' | 'warning' | 'offline' | 'unconfigured';

interface StatusDotProps {
  status: StatusType;
  label?: string;
  showPing?: boolean;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, label, showPing = false }) => {
  const colorMap: Record<StatusType, { bg: string; dot: string; ping: string; text: string }> = {
    online: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      ping: 'bg-emerald-400',
      text: 'text-emerald-700',
    },
    standby: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      ping: 'bg-amber-400',
      text: 'text-amber-700',
    },
    warning: {
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      dot: 'bg-orange-500',
      ping: 'bg-orange-400',
      text: 'text-orange-700',
    },
    offline: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      ping: 'bg-rose-400',
      text: 'text-rose-700',
    },
    unconfigured: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      ping: 'bg-slate-300',
      text: 'text-slate-600',
    },
  };

  const style = colorMap[status] || colorMap.unconfigured;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg}`}>
      <span className="relative flex h-2 w-2">
        {showPing && status === 'online' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.ping}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
};
