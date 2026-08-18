import React, { useEffect, useState, useMemo } from 'react';
import { fetchNetworkHealthTimeline, HealthSnapshotItem } from '../layer1_data/supabaseService';
import { isSupabaseConfigured } from '../layer1_data/supabaseClient';
import { IconDashboard, IconRefresh, IconSparkles } from './SvgIcons';

interface NetworkHealthHistoryChartProps {
  onOpenSupabaseModal?: () => void;
}

export const NetworkHealthHistoryChart: React.FC<NetworkHealthHistoryChartProps> = ({
  onOpenSupabaseModal
}) => {
  const [history, setHistory] = useState<HealthSnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isConfigured = isSupabaseConfigured();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNetworkHealthTimeline(30);
      setHistory(data);
    } catch (err) {
      console.error('[WaveScope] Failed to fetch health history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute summary statistics
  const stats = useMemo(() => {
    if (history.length === 0) return { current: 100, min: 100, max: 100, avg: 100 };
    const scores = history.map(h => h.healthScore);
    const current = scores[scores.length - 1];
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { current, min, max, avg };
  }, [history]);

  // Chart dimensions & SVG path generation
  const width = 800;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (history.length === 0) return [];
    return history.map((item, idx) => {
      const x = padding.left + (idx / Math.max(1, history.length - 1)) * innerWidth;
      // Y maps 0-100 to innerHeight-0
      const score = Math.max(0, Math.min(100, item.healthScore));
      const y = padding.top + innerHeight - (score / 100) * innerHeight;
      return { x, y, score, timestamp: item.timestamp, item };
    });
  }, [history, innerWidth, innerHeight]);

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((path, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = padding.top + innerHeight;
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [points, linePath, innerHeight]);

  return (
    <div className="bg-white border border-[#E2E5E9] rounded-2xl p-6 shadow-panel space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E5E9] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-card">
              <IconDashboard size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-black tracking-tight">
                  Network Health Score Over Time
                </h2>
                <span className="badge-status font-mono text-[10px] bg-[#F8F9FA] text-black border-[#E2E5E9]">
                  Supabase History
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#6B7280]">
                Continuous fleet aggregate health scoring (0–100) recorded to Supabase
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status summary pills */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2.5 py-1 bg-[#F8F9FA] border border-[#E2E5E9] rounded-lg text-black">
              Avg: <strong>{stats.avg}/100</strong>
            </span>
            <span className="px-2.5 py-1 bg-[#F8F9FA] border border-[#E2E5E9] rounded-lg text-black">
              Min: <strong>{stats.min}</strong> &bull; Max: <strong>{stats.max}</strong>
            </span>
          </div>

          <button
            type="button"
            className="btn-instrument-secondary text-[11.5px] py-1.5 px-2.5 rounded-xl cursor-pointer"
            onClick={loadData}
            title="Refresh historical timeline"
          >
            <IconRefresh size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {!isConfigured && onOpenSupabaseModal && (
            <button
              type="button"
              className="text-[11px] font-mono font-bold px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-lg hover:bg-[#FDE68A] cursor-pointer transition-colors"
              onClick={onOpenSupabaseModal}
            >
              ⚙ Setup Supabase
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      {points.length >= 2 ? (
        <div className="relative">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44 font-mono text-[10px] select-none"
            >
              {/* Horizontal Grid lines at 25, 50, 75, 100 */}
              {[0, 25, 50, 75, 100].map(val => {
                const y = padding.top + innerHeight - (val / 100) * innerHeight;
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#ECEEF1"
                      strokeDasharray={val === 0 || val === 100 ? '' : '3 3'}
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fill="#9CA3AF"
                      className="text-[9.5px]"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              <defs>
                <linearGradient id="healthScoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F1113" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0F1113" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              <path d={areaPath} fill="url(#healthScoreGrad)" />
              <path
                d={linePath}
                fill="none"
                stroke="#0F1113"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {points.map((pt, i) => {
                const isHovered = hoveredIndex === i;
                const pointColor = pt.score >= 80 ? '#16A34A' : pt.score >= 60 ? '#D97706' : '#DC2626';

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Invisible larger hover target */}
                    <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
                    {/* Visual dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? '6' : '3.5'}
                      fill="white"
                      stroke={pointColor}
                      strokeWidth={isHovered ? '2.5' : '2'}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Hover Tooltip Overlay */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="absolute top-2 p-2.5 bg-black text-white rounded-xl shadow-panel font-mono text-[11px] pointer-events-none transition-all z-20 space-y-1"
              style={{
                left: `${Math.max(10, Math.min(85, (points[hoveredIndex].x / width) * 100))}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="font-bold flex items-center gap-2">
                <span>Score: {points[hoveredIndex].score}/100</span>
                <span
                  className="px-1.5 py-0.2 rounded text-[9px]"
                  style={{
                    backgroundColor:
                      points[hoveredIndex].score >= 80 ? '#16A34A' : points[hoveredIndex].score >= 60 ? '#D97706' : '#DC2626'
                  }}
                >
                  {points[hoveredIndex].score >= 80 ? 'Optimal' : points[hoveredIndex].score >= 60 ? 'Attention' : 'Critical'}
                </span>
              </div>
              <div className="text-[9.5px] opacity-75">
                {new Date(points[hoveredIndex].timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Bottom Time Range Indicators */}
          <div className="flex items-center justify-between font-mono text-[10.5px] text-[#6B7280] pt-1 px-1">
            <span>First: {new Date(points[0].timestamp).toLocaleTimeString()}</span>
            <span>{points.length} Historical Snapshots</span>
            <span>Latest: {new Date(points[points.length - 1].timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      ) : (
        /* Empty / Collecting State */
        <div className="p-8 bg-[#F8F9FA] border border-dashed border-[#E2E5E9] rounded-xl text-center space-y-2">
          <div className="inline-block animate-pulse text-[#6B7280]">
            <IconSparkles size={24} />
          </div>
          <div className="text-[13px] font-bold text-black">
            Collecting Historical Session Telemetry...
          </div>
          <p className="font-mono text-[11.5px] text-[#6B7280] max-w-md mx-auto">
            WaveScope is polling live fleet diagnostics and streaming 30-second health snapshots to Supabase. The timeline chart will populate automatically as readings accumulate.
          </p>
        </div>
      )}
    </div>
  );
};
