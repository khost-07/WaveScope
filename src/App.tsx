import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientDevice, DataSourceMode, StructuredDiagnosis, DataProvenance, DiagnosticStatus } from './layer1_data/types';
import { SIMULATION_SCENARIOS, SIMULATED_AP } from './layer1_data/simulationDataset';
import { loadDevices } from './layer1_data/dataService';
import { runDiagnosticEngine } from './layer2_engine/engine';
import { recordDeviceSample, evaluateDeviceTrend } from './layer2_engine/trendEngine';
import { generateExplanation } from './layer3_llm/llmService';
import { LLMExplanationResponse } from './layer3_llm/types';
import { scanLocalNetwork } from './layer1_data/networkScanService';
import { generateNetworkAuditReport } from './layer3_llm/networkReportService';
import { NetworkScanResult, NetworkAuditReport } from './layer1_data/networkScannerTypes';
import { OverviewDashboard, NavSection } from './components/OverviewDashboard';
import { WifiRadarSubpage } from './components/WifiRadarSubpage';
import { NetworkAuditSubpage } from './components/NetworkAuditSubpage';
import { DeviceListPane } from './components/DeviceListPane';
import { DeviceDetailHub } from './components/DeviceDetailHub';
import { EasyModeView } from './components/EasyModeView';
import { HotspotTelemetryMatrix } from './components/HotspotTelemetryMatrix';
import { ApiKeySetupScreen } from './components/ApiKeySetupScreen';
import { StaggeredMenu, StaggeredMenuItem, StaggeredMenuSocialItem } from './components/StaggeredMenu';
import { IconRadar, IconKey, IconRfSignalWave, IconDashboard, IconRule, IconHistory } from './components/SvgIcons';
import { NearbyNetworksScanResult } from './layer1_data/nearbyWifiTypes';
import { rankAndCompareNetworks, getSimulatedNearbyNetworks } from './layer2_engine/wifiScoringEngine';
import { syncHistoricalTelemetry } from './layer1_data/supabaseService';
import { SupabaseModal } from './components/SupabaseModal';

const STORAGE_KEY = 'wavescope_gemini_api_key';

