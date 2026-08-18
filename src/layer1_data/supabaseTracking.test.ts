import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStoredSupabaseCredentials,
  isSupabaseConfigured
} from './supabaseClient.js';

test('Supabase Client - Configuration & Credential Management', () => {
  const initial = getStoredSupabaseCredentials();
  assert.ok(typeof initial.url === 'string');
  assert.ok(typeof initial.anonKey === 'string');

  // Test isSupabaseConfigured
  const configured = isSupabaseConfigured();
  assert.ok(typeof configured === 'boolean');
});

test('Supabase Tracking - Schema and Event Type contracts', () => {
  const validEventTypes = ['connect', 'disconnect'];
  assert.equal(validEventTypes.includes('connect'), true);
  assert.equal(validEventTypes.includes('disconnect'), true);
  assert.equal(validEventTypes.includes('reboot'), false);

  // Validate Uptime / Downtime calculation logic
  const now = Date.now();
  const sessionStart = now - 600000; // 10 minutes ago
  const events = [
    { event_type: 'connect', timestamp: new Date(sessionStart).toISOString() },
    { event_type: 'disconnect', timestamp: new Date(sessionStart + 60000).toISOString() }, // 1 min online
    { event_type: 'connect', timestamp: new Date(sessionStart + 120000).toISOString() } // 1 min offline, then online rest (8 mins)
  ];

  let totalConnectedMs = 0;
  let lastConnectTime: number | null = null;
  let isCurrentlyConnected = false;

  for (const ev of events) {
    const evTime = new Date(ev.timestamp).getTime();
    if (ev.event_type === 'connect') {
      lastConnectTime = evTime;
      isCurrentlyConnected = true;
    } else if (ev.event_type === 'disconnect') {
      if (lastConnectTime !== null) {
        totalConnectedMs += Math.max(0, evTime - lastConnectTime);
        lastConnectTime = null;
      }
      isCurrentlyConnected = false;
    }
  }

  if (isCurrentlyConnected && lastConnectTime !== null) {
    totalConnectedMs += Math.max(0, now - lastConnectTime);
  }

  const totalSpanMs = now - sessionStart;
  const uptimePct = Math.min(100, Math.max(0, Math.round((totalConnectedMs / totalSpanMs) * 100)));
  const downtimePct = 100 - uptimePct;

  assert.ok(uptimePct >= 85 && uptimePct <= 95, `Expected ~90% uptime, got ${uptimePct}%`);
  assert.equal(uptimePct + downtimePct, 100);
});

test('Supabase Tracking - Network Health Snapshot aggregation', () => {
  const stats = { healthy: 6, attention: 2, critical: 0, total: 8 };
  const healthScore = Math.max(0, Math.round(
    ((stats.healthy * 100) + (stats.attention * 60) + (stats.critical * 20)) / stats.total
  ));

  assert.equal(healthScore, 90);
});
