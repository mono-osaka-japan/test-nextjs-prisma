'use client';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'line';
  height?: number;
  color?: string;
}

export function Chart({
  title,
  data,
  type = 'bar',
  height = 200,
  color = '#3b82f6',
}: ChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          データがありません
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const padding = 40;
  const chartWidth = 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1={padding}
              y1={height - padding - ((height - 2 * padding) * percent) / 100}
              x2={chartWidth - 10}
              y2={height - padding - ((height - 2 * padding) * percent) / 100}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={0.5}
            />
          ))}

          {type === 'bar' ? (
            // Bar chart
            data.map((point, index) => {
              const barWidth =
                (chartWidth - padding - 10) / data.length - 4;
              const barHeight =
                maxValue > 0
                  ? (point.value / maxValue) * (height - 2 * padding)
                  : 0;
              const x = padding + index * ((chartWidth - padding - 10) / data.length) + 2;
              const y = height - padding - barHeight;

              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    rx={2}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                  <title>
                    {point.label}: {point.value}
                  </title>
                </g>
              );
            })
          ) : (
            // Line chart
            <>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth={2}
                points={data
                  .map((point, index) => {
                    const x =
                      padding +
                      (index * (chartWidth - padding - 10)) / (data.length - 1 || 1);
                    const y =
                      maxValue > 0
                        ? height -
                          padding -
                          (point.value / maxValue) * (height - 2 * padding)
                        : height - padding;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
              {data.map((point, index) => {
                const x =
                  padding +
                  (index * (chartWidth - padding - 10)) / (data.length - 1 || 1);
                const y =
                  maxValue > 0
                    ? height -
                      padding -
                      (point.value / maxValue) * (height - 2 * padding)
                    : height - padding;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r={3}
                      fill={color}
                      className="transition-all duration-300 hover:r-4"
                    />
                    <title>
                      {point.label}: {point.value}
                    </title>
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10 text-xs text-gray-500 dark:text-gray-400">
          {data.map((point, index) => (
            <span key={index} className="truncate max-w-[60px]">
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
