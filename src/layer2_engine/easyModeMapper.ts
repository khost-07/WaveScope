import { ClientDevice, StructuredDiagnosis } from '../layer1_data/types';
import { PeerCorroborationResult } from './peerAnalysis';
import { DeviceTrend } from './trendEngine';
import { CoverageMapResult } from './deadZoneMapper';

export type FriendlyIconType = 'HAPPY' | 'NEUTRAL' | 'CONCERNED';
export type FriendlyLevel = 'GREAT' | 'ATTENTION' | 'PROBLEM';

export interface EasyModeDiagnosis {
  headline: string;
  shortVerdict: string;
  explanation: string;
  peerOrTrendNote?: string;
  recommendedAction: string;
  level: FriendlyLevel;
  iconType: FriendlyIconType;
}

/**
 * Maps deterministic Layer 2 telemetry & engine diagnosis into friendly,
 * jargon-free plain English for Easy Mode display.
 */
export function mapToEasyMode(
  device: ClientDevice,
  diagnosis: StructuredDiagnosis,
  peerResult?: PeerCorroborationResult | null,
  trend?: DeviceTrend | null,
  coverage?: CoverageMapResult | null
): EasyModeDiagnosis {
  const deviceName = device.hostname || 'Device';
  const primary = diagnosis.primary_diagnosis.toLowerCase();
  const status = diagnosis.status;

  let headline = `Your ${deviceName} is working great.`;
  let shortVerdict = 'Working great';
  let explanation = 'Your connection is fast, stable, and running at full strength.';
  let recommendedAction = "You're all set — nothing to do.";
  let level: FriendlyLevel = 'GREAT';
  let iconType: FriendlyIconType = 'HAPPY';

  if (primary.includes('weak') || primary.includes('attenuat')) {
    level = 'PROBLEM';
    iconType = 'CONCERNED';
    headline = `Your ${deviceName} is too far from the router.`;
    shortVerdict = 'Too far from router';
    explanation = 'The Wi-Fi signal has to travel too far or pass through thick walls and doors before reaching this device.';
    recommendedAction = 'Try moving closer to your Wi-Fi router or placing your router in an open, elevated spot.';
  } else if (primary.includes('interfer') || primary.includes('rf noise') || primary.includes('noise')) {
    level = 'PROBLEM';
    iconType = 'CONCERNED';
    headline = `Something nearby is disrupting your ${deviceName}'s signal.`;
    shortVerdict = 'Signal disrupted';
    explanation = 'Other electronics, dense objects, or neighboring signals are crowding the airwaves and causing choppy performance.';
    recommendedAction = 'Try moving this device away from large metal appliances, microwaves, or dense obstructions.';
  } else if (primary.includes('hardware') || primary.includes('capability')) {
    level = 'ATTENTION';
    iconType = 'NEUTRAL';
    headline = `Your ${deviceName} is a bit older and can't get the fastest Wi-Fi.`;
    shortVerdict = 'Older Wi-Fi hardware';
    explanation = 'This device was built with older Wi-Fi hardware that has a lower top speed, even though the connection is stable.';
    recommendedAction = 'No action needed unless you want higher speeds — in that case, consider using a newer device or Wi-Fi adapter.';
  } else if (primary.includes('band') || primary.includes('configuration')) {
    level = 'ATTENTION';
    iconType = 'NEUTRAL';
    headline = `Your ${deviceName} could be faster with a quick setting change.`;
    shortVerdict = 'Setting tweak available';
    explanation = 'This device supports faster Wi-Fi speeds, but is currently connected to a slower, busier frequency channel.';
    recommendedAction = 'Open Wi-Fi settings on this device and connect to your router’s 5 GHz or faster network name if available.';
  } else if (status === 'ATTENTION') {
    level = 'ATTENTION';
    iconType = 'NEUTRAL';
    headline = `Your ${deviceName} has a sub-optimal connection.`;
    shortVerdict = 'Sub-optimal connection';
    explanation = 'The connection is working, but could be faster or more responsive with a slight adjustment.';
    recommendedAction = 'Check your proximity to the router or reconnect to your Wi-Fi.';
  } else if (status === 'CRITICAL') {
    level = 'PROBLEM';
    iconType = 'CONCERNED';
    headline = `Your ${deviceName} is having trouble staying connected.`;
    shortVerdict = 'Connection trouble';
    explanation = 'The wireless signal is struggling to maintain a stable link with your router.';
    recommendedAction = 'Move closer to your router or restart your Wi-Fi connection.';
  }

  // Synthesize peer corroboration, dead-zone, and trend context into plain sentences
  const notes: string[] = [];

  if (peerResult && peerResult.hasPeers) {
    if (peerResult.verdict === 'ENVIRONMENTAL_SHARED') {
      notes.push(
        'Other devices nearby are having the same issue — it’s likely your router’s placement or shared room interference rather than this specific device.'
      );
    } else if (peerResult.verdict === 'DEVICE_SPECIFIC' && level !== 'GREAT') {
      notes.push(
        'Other devices in your home are working fine — moving just this device to a better spot should fix it.'
      );
    }
  }

  if (coverage && coverage.targetZone === 'DEAD_ZONE' && level !== 'GREAT') {
    notes.push('This device appears to be situated in a Wi-Fi dead spot.');
  }

  if (trend && trend.hasEnoughData) {
    if (trend.direction === 'DEGRADING') {
      notes.push('This device’s signal has been getting weaker over time.');
    } else if (trend.direction === 'IMPROVING') {
      notes.push('This device’s signal has been improving.');
    }
  }

  const peerOrTrendNote = notes.length > 0 ? notes.join(' ') : undefined;

  return {
    headline,
    shortVerdict,
    explanation,
    peerOrTrendNote,
    recommendedAction,
    level,
    iconType
  };
}
