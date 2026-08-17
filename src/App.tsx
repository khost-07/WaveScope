import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientDevice, DataSourceMode, StructuredDiagnosis, DataProvenance, DiagnosticStatus } from './layer1_data/types';
import { SIMULATION_SCENARIOS, SIMULATED_AP } from './layer1_data/simulationDataset';
import { loadDevices } from './layer1_data/dataService';
import { runDiagnosticEngine } from './layer2_engine/engine';
import { generateExplanation } from './layer3_llm/llmService';
import { LLMExplanationResponse } from './layer3_llm/types';
import { scanLocalNetwork } from './layer1_data/networkScanService';
import { generateNetworkAuditReport } from './layer3_llm/networkReportService';
import { NetworkScanResult, NetworkAuditReport } from './layer1_data/networkScannerTypes';
import { NetworkOverviewBar } from './components/NetworkOverviewBar';
import { DeviceListPane } from './components/DeviceListPane';
import { DeviceDetailHub } from './components/DeviceDetailHub';
import { ClientTable } from './components/ClientTable';
import { ApiKeySetupScreen } from './components/ApiKeySetupScreen';
import { NetworkReportModal } from './components/NetworkReportModal';

const STORAGE_KEY = 'wavescope_gemini_api_key';

type NavSection = 'OVERVIEW' | 'CLIENTS' | 'RULES';

