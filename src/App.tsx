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
import { NetworkOverviewBar } from './components/NetworkOverviewBar';
import { DeviceListPane } from './components/DeviceListPane';
import { DeviceDetailHub } from './components/DeviceDetailHub';
import { EasyModeView } from './components/EasyModeView';
import { ClientTable } from './components/ClientTable';
import { ApiKeySetupScreen } from './components/ApiKeySetupScreen';
import { NetworkReportModal } from './components/NetworkReportModal';
import { StaggeredMenu, StaggeredMenuItem, StaggeredMenuSocialItem } from './components/StaggeredMenu';
import { IconRadar, IconKey, IconRouter, IconDashboard, IconRule } from './components/SvgIcons';

const STORAGE_KEY = 'wavescope_gemini_api_key';

type NavSection = 'OVERVIEW' | 'CLIENTS' | 'RULES';

export function App() {
  const [mode, setMode] = useState<DataSourceMode>('SIMULATION');
  const [isEasyMode, setIsEasyMode] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<NavSection>('CLIENTS');
  const [simulatedDevices, setSimulatedDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
  const [devices, setDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | DiagnosticStatus>('ALL');
  
  const [provenance, setProvenance] = useState<DataProvenance>({
    mode: 'SIMULATION',
    sourceIdentifier: 'Controlled RF Simulation Fleet (8 Endpoints)',
    adapterName: 'Simulated Tri-Band 802.11ax AP Testbed',
    lastUpdated: Date.now(),
    isDeterministic: true
  });
  
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>('device-scenario-a');
  
  // API Key State & Storage
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY);
  });
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  // Whole-Network Diagnostic Audit States
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
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

  // Live simulation tick timer: periodically updates RF micro-fluctuations to trend history
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

  // Handle data loading when mode toggles
  useEffect(() => {
    async function fetchData() {
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
      } else {
        try {
          const result = await loadDevices('REAL');
          setDevices(result.devices);
          setProvenance(result.provenance);
          setRealError(null);
          if (result.devices.length > 0) {
            setSelectedDeviceId(result.devices[0].id);
          }
        } catch (err: any) {
          console.warn('[WaveScope] Real mode telemetry fetch error:', err.message);
          setRealError(err.message || 'Could not connect to local wlanScanner probe daemon.');
        }
      }
    }
    fetchData();
  }, [mode, simulatedDevices]);

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
    setShowReportModal(true);
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

  // Menu items for StaggeredMenu
  const menuItems = useMemo<StaggeredMenuItem[]>(() => [
    {
      label: isEasyMode ? 'Device List' : 'Fleet Clients',
      ariaLabel: 'View connected client fleet workspace',
      onClick: () => setActiveNav('CLIENTS')
    },
    {
      label: isEasyMode ? 'Overview Table' : 'Telemetry Matrix',
      ariaLabel: 'Open telemetry and RF matrix table',
      onClick: () => setActiveNav('OVERVIEW')
    },
    {
      label: isEasyMode ? 'How It Works' : 'Diagnostic Rules',
      ariaLabel: 'Inspect Layer 2 deterministic rules specification',
      onClick: () => setActiveNav('RULES')
    },
    {
      label: isEasyMode ? 'Check Entire Wi-Fi' : 'Network Audit',
      ariaLabel: 'Execute whole network AI security and RF audit',
      onClick: () => handleRunNetworkAudit()
    },
    {
      label: 'Gemini API Key',
      ariaLabel: 'Configure Google Gemini API key',
      onClick: () => setShowKeyModal(true)
    }
  ], [isEasyMode, handleRunNetworkAudit]);

  const socialItems = useMemo<StaggeredMenuSocialItem[]>(() => [
    { label: isEasyMode ? 'Switch to Expert Mode' : 'Switch to Easy Mode', link: '#toggle-mode', onClick: () => setIsEasyMode(!isEasyMode) },
    { label: 'GitHub Repo', link: 'https://github.com/khost-07/WaveScope' },
    { label: 'Google AI Studio', link: 'https://aistudio.google.com/app/apikey' },
    { label: 'Simulation Fleet', link: '#simulation', onClick: () => setMode('SIMULATION') },
    { label: 'Live WLAN Probe', link: '#real', onClick: () => setMode('REAL') }
  ], [isEasyMode]);

  if (!hasCompletedSetup) {
    return <ApiKeySetupScreen initialKey={apiKey} onSaveKey={handleSaveApiKey} />;
  }

  const activeAp = devices[0]?.apCapabilities || SIMULATED_AP;

  return (
    <div className="bg-[#F4F5F7] text-[#0F1113] font-['Hanken_Grotesk',sans-serif] min-h-screen flex flex-col antialiased relative">
      {/* Stitch TopNavBar */}
      <header className="bg-white border-b border-[#E2E5E9] fixed top-0 left-0 right-0 z-40 h-12 flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
          <IconRadar size={22} className="text-black" />
          <span className="text-[17px] font-bold text-black tracking-tight">WaveScope</span>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 border border-[#E2E5E9] bg-[#F8F9FA] hidden sm:inline-flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#16A34A] inline-block"></span>
            Node 01-A
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Top-Level Easy Mode / Expert Mode Toggle */}
          <div className="flex border border-[#0F1113] h-8 text-[11px] font-mono font-semibold">
            <button
              type="button"
              className={`px-3 flex items-center gap-1.5 transition-all ${
                !isEasyMode ? 'bg-[#0F1113] text-white' : 'text-black hover:bg-[#F8F9FA]'
              }`}
              onClick={() => setIsEasyMode(false)}
              title="Switch to detailed technical telemetry view"
            >
              <span>EXPERT</span>
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
          <div className="flex border border-[#0F1113] h-8 text-[11px] font-mono font-semibold">
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
            className="btn-instrument-primary hidden md:inline-flex"
            onClick={handleRunNetworkAudit}
          >
            <IconRadar size={15} />
            <span>{isEasyMode ? 'Check Entire Wi-Fi' : 'Whole Network Audit'}</span>
          </button>

          <button
            type="button"
            className="btn-instrument-secondary hidden sm:inline-flex"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <IconKey size={15} />
            <span>API Key</span>
          </button>

          {/* StaggeredMenu Trigger in Header */}
          <div className="relative pl-1">
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
              isFixed={true}
            />
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex pt-12 min-h-screen">
        {/* Stitch SideNavBar */}
        <aside className="fixed left-0 top-12 bottom-0 w-60 border-r border-[#E2E5E9] bg-white flex flex-col z-30 hidden md:flex">
          <div className="p-4 border-b border-[#E2E5E9]">
            <div className="text-[14px] font-bold text-black">
              {isEasyMode ? 'Wi-Fi Health Monitor' : 'WaveScope Inspector'}
            </div>
            <div className="text-[11px] font-mono text-[#6B7280] mt-0.5 truncate">
              {isEasyMode ? 'Home Network Scanner' : provenance.sourceIdentifier}
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            <button
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wider transition-colors ${
                activeNav === 'CLIENTS'
                  ? 'bg-[#F8F9FA] text-black border-l-2 border-black font-bold'
                  : 'text-[#3B4045] hover:bg-[#F8F9FA]'
              }`}
              onClick={() => setActiveNav('CLIENTS')}
            >
              <IconRouter size={16} />
              <span>{isEasyMode ? 'My Devices' : 'Fleet Clients'}</span>
              <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 border border-[#E2E5E9] bg-white">{devices.length}</span>
            </button>

            <button
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wider transition-colors ${
                activeNav === 'OVERVIEW'
                  ? 'bg-[#F8F9FA] text-black border-l-2 border-black font-bold'
                  : 'text-[#3B4045] hover:bg-[#F8F9FA]'
              }`}
              onClick={() => setActiveNav('OVERVIEW')}
            >
              <IconDashboard size={16} />
              <span>{isEasyMode ? 'All Devices List' : 'Telemetry Matrix'}</span>
            </button>

            <button
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wider transition-colors ${
                activeNav === 'RULES'
                  ? 'bg-[#F8F9FA] text-black border-l-2 border-black font-bold'
                  : 'text-[#3B4045] hover:bg-[#F8F9FA]'
              }`}
              onClick={() => setActiveNav('RULES')}
            >
              <IconRule size={16} />
              <span>{isEasyMode ? 'How It Works' : 'Diagnostic Rules'}</span>
            </button>
          </nav>

          <div className="p-3 border-t border-[#E2E5E9] space-y-1 text-[11px] font-mono text-[#6B7280] bg-[#F8F9FA]">
            <div>Mode: <strong className="text-black">{isEasyMode ? 'Easy Mode (Friendly)' : 'Expert (Physical RF)'}</strong></div>
            <div>Engine: <strong className="text-black">L2 Rule System</strong></div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="md:ml-60 flex-1 p-6 space-y-5 max-w-[1400px] w-full">
          {/* Real Mode Error Alert if daemon not running */}
          {mode === 'REAL' && realError && (
            <div className="p-4 border border-[#DC2626] bg-white flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider">REAL WLAN PROBE STATUS</div>
                <div className="text-[13px] text-[#3B4045] font-mono">{realError}</div>
                <div className="text-[11px] text-[#6B7280] font-mono">Launch probe daemon: <code>node server/wlanScanner.cjs</code></div>
              </div>
              <button
                type="button"
                className="btn-instrument-primary text-[11px]"
                onClick={() => setMode('SIMULATION')}
              >
                Switch to Simulation
              </button>
            </div>
          )}

          {/* Overview Metric Bar */}
          <NetworkOverviewBar
            ap={activeAp}
            stats={stats}
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
            selectedScenarioId={selectedDevice?.scenarioId}
            onSelectScenario={handleQuickScenario}
            isSimulation={mode === 'SIMULATION'}
            onOpenNetworkAudit={handleRunNetworkAudit}
            singleDeviceStatus={selectedDiagnosis?.status || 'HEALTHY'}
            singleDeviceHostname={selectedDevice?.hostname || 'Host Wi-Fi Interface'}
            singleDeviceDiagnosis={selectedDiagnosis?.primary_diagnosis}
            isEasyMode={isEasyMode}
          />

          {/* SECTION 1: CONNECTED CLIENTS WORKSPACE (MASTER-DETAIL) */}
          {activeNav === 'CLIENTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Device List */}
              <div className="lg:col-span-4 w-full">
                <DeviceListPane
                  devices={visibleDevices}
                  diagnoses={diagnoses}
                  selectedDeviceId={selectedDeviceId}
                  onSelectDevice={handleSelectDevice}
                  trends={trends}
                  isEasyMode={isEasyMode}
                />
              </div>

              {/* Right Column: Device Detail Intelligence Hub OR Easy Mode View */}
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
                      error={llmErrors[selectedDevice.id]}
                      onUpdateDeviceTelemetry={handleUpdateDeviceTelemetry}
                      onTriggerExplanation={() => triggerExplanationForDevice(selectedDevice, selectedDiagnosis)}
                      onOpenKeyModal={() => setShowKeyModal(true)}
                      trend={trends[selectedDevice.id]}
                    />
                  )
                ) : (
                  <div className="p-12 border border-[#E2E5E9] bg-white text-center text-[#6B7280]">
                    {isEasyMode ? 'Select a device to view its Wi-Fi status.' : 'Select a client from the list to inspect root cause.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: HIGH-DENSITY PRIMARY DEVICE TABLE */}
          {activeNav === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-black">
                  {isEasyMode ? 'All Devices Overview' : 'Fleet Telemetry & RF Matrix'}
                </h2>
                <span className="text-[12px] font-mono text-[#6B7280]">
                  Showing {visibleDevices.length} of {devices.length} {isEasyMode ? 'devices' : 'endpoints'}
                </span>
              </div>
              <ClientTable
                devices={visibleDevices}
                diagnoses={diagnoses}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={(dev) => {
                  handleSelectDevice(dev);
                  setActiveNav('CLIENTS');
                }}
              />
            </div>
          )}

          {/* SECTION 3: DIAGNOSTIC RULES SPECIFICATION */}
          {activeNav === 'RULES' && (
            <div className="border border-[#E2E5E9] bg-white p-6 space-y-4">
              <div className="border-b border-[#E2E5E9] pb-3">
                <h2 className="text-[20px] font-bold text-black">
                  {isEasyMode ? 'How WaveScope Checks Your Wi-Fi' : 'Layer 2 Deterministic Rule Engine'}
                </h2>
                <p className="text-[14px] text-[#3B4045] mt-1">
                  {isEasyMode
                    ? 'WaveScope evaluates your wireless connection using physical tests without relying on slow internet queries:'
                    : 'WaveScope evaluates four competing physical RF hypotheses using local mathematical point thresholds without LLM dependence:'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-[#E2E5E9] bg-[#F8F9FA] space-y-1">
                  <div className="text-[12px] font-bold text-black uppercase tracking-wider">
                    {isEasyMode ? '1. Distance & Obstacles (Too Far)' : '1. Weak / Attenuated Signal'}
                  </div>
                  <p className="text-[13px] text-[#3B4045]">
                    {isEasyMode
                      ? 'Detects if your device is too far away from the router or separated by thick walls and metal.'
                      : 'Triggered when RSSI ≤ -75 dBm, SNR ≤ 15 dB, or Retries ≥ 15%. Confirms high physical path loss.'}
                  </p>
                </div>

                <div className="p-4 border border-[#E2E5E9] bg-[#F8F9FA] space-y-1">
                  <div className="text-[12px] font-bold text-black uppercase tracking-wider">
                    {isEasyMode ? '2. Nearby Interference (Crowded Airwaves)' : '2. Possible RF Interference'}
                  </div>
                  <p className="text-[13px] text-[#3B4045]">
                    {isEasyMode
                      ? 'Detects if microwaves, neighbors, or electronics are crowding the wireless channel.'
                      : 'Triggered when RSSI ≥ -65 dBm but SNR ≤ 12 dB or Noise Floor ≥ -70 dBm. Indicates heavy jamming.'}
                  </p>
                </div>

                <div className="p-4 border border-[#E2E5E9] bg-[#F8F9FA] space-y-1">
                  <div className="text-[12px] font-bold text-black uppercase tracking-wider">
                    {isEasyMode ? '3. Device Capability (Older Hardware)' : '3. Hardware / Capability Limited'}
                  </div>
                  <p className="text-[13px] text-[#3B4045]">
                    {isEasyMode
                      ? 'Detects if the device is older and naturally cannot reach top modern Wi-Fi speeds.'
                      : 'Triggered when device standard is 802.11n/legacy, 20MHz width, or 1x1 SISO while RF link is stable.'}
                  </p>
                </div>

                <div className="p-4 border border-[#E2E5E9] bg-[#F8F9FA] space-y-1">
                  <div className="text-[12px] font-bold text-black uppercase tracking-wider">
                    {isEasyMode ? '4. Setting Adjustment (Slow Band)' : '4. Potential Band Selection Issue'}
                  </div>
                  <p className="text-[13px] text-[#3B4045]">
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

      {/* Whole-Network Audit Modal */}
      <NetworkReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        scanResult={scanResult}
        report={auditReport}
        isLoading={isScanLoading}
        error={scanError}
        onRescan={handleRunNetworkAudit}
      />

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="modal-overlay">
          <div className="modal-instrument max-w-md">
            <div className="modal-header">
              <span className="text-[15px] font-bold text-black">Google Gemini API Configuration</span>
              <button type="button" className="font-bold text-[#6B7280] hover:text-black" onClick={() => setShowKeyModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-[13px] text-[#3B4045]">
                Connected Model: <strong className="text-black">gemini-3.1-flash-lite</strong>. Zero fallback cache.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045]">Gemini API Key</label>
                <input
                  type="password"
                  className="w-full bg-[#F8F9FA] border border-[#E2E5E9] p-2.5 font-mono text-[13px] text-black outline-none focus:border-black transition-colors"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-between pt-2 border-t border-[#E2E5E9]">
                <button
                  type="button"
                  className="btn-instrument-secondary text-[#DC2626] border-[#DC2626] text-[11px]"
                  onClick={handleClearApiKey}
                >
                  Clear Key & Log Out
                </button>
                <button
                  type="button"
                  className="btn-instrument-primary text-[11px]"
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
    </div>
  );
}
