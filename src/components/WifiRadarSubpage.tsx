import React, { useState, useMemo, useEffect } from 'react';
import { NearbyNetworksScanResult, ScoredNetwork } from '../layer1_data/nearbyWifiTypes';
import {
  IconRfSignalWave,
  IconRefresh,
  IconLock,
  IconUnlock,
  IconConnect,
  IconAward,
  IconCheckCircle,
  IconAlertTriangle,
  IconSparkles
} from './SvgIcons';

interface WifiRadarSubpageProps {
  scanResult: NearbyNetworksScanResult | null;
  isLoading: boolean;
  onRescan: () => void;
  onConnectNetwork: (ssid: string, password?: string) => Promise<{ success: boolean; message: string }>;
  isSimulation: boolean;
  isEasyMode: boolean;
  onBack: () => void;
}

export const WifiRadarSubpage: React.FC<WifiRadarSubpageProps> = ({
  scanResult,
  isLoading,
  onRescan,
  onConnectNetwork,
  isSimulation,
  isEasyMode,
  onBack
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FAST_BANDS' | 'SAVED' | 'OPEN'>('ALL');
  const [connectingSsid, setConnectingSsid] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [promptSsid, setPromptSsid] = useState<ScoredNetwork | null>(null);
  const [passphraseInput, setPassphraseInput] = useState('');

  // Automatically trigger rescan on mount if no scan data is loaded
  useEffect(() => {
    if (!scanResult && !isLoading) {
      onRescan();
    }
  }, [scanResult, isLoading, onRescan]);

  const networks = scanResult?.networks || [];
  const bestNetwork = scanResult?.bestNetwork || null;

  const filteredNetworks = useMemo(() => {
    return networks.filter(net => {
      if (filter === 'FAST_BANDS') return net.band === '5GHz' || net.band === '6GHz';
      if (filter === 'SAVED') return net.isSavedProfile;
      if (filter === 'OPEN') return net.authentication.toLowerCase().includes('open') || net.authentication.toLowerCase().includes('none');
      return true;
    });
  }, [networks, filter]);

  const handleInitiateConnect = async (net: ScoredNetwork) => {
    const isOpenAuth = net.authentication.toLowerCase().includes('open') || net.authentication.toLowerCase().includes('none');
    if (!isSimulation && !net.isSavedProfile && !isOpenAuth) {
      setPromptSsid(net);
      setPassphraseInput('');
      return;
    }

    await executeConnect(net.ssid);
  };

  const executeConnect = async (ssid: string, password?: string) => {
    setConnectingSsid(ssid);
    setConnectionMessage(null);
    setPromptSsid(null);

    try {
      const res = await onConnectNetwork(ssid, password);
      if (res.success) {
        setConnectionMessage({
          type: 'success',
          text: res.message || `Successfully connected to "${ssid}"!`
        });
      } else {
        setConnectionMessage({
          type: 'error',
          text: res.message || `Could not connect to "${ssid}". Check credentials.`
        });
      }
    } catch (err: any) {
      setConnectionMessage({
        type: 'error',
        text: err.message || `Connection attempt failed.`
      });
    } finally {
      setConnectingSsid(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Subpage Header & Breadcrumb */}
      <div className="bg-white border border-[#E2E5E9] rounded-2xl p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="btn-instrument-secondary text-[12px] py-1.5 px-3 rounded-xl flex items-center gap-1 font-semibold cursor-pointer"
              onClick={onBack}
            >
              &larr; Back to Overview
            </button>
            <div className="h-6 w-px bg-[#E2E5E9]"></div>
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#16A34A]/30 text-[#16A34A] flex items-center justify-center shadow-xs">
              <IconRfSignalWave size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[20px] font-bold text-black tracking-tight">
                  {isEasyMode ? 'Find the Best & Fastest Wi-Fi' : 'Surrounding Wi-Fi Radar & Finder'}
                </h1>
                <span className="badge-status font-mono text-[10px] bg-[#F8F9FA] text-black border-[#E2E5E9]">
                  {isSimulation ? 'SIMULATION TESTBED (7 NETWORKS)' : 'LIVE OS SCAN'}
                </span>
              </div>
              <p className="font-mono text-[11.5px] text-[#6B7280] mt-0.5">
                {isEasyMode
                  ? 'Automatically scores every nearby network and connects you to the fastest Wi-Fi.'
                  : 'Evaluates signal, spectrum band, channel load & encryption using deterministic Wi-Fi Quality Index (WQI)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-instrument-primary text-[11.5px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-card cursor-pointer"
              onClick={onRescan}
              disabled={isLoading}
            >
              <IconRefresh size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>{isLoading ? 'Scanning Airwaves...' : 'Rescan Airwaves'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Alert */}
      {connectionMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-[13px] font-medium shadow-subtle ${
            connectionMessage.type === 'success'
              ? 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A]'
              : 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {connectionMessage.type === 'success' ? <IconCheckCircle size={18} /> : <IconAlertTriangle size={18} />}
            <span>{connectionMessage.text}</span>
          </div>
          <button
            type="button"
            className="text-[12px] font-bold underline cursor-pointer"
            onClick={() => setConnectionMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Banner */}
      {isLoading && (
        <div className="p-8 bg-white border border-[#E2E5E9] rounded-2xl text-center space-y-3 shadow-card animate-pulse">
          <div className="inline-block animate-spin text-black">
            <IconRefresh size={28} />
          </div>
          <h3 className="text-[16px] font-bold text-black">Scanning Local 2.4GHz, 5GHz & 6GHz Airwaves...</h3>
          <p className="font-mono text-[11.5px] text-[#6B7280]">
            Probing Wi-Fi beacon frames, measuring channel utilization, and computing WQI scores.
          </p>
        </div>
      )}

      {/* SPOTLIGHT CARD: #1 Recommended Best Network */}
      {bestNetwork && !isLoading && (
        <div className="p-6 rounded-2xl border-2 border-[#16A34A] bg-[#F0FDF4]/50 shadow-panel relative overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3 flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge-status text-[10.5px] font-bold bg-[#16A34A] text-white border-[#16A34A] px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs">
                  <IconAward size={13} />
                  #1 RECOMMENDED BEST WI-FI NETWORK
                </span>
                <span className="font-mono text-[11.5px] text-[#6B7280]">
                  {bestNetwork.vendor || 'Discovered AP Hardware'}
                </span>
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-[26px] font-bold text-black tracking-tight">{bestNetwork.ssid}</h2>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2.5 py-1 bg-white border border-[#E2E5E9] rounded-lg font-bold text-black shadow-xs">
                    {bestNetwork.band}
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#E2E5E9] rounded-lg text-[#3B4045] shadow-xs">
                    Channel {bestNetwork.channel}
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#E2E5E9] rounded-lg text-[#3B4045] shadow-xs">
                    {bestNetwork.radioType}
                  </span>
                </div>
              </div>

              {/* Reasons Bullets */}
              <div className="space-y-1.5 pt-1">
                {bestNetwork.score.recommendationReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-[13px] text-[#3B4045] font-sans">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score & Action Column */}
            <div className="flex flex-col items-end gap-3.5 flex-shrink-0">
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#16A34A]/30 shadow-card">
                <div className="text-right">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#6B7280]">Wi-Fi Quality Index</div>
                  <div className="font-mono text-[22px] font-bold text-[#16A34A] leading-tight">
                    {bestNetwork.score.totalScore}<span className="text-[13px] text-[#6B7280]">/100</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#16A34A] text-white font-bold text-[16px] flex items-center justify-center shadow-xs">
                  {bestNetwork.score.grade}
                </div>
              </div>

              {bestNetwork.isConnected ? (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl text-[13px] font-bold shadow-card">
                  <IconCheckCircle size={16} />
                  <span>Currently Connected</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-instrument-primary py-3 px-6 text-[13.5px] rounded-xl shadow-panel hover:scale-[1.02] flex items-center gap-2 transition-all cursor-pointer"
                  onClick={() => handleInitiateConnect(bestNetwork)}
                  disabled={connectingSsid === bestNetwork.ssid}
                >
                  <IconConnect size={16} />
                  <span>{connectingSsid === bestNetwork.ssid ? 'Connecting...' : 'Connect to Best Network'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spectrum Analysis Comparison Delta */}
      {scanResult?.comparisonSummary && !isLoading && (
        <div className="p-4 bg-white border border-[#E2E5E9] rounded-2xl text-[13.5px] text-black leading-relaxed font-sans shadow-card flex items-start gap-3">
          <span className="text-[18px] flex-shrink-0">⚡</span>
          <div>
            <strong className="text-black">Spectrum Advantage: </strong>
            <span>{scanResult.comparisonSummary}</span>
          </div>
        </div>
      )}

      {/* Leaderboard & Filter Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-2">
            <IconSparkles size={16} />
            <span>Nearby Reachable Networks Leaderboard ({filteredNetworks.length})</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-[#6B7280] border-[#E2E5E9] hover:border-black'
              }`}
              onClick={() => setFilter('ALL')}
            >
              All ({networks.length})
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filter === 'FAST_BANDS'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-[#6B7280] border-[#E2E5E9] hover:border-black'
              }`}
              onClick={() => setFilter('FAST_BANDS')}
            >
              5GHz & 6GHz ({networks.filter(n => n.band !== '2.4GHz').length})
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filter === 'SAVED'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-[#6B7280] border-[#E2E5E9] hover:border-black'
              }`}
              onClick={() => setFilter('SAVED')}
            >
              Saved ({networks.filter(n => n.isSavedProfile).length})
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filter === 'OPEN'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-[#6B7280] border-[#E2E5E9] hover:border-black'
              }`}
              onClick={() => setFilter('OPEN')}
            >
              Open ({networks.filter(n => n.authentication.toLowerCase().includes('open')).length})
            </button>
          </div>
        </div>

        {/* Networks Table */}
        <div className="border border-[#E2E5E9] rounded-2xl bg-white shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="instrument-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>RANK</th>
                  <th>SSID / NETWORK NAME</th>
                  <th>BAND & CH</th>
                  <th>SIGNAL (RSSI)</th>
                  <th>CONGESTION</th>
                  <th>SECURITY</th>
                  <th style={{ textAlign: 'right' }}>WQI SCORE</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredNetworks.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <div className="space-y-3 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#16A34A] mx-auto flex items-center justify-center border border-[#16A34A]/30 shadow-xs">
                          <IconRfSignalWave size={22} />
                        </div>
                        <h4 className="text-[15px] font-bold text-black">No Reachable Wi-Fi Networks Found</h4>
                        <p className="font-mono text-[11.5px] text-[#6B7280]">
                          Click below to trigger a live hardware scan across local 2.4GHz, 5GHz, and 6GHz airwaves.
                        </p>
                        <button
                          type="button"
                          className="btn-instrument-primary text-[12px] py-2 px-4 rounded-xl shadow-card inline-flex items-center gap-2 cursor-pointer"
                          onClick={onRescan}
                        >
                          <IconRefresh size={14} />
                          <span>Scan Local Airwaves</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredNetworks.map((net, i) => {
                  const isTopRank = i === 0 && filter === 'ALL';

                  return (
                    <tr
                      key={net.bssid || `${net.ssid}-${i}`}
                      className={`hover:bg-[#F8F9FA] transition-colors ${
                        net.isConnected ? 'bg-[#F0FDF4]/40 font-medium' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="font-mono font-bold text-[12px]">
                        {isTopRank ? (
                          <span className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10.5px] font-extrabold shadow-xs">
                            1
                          </span>
                        ) : (
                          <span className="text-[#6B7280] pl-1.5">#{i + 1}</span>
                        )}
                      </td>

                      {/* SSID */}
                      <td>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-black text-[13.5px]">{net.ssid}</span>
                            {net.isConnected && (
                              <span className="badge-status text-[9px] font-bold bg-[#16A34A] text-white border-[#16A34A] px-1.5 py-0.2 rounded">
                                CONNECTED
                              </span>
                            )}
                            {net.isSavedProfile && !net.isConnected && (
                              <span className="badge-status font-mono text-[9px] bg-white text-[#6B7280] border-[#E2E5E9] px-1.5 py-0.2 rounded">
                                SAVED
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10.5px] text-[#6B7280]">
                            BSSID: {net.bssid} &bull; {net.vendor || 'OEM Hardware'}
                          </div>
                        </div>
                      </td>

                      {/* Band & Channel */}
                      <td>
                        <div className="font-mono text-[12px] space-y-0.5">
                          <div className="font-bold text-black">{net.band}</div>
                          <div className="text-[10.5px] text-[#6B7280]">Ch {net.channel} &bull; {net.radioType}</div>
                        </div>
                      </td>

                      {/* Signal */}
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-black">
                            <span>{net.rssi_dBm} dBm</span>
                            <span className="text-[10px] text-[#6B7280] font-normal">({net.signalPct}%)</span>
                          </div>
                          {/* Mini visual signal bar */}
                          <div className="w-20 h-1.5 bg-[#E2E5E9] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(10, net.signalPct))}%`,
                                backgroundColor:
                                  net.signalPct >= 70 ? '#16A34A' : net.signalPct >= 40 ? '#D97706' : '#DC2626'
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Congestion */}
                      <td>
                        <span
                          className="font-mono text-[12px] font-semibold"
                          style={{
                            color:
                              net.channelUtilizationPct <= 25
                                ? '#16A34A'
                                : net.channelUtilizationPct <= 55
                                ? '#D97706'
                                : '#DC2626'
                          }}
                        >
                          {net.channelUtilizationPct}% load
                        </span>
                      </td>

                      {/* Security */}
                      <td>
                        <div className="flex items-center gap-1 font-mono text-[11.5px] text-[#3B4045]">
                          {net.authentication.toLowerCase().includes('open') ? (
                            <>
                              <IconUnlock size={13} className="text-[#DC2626]" />
                              <span className="text-[#DC2626]">Open</span>
                            </>
                          ) : (
                            <>
                              <IconLock size={13} className="text-[#16A34A]" />
                              <span>{net.authentication.replace('-Personal', '').replace('-Enterprise', ' Ent')}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* WQI Score */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-mono text-[14px] font-bold text-black mr-2">
                          {net.score.totalScore}
                        </span>
                        <span
                          className="badge-status font-mono text-[10px] px-1.5 py-0.5 rounded-md"
                          style={{
                            color:
                              net.score.grade === 'A+' || net.score.grade === 'A'
                                ? '#16A34A'
                                : net.score.grade === 'B'
                                ? '#D97706'
                                : '#DC2626',
                            borderColor:
                              net.score.grade === 'A+' || net.score.grade === 'A'
                                ? '#16A34A'
                                : net.score.grade === 'B'
                                ? '#D97706'
                                : '#DC2626'
                          }}
                        >
                          {net.score.grade}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'center' }}>
                        {net.isConnected ? (
                          <span className="text-[11.5px] font-bold text-[#16A34A] flex items-center justify-center gap-1">
                            <IconCheckCircle size={14} /> Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-instrument-secondary text-[11px] py-1.5 px-3.5 rounded-lg transition-all shadow-xs hover:shadow-subtle hover:bg-black hover:text-white cursor-pointer"
                            onClick={() => handleInitiateConnect(net)}
                            disabled={connectingSsid === net.ssid}
                          >
                            {connectingSsid === net.ssid ? '...' : 'Connect'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Password Prompt Modal */}
      {promptSsid && (
        <div className="fixed inset-0 bg-[#0F1113]/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E2E5E9] shadow-float max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#E2E5E9] pb-3">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                <IconLock size={16} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-black tracking-tight">Connect to "{promptSsid.ssid}"</h3>
                <p className="font-mono text-[10.5px] text-[#6B7280]">Enter the Wi-Fi network security key</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Security Passphrase ({promptSsid.authentication})
              </label>
              <input
                type="password"
                className="w-full bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl p-3 font-mono text-[13px] text-black outline-none focus:border-black shadow-subtle transition-colors"
                placeholder="Enter Wi-Fi password..."
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-instrument-secondary text-[11px] py-2 px-3.5 rounded-xl"
                onClick={() => setPromptSsid(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-instrument-primary text-[11px] py-2 px-4 rounded-xl shadow-card"
                onClick={() => executeConnect(promptSsid.ssid, passphraseInput)}
                disabled={!passphraseInput.trim()}
              >
                Connect & Switch Network
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
