import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';

interface SimpleDeviceCardProps {
  device: ClientDevice;
  diagnosis: StructuredDiagnosis;
  isSelected: boolean;
  onSelect: (device: ClientDevice) => void;
}

export function getFriendlyStatus(diagnosis: StructuredDiagnosis, device: ClientDevice) {
  const diag = diagnosis.primary_diagnosis.toLowerCase();
  if (diag.includes('healthy')) {
    return {
      title: 'Optimal Connection',
      summary: 'Fast, clean, and reliable connection with zero issues.',
      theme: 'success',
      badge: 'Great Wi-Fi',
      bars: 4,
      speedLabel: `${device.telemetry.txLinkRate_Mbps} Mbps (Very Fast)`
    };
  } else if (diag.includes('weak') || diag.includes('attenuated')) {
    return {
      title: 'Weak Wi-Fi Signal',
      summary: 'Signal is too faint due to distance or walls, causing lag and retries.',
      theme: 'critical',
      badge: 'Weak Signal',
      bars: 1,
      speedLabel: `${device.telemetry.txLinkRate_Mbps} Mbps (Slowed Down)`
    };
  } else if (diag.includes('interference')) {
    return {
      title: 'Heavy RF Interference',
      summary: 'Strong signal, but crowded channels or appliances are jamming the data.',
      theme: 'critical',
      badge: 'Interference',
      bars: 3,
      speedLabel: `${device.telemetry.txLinkRate_Mbps} Mbps (Packet Collisions)`
    };
  } else if (diag.includes('hardware')) {
    return {
      title: 'Older Hardware Limit',
      summary: 'Device is working properly, but limited by its older built-in Wi-Fi chip.',
      theme: 'warning',
      badge: 'Hardware Limit',
      bars: 4,
      speedLabel: `${device.telemetry.txLinkRate_Mbps} Mbps (Hardware Max)`
    };
  } else if (diag.includes('band selection')) {
    return {
      title: 'Using Slower Wi-Fi Band',
      summary: 'This device is capable of fast 5GHz/6GHz, but is stuck on slower 2.4GHz.',
      theme: 'warning',
      badge: 'Wrong Band',
      bars: 4,
      speedLabel: `${device.telemetry.txLinkRate_Mbps} Mbps (Could be 1200+ Mbps)`
    };
  }

  return {
    title: diagnosis.primary_diagnosis,
    summary: 'Wi-Fi connection active.',
    theme: diagnosis.severity === 'High' ? 'critical' : diagnosis.severity === 'Medium' ? 'warning' : 'success',
    badge: diagnosis.status,
    bars: 3,
    speedLabel: `${device.telemetry.txLinkRate_Mbps} Mbps`
  };
}

export function getDeviceTypeIcon(deviceType: string, hostname: string) {
  const name = (deviceType + ' ' + hostname).toLowerCase();
  if (name.includes('macbook') || name.includes('laptop') || name.includes('thinkpad')) {
    return '💻';
  } else if (name.includes('phone') || name.includes('pixel') || name.includes('iphone') || name.includes('smartphone')) {
    return '📱';
  } else if (name.includes('sensor') || name.includes('iot') || name.includes('thermal')) {
    return '🌡️';
  } else if (name.includes('desktop') || name.includes('station') || name.includes('dell')) {
    return '🖥️';
  }
  return '📡';
}

export const SimpleDeviceCard: React.FC<SimpleDeviceCardProps> = ({
  device,
  diagnosis,
  isSelected,
  onSelect
}) => {
  const statusInfo = getFriendlyStatus(diagnosis, device);
  const icon = getDeviceTypeIcon(device.deviceType, device.hostname);

  return (
    <div
      className={`simple-card ${isSelected ? 'selected' : ''} ${statusInfo.theme}`}
      onClick={() => onSelect(device)}
    >
      <div className="simple-card-header">
        <div className="simple-card-title-group">
          <span className="simple-card-icon">{icon}</span>
          <div>
            <div className="simple-card-hostname">{device.hostname}</div>
            <div className="simple-card-type">{device.vendor} &bull; {device.deviceType}</div>
          </div>
        </div>

        <div className={`simple-status-badge ${statusInfo.theme}`}>
          {statusInfo.badge}
        </div>
      </div>

      <div className="simple-card-body">
        <div className="simple-card-problem-title">{statusInfo.title}</div>
        <p className="simple-card-summary">{statusInfo.summary}</p>
      </div>

      <div className="simple-card-footer">
        <div className="simple-speed-indicator">
          <span className="simple-label">Current Speed:</span>
          <span className="simple-speed-val">{statusInfo.speedLabel}</span>
        </div>

        <div className="simple-signal-bars" title={`Signal Quality: ${statusInfo.bars} of 4 bars`}>
          <span className={`bar ${statusInfo.bars >= 1 ? 'active ' + statusInfo.theme : ''}`} />
          <span className={`bar ${statusInfo.bars >= 2 ? 'active ' + statusInfo.theme : ''}`} />
          <span className={`bar ${statusInfo.bars >= 3 ? 'active ' + statusInfo.theme : ''}`} />
          <span className={`bar ${statusInfo.bars >= 4 ? 'active ' + statusInfo.theme : ''}`} />
        </div>
      </div>
    </div>
  );
};
