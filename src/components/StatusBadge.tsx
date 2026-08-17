import React from 'react';
import { DiagnosticStatus, SeverityLevel } from '../layer1_data/types';

interface StatusBadgeProps {
  status: DiagnosticStatus;
  severity?: SeverityLevel;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let className = 'status-badge healthy';
  let label = 'HEALTHY';

  if (status === 'CRITICAL') {
    className = 'status-badge critical';
    label = 'CRITICAL';
  } else if (status === 'ATTENTION') {
    className = 'status-badge attention';
    label = 'ATTENTION';
  }

  return (
    <span className={className}>
      [{label}]
    </span>
  );
};

export const BandBadge: React.FC<{ band: string }> = ({ band }) => {
  let className = 'band-badge b24';
  if (band === '5GHz' || band.includes('5')) {
    className = 'band-badge b50';
  } else if (band === '6GHz' || band.includes('6')) {
    className = 'band-badge b60';
  }

  return (
    <span className={className}>
      {band}
    </span>
  );
};
