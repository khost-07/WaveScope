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
import {
  IconRadar,
  IconKey,
  IconDashboard,
  IconRule,
  IconSignal,
  IconSparkles
} from './components/SvgIcons';

const STORAGE_KEY = 'wavescope_gemini_api_key';

type NavSection = 'INSPECTOR' | 'MATRIX' | 'RULES';

export function App() {
  const [mode, setMode] = useState<DataSourceMode>('SIMULATION');
  const [isEasyMode, setIsEasyMode] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<NavSection>('INSPECTOR');
  const [simulatedDevices, setSimulatedDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
  const [devices, setDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | DiagnosticStatus>('ALL');
  
  const [, setProvenance] = useState<DataProvenance>({
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

  if (!hasCompletedSetup) {
    return <ApiKeySetupScreen initialKey={apiKey} onSaveKey={handleSaveApiKey} />;
  }

  const activeAp = devices[0]?.apCapabilities || SIMULATED_AP;

  return (
    <div className="bg-[#F4F5F7] text-[#0F1113] font-['Hanken_Grotesk',sans-serif] min-h-screen flex flex-col antialiased relative">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#E2E5E9] fixed top-0 left-0 right-0 z-40 h-14 flex justify-between items-center px-6 shadow-subtle">
        {/* Brand & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-xs">
            <IconRadar size={18} />
          </div>
          <div>
            <span className="text-[17px] font-bold text-black tracking-tight block leading-none">WaveScope</span>
            <span className="font-mono text-[10px] text-[#6B7280] hidden sm:block mt-0.5">
              RF Diagnostic Instrument
            </span>
          </div>
          <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-md border border-[#E2E5E9] bg-[#F8F9FA] hidden md:inline-flex items-center gap-1.5 ml-2">
            <span className={`w-2 h-2 rounded-full inline-block ${mode === 'REAL' ? 'bg-[#16A34A] animate-pulse-fast' : 'bg-black'}`}></span>
            {mode === 'REAL' ? 'Live WLAN Scanner' : 'Simulated RF Fleet'}
          </span>
        </div>

        {/* Primary Center Navigation Tabs */}
        <nav className="flex items-center p-1 bg-[#F0F2F5] border border-[#E2E5E9] rounded-xl shadow-subtle">
          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12px] font-bold font-sans transition-all duration-200 ${
              activeNav === 'INSPECTOR'
                ? 'bg-white text-black shadow-card'
                : 'text-[#6B7280] hover:text-black hover:bg-white/50'
            }`}
            onClick={() => setActiveNav('INSPECTOR')}
          >
            <IconSignal size={15} />
            <span>{isEasyMode ? 'Device Status' : 'Device Inspector'}</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12px] font-bold font-sans transition-all duration-200 ${
              activeNav === 'MATRIX'
                ? 'bg-white text-black shadow-card'
                : 'text-[#6B7280] hover:text-black hover:bg-white/50'
            }`}
            onClick={() => setActiveNav('MATRIX')}
          >
            <IconDashboard size={15} />
            <span>{isEasyMode ? 'All Devices' : 'Fleet Telemetry Matrix'}</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12px] font-bold font-sans transition-all duration-200 ${
              activeNav === 'RULES'
                ? 'bg-white text-black shadow-card'
                : 'text-[#6B7280] hover:text-black hover:bg-white/50'
            }`}
            onClick={() => setActiveNav('RULES')}
          >
            <IconRule size={15} />
            <span>{isEasyMode ? 'How It Works' : 'Diagnostic Rules'}</span>
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Easy Mode / Technical Mode Toggle */}
          <div className="flex p-0.5 bg-[#F0F2F5] border border-[#E2E5E9] rounded-lg text-[11px] font-mono font-semibold">
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md transition-all ${
                !isEasyMode ? 'bg-black text-white shadow-xs' : 'text-[#6B7280] hover:text-black'
              }`}
              onClick={() => setIsEasyMode(false)}
              title="Detailed technical telemetry view"
            >
              TECHNICAL
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md transition-all ${
                isEasyMode ? 'bg-[#16A34A] text-white shadow-xs' : 'text-[#6B7280] hover:text-black'
              }`}
              onClick={() => setIsEasyMode(true)}
              title="Plain-English summary mode"
            >
              ✨ EASY
            </button>
          </div>

          {/* Data Source Mode Switcher (Simulation vs Live Probe) */}
          <div className="flex p-0.5 bg-[#F0F2F5] border border-[#E2E5E9] rounded-lg text-[11px] font-mono font-semibold">
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md transition-all ${
                mode === 'SIMULATION' ? 'bg-black text-white shadow-xs' : 'text-[#6B7280] hover:text-black'
              }`}
              onClick={() => setMode('SIMULATION')}
            >
              SIMULATION
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md transition-all ${
                mode === 'REAL' ? 'bg-black text-white shadow-xs' : 'text-[#6B7280] hover:text-black'
              }`}
              onClick={() => setMode('REAL')}
            >
              LIVE PROBE
            </button>
          </div>

          {/* Whole Network AI Audit Action */}
          <button
            type="button"
            className="btn-instrument-primary hidden lg:inline-flex rounded-lg text-[12px] py-1.5 px-3.5"
            onClick={handleRunNetworkAudit}
          >
            <IconSparkles size={14} />
            <span>{isEasyMode ? 'Check Entire Wi-Fi' : 'Whole-Network Audit'}</span>
          </button>

          {/* API Key Modal Button */}
          <button
            type="button"
            className="btn-instrument-secondary rounded-lg text-[11px] py-1.5 px-2.5"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <IconKey size={14} />
            <span className="hidden sm:inline">API Key</span>
            {apiKey && <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>}
          </button>
        </div>
      </header>

      {/* Main Page Container */}
      <div className="pt-14 min-h-screen">
        <main className="p-6 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* Real Mode Probe Error Banner if daemon unreachable */}
          {mode === 'REAL' && realError && (
            <div className="p-5 border border-[#DC2626] rounded-xl bg-white flex items-center justify-between gap-4 shadow-card">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider">Real WLAN Probe Status</div>
                <div className="text-[13.5px] text-[#3B4045] font-mono">{realError}</div>
                <div className="text-[11.5px] text-[#6B7280] font-mono">Launch probe daemon: <code>node server/wlanScanner.cjs</code></div>
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

          {/* SECTION 1: DEVICE INSPECTOR (PRIMARY WORKSPACE) */}
          {activeNav === 'INSPECTOR' && (
            <div className="space-y-5">
              {/* Top Overview & AP Bar */}
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

              {/* Master-Detail 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Device Selector List */}
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
                    <div className="p-12 border border-[#E2E5E9] rounded-2xl bg-white text-center text-[#6B7280] shadow-card">
                      {isEasyMode ? 'Select a device from the list to view its Wi-Fi health.' : 'Select a client endpoint from the list to inspect root cause.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: FLEET TELEMETRY MATRIX TABLE */}
          {activeNav === 'MATRIX' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-white border border-[#E2E5E9] rounded-2xl shadow-card">
                <div>
                  <h2 className="text-[20px] font-bold text-black tracking-tight">
                    {isEasyMode ? 'All Devices Overview' : 'Fleet Telemetry & RF Matrix'}
                  </h2>
                  <p className="text-[13px] text-[#6B7280] font-mono mt-0.5">
                    Real-time link speed, physical RSSI, SNR margins, and retransmission statistics for all {devices.length} endpoints.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-instrument-primary text-[12px] py-1.5 px-4 rounded-lg"
                    onClick={handleRunNetworkAudit}
                  >
                    <IconSparkles size={14} />
                    <span>Run AI Network Audit</span>
                  </button>
                </div>
              </div>

              <ClientTable
                devices={visibleDevices}
                diagnoses={diagnoses}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={(dev) => {
                  handleSelectDevice(dev);
                  setActiveNav('INSPECTOR');
                }}
              />
            </div>
          )}

          {/* SECTION 3: INTERACTIVE DIAGNOSTIC RULES SPECIFICATION */}
          {activeNav === 'RULES' && (
            <div className="border border-[#E2E5E9] rounded-2xl bg-white p-7 space-y-6 shadow-panel">
              <div className="border-b border-[#E2E5E9] pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                    <IconRule size={15} />
                  </div>
                  <h2 className="text-[22px] font-bold text-black tracking-tight">
                    {isEasyMode ? 'How WaveScope Checks Your Wi-Fi' : 'Layer 2 Deterministic Rule System'}
                  </h2>
                </div>
                <p className="text-[14.5px] text-[#3B4045] leading-relaxed font-sans">
                  {isEasyMode
                    ? 'WaveScope tests your wireless signals using local physics-based diagnostic rules before asking Google Gemini for plain-English explanations:'
                    : 'WaveScope evaluates four competing physical RF hypotheses using local mathematical point thresholds and signal metrics with zero fallback LLM hallucination:'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                {/* Rule 1 */}
                <div className="p-5 border border-[#E2E5E9] rounded-xl bg-[#F8F9FA] space-y-2 shadow-subtle hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-black uppercase tracking-wider">
                      {isEasyMode ? '1. Distance & Walls (Too Far)' : '1. Weak / Attenuated Signal'}
                    </span>
                    <span className="badge-status font-mono text-[9px] rounded-md border-[#DC2626] text-[#DC2626]">
                      PATH LOSS
                    </span>
                  </div>
                  <p className="text-[13.5px] text-[#3B4045] leading-relaxed">
                    {isEasyMode
                      ? 'Triggered when your device is too far from the router or separated by thick concrete/metal walls, making the signal faint.'
                      : 'Triggered when RSSI ≤ -75 dBm, SNR ≤ 15 dB, or Retries ≥ 15%. Confirms physical path attenuation and low link rates.'}
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="p-5 border border-[#E2E5E9] rounded-xl bg-[#F8F9FA] space-y-2 shadow-subtle hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-black uppercase tracking-wider">
                      {isEasyMode ? '2. Crowded Airwaves (Interference)' : '2. Possible RF Interference'}
                    </span>
                    <span className="badge-status font-mono text-[9px] rounded-md border-[#D97706] text-[#D97706]">
                      RF JAMMING
                    </span>
                  </div>
                  <p className="text-[13.5px] text-[#3B4045] leading-relaxed">
                    {isEasyMode
                      ? 'Triggered when the signal appears strong, but background electronics, microwaves, or neighboring routers crowd the channel.'
                      : 'Triggered when RSSI ≥ -65 dBm but SNR ≤ 12 dB or Noise Floor ≥ -70 dBm. Indicates high noise floor disrupting frame delivery.'}
                  </p>
                </div>

                {/* Rule 3 */}
                <div className="p-5 border border-[#E2E5E9] rounded-xl bg-[#F8F9FA] space-y-2 shadow-subtle hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-black uppercase tracking-wider">
                      {isEasyMode ? '3. Hardware Age (Older Device)' : '3. Hardware / Capability Limited'}
                    </span>
                    <span className="badge-status font-mono text-[9px] rounded-md border-black text-black">
                      PHY CAPABILITY
                    </span>
                  </div>
                  <p className="text-[13.5px] text-[#3B4045] leading-relaxed">
                    {isEasyMode
                      ? 'Triggered when an older device (like legacy smart plugs) is limited by its own antenna and can never reach gigabit speeds.'
                      : 'Triggered when client hardware is 802.11n/legacy, 20MHz width, or 1x1 SISO while RF link is otherwise pristine.'}
                  </p>
                </div>

                {/* Rule 4 */}
                <div className="p-5 border border-[#E2E5E9] rounded-xl bg-[#F8F9FA] space-y-2 shadow-subtle hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-black uppercase tracking-wider">
                      {isEasyMode ? '4. Setting Tweak (Wrong Band)' : '4. Potential Band Selection Issue'}
                    </span>
                    <span className="badge-status font-mono text-[9px] rounded-md border-[#16A34A] text-[#16A34A]">
                      BAND STEERING
                    </span>
                  </div>
                  <p className="text-[13.5px] text-[#3B4045] leading-relaxed">
                    {isEasyMode
                      ? 'Triggered when a modern fast phone or laptop is stuck on the slow 2.4 GHz channel when faster 5 GHz / 6 GHz is available.'
                      : 'Triggered when a dual-band/tri-band device is associated on congested 2.4GHz despite strong SNR and 5GHz availability.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Whole-Network Diagnostic Audit Modal */}
      <NetworkReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        scanResult={scanResult}
        report={auditReport}
        isLoading={isScanLoading}
        error={scanError}
        onRescan={handleRunNetworkAudit}
      />

      {/* API Key Configuration Modal */}
      {showKeyModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-instrument max-w-md rounded-2xl shadow-float overflow-hidden">
            <div className="modal-header bg-[#F8F9FA] p-5 border-b border-[#E2E5E9]">
              <div className="flex items-center gap-2">
                <IconKey size={18} className="text-black" />
                <span className="text-[15px] font-bold text-black">Google Gemini API Configuration</span>
              </div>
              <button type="button" className="font-bold text-[#6B7280] hover:text-black" onClick={() => setShowKeyModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body p-6 space-y-4">
              <p className="text-[13.5px] text-[#3B4045] leading-relaxed">
                Connected Model: <strong className="text-black">gemini-3.1-flash-lite</strong>. Zero fallback cache.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#3B4045]">Gemini API Key</label>
                <input
                  type="password"
                  className="w-full bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl p-3 font-mono text-[13px] text-black outline-none focus:border-black shadow-subtle transition-colors"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-between pt-3 border-t border-[#E2E5E9]">
                <button
                  type="button"
                  className="btn-instrument-secondary text-[#DC2626] border-[#DC2626] text-[11px] rounded-lg"
                  onClick={handleClearApiKey}
                >
                  Clear Key & Log Out
                </button>
                <button
                  type="button"
                  className="btn-instrument-primary text-[11px] py-1.5 px-4 rounded-lg"
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

