import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { SimpleDeviceCard } from './SimpleDeviceCard';

interface SimpleDeviceListProps {
  devices: ClientDevice[];
  diagnoses: Record<string, StructuredDiagnosis>;
  selectedDeviceId: string | null;
  onSelectDevice: (device: ClientDevice) => void;
  onSelectScenario?: (scenarioId: string) => void;
  isSimulation: boolean;
}

export const SimpleDeviceList: React.FC<SimpleDeviceListProps> = ({
  devices,
  diagnoses,
  selectedDeviceId,
  onSelectDevice,
  onSelectScenario,
  isSimulation
}) => {
  return (
    <div className="simple-list-container">
      {isSimulation && onSelectScenario && (
        <div className="simple-scenarios-strip">
          <span className="simple-scenarios-label">Demo Scenarios:</span>
          <div className="simple-scenario-buttons">
            <button
              type="button"
              className={`simple-scenario-btn ${devices.find(d => d.id === selectedDeviceId)?.scenarioId === 'A' ? 'active' : ''}`}
              onClick={() => onSelectScenario('A')}
            >
              A: Fast & Clean
            </button>
            <button
              type="button"
              className={`simple-scenario-btn ${devices.find(d => d.id === selectedDeviceId)?.scenarioId === 'B' ? 'active' : ''}`}
              onClick={() => onSelectScenario('B')}
            >
              B: Weak Signal
            </button>
            <button
              type="button"
              className={`simple-scenario-btn ${devices.find(d => d.id === selectedDeviceId)?.scenarioId === 'C' ? 'active' : ''}`}
              onClick={() => onSelectScenario('C')}
            >
              C: Interference
            </button>
            <button
              type="button"
              className={`simple-scenario-btn ${devices.find(d => d.id === selectedDeviceId)?.scenarioId === 'D' ? 'active' : ''}`}
              onClick={() => onSelectScenario('D')}
            >
              D: Older Tech
            </button>
            <button
              type="button"
              className={`simple-scenario-btn ${devices.find(d => d.id === selectedDeviceId)?.scenarioId === 'E' ? 'active' : ''}`}
              onClick={() => onSelectScenario('E')}
            >
              E: Slower Band
            </button>
          </div>
        </div>
      )}

      <div className="simple-cards-grid">
        {devices.map((device) => {
          const diagnosis = diagnoses[device.id] || {
            primary_diagnosis: 'Healthy',
            severity: 'Low',
            status: 'HEALTHY',
            confidence: 90,
            evidence: [],
            possible_causes: [],
            secondary_factors: [],
            hypothesis_scores: {},
            evaluated_at: Date.now()
          };

          return (
            <SimpleDeviceCard
              key={device.id}
              device={device}
              diagnosis={diagnosis}
              isSelected={selectedDeviceId === device.id}
              onSelect={onSelectDevice}
            />
          );
        })}
      </div>
    </div>
  );
};