export function App() {
  const [mode, setMode] = useState<DataSourceMode>('SIMULATION');
  const [activeNav, setActiveNav] = useState<NavSection>('CLIENTS');
  const [simulatedDevices, setSimulatedDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
  const [devices, setDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | DiagnosticStatus>('ALL');
  
  const [provenance, setProvenance] = useState<DataProvenance>({
    mode: 'SIMULATION',
    sourceIdentifier: 'Controlled RF Simulation Dataset (Scenarios A–E)',
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

  // Compute Layer 2 Diagnoses deterministically for all active devices
  const diagnoses = useMemo(() => {
    const map: Record<string, StructuredDiagnosis> = {};
    for (const d of devices) {
      map[d.id] = runDiagnosticEngine(d);
    }
    return map;
  }, [devices]);

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
          sourceIdentifier: 'Controlled RF Simulation Dataset (Scenarios A–E)',
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

  // Trigger explanation automatically when selected device changes
  useEffect(() => {
    if (selectedDevice && selectedDiagnosis && !explanations[selectedDevice.id] && hasCompletedSetup && apiKey) {
      triggerExplanationForDevice(selectedDevice, selectedDiagnosis);
    }
  }, [selectedDeviceId, selectedDevice, selectedDiagnosis, explanations, hasCompletedSetup, apiKey, triggerExplanationForDevice]);

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
  const handleRunNetworkAudit = async () => {
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
  };

  const handleSelectDevice = (device: ClientDevice) => {
    setSelectedDeviceId(device.id);
    const diag = diagnoses[device.id] || runDiagnosticEngine(device);
    if (!explanations[device.id] && apiKey) {
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
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased">
      {/* Stitch TopNavBar */}
      <header className="bg-surface border-b border-border-subtle fixed top-0 w-full z-50 h-12 flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[22px]">radar</span>
          <span className="font-headline-md font-bold text-primary tracking-tight">WaveScope</span>
          <span className="badge-status font-data-sm text-[10px] hidden sm:inline-flex">Instrument Node 01-A</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex border border-primary h-8 font-data-sm">
            <button
              type="button"
              className={`px-3 flex items-center justify-center border-r border-primary transition-colors ${
                mode === 'SIMULATION' ? 'bg-primary text-on-primary sim-pattern font-bold' : 'text-primary hover:bg-surface-offset'
              }`}
              onClick={() => setMode('SIMULATION')}
            >
              SIMULATION
            </button>
            <button
              type="button"
              className={`px-3 flex items-center justify-center transition-colors ${
                mode === 'REAL' ? 'bg-primary text-on-primary font-bold' : 'text-primary hover:bg-surface-offset'
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
            <span className="material-symbols-outlined text-[16px]">radar</span>
            Whole Network Audit
          </button>

          <button
            type="button"
            className="btn-instrument-secondary"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            API Key
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex pt-12 min-h-screen">
        {/* Stitch SideNavBar */}
        <aside className="fixed left-0 top-12 bottom-0 w-64 border-r border-border-subtle bg-surface flex flex-col z-40 hidden md:flex">
          <div className="p-4 border-b border-border-subtle">
            <div className="font-headline-md text-primary text-[15px]">WaveScope Admin</div>
            <div className="font-data-sm text-muted text-[11px] mt-0.5">{provenance.sourceIdentifier}</div>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            <button
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left font-label-caps transition-colors ${
                activeNav === 'CLIENTS'
                  ? 'bg-surface-offset text-primary border-l-2 border-primary font-bold'
                  : 'text-secondary hover:bg-surface-offset'
              }`}
              onClick={() => setActiveNav('CLIENTS')}
            >
              <span className="material-symbols-outlined text-[18px]">router</span>
              <span>Connected Clients</span>
              <span className="ml-auto badge-status font-data-sm text-[9px]">{devices.length}</span>
            </button>

            <button
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left font-label-caps transition-colors ${
                activeNav === 'OVERVIEW'
                  ? 'bg-surface-offset text-primary border-l-2 border-primary font-bold'
                  : 'text-secondary hover:bg-surface-offset'
              }`}
              onClick={() => setActiveNav('OVERVIEW')}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Overview Table</span>
            </button>

            <button
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left font-label-caps transition-colors ${
                activeNav === 'RULES'
                  ? 'bg-surface-offset text-primary border-l-2 border-primary font-bold'
                  : 'text-secondary hover:bg-surface-offset'
              }`}
              onClick={() => setActiveNav('RULES')}
            >
              <span className="material-symbols-outlined text-[18px]">rule</span>
              <span>Diagnostic Rules</span>
            </button>
          </nav>

          <div className="p-3 border-t border-border-subtle space-y-1 font-data-sm text-[11px] text-muted">
            <div>Engine: <strong>L2 Math Scoring</strong></div>
            <div>AI: <strong>gemini-3.1-flash-lite</strong></div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="md:ml-64 flex-1 p-6 space-y-6 max-w-6xl">
          {/* Real Mode Error Alert if daemon not running */}
          {mode === 'REAL' && realError && (
            <div className="p-4 border border-status-critical bg-surface flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-label-caps text-status-critical font-bold">REAL WLAN PROBE STATUS</div>
                <div className="font-data-sm text-secondary">{realError}</div>
                <div className="font-data-sm text-muted">Run in terminal: <code>node server/wlanScanner.cjs</code></div>
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
          />

          {/* SECTION 1: CONNECTED CLIENTS WORKSPACE (MASTER-DETAIL) */}
          {activeNav === 'CLIENTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Device List */}
              <div className="lg:col-span-4">
                <DeviceListPane
                  devices={visibleDevices}
                  diagnoses={diagnoses}
                  selectedDeviceId={selectedDeviceId}
                  onSelectDevice={handleSelectDevice}
                />
              </div>

              {/* Right Column: Device Detail Intelligence Hub */}
              <div className="lg:col-span-8">
                {selectedDevice && selectedDiagnosis ? (
                  <DeviceDetailHub
                    device={selectedDevice}
                    diagnosis={selectedDiagnosis}
                    explanation={explanations[selectedDevice.id] || null}
                    isLoading={isLlmLoading}
                    error={llmErrors[selectedDevice.id]}
                    onUpdateDeviceTelemetry={handleUpdateDeviceTelemetry}
                    onTriggerExplanation={() => triggerExplanationForDevice(selectedDevice, selectedDiagnosis)}
                    onOpenKeyModal={() => setShowKeyModal(true)}
                  />
                ) : (
                  <div className="p-12 border border-border-subtle bg-surface text-center text-muted font-body-md">
                    Select a client from the list to inspect root cause.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: HIGH-DENSITY PRIMARY DEVICE TABLE */}
          {activeNav === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-primary">All Associated Clients Telemetry Matrix</h2>
                <span className="font-data-sm text-muted">
                  Showing {visibleDevices.length} of {devices.length} endpoints
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
            <div className="border border-border-subtle bg-surface p-6 space-y-4">
              <div className="border-b border-border-subtle pb-3">
                <h2 className="font-headline-lg text-primary">Layer 2 Deterministic Rule Engine</h2>
                <p className="font-body-md text-secondary mt-1">
                  WaveScope evaluates four competing physical RF hypotheses using local mathematical point thresholds without LLM dependence:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border-subtle bg-surface-offset space-y-1">
                  <div className="font-label-caps text-primary font-bold">1. Weak / Attenuated Signal</div>
                  <p className="font-body-md text-secondary text-[13px]">
                    Triggered when RSSI &le; -75 dBm, SNR &le; 15 dB, or Retries &ge; 15%. Confirms high physical path loss or excessive obstacle attenuation.
                  </p>
                </div>

                <div className="p-4 border border-border-subtle bg-surface-offset space-y-1">
                  <div className="font-label-caps text-primary font-bold">2. Possible RF Interference</div>
                  <p className="font-body-md text-secondary text-[13px]">
                    Triggered when RSSI &ge; -65 dBm but SNR &le; 12 dB or Noise Floor &ge; -70 dBm. Indicates heavy co-channel / non-Wi-Fi jamming.
                  </p>
                </div>

                <div className="p-4 border border-border-subtle bg-surface-offset space-y-1">
                  <div className="font-label-caps text-primary font-bold">3. Hardware / Capability Limited</div>
                  <p className="font-body-md text-secondary text-[13px]">
                    Triggered when device standard is 802.11n/legacy, 20MHz width, or 1x1 SISO while RF link is stable (SNR &ge; 25 dB).
                  </p>
                </div>

                <div className="p-4 border border-border-subtle bg-surface-offset space-y-1">
                  <div className="font-label-caps text-primary font-bold">4. Potential Band Selection Issue</div>
                  <p className="font-body-md text-secondary text-[13px]">
                    Triggered when a dual-band/tri-band device is associated on congested 2.4GHz despite strong signal (RSSI &ge; -60 dBm).
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
              <span className="font-headline-md text-primary text-[15px]">Google Gemini API Configuration</span>
              <button type="button" className="font-bold text-muted hover:text-primary" onClick={() => setShowKeyModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body space-y-4">
              <p className="font-body-md text-secondary text-[13px]">
                Connected Model: <strong>gemini-3.1-flash-lite</strong>. Zero fallback cache.
              </p>

              <div className="space-y-1">
                <label className="font-label-caps text-secondary text-[10px]">Gemini API Key</label>
                <input
                  type="password"
                  className="w-full bg-surface-offset border border-border-subtle p-2.5 font-data-md text-primary outline-none focus:border-primary"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-between pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  className="btn-instrument-secondary text-status-critical border-status-critical text-[11px]"
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
