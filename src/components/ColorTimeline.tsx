import React from 'react';

interface ColorTimelineProps {
  colors: {
    jan?: string | null;
    feb?: string | null;
    mar?: string | null;
    apr?: string | null;
    may?: string | null;
    jun?: string | null;
    jul?: string | null;
    aug?: string | null;
    sep?: string | null;
    oct?: string | null;
    nov?: string | null;
    dec?: string | null;
  };
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const MONTHS = [
  { key: 'jan', label: 'Jan' },
  { key: 'feb', label: 'Feb' },
  { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Apr' },
  { key: 'may', label: 'May' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'aug', label: 'Aug' },
  { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Oct' },
  { key: 'nov', label: 'Nov' },
  { key: 'dec', label: 'Dec' },
];

export const ColorTimeline: React.FC<ColorTimelineProps> = ({
  colors,
  showLabels = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const hasAnyColor = MONTHS.some(
    (month) => colors[month.key as keyof typeof colors]
  );

  if (!hasAnyColor) {
    return null;
  }

  return (
    <div className="space-y-2">
      {showLabels && (
        <div className="text-xs text-gray-400 font-medium">Seasonal Colors</div>
      )}
      <div className="flex gap-1.5">
        {MONTHS.map((month) => {
          const color = colors[month.key as keyof typeof colors];
          const hasColor = color && color !== '';

          if (!hasColor) {
            return (
              <div
                key={month.key}
                className={`${sizeClasses[size]} rounded-full border-2 border-gray-500 bg-transparent relative flex items-center justify-center`}
                title={`${month.label}: No color`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="absolute w-full h-full"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="6" y1="6" x2="18" y2="18" className="text-gray-500" />
                </svg>
              </div>
            );
          }

          return (
            <div
              key={month.key}
              className={`${sizeClasses[size]} rounded-full border-2 border-zinc-700 shadow-sm transition-all`}
              style={{
                backgroundColor: color,
              }}
              title={`${month.label}: ${color}`}
            />
          );
        })}
      </div>
    </div>
  );
};
