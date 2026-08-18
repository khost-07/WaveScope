/**
 * SUPABASE HISTORICAL TRACKING SERVICE
 * Manages device registration, telemetry buffering, connect/disconnect event logging,
 * and network health snapshot history.
 */

import { getSupabase } from './supabaseClient';
import { ClientDevice, StructuredDiagnosis } from './types';

// In-memory cache for MAC address -> Supabase UUID
const deviceIdCache = new Map<string, string>();

// In-memory tracking of previously observed online devices to detect connect/disconnect edges
let lastOnlineMacs = new Set<string>();
const lastKnownDeviceStatus = new Map<string, 'connect' | 'disconnect'>();
let isFirstSync = true;
let lastSnapshotTime = 0;
let lastReadingsFlushTime = 0;

export interface DeviceUptimeStats {
  uptimePct: number;
  downtimePct: number;
  totalEventsCount: number;
  lastEventType?: 'connect' | 'disconnect';
  lastEventTimestamp?: string;
  totalReadingsCount: number;
  isConnected: boolean;
  totalMonitoredMinutes: number;
}

export interface ConnectionEventItem {
  id: string;
  eventType: 'connect' | 'disconnect';
  timestamp: string;
  durationSincePrevFormatted?: string;
}

export interface HealthSnapshotItem {
  id: string;
  timestamp: string;
  healthScore: number;
  healthyCount: number;
  attentionCount: number;
  criticalCount: number;
}

/**
 * Ensure device exists in `devices` table and return its UUID
 */
export async function ensureDeviceId(macAddress: string, vendor?: string): Promise<string | null> {
  const client = getSupabase();
  if (!client || !macAddress) return null;

  const normalizedMac = macAddress.toUpperCase().trim();
  if (deviceIdCache.has(normalizedMac)) {
    return deviceIdCache.get(normalizedMac)!;
  }

  try {
    // 1. Try to find existing device
    const { data: existing } = await client
      .from('devices')
      .select('id')
      .eq('mac_address', normalizedMac)
      .maybeSingle();

    if (existing?.id) {
      deviceIdCache.set(normalizedMac, existing.id);
      return existing.id;
    }

    // 2. Insert new device
    const { data: inserted, error: insertErr } = await client
      .from('devices')
      .insert({
        mac_address: normalizedMac,
        vendor: vendor || 'Unknown Vendor'
      })
      .select('id')
      .single();

    if (inserted?.id) {
      deviceIdCache.set(normalizedMac, inserted.id);
      return inserted.id;
    }

    // Handle race condition / duplicate key
    if (insertErr) {
      const { data: retryData } = await client
        .from('devices')
        .select('id')
        .eq('mac_address', normalizedMac)
        .maybeSingle();

      if (retryData?.id) {
        deviceIdCache.set(normalizedMac, retryData.id);
        return retryData.id;
      }
    }

    return null;
  } catch (err) {
    console.error('[WaveScope Supabase] ensureDeviceId Error:', err);
    return null;
  }
}

/**
 * Process a batch of active devices from a polling cycle.
 * Handles:
 * 1. Connect / Disconnect transition detection
 * 2. Throttled insertion into `readings` (every ~5-8 seconds)
 * 3. Periodic network health snapshot (every ~30 seconds)
 */
