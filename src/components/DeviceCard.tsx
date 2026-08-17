import React from 'react';
import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { IconLaptop, IconPhone, IconDesktop, IconSensor } from './SvgIcons';

interface DeviceCardProps {
  device: ClientDevice;
  diagnosis: StructuredDiagnosis;
  isSelected: boolean;
  onSelect: (device: ClientDevice) => void;
}

export function getDeviceIconComponent(deviceType: string, hostname: string) {
  const name = (deviceType + ' ' + hostname).toLowerCase();
  if (name.includes('macbook') || name.includes('laptop') || name.includes('thinkpad')) {
    return <IconLaptop size={18} />;
  } else if (name.includes('phone') || name.includes('pixel') || name.includes('iphone') || name.includes('smartphone')) {
    return <IconPhone size={18} />;
  } else if (name.includes('sensor') || name.includes('iot') || name.includes('thermal')) {
    return <IconSensor size={18} />;
  } else if (name.includes('desktop') || name.includes('station') || name.includes('dell')) {
    return <IconDesktop size={18} />;
  }
  return <IconLaptop size={18} />;
}

export function getFriendlyBadgeText(diagnosis: StructuredDiagnosis) {
  const diag = diagnosis.primary_diagnosis.toLowerCase();
  if (diag.includes('healthy')) return { label: 'Optimal Link', theme: 'success', bars: 4 };
  if (diag.includes('weak') || diag.includes('attenuated')) return { label: 'Weak Signal', theme: 'critical', bars: 1 };
  if (diag.includes('interference')) return { label: 'RF Jammed', theme: 'critical', bars: 2 };
  if (diag.includes('hardware')) return { label: 'Legacy Radio', theme: 'warning', bars: 4 };
  if (diag.includes('band selection')) return { label: 'Sub-Optimal Band', theme: 'warning', bars: 4 };
  return { label: diagnosis.status, theme: diagnosis.severity === 'High' ? 'critical' : 'warning', bars: 3 };
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  diagnosis,
  isSelected,
  onSelect
}) => {
  const badgeInfo = getFriendlyBadgeText(diagnosis);
  const icon = getDeviceIconComponent(device.deviceType, device.hostname);
  const { telemetry } = device;

  const bandClass = telemetry.band === '5GHz' ? 'b50' : telemetry.band === '6GHz' ? 'b60' : 'b24';

  return (
    <div
      className={`device-card-item ${isSelected ? 'selected' : ''} ${badgeInfo.theme}`}
      onClick={() => onSelect(device)}
    >
      <div className="card-top-row">
        <div className="card-device-meta">
          <div className="card-device-icon-box">
            {icon}
          </div>
          <div>
            <div className="card-hostname">{device.hostname}</div>
            <div className="card-sub-info">
              {device.vendor} &bull; {device.macAddress}
            </div>
          </div>
        </div>

        <div className={`card-status-pill ${badgeInfo.theme}`}>
          {badgeInfo.label}
        </div>
      </div>

      <div className="card-middle-row">
        <div className="card-diag-title">{diagnosis.primary_diagnosis}</div>
      </div>

      <div className="card-bottom-row">
        <div className="card-metrics-strip">
          <span className={`band-badge-mini ${bandClass}`}>
            {telemetry.band}
          </span>
          <span className="mono card-phy-speed">
            {telemetry.txLinkRate_Mbps} Mbps
          </span>
          <span className="mono card-rssi-snr">
            {telemetry.rssi_dBm} dBm / {telemetry.snr_dB} dB SNR
          </span>
        </div>

        {/* Signal Bars */}
        <div className="card-signal-bars" title={`Signal: ${badgeInfo.bars} of 4 bars`}>
          <span className={`sig-bar ${badgeInfo.bars >= 1 ? 'active ' + badgeInfo.theme : ''}`} />
          <span className={`sig-bar ${badgeInfo.bars >= 2 ? 'active ' + badgeInfo.theme : ''}`} />
          <span className={`sig-bar ${badgeInfo.bars >= 3 ? 'active ' + badgeInfo.theme : ''}`} />
          <span className={`sig-bar ${badgeInfo.bars >= 4 ? 'active ' + badgeInfo.theme : ''}`} />
        </div>
      </div>
    </div>
  );
};
