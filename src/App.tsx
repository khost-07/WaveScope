import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientDevice, DataSourceMode, StructuredDiagnosis, DataProvenance } from './layer1_data/types';
import { SIMULATION_SCENARIOS } from './layer1_data/simulationDataset';
import { loadDevices } from './layer1_data/dataService';
import { runDiagnosticEngine } from './layer2_engine/engine';
import { generateExplanation } from './layer3_llm/llmService';
import { LLMExplanationResponse } from './layer3_llm/types';
import { HeaderInstrument } from './components/HeaderInstrument';
import { UIMode } from './components/ViewModeToggle';
import { SimpleDeviceList } from './components/SimpleDeviceList';
import { SimpleDetailView } from './components/SimpleDetailView';
import { ClientTable } from './components/ClientTable';
import { ClientDetail } from './components/ClientDetail';
import { ApiKeySetupScreen } from './components/ApiKeySetupScreen';

const STORAGE_KEY = 'wavescope_gemini_api_key';

export function App() {
  const [uiMode, setUiMode] = useState<UIMode>('SIMPLE');
  const [mode, setMode] = useState<DataSourceMode>('SIMULATION');
  const [simulatedDevices, setSimulatedDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
  const [devices, setDevices] = useState<ClientDevice[]>(SIMULATION_SCENARIOS);
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

  // Selected device object & diagnosis
  const selectedDevice = useMemo(() => {
    return devices.find(d => d.id === selectedDeviceId) || devices[0] || null;
  }, [devices, selectedDeviceId]);

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
        [device.id]: 'No API key configured. Please enter your Gemini API key.'
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
      <HeaderInstrument
        mode={mode}
        onModeChange={setMode}
        uiMode={uiMode}
        onChangeUiMode={setUiMode}
        provenance={provenance}
        stats={stats}
        onOpenSettings={() => setShowKeyModal(true)}
      />

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

      {/* VIEW 1: USER-FRIENDLY SIMPLE MODE */}
      {uiMode === 'SIMPLE' && (
        <main className="simple-layout">
          {/* Left Column: Device Cards */}
          <section className="simple-left-pane">
            <div className="pane-header-simple">
              <div>
                <h2 className="pane-title-simple">Connected Wi-Fi Devices</h2>
                <p className="pane-desc-simple">Click any device below to see what's happening and how to fix issues.</p>
              </div>
            </div>

            <div className="simple-cards-scroll">
              <SimpleDeviceList
                devices={devices}
                diagnoses={diagnoses}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={handleSelectDevice}
                onSelectScenario={handleQuickScenario}
                isSimulation={mode === 'SIMULATION'}
              />
            </div>
          </section>

          {/* Right Column: Simple Detail & Actionable Steps */}
          <section className="simple-right-pane">
            {selectedDevice && selectedDiagnosis ? (
              <SimpleDetailView
                device={selectedDevice}
                diagnosis={selectedDiagnosis}
                explanation={explanations[selectedDevice.id] || null}
                isLoading={isLlmLoading}
                error={llmErrors[selectedDevice.id]}
                onSwitchToNerdMode={() => setUiMode('NERD')}
                onRefreshExplanation={() => triggerExplanationForDevice(selectedDevice, selectedDiagnosis)}
                onOpenKeyModal={() => setShowKeyModal(true)}
              />
            ) : (
              <div className="empty-state-card">
                <h3>No Device Selected</h3>
                <p>Select a device from the left to inspect its connection health.</p>
              </div>
            )}
          </section>
        </main>
      )}

      {/* VIEW 2: NERD MODE (PRECISION RF INSTRUMENT) */}
      {uiMode === 'NERD' && (
        <main className="main-layout nerd-layout">
          {/* Left Column: Client Overview Table & Test Scenarios */}
          <section className="panel-left">
            <div className="panel-header">
              <div>
                <span className="panel-title">Active Associated Wi-Fi Clients</span>
                <span className="mono" style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  ({devices.length} Endpoints)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-instrument"
                  onClick={() => setUiMode('SIMPLE')}
                  title="Switch to Simple View"
                >
                  ← Simple View
                </button>
              </div>
            </div>

            {/* Scenario Fast-Switch Strip */}
            {mode === 'SIMULATION' && (
              <div className="nerd-scenario-strip">
                <span className="mono nerd-scenario-label">
                  TEST SCENARIOS:
                </span>
                {(['A', 'B', 'C', 'D', 'E'] as const).map(scId => {
                  const isCurrent = selectedDevice?.scenarioId === scId;
                  return (
                    <button
                      key={scId}
                      type="button"
                      className={`btn-instrument ${isCurrent ? 'primary' : ''}`}
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                      onClick={() => handleQuickScenario(scId)}
                    >
                      Scenario {scId}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ClientTable
                devices={devices}
                diagnoses={diagnoses}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={handleSelectDevice}
              />
            </div>

            {/* Architecture Reference Strip */}
            <div className="nerd-arch-footer">
              <div className="mono" style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                ARCHITECTURE: 3 ISOLATED LAYERS
              </div>
              <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '10.5px' }}>
                Layer 1: Raw Telemetry &rarr; Layer 2: Deterministic Rule Engine (No LLM) &rarr; Layer 3: Live Gemini API (Zero Fallback)
              </div>
            </div>
          </section>

          {/* Right Column: Technical Diagnostic Inspector & LLM Explanation */}
          <section className="panel-right">
            {selectedDevice && selectedDiagnosis ? (
              <ClientDetail
                device={selectedDevice}
                diagnosis={selectedDiagnosis}
                explanation={explanations[selectedDevice.id] || null}
                isLlmLoading={isLlmLoading}
                error={llmErrors[selectedDevice.id]}
                onUpdateDeviceTelemetry={handleUpdateDeviceTelemetry}
                onTriggerExplanation={() => triggerExplanationForDevice(selectedDevice, selectedDiagnosis)}
                onOpenKeyModal={() => setShowKeyModal(true)}
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="mono">NO DEVICE SELECTED</div>
                <div style={{ fontSize: '12px', marginTop: '6px' }}>Select an associated device from the overview table to inspect.</div>
              </div>
            )}
          </section>
        </main>
      )}

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
                style={{ width: '100%', borderRadius: '4px' }}
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