export function App() {
  const [mode, setMode] = useState<DataSourceMode>('REAL');
  const [isEasyMode, setIsEasyMode] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<NavSection>('OVERVIEW');
  const [simulatedDevices, setSimulatedDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
  const [devices, setDevices] = useState<ClientDevice[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | DiagnosticStatus>('ALL');
  
  const [, setProvenance] = useState<DataProvenance>({
    mode: 'REAL',
    sourceIdentifier: 'Windows Native WLAN API (netsh wlan show interfaces)',
    adapterName: 'Host Wi-Fi Interface',
    lastUpdated: Date.now(),
    isDeterministic: false
  });
  
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  
  // API Key State & Storage
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY);
  });
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);

  // Whole-Network Diagnostic Audit States
  const [scanResult, setScanResult] = useState<NetworkScanResult | null>(null);
  const [auditReport, setAuditReport] = useState<NetworkAuditReport | null>(null);
  const [isScanLoading, setIsScanLoading] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // LLM Explanations & Error tracking per device
  const [explanations, setExplanations] = useState<Record<string, LLMExplanationResponse>>({});
  const [llmErrors, setLlmErrors] = useState<Record<string, string | null>>({});
  const [isLlmLoading, setIsLlmLoading] = useState<boolean>(false);
  const [realError, setRealError] = useState<string | null>(null);

  // Record samples in trend engine buffer
  useEffect(() => {
    for (const d of devices) {
      recordDeviceSample(d.id, d.telemetry.rssi_dBm, d.telemetry.snr_dB, d.telemetry.retryRatePct);
    }
  }, [devices]);

  // Live simulation tick timer: periodically updates RF micro-fluctuations ONLY in SIMULATION mode
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    if (mode !== 'SIMULATION') return;
    const interval = setInterval(() => {
      for (const d of devices) {
        const jitter = (Math.random() * 0.6 - 0.3);
        const currentRssi = Math.round(d.telemetry.rssi_dBm + jitter);
        recordDeviceSample(d.id, currentRssi, d.telemetry.snr_dB, d.telemetry.retryRatePct);
      }
      setTick(t => t + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, [mode, devices]);

  // Compute Layer 2 Diagnoses deterministically for all active devices
  const diagnoses = useMemo(() => {
    const map: Record<string, StructuredDiagnosis> = {};
    for (const d of devices) {
      map[d.id] = runDiagnosticEngine(d);
    }
    return map;
  }, [devices]);

  // Compute device trend analytics
  const trends = useMemo(() => {
    const map: Record<string, ReturnType<typeof evaluateDeviceTrend>> = {};
    for (const d of devices) {
      map[d.id] = evaluateDeviceTrend(d.id);
    }
    return map;
  }, [devices, tick]);

  // Compute status summary counts
  const stats = useMemo(() => {
    let healthy = 0;
    let attention = 0;
    let critical = 0;
    for (const d of devices) {
      const diag = diagnoses[d.id];
      if (diag) {
        if (diag.status === 'HEALTHY') healthy++;
        else if (diag.status === 'ATTENTION') attention++;
        else if (diag.status === 'CRITICAL') critical++;
      }
    }
    return { total: devices.length, healthy, attention, critical };
  }, [devices, diagnoses]);

  // Filtered devices by active filter
  const visibleDevices = useMemo(() => {
    if (activeFilter === 'ALL') return devices;
    return devices.filter(d => diagnoses[d.id]?.status === activeFilter);
  }, [devices, diagnoses, activeFilter]);

  // Selected device object & diagnosis
  const selectedDevice = useMemo(() => {
    return devices.find(d => d.id === selectedDeviceId) || visibleDevices[0] || devices[0] || null;
  }, [devices, visibleDevices, selectedDeviceId]);

  const selectedDiagnosis = useMemo(() => {
    if (!selectedDevice) return null;
    return diagnoses[selectedDevice.id] || runDiagnosticEngine(selectedDevice);
  }, [selectedDevice, diagnoses]);

  // Handle data loading & continuous live polling
  useEffect(() => {
    setScanResult(null);
    setAuditReport(null);

    if (mode === 'SIMULATION') {
      setDevices(simulatedDevices);
      setProvenance({
        mode: 'SIMULATION',
        sourceIdentifier: 'Controlled RF Simulation Fleet (8 Endpoints)',
        adapterName: 'Simulated Tri-Band 802.11ax AP Testbed',
        lastUpdated: Date.now(),
        isDeterministic: true
      });
      setRealError(null);
      if (simulatedDevices.length > 0) {
        setSelectedDeviceId(prev => (prev && simulatedDevices.some(d => d.id === prev) ? prev : simulatedDevices[0].id));
      }
      return;
    }

    // REAL MODE: Continuous live polling from native WLAN adapter
    let isSubscribed = true;
    async function pollLiveTelemetry() {
      try {
        const result = await loadDevices('REAL');
        if (!isSubscribed) return;

        if (result.devices.length > 0) {
          setDevices(result.devices);
          setProvenance(result.provenance);
          setRealError(null);
          setSelectedDeviceId(prev => (prev && result.devices.some(d => d.id === prev) ? prev : result.devices[0].id));
        } else {
          setDevices([]);
          if (result.realProbeStatus?.errorMessage) {
            setRealError(result.realProbeStatus.errorMessage);
          } else {
            setRealError('WLAN interface is disconnected or not associated with an AP.');
          }
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        setRealError(err.message || 'Could not connect to local wlanScanner probe daemon.');
      }
    }

    pollLiveTelemetry();
    const interval = setInterval(pollLiveTelemetry, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [mode, simulatedDevices]);

  // Supabase Historical Telemetry Stream (Additive historical tracker)
  useEffect(() => {
    if (devices.length > 0) {
      syncHistoricalTelemetry(devices, diagnoses, stats).catch(err => {
        console.error('[WaveScope Supabase] Sync error:', err);
      });
    }
  }, [devices, diagnoses, stats, tick]);

  // Trigger Gemini Layer 3 explanation for a given device
  const triggerExplanationForDevice = useCallback(async (dev: ClientDevice, diag: StructuredDiagnosis) => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    setIsLlmLoading(true);
    setLlmErrors(prev => ({ ...prev, [dev.id]: null }));

    try {
      const resp = await generateExplanation(dev, diag, apiKey);
      setExplanations(prev => ({ ...prev, [dev.id]: resp }));
    } catch (err: any) {
      console.error('[WaveScope] Layer 3 Gemini Error:', err);
      setLlmErrors(prev => ({
        ...prev,
        [dev.id]: err.message || 'Inference error calling Google Gemini API.'
      }));
    } finally {
      setIsLlmLoading(false);
    }
  }, [apiKey]);

  // Trigger explanation automatically when selected device changes (only in Technical Mode)
  useEffect(() => {
    if (selectedDevice && selectedDiagnosis && !explanations[selectedDevice.id] && hasCompletedSetup && apiKey && !isEasyMode) {
      triggerExplanationForDevice(selectedDevice, selectedDiagnosis);
    }
  }, [selectedDeviceId, selectedDevice, selectedDiagnosis, explanations, hasCompletedSetup, apiKey, isEasyMode, triggerExplanationForDevice]);

  // Handle saving API key
  const handleSaveApiKey = (newKey: string, persist: boolean) => {
    const clean = newKey.trim();
    setApiKey(clean);
    if (persist) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHasCompletedSetup(true);
    setShowKeyModal(false);
    if (selectedDevice && selectedDiagnosis) {
      triggerExplanationForDevice(selectedDevice, selectedDiagnosis);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    setHasCompletedSetup(false);
    setShowKeyModal(false);
    setExplanations({});
  };

  // Run Whole-Network Diagnostic Audit
  const handleRunNetworkAudit = useCallback(async () => {
    setIsScanLoading(true);
    setScanError(null);

    try {
      const scanRes = await scanLocalNetwork(mode);
      setScanResult(scanRes);
      const rep = await generateNetworkAuditReport(scanRes, apiKey);
      setAuditReport(rep);
    } catch (err: any) {
      console.error('[WaveScope] Whole-Network Scan Error:', err);
      setScanError(err.message || 'Network sweep failed. Ensure local probe is accessible.');
    } finally {
      setIsScanLoading(false);
    }
  }, [mode, apiKey]);

  const handleSelectDevice = (device: ClientDevice) => {
    setSelectedDeviceId(device.id);
    const diag = diagnoses[device.id] || runDiagnosticEngine(device);
    if (!explanations[device.id] && apiKey && !isEasyMode) {
      triggerExplanationForDevice(device, diag);
    }
  };

  const handleQuickScenario = (scenarioId: string) => {
    const target = devices.find(d => d.scenarioId === scenarioId);
    if (target) {
      handleSelectDevice(target);
    }
  };

  const handleUpdateDeviceTelemetry = (updatedDevice: ClientDevice) => {
    setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
    setSimulatedDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
  };

  // Wi-Fi Radar & Best Network States
  const [nearbyScanResult, setNearbyScanResult] = useState<NearbyNetworksScanResult | null>(null);
  const [isNearbyLoading, setIsNearbyLoading] = useState<boolean>(false);
  const [simulatedActiveSsid, setSimulatedActiveSsid] = useState<string>('VITC-EVENT');

  const handleOpenWifiRadar = useCallback(async () => {
    setIsNearbyLoading(true);

    if (mode === 'SIMULATION') {
      const currentSsid = simulatedActiveSsid;
      const simNetworks = getSimulatedNearbyNetworks(currentSsid);
      const scoredResult = rankAndCompareNetworks(simNetworks, currentSsid);
      setNearbyScanResult(scoredResult);
      setIsNearbyLoading(false);
    } else {
      const endpoints = [
        '/api/wlan/nearby-networks',
        'http://localhost:5175/api/wlan/nearby-networks',
        'http://localhost:5174/api/wlan/nearby-networks'
      ];
      let resolved = false;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.networks) && data.networks.length > 0) {
              const scoredResult = rankAndCompareNetworks(data.networks, data.currentConnectedSsid);
              setNearbyScanResult(scoredResult);
              resolved = true;
              break;
            }
          }
        } catch {
          // try next endpoint
        }
      }

      if (!resolved) {
        setNearbyScanResult(rankAndCompareNetworks([], null));
      }
      setIsNearbyLoading(false);
    }
  }, [mode, simulatedActiveSsid]);

  // Initial load of nearby Wi-Fi radar on boot / mode change
  useEffect(() => {
    handleOpenWifiRadar();
  }, [mode, handleOpenWifiRadar]);

  const handleConnectNetwork = useCallback(async (ssid: string, password?: string): Promise<{ success: boolean; message: string }> => {
    if (mode === 'SIMULATION') {
      setSimulatedActiveSsid(ssid);
      const simNetworks = getSimulatedNearbyNetworks(ssid);
      const chosenNet = simNetworks.find(n => n.ssid === ssid);
      
      // Update simulated devices with chosen network's RF characteristics
      if (chosenNet) {
        setSimulatedDevices(prev => prev.map(d => ({
          ...d,
          apCapabilities: {
            ...d.apCapabilities,
            ssid: chosenNet.ssid,
            bssid: chosenNet.bssid,
            apModel: chosenNet.vendor || 'Active Simulated AP',
            channelUtilizationPct: chosenNet.channelUtilizationPct
          },
          telemetry: {
            ...d.telemetry,
            band: chosenNet.band,
            channel: chosenNet.channel,
            rssi_dBm: Math.min(-30, Math.max(-85, chosenNet.rssi_dBm + (d.id === 'device-scenario-a' ? 0 : d.telemetry.rssi_dBm - (-46))))
          }
        })));
        setDevices(prev => prev.map(d => ({
          ...d,
          apCapabilities: {
            ...d.apCapabilities,
            ssid: chosenNet.ssid,
            bssid: chosenNet.bssid,
            apModel: chosenNet.vendor || 'Active Simulated AP',
            channelUtilizationPct: chosenNet.channelUtilizationPct
          },
          telemetry: {
            ...d.telemetry,
            band: chosenNet.band,
            channel: chosenNet.channel,
            rssi_dBm: Math.min(-30, Math.max(-85, chosenNet.rssi_dBm + (d.id === 'device-scenario-a' ? 0 : d.telemetry.rssi_dBm - (-46))))
          }
        })));
      }

      const scoredResult = rankAndCompareNetworks(simNetworks, ssid);
      setNearbyScanResult(scoredResult);
      return {
        success: true,
        message: `Successfully connected to "${ssid}"! AP capabilities and RF metrics have updated in real time.`
      };
    } else {
      const connectEndpoints = [
        '/api/wlan/connect-network',
        'http://localhost:5175/api/wlan/connect-network',
        'http://localhost:5174/api/wlan/connect-network'
      ];
      for (const ep of connectEndpoints) {
        try {
          const response = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ssid, password }),
            signal: AbortSignal.timeout(5000)
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setTimeout(async () => {
                const res = await loadDevices('REAL');
                if (res.devices.length > 0) {
                  setDevices(res.devices);
                }
                handleOpenWifiRadar();
              }, 2000);
              return { success: true, message: data.message || `Connected to "${ssid}"` };
            }
          }
        } catch {
          // try next
        }
      }
      return { success: false, message: `Could not send connection request to "${ssid}".` };
    }
  }, [mode, handleOpenWifiRadar]);

  // Menu items for StaggeredMenu
  const menuItems = useMemo<StaggeredMenuItem[]>(() => [
    {
      label: 'Overview Dashboard',
      ariaLabel: 'Open network overview dashboard',
      onClick: () => setActiveNav('OVERVIEW')
    },
    {
      label: isEasyMode ? 'Device List' : 'Connected Devices',
      ariaLabel: 'View connected client fleet workspace',
      onClick: () => setActiveNav('CLIENTS')
    },
    {
      label: isEasyMode ? 'Find Best Wi-Fi' : 'Wi-Fi Radar & Best Network',
      ariaLabel: 'Analyze surrounding Wi-Fi networks and connect to the best one',
      onClick: () => {
        setActiveNav('RADAR');
        handleOpenWifiRadar();
      }
    },
    {
      label: isEasyMode ? 'Check Entire Wi-Fi' : 'Network AI Audit',
      ariaLabel: 'Execute whole network AI security and RF audit',
      onClick: () => {
        setActiveNav('AUDIT');
        if (!auditReport && !isScanLoading) handleRunNetworkAudit();
      }
    },
    {
      label: isEasyMode ? 'Overview Table' : 'Telemetry Matrix',
      ariaLabel: 'Open telemetry and RF matrix table',
      onClick: () => setActiveNav('MATRIX')
    },
    {
      label: isEasyMode ? 'How It Works' : 'Diagnostic Rules',
      ariaLabel: 'Inspect Layer 2 deterministic rules specification',
      onClick: () => setActiveNav('RULES')
    },
    {
      label: 'Gemini API Key',
      ariaLabel: 'Configure Google Gemini API key',
      onClick: () => setShowKeyModal(true)
    }
  ], [isEasyMode, handleRunNetworkAudit, handleOpenWifiRadar, auditReport, isScanLoading]);

  const socialItems = useMemo<StaggeredMenuSocialItem[]>(() => [
    { label: isEasyMode ? 'Switch to Expert Mode' : 'Switch to Easy Mode', link: '#toggle-mode', onClick: () => setIsEasyMode(!isEasyMode) },
    { label: 'Find Best Wi-Fi', link: '#radar', onClick: () => { setActiveNav('RADAR'); handleOpenWifiRadar(); } },
    { label: 'GitHub Repo', link: 'https://github.com/khost-07/WaveScope' },
    { label: 'Google AI Studio', link: 'https://aistudio.google.com/app/apikey' },
    { label: 'Simulation Fleet', link: '#simulation', onClick: () => setMode('SIMULATION') },
    { label: 'Live WLAN Probe', link: '#real', onClick: () => setMode('REAL') }
  ], [isEasyMode, handleOpenWifiRadar]);

  if (!hasCompletedSetup) {
    return <ApiKeySetupScreen initialKey={apiKey} onSaveKey={handleSaveApiKey} />;
  }

  const activeAp = devices[0]?.apCapabilities || (mode === 'SIMULATION' ? SIMULATED_AP : {
    ssid: 'Live WLAN Interface',
    bssid: '--:--:--:--:--:--',
    apModel: 'Realtek / Local WLAN Adapter',
    operatingStandards: ['802.11ax', '802.11ac', '802.11n'],
    maxStandard: '802.11ax',
    enabledBands: ['2.4GHz', '5GHz'],
    supports6GHz: false,
    supports5GHz: true,
    maxChannelWidthMHz: 80,
    channelUtilizationPct: 15
  });

  return (
    <div className="bg-[#F4F5F7] text-[#0F1113] font-['Hanken_Grotesk',sans-serif] min-h-screen flex flex-col antialiased relative">
      {/* Stitch TopNavBar */}
      <header className="bg-white border-b border-[#E2E5E9] fixed top-0 left-0 right-0 z-40 h-12 flex justify-between items-center px-6 shadow-subtle">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
            onClick={() => setActiveNav('OVERVIEW')}
            title="Go to Overview Dashboard"
          >
            <IconRadar size={22} className="text-black" />
            <span className="text-[17px] font-bold text-black tracking-tight">WaveScope</span>
          </button>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 border border-[#E2E5E9] bg-[#F8F9FA] rounded-md hidden sm:inline-flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block"></span>
            Node 01-A
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Top-Level Easy Mode / Expert Mode Toggle */}
          <div className="flex border border-[#0F1113] rounded-lg overflow-hidden h-8 text-[11px] font-mono font-semibold shadow-xs">
            <button
              type="button"
              className={`px-3 flex items-center gap-1.5 transition-all ${
                !isEasyMode ? 'bg-[#0F1113] text-white' : 'text-black hover:bg-[#F8F9FA]'
              }`}
              onClick={() => setIsEasyMode(false)}
              title="Switch to detailed technical instrument mode"
            >
              <span>🔬 EXPERT</span>
            </button>
            <button
              type="button"
              className={`px-3 flex items-center gap-1.5 border-l border-[#0F1113] transition-all ${
                isEasyMode ? 'bg-[#16A34A] text-white border-[#16A34A]' : 'text-black hover:bg-[#F8F9FA]'
              }`}
              onClick={() => setIsEasyMode(true)}
              title="Switch to friendly, jargon-free summary mode"
            >
              <span>✨ EASY MODE</span>
            </button>
          </div>

          {/* Data Source Mode Switcher (Simulation vs Live Data) */}
          <div className="flex border border-[#0F1113] rounded-lg overflow-hidden h-8 text-[11px] font-mono font-semibold shadow-xs">
            <button
              type="button"
              className={`px-3 flex items-center justify-center border-r border-[#0F1113] transition-colors ${
                mode === 'SIMULATION' ? 'bg-[#0F1113] text-white sim-pattern' : 'text-black hover:bg-[#F8F9FA]'
              }`}
              onClick={() => setMode('SIMULATION')}
            >
              SIMULATION
            </button>
            <button
              type="button"
              className={`px-3 flex items-center justify-center transition-colors ${
                mode === 'REAL' ? 'bg-[#0F1113] text-white' : 'text-black hover:bg-[#F8F9FA]'
              }`}
              onClick={() => setMode('REAL')}
            >
              LIVE DATA
            </button>
          </div>

          <button
            type="button"
            className="btn-instrument-secondary hidden sm:inline-flex rounded-lg text-[11.5px] py-1.5 px-3 shadow-xs items-center gap-1.5"
            onClick={() => setShowSupabaseModal(true)}
            title="Configure Supabase Historical Tracking"
          >
            <IconHistory size={14} />
            <span>Supabase</span>
          </button>

          <button
            type="button"
            className="btn-instrument-secondary hidden sm:inline-flex rounded-lg text-[11.5px] py-1.5 px-3 shadow-xs items-center gap-1.5"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <IconKey size={14} />
            <span>API Key</span>
          </button>

          {/* StaggeredMenu Trigger in Header */}
          <div className="inline-flex items-center">
            <StaggeredMenu
              position="right"
              items={menuItems}
              socialItems={socialItems}
              displaySocials={true}
              displayItemNumbering={true}
              menuButtonColor="#0F1113"
              openMenuButtonColor="#0F1113"
              changeMenuColorOnOpen={true}
              colors={['#0F1113', '#23272B', '#E2E5E9']}
              accentColor="#16A34A"
              isFixed={false}
            />
          </div>
        </div>
      </header>

      {/* Sleek Top Subpage Navigation Bar */}
      <nav className="bg-white border-b border-[#E2E5E9] fixed top-12 left-0 right-0 z-30 px-6 py-2 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 font-mono text-[11.5px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveNav('OVERVIEW')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'OVERVIEW'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-black hover:bg-[#F8F9FA]'
              }`}
            >
              <span>🏠 Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('CLIENTS')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'CLIENTS'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-black hover:bg-[#F8F9FA]'
              }`}
            >
              <span>📱 {mode === 'SIMULATION' ? `Fleet Devices (${devices.length})` : `Connected Device (${devices.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('RADAR');
                handleOpenWifiRadar();
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'RADAR'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-[#16A34A] hover:bg-[#F0FDF4]'
              }`}
            >
              <IconRfSignalWave size={13} />
              <span>Wi-Fi Radar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('AUDIT');
                if (!auditReport && !isScanLoading) handleRunNetworkAudit();
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'AUDIT'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-black hover:bg-[#F8F9FA]'
              }`}
            >
              <IconRadar size={13} />
              <span>AI Network Audit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('MATRIX');
                if (!nearbyScanResult) handleOpenWifiRadar();
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'MATRIX'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-black hover:bg-[#F8F9FA]'
              }`}
            >
              <IconDashboard size={13} />
              <span>Telemetry Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('RULES')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeNav === 'RULES'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-black hover:bg-[#F8F9FA]'
              }`}
            >
              <IconRule size={13} />
              <span>Rules Engine</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 w-full pt-26">
        <main className="w-full p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Real Mode Connectivity Warning if no adapter active */}
          {mode === 'REAL' && realError && (
            <div className="p-4 bg-[#FEF2F2] border border-[#DC2626] rounded-2xl text-[12.5px] text-[#DC2626] flex items-center justify-between flex-wrap gap-2 shadow-card">
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono">⚠️ [REAL MODE NOTICE]:</span>
                <span>{realError}</span>
              </div>
              <button
                type="button"
                className="btn-instrument-primary text-[11px] rounded-lg"
                onClick={() => setMode('SIMULATION')}
              >
                Switch to Simulation
              </button>
            </div>
          )}

          {/* SUBPAGE 1: OVERVIEW DASHBOARD */}
          {activeNav === 'OVERVIEW' && (
            <OverviewDashboard
              ap={activeAp}
              stats={stats}
              onNavigate={(sec) => {
                setActiveNav(sec);
                if (sec === 'RADAR') handleOpenWifiRadar();
                if (sec === 'AUDIT' && !auditReport && !isScanLoading) handleRunNetworkAudit();
              }}
              onFilterClients={(f) => setActiveFilter(f)}
              selectedScenarioId={selectedDevice?.scenarioId}
              onSelectScenario={handleQuickScenario}
              isSimulation={mode === 'SIMULATION'}
              isEasyMode={isEasyMode}
              singleDeviceStatus={selectedDiagnosis?.status || 'HEALTHY'}
              singleDeviceHostname={selectedDevice?.hostname || (mode === 'REAL' ? 'Local Host Adapter' : 'Host Wi-Fi Interface')}
              singleDeviceDiagnosis={selectedDiagnosis?.primary_diagnosis}
              nearbyBestSsid={nearbyScanResult?.bestNetwork?.ssid || (mode === 'SIMULATION' ? 'AeroMesh-Pro-5G' : 'Scan Nearby Airwaves')}
              nearbyCount={nearbyScanResult?.networks?.length ?? (mode === 'SIMULATION' ? 7 : 0)}
              onOpenSupabaseModal={() => setShowSupabaseModal(true)}
            />
          )}

          {/* SUBPAGE 2: CONNECTED DEVICES WORKSPACE (MASTER-DETAIL) */}
          {activeNav === 'CLIENTS' && (
            <div className="space-y-4 animate-fade-in">
              {/* Clients Header with Breadcrumb & Filter Bar */}
              <div className="bg-white border border-[#E2E5E9] rounded-2xl p-4 shadow-panel flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="btn-instrument-secondary text-[12px] py-1.5 px-3 rounded-xl flex items-center gap-1 font-semibold"
                    onClick={() => setActiveNav('OVERVIEW')}
                  >
                    &larr; Back to Overview
                  </button>
                  <div className="h-5 w-px bg-[#E2E5E9]"></div>
                  <div>
                    <h2 className="text-[16px] font-bold text-black tracking-tight">Connected Devices Workspace</h2>
                    <span className="font-mono text-[11px] text-[#6B7280]">
                      Showing {visibleDevices.length} of {devices.length} endpoints
                    </span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      activeFilter === 'ALL'
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-[#6B7280] border-[#E2E5E9] hover:border-black'
                    }`}
                    onClick={() => setActiveFilter('ALL')}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      activeFilter === 'HEALTHY'
                        ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                        : 'bg-white text-[#16A34A] border-[#16A34A]/30 hover:border-[#16A34A]'
                    }`}
                    onClick={() => setActiveFilter('HEALTHY')}
                  >
                    Healthy ({stats.healthy})
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      activeFilter === 'ATTENTION'
                        ? 'bg-[#D97706] text-white border-[#D97706] shadow-xs'
                        : 'bg-white text-[#D97706] border-[#D97706]/30 hover:border-[#D97706]'
                    }`}
                    onClick={() => setActiveFilter('ATTENTION')}
                  >
                    Attention ({stats.attention})
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      activeFilter === 'CRITICAL'
                        ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                        : 'bg-white text-[#DC2626] border-[#DC2626]/30 hover:border-[#DC2626]'
                    }`}
                    onClick={() => setActiveFilter('CRITICAL')}
                  >
                    Critical ({stats.critical})
                  </button>
                </div>
              </div>

              {/* Master-Detail Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Device List */}
                <div className="lg:col-span-4 w-full">
                  <DeviceListPane
                    devices={visibleDevices}
                    diagnoses={diagnoses}
                    selectedDeviceId={selectedDevice?.id || null}
                    onSelectDevice={handleSelectDevice}
                    trends={trends}
                    isEasyMode={isEasyMode}
                  />
                </div>

                {/* Right Column: Device Detail */}
                <div className="lg:col-span-8 w-full">
                  {selectedDevice && selectedDiagnosis ? (
                    isEasyMode ? (
                      <EasyModeView
                        device={selectedDevice}
                        allDevices={devices}
                        diagnosis={selectedDiagnosis}
                        diagnoses={diagnoses}
                        trend={trends[selectedDevice.id]}
                      />
                    ) : (
                      <DeviceDetailHub
                        device={selectedDevice}
                        allDevices={devices}
                        diagnosis={selectedDiagnosis}
                        diagnoses={diagnoses}
                        explanation={explanations[selectedDevice.id] || null}
                        isLoading={isLlmLoading}
                        error={llmErrors[selectedDevice.id] || null}
                        onTriggerExplanation={() => triggerExplanationForDevice(selectedDevice, selectedDiagnosis)}
                        onUpdateDeviceTelemetry={handleUpdateDeviceTelemetry}
                        onOpenKeyModal={() => setShowKeyModal(true)}
                        trend={trends[selectedDevice.id]}
                      />
                    )
                  ) : (
                    <div className="bg-white border border-[#E2E5E9] rounded-2xl p-12 text-center text-[#6B7280] font-mono text-[13px] shadow-card">
                      Select a client device from the fleet list to begin Layer 2 telemetry analysis.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBPAGE 3: SURROUNDING WI-FI RADAR */}
          {activeNav === 'RADAR' && (
            <WifiRadarSubpage
              scanResult={nearbyScanResult}
              isLoading={isNearbyLoading}
              onRescan={handleOpenWifiRadar}
              onConnectNetwork={handleConnectNetwork}
              isSimulation={mode === 'SIMULATION'}
              isEasyMode={isEasyMode}
              onBack={() => setActiveNav('OVERVIEW')}
            />
          )}

          {/* SUBPAGE 4: WHOLE-NETWORK AI SECURITY & RF AUDIT */}
          {activeNav === 'AUDIT' && (
            <NetworkAuditSubpage
              scanResult={scanResult}
              report={auditReport}
              isLoading={isScanLoading}
              error={scanError}
              onRescan={handleRunNetworkAudit}
              onBack={() => setActiveNav('OVERVIEW')}
            />
          )}

          {/* SUBPAGE 5: RF AIRWAVES & FLEET TELEMETRY MATRIX VIEW */}
          {activeNav === 'MATRIX' && (
            <HotspotTelemetryMatrix
              scanResult={nearbyScanResult}
              isLoading={isNearbyLoading}
              onRescan={handleOpenWifiRadar}
              onConnectNetwork={handleConnectNetwork}
              devices={visibleDevices}
              diagnoses={diagnoses}
              selectedDeviceId={selectedDevice?.id || null}
              onSelectDevice={(dev) => {
                handleSelectDevice(dev);
                setActiveNav('CLIENTS');
              }}
              onInspectDeviceSubpage={() => setActiveNav('CLIENTS')}
            />
          )}

          {/* SUBPAGE 6: DETERMINISTIC DIAGNOSTIC RULES SPECIFICATION */}
          {activeNav === 'RULES' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-5 border border-[#E2E5E9] rounded-2xl flex items-center justify-between shadow-panel">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="btn-instrument-secondary text-[12px] py-1.5 px-3 rounded-xl flex items-center gap-1 font-semibold"
                    onClick={() => setActiveNav('OVERVIEW')}
                  >
                    &larr; Back to Overview
                  </button>
                  <div className="h-5 w-px bg-[#E2E5E9]"></div>
                  <div>
                    <h2 className="text-[17px] font-bold text-black tracking-tight">
                      {isEasyMode ? 'How WaveScope Analyzes Your Wi-Fi' : 'Layer 2 Deterministic Rule System Specification'}
                    </h2>
                    <p className="font-mono text-[11px] text-[#6B7280]">
                      {isEasyMode
                        ? 'WaveScope uses transparent, rule-based checks to instantly pinpoint issues without confusing tech jargon.'
                        : 'Transparent, zero-hallucination inference tree mapping RF physics to root causes.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-[#E2E5E9] bg-white rounded-2xl space-y-1.5 shadow-card">
                  <div className="text-[12px] font-bold text-black uppercase tracking-wider mb-1">
                    {isEasyMode ? '1. Weak Signal (Distance / Walls)' : '1. Weak Signal Attenuation'}
                  </div>
                  <p className="text-[13px] text-[#3B4045] leading-relaxed">
                    {isEasyMode
                      ? 'Detects if the device is simply too far from the router or separated by thick walls.'
                      : 'Triggered when RSSI < -75 dBm and SNR < 15 dB while negotiated modulation drops to MCS 0–3.'}
                  </p>
                </div>

                <div className="p-5 border border-[#E2E5E9] bg-white rounded-2xl space-y-1.5 shadow-card">
                  <div className="text-[12px] font-bold text-black uppercase tracking-wider mb-1">
                    {isEasyMode ? '2. Radio Interference (Airwave Noise)' : '2. RF Interference & Airwave Jams'}
                  </div>
                  <p className="text-[13px] text-[#3B4045] leading-relaxed">
                    {isEasyMode
                      ? 'Detects if nearby devices or crowded channels are jamming and dropping Wi-Fi packets.'
                      : 'Triggered when retry rate > 15% and noise floor > -82 dBm despite reasonable raw RSSI.'}
                  </p>
                </div>

                <div className="p-5 border border-[#E2E5E9] bg-white rounded-2xl space-y-1.5 shadow-card">
                  <div className="text-[12px] font-bold text-black uppercase tracking-wider mb-1">
                    {isEasyMode ? '3. Device Capability (Older Hardware)' : '3. Hardware / Capability Limited'}
                  </div>
                  <p className="text-[13px] text-[#3B4045] leading-relaxed">
                    {isEasyMode
                      ? 'Detects if the device is older and naturally cannot reach top modern Wi-Fi speeds.'
                      : 'Triggered when device standard is 802.11n/legacy, 20MHz width, or 1x1 SISO while RF link is stable.'}
                  </p>
                </div>

                <div className="p-5 border border-[#E2E5E9] bg-white rounded-2xl space-y-1.5 shadow-card">
                  <div className="text-[12px] font-bold text-black uppercase tracking-wider mb-1">
                    {isEasyMode ? '4. Setting Adjustment (Slow Band)' : '4. Potential Band Selection Issue'}
                  </div>
                  <p className="text-[13px] text-[#3B4045] leading-relaxed">
                    {isEasyMode
                      ? 'Detects if your fast device accidentally connected to a slow 2.4 GHz channel instead of 5 GHz.'
                      : 'Triggered when a dual-band/tri-band device is associated on congested 2.4GHz despite strong signal.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="modal-overlay">
          <div className="modal-instrument max-w-md rounded-2xl shadow-float overflow-hidden">
            <div className="modal-header bg-[#F8F9FA] p-4 border-b border-[#E2E5E9]">
              <span className="text-[15px] font-bold text-black tracking-tight">Google Gemini API Configuration</span>
              <button type="button" className="font-bold text-[#6B7280] hover:text-black text-[16px]" onClick={() => setShowKeyModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body p-6 space-y-4">
              <p className="text-[13.5px] text-[#3B4045]">
                Connected Model: <strong className="text-black">gemini-3.1-flash-lite</strong>. Zero fallback cache.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Gemini API Key</label>
                <input
                  type="password"
                  className="w-full bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl p-3 font-mono text-[13px] text-black outline-none focus:border-black shadow-subtle transition-colors"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#E2E5E9]">
                <button
                  type="button"
                  className="btn-instrument-secondary text-[#DC2626] border-[#DC2626]/40 hover:border-[#DC2626] text-[11px] rounded-xl"
                  onClick={handleClearApiKey}
                >
                  Clear Key & Log Out
                </button>
                <button
                  type="button"
                  className="btn-instrument-primary text-[11.5px] rounded-xl shadow-card"
                  onClick={() => handleSaveApiKey(apiKey, true)}
                  disabled={!apiKey.trim()}
                >
                  Save & Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Historical Tracking Configuration Modal */}
      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />
    </div>
  );
}
