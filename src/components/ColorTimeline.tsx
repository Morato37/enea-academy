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
  colors2?: {
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
  colors2,
  showLabels = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const hasAnyColor = MONTHS.some(
    (month) => colors[month.key as keyof typeof colors] || (colors2 && colors2[month.key as keyof typeof colors2])
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
          const color2 = colors2 ? colors2[month.key as keyof typeof colors2] : undefined;
          const hasColor = color && color !== '';
          const hasColor2 = color2 && color2 !== '';

          if (!hasColor && !hasColor2) {
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

          if (hasColor && hasColor2) {
            return (
              <div
                key={month.key}
                className={`${sizeClasses[size]} rounded-full border-2 border-zinc-700 shadow-sm transition-all overflow-hidden relative`}
                title={`${month.label}: ${color} / ${color2}`}
              >
                <div className="absolute inset-0" style={{ backgroundColor: color }} />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: color2 as string,
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  }}
                />
              </div>
            );
          }

          const activeColor = hasColor ? color : color2;
          return (
            <div
              key={month.key}
              className={`${sizeClasses[size]} rounded-full border-2 border-zinc-700 shadow-sm transition-all`}
              style={{
                backgroundColor: activeColor ?? undefined,
              }}
              title={`${month.label}: ${activeColor}`}
            />
          );
        })}
      </div>
    </div>
  );
};