export async function syncHistoricalTelemetry(
  activeDevices: ClientDevice[],
  diagnosesMap: Record<string, StructuredDiagnosis>,
  networkStats: { healthy: number; attention: number; critical: number; total: number }
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  const now = Date.now();
  const currentMacMap = new Map<string, ClientDevice>();
  for (const d of activeDevices) {
    if (d.macAddress) {
      currentMacMap.set(d.macAddress.toUpperCase().trim(), d);
    }
  }
  const currentMacs = new Set(currentMacMap.keys());

  // 1. Detect Connect / Disconnect Transitions
  if (isFirstSync) {
    // Initial run: only insert "connect" if device has no previous events or was last disconnected
    for (const [mac, dev] of currentMacMap.entries()) {
      const devId = await ensureDeviceId(mac, dev.vendor);
      if (devId) {
        const { data: latestEvent } = await client
          .from('connection_events')
          .select('event_type')
          .eq('device_id', devId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latestEvent || latestEvent.event_type !== 'connect') {
          await client.from('connection_events').insert({
            device_id: devId,
            event_type: 'connect',
            timestamp: new Date().toISOString()
          });
        }
        lastKnownDeviceStatus.set(mac, 'connect');
      }
    }
    isFirstSync = false;
  } else {
    // Newly connected devices (in currentMacs but not previously marked connected)
    for (const [mac, dev] of currentMacMap.entries()) {
      if (!lastOnlineMacs.has(mac) && lastKnownDeviceStatus.get(mac) !== 'connect') {
        const devId = await ensureDeviceId(mac, dev.vendor);
        if (devId) {
          await client.from('connection_events').insert({
            device_id: devId,
            event_type: 'connect',
            timestamp: new Date().toISOString()
          });
          lastKnownDeviceStatus.set(mac, 'connect');
        }
      }
    }

    // Disconnected devices (in lastOnlineMacs but no longer in currentMacs)
    for (const oldMac of lastOnlineMacs) {
      if (!currentMacs.has(oldMac) && lastKnownDeviceStatus.get(oldMac) === 'connect') {
        const devId = deviceIdCache.get(oldMac) || await ensureDeviceId(oldMac);
        if (devId) {
          await client.from('connection_events').insert({
            device_id: devId,
            event_type: 'disconnect',
            timestamp: new Date().toISOString()
          });
          lastKnownDeviceStatus.set(oldMac, 'disconnect');
        }
      }
    }
  }

  lastOnlineMacs = currentMacs;

  // 2. Throttled Readings Insert (every 6 seconds)
  if (now - lastReadingsFlushTime >= 6000 && activeDevices.length > 0) {
    lastReadingsFlushTime = now;
    const readingsPayload: any[] = [];

    for (const dev of activeDevices) {
      if (!dev.macAddress) continue;
      const devId = await ensureDeviceId(dev.macAddress, dev.vendor);
      if (!devId) continue;

      const diag = diagnosesMap[dev.id];
      readingsPayload.push({
        device_id: devId,
        timestamp: new Date().toISOString(),
        rssi: dev.telemetry.rssi_dBm,
        snr: dev.telemetry.snr_dB,
        band: dev.telemetry.band,
        link_rate: dev.telemetry.rxLinkRate_Mbps || dev.telemetry.txLinkRate_Mbps,
        diagnosis: diag?.primary_diagnosis || 'Healthy',
        confidence: diag?.confidence || 95
      });
    }

    if (readingsPayload.length > 0) {
      try {
        await client.from('readings').insert(readingsPayload);
      } catch (err) {
        console.error('[WaveScope Supabase] readings insert error:', err);
      }
    }
  }

  // 3. Periodic Network Health Snapshot (every 30 seconds)
  if (now - lastSnapshotTime >= 30000 || lastSnapshotTime === 0) {
    lastSnapshotTime = now;
    const total = networkStats.total || 1;
    const healthScore = Math.max(0, Math.round(
      ((networkStats.healthy * 100) + (networkStats.attention * 60) + (networkStats.critical * 20)) / total
    ));

    try {
      await client.from('network_health_snapshots').insert({
        timestamp: new Date().toISOString(),
        health_score: healthScore,
        healthy_count: networkStats.healthy,
        attention_count: networkStats.attention,
        critical_count: networkStats.critical
      });
    } catch (err) {
      console.error('[WaveScope Supabase] health snapshot insert error:', err);
    }
  }
}

/**
 * Compute Uptime/Downtime % for a selected device
 */
