import React, { useState, useEffect } from 'react';
import { ClientDevice } from '../layer1_data/types';
import {
  fetchDeviceUptime,
  fetchDeviceEventsLog,
  DeviceUptimeStats,
  ConnectionEventItem
} from '../layer1_data/supabaseService';
import { isSupabaseConfigured } from '../layer1_data/supabaseClient';
import {
  IconHistory,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
  IconCheckBox,
  IconClock
} from './SvgIcons';

interface DeviceHistoricalEventsSectionProps {
  device: ClientDevice;
  onOpenSupabaseModal?: () => void;
}

export const DeviceHistoricalEventsSection: React.FC<DeviceHistoricalEventsSectionProps> = ({
  device,
  onOpenSupabaseModal
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [uptimeStats, setUptimeStats] = useState<DeviceUptimeStats | null>(null);
  const [eventsLog, setEventsLog] = useState<ConnectionEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isConfigured = isSupabaseConfigured();

  const loadDeviceHistory = async () => {
    if (!device.macAddress) return;
    setIsLoading(true);
    try {
      const [uptime, events] = await Promise.all([
        fetchDeviceUptime(device.macAddress),
        fetchDeviceEventsLog(device.macAddress, 15)
      ]);
      setUptimeStats(uptime);
      setEventsLog(events);
    } catch (err) {
      console.error('[WaveScope] Failed to load device history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceHistory();
    const interval = setInterval(loadDeviceHistory, 12000);
    return () => clearInterval(interval);
  }, [device.macAddress]);

  const uptime = uptimeStats?.uptimePct ?? 100;
  const downtime = uptimeStats?.downtimePct ?? 0;

  return (
    <div className="border border-[#E2E5E9] rounded-2xl bg-white p-6 space-y-4 shadow-panel transition-all">
      {/* Expandable Section Header */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-card flex-shrink-0">
            <IconHistory size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-black tracking-tight">
                Historical Connection & Uptime Tracking
              </span>
              <span className="badge-status font-mono text-[9.5px] bg-[#F8F9FA] text-black border-[#E2E5E9]">
                Supabase
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#6B7280]">
              Session uptime metrics & connect/disconnect event log for {device.hostname}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Uptime Quick Pill */}
          <span
            className="font-mono text-[11.5px] font-bold px-2.5 py-1 rounded-lg border"
            style={{
              backgroundColor: uptime >= 98 ? '#F0FDF4' : uptime >= 90 ? '#FEF3C7' : '#FEF2F2',
              color: uptime >= 98 ? '#16A34A' : uptime >= 90 ? '#D97706' : '#DC2626',
              borderColor: uptime >= 98 ? '#BBF7D0' : uptime >= 90 ? '#FDE68A' : '#FECACA'
            }}
          >
            {uptime}% Uptime
          </span>

          <button
            type="button"
            className="p-1 rounded-lg hover:bg-[#F8F9FA] text-[#6B7280]"
            onClick={(e) => {
              e.stopPropagation();
              loadDeviceHistory();
            }}
            title="Refresh history"
          >
            <IconRefresh size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <span className="text-[#6B7280]">
            {isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-[#E2E5E9] animate-fade-in">
          {/* Uptime vs Downtime Metrics Bar */}
          <div className="p-4 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
              <span className="text-[#16A34A] flex items-center gap-1.5">
                <IconCheckBox size={13} />
                Session Uptime: {uptime}%
              </span>
              <span className="text-[#DC2626]">
                Downtime: {downtime}%
              </span>
            </div>

            {/* Split Progress Bar */}
            <div className="h-2.5 w-full bg-[#E2E5E9] rounded-full overflow-hidden flex">
              <div
                className="bg-[#16A34A] h-full transition-all duration-500"
                style={{ width: `${uptime}%` }}
                title={`Uptime: ${uptime}%`}
              />
              <div
                className="bg-[#DC2626] h-full transition-all duration-500"
                style={{ width: `${downtime}%` }}
                title={`Downtime: ${downtime}%`}
              />
            </div>

            <div className="flex items-center justify-between font-mono text-[10.5px] text-[#6B7280]">
              <span>Logged Readings: <strong className="text-black">{uptimeStats?.totalReadingsCount ?? 0}</strong></span>
              <span>Events Logged: <strong className="text-black">{uptimeStats?.totalEventsCount ?? eventsLog.length}</strong></span>
              <span>Session Duration: <strong className="text-black">~{uptimeStats?.totalMonitoredMinutes ?? 1}m</strong></span>
            </div>
          </div>

          {/* Chronological Disconnect / Reconnect Event Log */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center justify-between">
              <span>Connection Transition Events</span>
              <span className="font-mono text-[10px] text-[#6B7280]">Latest {eventsLog.length} Transitions</span>
            </div>

            {eventsLog.length > 0 ? (
              <div className="divide-y divide-[#E2E5E9] border border-[#E2E5E9] rounded-xl bg-white overflow-hidden font-mono text-[11px]">
                {eventsLog.map((ev) => {
                  const isConnect = ev.eventType === 'connect';
                  return (
                    <div
                      key={ev.id}
                      className="p-3 flex items-center justify-between hover:bg-[#F8F9FA] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border"
                          style={{
                            backgroundColor: isConnect ? '#F0FDF4' : '#FEF2F2',
                            color: isConnect ? '#16A34A' : '#DC2626',
                            borderColor: isConnect ? '#BBF7D0' : '#FECACA'
                          }}
                        >
                          {ev.eventType}
                        </span>
                        <span className="text-black font-medium">
                          {isConnect ? 'Station associated with Access Point' : 'Station disassociated / packet loss'}
                        </span>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="text-black font-bold">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-[9.5px] text-[#6B7280]">
                          {ev.durationSincePrevFormatted}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#F8F9FA] border border-dashed border-[#E2E5E9] rounded-xl text-center font-mono text-[11.5px] text-[#6B7280] space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-black font-semibold">
                  <IconClock size={14} />
                  <span>Logging session events into Supabase...</span>
                </div>
                <p className="text-[10.5px]">
                  Transitions between connected and absent states will be stamped and logged here automatically.
                </p>
                {!isConfigured && onOpenSupabaseModal && (
                  <button
                    type="button"
                    className="inline-block text-[11px] font-bold px-3 py-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-lg hover:bg-[#FDE68A] cursor-pointer transition-colors"
                    onClick={onOpenSupabaseModal}
                  >
                    ⚙ Connect Supabase Project
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
