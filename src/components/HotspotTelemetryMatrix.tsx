import React, { useState, useMemo } from 'react';
import { NearbyNetworksScanResult } from '../layer1_data/nearbyWifiTypes';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { BandBadge } from './StatusBadge';
import {
  IconRfSignalWave,
  IconLock,
  IconUnlock,
  IconAward,
  IconConnect,
  IconCheckCircle,
  IconRefresh,
  IconSearch,
  IconRadar
} from './SvgIcons';
import { ClientTable } from './ClientTable';

interface HotspotTelemetryMatrixProps {
  scanResult: NearbyNetworksScanResult | null;
  isLoading: boolean;
  onRescan: () => void;
  onConnectNetwork?: (ssid: string, password?: string) => Promise<{ success: boolean; message: string }>;
  devices: ClientDevice[];
  diagnoses: Record<string, StructuredDiagnosis>;
  selectedDeviceId: string | null;
  onSelectDevice: (device: ClientDevice) => void;
  onInspectDeviceSubpage: () => void;
}

export const HotspotTelemetryMatrix: React.FC<HotspotTelemetryMatrixProps> = ({
  scanResult,
  isLoading,
  onRescan,
  onConnectNetwork,
  devices,
  diagnoses,
  selectedDeviceId,
  onSelectDevice,
  onInspectDeviceSubpage
}) => {
  const [activeTab, setActiveTab] = useState<'HOTSPOTS' | 'CLIENTS'>('HOTSPOTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [bandFilter, setBandFilter] = useState<'ALL' | '5GHz_6GHz' | '2.4GHz' | 'SAVED' | 'OPEN'>('ALL');
  const [sortBy, setSortBy] = useState<'SCORE' | 'SIGNAL' | 'CHANNEL' | 'SSID'>('SCORE');

  const networks = scanResult?.networks || [];
  const bestNetwork = scanResult?.bestNetwork || null;
  const currentSsid = scanResult?.currentConnectedSsid || null;

  // Filter and sort Hotspots
  const filteredHotspots = useMemo(() => {
    return networks
      .filter(net => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSsid = net.ssid.toLowerCase().includes(q);
          const matchBssid = net.bssid.toLowerCase().includes(q);
          const matchVendor = (net.vendor || '').toLowerCase().includes(q);
          const matchRadio = net.radioType.toLowerCase().includes(q);
          if (!matchSsid && !matchBssid && !matchVendor && !matchRadio) return false;
        }

        // Band / category filter
        if (bandFilter === '5GHz_6GHz') return net.band === '5GHz' || net.band === '6GHz';
        if (bandFilter === '2.4GHz') return net.band === '2.4GHz';
        if (bandFilter === 'SAVED') return net.isSavedProfile;
        if (bandFilter === 'OPEN') return net.authentication.toLowerCase().includes('open') || net.authentication.toLowerCase().includes('none');

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'SCORE') return (b.score?.totalScore || 0) - (a.score?.totalScore || 0);
        if (sortBy === 'SIGNAL') return b.rssi_dBm - a.rssi_dBm;
        if (sortBy === 'CHANNEL') return a.channel - b.channel;
        if (sortBy === 'SSID') return a.ssid.localeCompare(b.ssid);
        return 0;
      });
  }, [networks, searchQuery, bandFilter, sortBy]);

  // Airspace band breakdown
  const bandCounts = useMemo(() => {
    let b24 = 0;
    let b5 = 0;
    let b6 = 0;
    for (const net of networks) {
      if (net.band === '2.4GHz') b24++;
      else if (net.band === '5GHz') b5++;
      else if (net.band === '6GHz') b6++;
    }
    return { b24, b5, b6, total: networks.length };
  }, [networks]);

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E2E5E9] rounded-2xl p-5 shadow-panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
            <IconRfSignalWave size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-black tracking-tight flex items-center gap-2">
              <span>Full RF Telemetry Matrix</span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F0F2F5] text-[#4B5563] border border-[#E2E5E9]">
                {networks.length} Hotspots / APs Detected
              </span>
            </h2>
            <p className="font-mono text-[11.5px] text-[#6B7280]">
              Physical layer telemetry, BSSID mapping, Wireless Quality Index (WQI), and channel congestion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="btn-instrument-secondary text-[12px] py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs"
            onClick={onRescan}
            disabled={isLoading}
          >
            <IconRefresh size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Scanning Airwaves...' : 'Rescan Hotspots'}</span>
          </button>

          <button
            type="button"
            className="btn-instrument-primary text-[12px] py-1.5 px-3.5 rounded-xl shadow-xs"
            onClick={onInspectDeviceSubpage}
          >
            Client Diagnostic Hub &rarr;
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Hotspots */}
        <div className="bg-white border border-[#E2E5E9] rounded-2xl p-4 shadow-card space-y-1">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider">Hotspots in Range</span>
            <IconRadar size={16} />
          </div>
          <div className="text-[22px] font-bold text-black font-mono tracking-tight">
            {networks.length} <span className="text-[12px] font-normal text-[#6B7280]">BSSIDs</span>
          </div>
          <div className="font-mono text-[10.5px] text-[#6B7280] flex items-center gap-1.5">
            <span className="text-black font-semibold">{bandCounts.b5 + bandCounts.b6} High-Speed</span>
            <span>•</span>
            <span>{bandCounts.b24} Legacy 2.4G</span>
          </div>
        </div>

        {/* Card 2: Active Connected Hotspot */}
        <div className="bg-white border border-[#E2E5E9] rounded-2xl p-4 shadow-card space-y-1">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider">Active Hotspot</span>
            <IconCheckCircle size={16} className="text-[#16A34A]" />
          </div>
          <div className="text-[17px] font-bold text-black truncate" title={currentSsid || 'Connected AP'}>
            {currentSsid || 'Active Adapter AP'}
          </div>
          <div className="font-mono text-[10.5px] text-[#16A34A] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span>Currently Associated Station</span>
          </div>
        </div>

        {/* Card 3: Best Quality Hotspot */}
        <div className="bg-white border border-[#E2E5E9] rounded-2xl p-4 shadow-card space-y-1">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider">Optimal WQI Hotspot</span>
            <IconAward size={16} className="text-[#F59E0B]" />
          </div>
          <div className="text-[17px] font-bold text-black truncate" title={bestNetwork?.ssid || 'Optimal Candidate'}>
            {bestNetwork?.ssid || 'Analyzing...'}
          </div>
          <div className="font-mono text-[10.5px] text-[#6B7280]">
            Score: <strong className="text-black">{bestNetwork?.score?.totalScore ?? '--'}/100</strong> (Grade {bestNetwork?.score?.grade ?? 'A'})
          </div>
        </div>

        {/* Card 4: Band Allocation */}
        <div className="bg-white border border-[#E2E5E9] rounded-2xl p-4 shadow-card space-y-1">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider">Frequency Spread</span>
            <IconRfSignalWave size={16} />
          </div>
          <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#F3E8FF] text-[#7E22CE] font-bold border border-[#E9D5FF]">
              6G: {bandCounts.b6}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-bold border border-[#DBEAFE]">
              5G: {bandCounts.b5}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] font-bold border border-[#FEF3C7]">
              2.4G: {bandCounts.b24}
            </span>
          </div>
          <div className="font-mono text-[10px] text-[#6B7280] pt-0.5">
            Cleanest Channels: 36, 48, 149 (5GHz)
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Hotspots Matrix vs Station Clients Matrix */}
      <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'HOTSPOTS'
                ? 'bg-black text-white shadow-xs'
                : 'bg-white text-[#6B7280] border border-[#E2E5E9] hover:text-black hover:bg-[#F8F9FA]'
            }`}
            onClick={() => setActiveTab('HOTSPOTS')}
          >
            <IconRfSignalWave size={15} />
            <span>Detected Hotspots & Access Points ({networks.length})</span>
          </button>

          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'CLIENTS'
                ? 'bg-black text-white shadow-xs'
                : 'bg-white text-[#6B7280] border border-[#E2E5E9] hover:text-black hover:bg-[#F8F9FA]'
            }`}
            onClick={() => setActiveTab('CLIENTS')}
          >
            <IconConnect size={15} />
            <span>Client Station Telemetry ({devices.length})</span>
          </button>
        </div>

        {activeTab === 'HOTSPOTS' && (
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter SSID, BSSID, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-[#E2E5E9] rounded-xl pl-8 pr-3 py-1.5 text-[11.5px] font-mono text-black placeholder-[#9CA3AF] outline-none focus:border-black shadow-subtle transition-all w-52"
              />
              <span className="absolute left-2.5 top-2 text-[#9CA3AF]">
                <IconSearch size={13} />
              </span>
            </div>

            {/* Band Filters */}
            <div className="hidden sm:flex items-center bg-[#F0F2F5] p-1 rounded-xl border border-[#E2E5E9] text-[11px] font-mono font-bold">
              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  bandFilter === 'ALL' ? 'bg-white text-black shadow-xs' : 'text-[#6B7280] hover:text-black'
                }`}
                onClick={() => setBandFilter('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  bandFilter === '5GHz_6GHz' ? 'bg-white text-black shadow-xs' : 'text-[#6B7280] hover:text-black'
                }`}
                onClick={() => setBandFilter('5GHz_6GHz')}
              >
                5G/6G
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  bandFilter === '2.4GHz' ? 'bg-white text-black shadow-xs' : 'text-[#6B7280] hover:text-black'
                }`}
                onClick={() => setBandFilter('2.4GHz')}
              >
                2.4G
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  bandFilter === 'OPEN' ? 'bg-white text-black shadow-xs' : 'text-[#6B7280] hover:text-black'
                }`}
                onClick={() => setBandFilter('OPEN')}
              >
                Open
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-[#E2E5E9] rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-black outline-none focus:border-black shadow-subtle cursor-pointer"
            >
              <option value="SCORE">Sort: WQI Score</option>
              <option value="SIGNAL">Sort: Signal (RSSI)</option>
              <option value="CHANNEL">Sort: Channel</option>
              <option value="SSID">Sort: SSID Name</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: HOTSPOTS MATRIX TABLE */}
      {activeTab === 'HOTSPOTS' && (
        <div className="border border-[#E2E5E9] rounded-2xl bg-white shadow-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="instrument-table w-full">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>RANK</th>
                  <th>HOTSPOT / SSID</th>
                  <th>BSSID (MAC) & VENDOR</th>
                  <th>FREQUENCY BAND</th>
                  <th style={{ textAlign: 'center' }}>CHANNEL</th>
                  <th style={{ textAlign: 'right' }}>SIGNAL (RSSI)</th>
                  <th>STANDARD & SECURITY</th>
                  <th style={{ textAlign: 'center' }}>CONGESTION</th>
                  <th style={{ textAlign: 'right' }}>WQI SCORE</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotspots.length > 0 ? (
                  filteredHotspots.map((net, idx) => {
                    const isCurrent = net.isConnected || net.ssid === currentSsid;
                    const isOptimal = net.score?.isBest || net.rank === 1;
                    const isOpen = net.authentication.toLowerCase().includes('open') || net.authentication.toLowerCase().includes('none');

                    // Score color
                    const scoreVal = net.score?.totalScore ?? 80;
                    const scoreColor = scoreVal >= 85 ? '#16A34A' : scoreVal >= 70 ? '#D97706' : '#DC2626';

                    return (
                      <tr
                        key={`${net.ssid}-${net.bssid}-${idx}`}
                        className={`transition-colors ${
                          isCurrent ? 'bg-[#F0FDF4] font-medium' : isOptimal ? 'bg-[#FFFBEB]/40' : 'hover:bg-[#F8F9FA]'
                        }`}
                      >
                        {/* Rank / Badge */}
                        <td style={{ textAlign: 'center' }}>
                          {isCurrent ? (
                            <span className="inline-block font-mono text-[9.5px] font-bold px-2 py-0.5 bg-[#16A34A] text-white rounded-md">
                              CONNECTED
                            </span>
                          ) : isOptimal ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-bold px-2 py-0.5 bg-[#F59E0B] text-black rounded-md">
                              <IconAward size={11} />
                              <span>#1 BEST</span>
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] font-bold text-[#9CA3AF]">
                              #{net.rank || idx + 1}
                            </span>
                          )}
                        </td>

                        {/* Hotspot Name / SSID */}
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-bold text-black tracking-tight">
                              {net.ssid}
                            </span>
                            {net.isSavedProfile && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#E0E7FF] text-[#4338CA]">
                                SAVED
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10.5px] text-[#6B7280]">
                            {net.score?.recommendationReasons?.[0] || 'Surrounding AP Broadcast'}
                          </div>
                        </td>

                        {/* BSSID & Vendor */}
                        <td>
                          <div className="font-mono text-[12px] text-[#1F2937] font-semibold">
                            {net.bssid}
                          </div>
                          <div className="font-mono text-[10.5px] text-[#6B7280]">
                            {net.vendor || 'Standard IEEE Access Point'}
                          </div>
                        </td>

                        {/* Band */}
                        <td>
                          <BandBadge band={net.band} />
                        </td>

                        {/* Channel & Width */}
                        <td style={{ textAlign: 'center' }} className="font-mono text-[12px] text-black font-semibold">
                          Ch {net.channel}
                          <div className="text-[9.5px] text-[#6B7280] font-normal">
                            {net.band === '6GHz' ? '160 MHz' : net.band === '5GHz' ? '80 MHz' : '20 MHz'}
                          </div>
                        </td>

                        {/* Signal (RSSI) */}
                        <td style={{ textAlign: 'right' }}>
                          <div
                            className="font-mono text-[12.5px] font-bold"
                            style={{
                              color: net.rssi_dBm >= -60 ? '#16A34A' : net.rssi_dBm >= -72 ? '#D97706' : '#DC2626'
                            }}
                          >
                            {net.rssi_dBm} dBm
                          </div>
                          <div className="flex items-center justify-end gap-1.5 pt-0.5">
                            <div className="w-14 h-1.5 bg-[#E2E5E9] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(10, net.signalPct))}%`,
                                  backgroundColor: net.signalPct >= 70 ? '#16A34A' : net.signalPct >= 45 ? '#D97706' : '#DC2626'
                                }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-[#6B7280]">{net.signalPct}%</span>
                          </div>
                        </td>

                        {/* Radio Standard & Security */}
                        <td>
                          <div className="font-mono text-[11.5px] text-black font-semibold">
                            {net.radioType || (net.band === '6GHz' ? '802.11be (Wi-Fi 7)' : net.band === '5GHz' ? '802.11ax (Wi-Fi 6)' : '802.11n')}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[10.5px] text-[#6B7280]">
                            {isOpen ? (
                              <span className="inline-flex items-center gap-1 text-[#D97706] font-semibold">
                                <IconUnlock size={11} /> Open
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#4B5563]">
                                <IconLock size={11} /> {net.authentication || 'WPA2-Personal'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Congestion */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
                            style={{
                              backgroundColor: net.channelUtilizationPct < 30 ? '#F0FDF4' : net.channelUtilizationPct < 60 ? '#FEF3C7' : '#FEF2F2',
                              color: net.channelUtilizationPct < 30 ? '#16A34A' : net.channelUtilizationPct < 60 ? '#D97706' : '#DC2626',
                              borderColor: net.channelUtilizationPct < 30 ? '#BBF7D0' : net.channelUtilizationPct < 60 ? '#FDE68A' : '#FECACA'
                            }}
                          >
                            {net.channelUtilizationPct < 30 ? 'LOW' : net.channelUtilizationPct < 60 ? 'MODERATE' : 'CONGESTED'} ({net.channelUtilizationPct}%)
                          </span>
                        </td>

                        {/* WQI Score */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-[13px] font-bold" style={{ color: scoreColor }}>
                              {scoreVal}/100
                            </span>
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10.5px] font-bold text-white shadow-xs"
                              style={{ backgroundColor: scoreColor }}
                            >
                              {net.score?.grade || 'A'}
                            </span>
                          </div>
                          {net.score?.throughputMultiplier && net.score.throughputMultiplier > 1 && (
                            <div className="font-mono text-[9.5px] text-[#16A34A] font-bold">
                              +{((net.score.throughputMultiplier - 1) * 100).toFixed(0)}% Speed
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'center' }}>
                          {isCurrent ? (
                            <span className="font-mono text-[10.5px] font-bold text-[#16A34A] px-2.5 py-1 bg-white border border-[#BBF7D0] rounded-lg">
                              Active
                            </span>
                          ) : onConnectNetwork ? (
                            <button
                              type="button"
                              className="btn-instrument-secondary text-[10.5px] py-1 px-3 rounded-lg shadow-xs hover:border-black font-semibold"
                              onClick={() => onConnectNetwork(net.ssid)}
                            >
                              Connect
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] text-[#9CA3AF]">Available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-[#6B7280] font-mono text-[12.5px] bg-[#F8F9FA]">
                      {isLoading ? 'Scanning all local Wi-Fi frequencies and BSSIDs...' : 'No Hotspots matching your filter criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CLIENT STATIONS MATRIX */}
      {activeTab === 'CLIENTS' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl flex items-center justify-between text-[12px] font-mono">
            <span className="text-[#3B4045]">
              Connected Stations & Network Endpoints Telemetry Matrix
            </span>
            <span className="font-bold text-black">{devices.length} Station(s) Online</span>
          </div>

          <ClientTable
            devices={devices}
            diagnoses={diagnoses}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={onSelectDevice}
          />
        </div>
      )}
    </div>
  );
};
