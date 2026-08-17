import React from 'react';

interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  points,
  width = 64,
  height = 16,
  color = '#1A1C1C'
}) => {
  if (!points || points.length < 2) return null;

  const n = points.length;
  const step = width / (n - 1);
  const pathD = points.reduce((acc, val, idx) => {
    const x = idx * step;
    const y = height - val * (height - 4) - 2; // invert y for SVG coordinate system
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  const lastX = (n - 1) * step;
  const lastY = height - points[n - 1] * (height - 4) - 2;

  return (
    <svg width={width} height={height} className="inline-block align-middle overflow-visible">
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
};
