import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientDevice, DataSourceMode, StructuredDiagnosis, DataProvenance, DiagnosticStatus } from './layer1_data/types';
import { SIMULATION_SCENARIOS, SIMULATED_AP } from './layer1_data/simulationDataset';
import { loadDevices } from './layer1_data/dataService';
import { runDiagnosticEngine } from './layer2_engine/engine';
import { generateExplanation } from './layer3_llm/llmService';
import { LLMExplanationResponse } from './layer3_llm/types';
import { NetworkOverviewBar } from './components/NetworkOverviewBar';
import { DeviceListPane } from './components/DeviceListPane';
import { DeviceDetailHub } from './components/DeviceDetailHub';
import { ClientTable } from './components/ClientTable';
import { ApiKeySetupScreen } from './components/ApiKeySetupScreen';
import { IconKey } from './components/SvgIcons';

const STORAGE_KEY = 'wavescope_gemini_api_key';

export function App() {
  const [mode, setMode] = useState<DataSourceMode>('SIMULATION');
  const [viewLayout, setViewLayout] = useState<'WORKSPACE' | 'TABLE'>('WORKSPACE');
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

  // Trigger LLM Live API Explanation on explicit device selection (Layer 3)
  const triggerExplanationForDevice = useCallback(async (device: ClientDevice, diagnosis: StructuredDiagnosis, keyToUse?: string) => {
    const activeKey = keyToUse !== undefined ? keyToUse : apiKey;
    if (!activeKey || !activeKey.trim()) {
      setLlmErrors(prev => ({
        ...prev,
        [device.id]: 'No Gemini API key configured. Please enter your API key.'
      }));
      return;
    }

    setIsLlmLoading(true);
    setLlmErrors(prev => ({ ...prev, [device.id]: null }));

    try {
      const result = await generateExplanation(device, diagnosis, activeKey);
      setExplanations(prev => ({
        ...prev,
        [device.id]: result
      }));
      setLlmErrors(prev => ({
        ...prev,
        [device.id]: null
      }));
    } catch (err: any) {
      console.error('Error generating explanation via Live API:', err);
      setLlmErrors(prev => ({
        ...prev,
        [device.id]: err.message || 'Failed to generate explanation from Gemini API.'
      }));
    } finally {
      setIsLlmLoading(false);
    }
  }, [apiKey]);

  // Save API Key from Setup Screen
  const handleSaveApiKey = (newKey: string, persist: boolean) => {
    setApiKey(newKey);
    if (persist) {
      localStorage.setItem(STORAGE_KEY, newKey);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHasCompletedSetup(true);
    setShowKeyModal(false);

    if (selectedDevice && selectedDiagnosis) {
      triggerExplanationForDevice(selectedDevice, selectedDiagnosis, newKey);
    }
  };

  // Clear API Key
  const handleClearApiKey = () => {
    setApiKey('');
    localStorage.removeItem(STORAGE_KEY);
    setHasCompletedSetup(false);
    setShowKeyModal(false);
  };

  // Load devices on data mode change
  useEffect(() => {
    let isMounted = true;
    async function updateData() {
      const res = await loadDevices(mode, simulatedDevices);
      if (!isMounted) return;

      setDevices(res.devices);
      setProvenance(res.provenance);

      if (mode === 'REAL') {
        if (res.realProbeStatus?.errorMessage) {
          setRealError(res.realProbeStatus.errorMessage);
        } else {
          setRealError(null);
        }
      } else {
        setRealError(null);
      }

      if (res.devices.length > 0) {
        const first = res.devices[0];
        setSelectedDeviceId(first.id);
        if (hasCompletedSetup && apiKey) {
          const diag = runDiagnosticEngine(first);
          triggerExplanationForDevice(first, diag);
        }
      } else {
        setSelectedDeviceId(null);
      }
    }

    updateData();
    return () => { isMounted = false; };
  }, [mode, simulatedDevices, hasCompletedSetup, apiKey, triggerExplanationForDevice]);

  // Handle device selection
  const handleSelectDevice = (device: ClientDevice) => {
    setSelectedDeviceId(device.id);
    const diag = diagnoses[device.id] || runDiagnosticEngine(device);
    if (hasCompletedSetup && apiKey) {
      triggerExplanationForDevice(device, diag);
    }
  };

  // Handle live telemetry tweak in interactive simulator
  const handleUpdateDeviceTelemetry = (updatedDevice: ClientDevice) => {
    const nextList = devices.map(d => d.id === updatedDevice.id ? updatedDevice : d);
    setDevices(nextList);
    if (mode === 'SIMULATION') {
      setSimulatedDevices(nextList);
    }
    // Re-evaluate diagnosis
    const diag = runDiagnosticEngine(updatedDevice);
    if (hasCompletedSetup && apiKey) {
      triggerExplanationForDevice(updatedDevice, diag);
    }
  };

  // Quick scenario selector helper
  const handleQuickScenario = (scenarioId: string) => {
    const target = devices.find(d => d.scenarioId === scenarioId);
    if (target) {
      handleSelectDevice(target);
    }
  };

  // Active AP
  const activeAp = selectedDevice?.apCapabilities || SIMULATED_AP;

  // IF NO API KEY IS CONFIGURED YET -> SHOW ONBOARDING / SETUP SCREEN FIRST
  if (!hasCompletedSetup || !apiKey) {
    return (
      <ApiKeySetupScreen
        initialKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-navbar">
        <div className="nav-left">
          <div className="nav-brand-box">
            <span className="nav-brand-logo">WS</span>
            <div>
              <div className="nav-brand-title">WaveScope</div>
              <div className="nav-brand-sub">Wi-Fi Band & Root-Cause Diagnostic Tool</div>
            </div>
          </div>
        </div>

        <div className="nav-center">
          <div className="nav-segmented-toggle">
            <button
              type="button"
              className={`nav-seg-btn ${viewLayout === 'WORKSPACE' ? 'active' : ''}`}
              onClick={() => setViewLayout('WORKSPACE')}
            >
              Interactive Workspace
            </button>
            <button
              type="button"
              className={`nav-seg-btn ${viewLayout === 'TABLE' ? 'active' : ''}`}
              onClick={() => setViewLayout('TABLE')}
            >
              Spreadsheet View
            </button>
          </div>
        </div>

        <div className="nav-right">
          {/* Data Mode Selector */}
          <div className="data-source-pill-group">
            <button
              type="button"
              className={`source-pill ${mode === 'SIMULATION' ? 'active' : ''}`}
              onClick={() => setMode('SIMULATION')}
            >
              Simulation Mode
            </button>
            <button
              type="button"
              className={`source-pill ${mode === 'REAL' ? 'active' : ''}`}
              onClick={() => setMode('REAL')}
            >
              Real Wi-Fi
            </button>
          </div>

          {/* Settings / API Key */}
          <button
            type="button"
            className="nav-btn-icon"
            onClick={() => setShowKeyModal(true)}
            title="Google Gemini API Configuration"
          >
            <IconKey size={14} />
            <span className="mono" style={{ fontSize: '11.5px' }}>API Key</span>
          </button>
        </div>
      </header>

      {/* Sub Header: Provenance & Status */}
      <div className="app-sub-header">
        <div className="provenance-chip">
          <span className="prov-dot" />
          <span className="prov-label mono">DATA PROVENANCE:</span>
          <span className="prov-val mono">{provenance.sourceIdentifier}</span>
          {provenance.adapterName && (
            <span className="prov-sub mono">({provenance.adapterName})</span>
          )}
        </div>

        <div className="model-active-badge mono">
          <span>AI Engine: <strong>gemini-3.1-flash-lite</strong></span>
          <span className="live-dot" />
        </div>
      </div>

      {/* Real Mode Error / Setup helper if offline */}
      {mode === 'REAL' && realError && (
        <div className="real-status-banner">
          <div>
            <span className="banner-badge">[REAL TELEMETRY PROBE STATUS]</span>
            <span className="banner-msg">{realError}</span>
            <span className="banner-cmd mono">(To launch probe daemon: <code>node server/wlanScanner.cjs</code>)</span>
          </div>
          <button
            type="button"
            className="btn-banner-action"
            onClick={() => setMode('SIMULATION')}
          >
            Switch to Simulation
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="app-main-body">
        {/* Network Health & Preset Bar */}
        <NetworkOverviewBar
          ap={activeAp}
          stats={stats}
          activeFilter={activeFilter}
          onChangeFilter={setActiveFilter}
          selectedScenarioId={selectedDevice?.scenarioId}
          onSelectScenario={handleQuickScenario}
          isSimulation={mode === 'SIMULATION'}
        />

        {/* VIEW 1: MASTER-DETAIL INTERACTIVE WORKSPACE */}
        {viewLayout === 'WORKSPACE' && (
          <div className="workspace-grid">
            {/* Left Pane: Device List */}
            <section className="workspace-left">
              <DeviceListPane
                devices={visibleDevices}
                diagnoses={diagnoses}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={handleSelectDevice}
              />
            </section>

            {/* Right Pane: Device Detail Intelligence Hub */}
            <section className="workspace-right">
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
                <div className="empty-workspace-state">
                  <h3>No Device Selected</h3>
                  <p>Select a client device from the list on the left to inspect its root-cause diagnosis.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 2: HIGH-DENSITY SPREADSHEET TABLE VIEW */}
        {viewLayout === 'TABLE' && (
          <div className="table-view-container">
            <div className="table-view-header">
              <span style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase' }}>
                All Associated Clients Telemetry Grid
              </span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Showing {visibleDevices.length} of {devices.length} endpoints
              </span>
            </div>
            <ClientTable
              devices={visibleDevices}
              diagnoses={diagnoses}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={(dev) => {
                handleSelectDevice(dev);
                setViewLayout('WORKSPACE');
              }}
            />
          </div>
        )}
      </main>

      {/* API Key Modal for Changing Key while inside app */}
      {showKeyModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Google Gemini API Configuration</h3>
            </div>
            <p className="modal-desc">
              WaveScope connects directly to <strong>gemini-3.1-flash-lite</strong> to generate live plain-English explanations.
            </p>

            <div className="modal-input-group">
              <label>Gemini API Key:</label>
              <input
                type="password"
                className="input-instrument mono"
                style={{ width: '100%', borderRadius: '6px' }}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-instrument"
                onClick={handleClearApiKey}
                style={{ color: '#DC2626' }}
              >
                Clear Key & Log Out
              </button>
              <button
                type="button"
                className="btn-instrument primary"
                onClick={() => handleSaveApiKey(apiKey, true)}
                disabled={!apiKey.trim()}
              >
                Save & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
