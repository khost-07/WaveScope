import React, { useState, useMemo } from 'react';
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

interface NearbyWifiRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: NearbyNetworksScanResult | null;
  isLoading: boolean;
  onRescan: () => void;
  onConnectNetwork: (ssid: string, password?: string) => Promise<{ success: boolean; message: string }>;
  isSimulation: boolean;
}

export const NearbyWifiRadarModal: React.FC<NearbyWifiRadarModalProps> = ({
  isOpen,
  onClose,
  scanResult,
  isLoading,
  onRescan,
  onConnectNetwork,
  isSimulation
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FAST_BANDS' | 'SAVED' | 'OPEN'>('ALL');
  const [connectingSsid, setConnectingSsid] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [promptSsid, setPromptSsid] = useState<ScoredNetwork | null>(null);
  const [passphraseInput, setPassphraseInput] = useState('');

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

  if (!isOpen) return null;

  const handleInitiateConnect = async (net: ScoredNetwork) => {
    // If secured and not a saved profile (and not in simulation where it auto-connects), prompt password
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
    <div className="fixed inset-0 bg-[#0F1113]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#E2E5E9] shadow-float max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#F8F9FA] p-5 border-b border-[#E2E5E9] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
              <IconRfSignalWave size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-black tracking-tight">Surrounding Wi-Fi Radar & Best Network Finder</h2>
                <span className="badge-status font-mono text-[10px] bg-white border-[#E2E5E9] text-black">
                  {isSimulation ? 'SIMULATION TESTBED' : 'LIVE OS SCAN'}
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#6B7280] mt-0.5">
                Deterministic Wi-Fi Quality Index (WQI) scoring & instant one-click connection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-instrument-secondary text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1.5"
              onClick={onRescan}
              disabled={isLoading}
            >
              <IconRefresh size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>{isLoading ? 'Scanning...' : 'Rescan Spectrum'}</span>
            </button>
            <button
              type="button"
              className="btn-instrument-primary text-[11px] py-1.5 px-4 rounded-lg"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal Scroll Area */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Connection Status Banner */}
          {connectionMessage && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-[13px] font-medium shadow-subtle ${
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

          {/* SPOTLIGHT CARD: #1 Recommended Best Network */}
          {bestNetwork && (
            <div className="p-5 rounded-2xl border-2 border-[#16A34A] bg-[#F0FDF4]/40 shadow-panel relative overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-status text-[10px] font-bold bg-[#16A34A] text-white border-[#16A34A] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <IconAward size={12} />
                      #1 RECOMMENDED BEST NETWORK
                    </span>
                    <span className="font-mono text-[11px] text-[#6B7280]">
                      {bestNetwork.vendor || 'Discovered AP'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h3 className="text-[22px] font-bold text-black tracking-tight">{bestNetwork.ssid}</h3>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="px-2 py-0.5 bg-white border border-[#E2E5E9] rounded-md font-bold text-black">
                        {bestNetwork.band}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-[#E2E5E9] rounded-md text-[#3B4045]">
                        Ch {bestNetwork.channel}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-[#E2E5E9] rounded-md text-[#3B4045]">
                        {bestNetwork.radioType}
                      </span>
                    </div>
                  </div>

                  {/* Reasons Bullets */}
                  <div className="space-y-1 pt-1">
                    {bestNetwork.score.recommendationReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[12.5px] text-[#3B4045] font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score & Action Button Column */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#16A34A]/30 shadow-subtle">
                    <div className="text-right">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">Wi-Fi Quality Index</div>
                      <div className="font-mono text-[18px] font-bold text-[#16A34A] leading-tight">
                        {bestNetwork.score.totalScore}<span className="text-[12px] text-[#6B7280]">/100</span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#16A34A] text-white font-bold text-[14px] flex items-center justify-center">
                      {bestNetwork.score.grade}
                    </div>
                  </div>

                  {bestNetwork.isConnected ? (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] text-white rounded-xl text-[12px] font-bold shadow-xs">
                      <IconCheckCircle size={15} />
                      <span>Currently Connected</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-instrument-primary py-2.5 px-5 text-[12.5px] rounded-xl shadow-card hover:shadow-panel flex items-center gap-2 transition-all"
                      onClick={() => handleInitiateConnect(bestNetwork)}
                      disabled={connectingSsid === bestNetwork.ssid}
                    >
                      <IconConnect size={15} />
                      <span>{connectingSsid === bestNetwork.ssid ? 'Connecting...' : 'Connect to Best Network'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Delta Summary */}
          {scanResult?.comparisonSummary && (
            <div className="p-4 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl text-[13px] text-black leading-relaxed font-sans shadow-subtle flex items-start gap-2.5">
              <span className="text-[16px] flex-shrink-0">⚡</span>
              <div>
                <strong className="text-black">Spectrum Analysis: </strong>
                <span>{scanResult.comparisonSummary}</span>
              </div>
            </div>
          )}

          {/* Filters & Leaderboard Header */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#3B4045] flex items-center gap-2">
                <IconSparkles size={15} />
                <span>Nearby Reachable Networks Leaderboard ({filteredNetworks.length})</span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-md border transition-all ${
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
                  className={`px-2.5 py-1 rounded-md border transition-all ${
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
                  className={`px-2.5 py-1 rounded-md border transition-all ${
                    filter === 'SAVED'
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-[#6B7280] border-[#E2E5E9] hover:border-black'
                  }`}
                  onClick={() => setFilter('SAVED')}
                >
                  Saved Profiles ({networks.filter(n => n.isSavedProfile).length})
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-md border transition-all ${
                    filter === 'OPEN'
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-[#6B7280] border-[#E2E5E9] hover:border-black'
                  }`}
                  onClick={() => setFilter('OPEN')}
                >
                  Open / Unsecured ({networks.filter(n => n.authentication.toLowerCase().includes('open')).length})
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
                    {filteredNetworks.map((net) => {
                      const isTarget = net.isConnected;
                      const isTopRanked = net.rank === 1;

                      return (
                        <tr
                          key={net.bssid || net.ssid}
                          className={`transition-colors ${
                            isTarget ? 'bg-[#F0FDF4]/50' : 'hover:bg-[#F8F9FA]'
                          }`}
                        >
                          {/* Rank */}
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold flex items-center justify-center ${
                                  isTopRanked
                                    ? 'bg-[#16A34A] text-white shadow-xs'
                                    : 'bg-[#F0F2F5] text-black border border-[#E2E5E9]'
                                }`}
                              >
                                #{net.rank}
                              </span>
                            </div>
                          </td>

                          {/* SSID */}
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-black text-[13.5px]">{net.ssid}</span>
                              {isTarget && (
                                <span className="badge-status text-[8.5px] bg-[#16A34A] text-white border-[#16A34A] px-1.5 py-0.2 rounded">
                                  ACTIVE
                                </span>
                              )}
                              {net.isSavedProfile && !isTarget && (
                                <span className="badge-status text-[8.5px] font-mono rounded">
                                  SAVED
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[10.5px] text-[#6B7280]">
                              {net.radioType} &bull; {net.vendor || net.bssid}
                            </div>
                          </td>

                          {/* Band & Channel */}
                          <td>
                            <span className="badge-status font-mono text-[10px] rounded-md font-bold">
                              {net.band}
                            </span>
                            <span className="font-mono text-[11px] text-[#6B7280] ml-1.5">
                              Ch {net.channel}
                            </span>
                          </td>

                          {/* Signal */}
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#ECEEF1] h-2 rounded-full overflow-hidden border border-[#E2E5E9]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${net.signalPct}%`,
                                    backgroundColor:
                                      net.signalPct >= 75 ? '#16A34A' : net.signalPct >= 45 ? '#D97706' : '#DC2626'
                                  }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-bold text-black">
                                {net.rssi_dBm} dBm
                              </span>
                            </div>
                          </td>

                          {/* Congestion */}
                          <td>
                            <span
                              className="font-mono text-[11.5px] font-semibold"
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
                            <div className="flex items-center gap-1 font-mono text-[11px] text-[#3B4045]">
                              {net.authentication.toLowerCase().includes('open') ? (
                                <>
                                  <IconUnlock size={12} className="text-[#DC2626]" />
                                  <span className="text-[#DC2626]">Open</span>
                                </>
                              ) : (
                                <>
                                  <IconLock size={12} className="text-[#16A34A]" />
                                  <span>{net.authentication.replace('-Personal', '').replace('-Enterprise', ' Ent')}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* WQI Score */}
                          <td style={{ textAlign: 'right' }}>
                            <span className="font-mono text-[13.5px] font-bold text-black mr-1.5">
                              {net.score.totalScore}
                            </span>
                            <span
                              className="badge-status font-mono text-[9px] px-1 py-0.5 rounded"
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
                              <span className="text-[11px] font-bold text-[#16A34A] flex items-center justify-center gap-1">
                                <IconCheckCircle size={13} /> Active
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn-instrument-secondary text-[10.5px] py-1 px-3 rounded-md transition-all shadow-xs hover:shadow-subtle hover:bg-black hover:text-white"
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
        </div>
      </div>

      {/* PASSWORD PROMPT MODAL */}
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