export async function fetchDeviceUptime(macAddress: string): Promise<DeviceUptimeStats> {
  const client = getSupabase();
  if (!client || !macAddress) {
    return {
      uptimePct: 100,
      downtimePct: 0,
      totalEventsCount: 0,
      totalReadingsCount: 0,
      isConnected: true,
      totalMonitoredMinutes: 0
    };
  }

  const devId = await ensureDeviceId(macAddress);
  if (!devId) {
    return {
      uptimePct: 100,
      downtimePct: 0,
      totalEventsCount: 0,
      totalReadingsCount: 0,
      isConnected: true,
      totalMonitoredMinutes: 0
    };
  }

  try {
    // 1. Fetch count of readings
    const { count: readingsCount } = await client
      .from('readings')
      .select('id', { count: 'exact', head: true })
      .eq('device_id', devId);

    // 2. Fetch connection events
    const { data: events, error: evErr } = await client
      .from('connection_events')
      .select('event_type, timestamp')
      .eq('device_id', devId)
      .order('timestamp', { ascending: true });

    if (evErr || !events || events.length === 0) {
      return {
        uptimePct: 100,
        downtimePct: 0,
        totalEventsCount: 0,
        totalReadingsCount: readingsCount || 0,
        isConnected: true,
        totalMonitoredMinutes: Math.max(1, Math.round((readingsCount || 0) * 0.1))
      };
    }

    const firstTime = new Date(events[0].timestamp).getTime();
    const now = Date.now();
    const totalSpanMs = Math.max(now - firstTime, 10000);

    let totalConnectedMs = 0;
    let lastConnectTime: number | null = null;
    let isCurrentlyConnected = false;

    for (const ev of events) {
      const evTime = new Date(ev.timestamp).getTime();
      if (ev.event_type === 'connect') {
        if (isCurrentlyConnected && lastConnectTime !== null) {
          totalConnectedMs += Math.max(0, evTime - lastConnectTime);
        }
        lastConnectTime = evTime;
        isCurrentlyConnected = true;
      } else if (ev.event_type === 'disconnect') {
        if (isCurrentlyConnected && lastConnectTime !== null) {
          totalConnectedMs += Math.max(0, evTime - lastConnectTime);
          lastConnectTime = null;
        }
        isCurrentlyConnected = false;
      }
    }

    // If still connected, add duration up to now
    if (isCurrentlyConnected && lastConnectTime !== null) {
      totalConnectedMs += Math.max(0, now - lastConnectTime);
    }

    const uptimePct = Math.min(100, Math.max(0, Math.round((totalConnectedMs / totalSpanMs) * 100)));
    const downtimePct = 100 - uptimePct;

    const lastEvent = events[events.length - 1];

    return {
      uptimePct,
      downtimePct,
      totalEventsCount: events.length,
      lastEventType: lastEvent?.event_type as 'connect' | 'disconnect',
      lastEventTimestamp: lastEvent?.timestamp,
      totalReadingsCount: readingsCount || 0,
      isConnected: isCurrentlyConnected,
      totalMonitoredMinutes: Math.max(1, Math.round(totalSpanMs / 60000))
    };
  } catch (err) {
    console.error('[WaveScope Supabase] fetchDeviceUptime Error:', err);
    return {
      uptimePct: 100,
      downtimePct: 0,
      totalEventsCount: 0,
      totalReadingsCount: 0,
      isConnected: true,
      totalMonitoredMinutes: 0
    };
  }
}

/**
 * Fetch Chronological Disconnect / Reconnect Event Log for a device
 */
export async function fetchDeviceEventsLog(macAddress: string, limit = 15): Promise<ConnectionEventItem[]> {
  const client = getSupabase();
  if (!client || !macAddress) return [];

  const devId = await ensureDeviceId(macAddress);
  if (!devId) return [];

  try {
    const { data: events, error } = await client
      .from('connection_events')
      .select('id, event_type, timestamp')
      .eq('device_id', devId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error || !events) return [];

    // Calculate duration between consecutive events
    const items: ConnectionEventItem[] = [];
    for (let i = 0; i < events.length; i++) {
      const curr = events[i];
      let durationStr = '';

      if (i + 1 < events.length) {
        const currTime = new Date(curr.timestamp).getTime();
        const prevTime = new Date(events[i + 1].timestamp).getTime();
        const diffSec = Math.max(0, Math.round((currTime - prevTime) / 1000));

        if (diffSec < 60) durationStr = `${diffSec}s`;
        else if (diffSec < 3600) durationStr = `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
        else durationStr = `${(diffSec / 3600).toFixed(1)}h`;
      }

      items.push({
        id: curr.id,
        eventType: curr.event_type as 'connect' | 'disconnect',
        timestamp: curr.timestamp,
        durationSincePrevFormatted: durationStr ? `+${durationStr} since prior state` : 'Initial session discovery'
      });
    }

    return items;
  } catch (err) {
    console.error('[WaveScope Supabase] fetchDeviceEventsLog Error:', err);
    return [];
  }
}

/**
 * Fetch Network Health Score History across the session
 */
export async function fetchNetworkHealthTimeline(limit = 40): Promise<HealthSnapshotItem[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('network_health_snapshots')
      .select('id, timestamp, health_score, healthy_count, attention_count, critical_count')
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    return data.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      healthScore: Number(row.health_score || 0),
      healthyCount: row.healthy_count || 0,
      attentionCount: row.attention_count || 0,
      criticalCount: row.critical_count || 0
    }));
  } catch (err) {
    console.error('[WaveScope Supabase] fetchNetworkHealthTimeline Error:', err);
    return [];
  }
}
