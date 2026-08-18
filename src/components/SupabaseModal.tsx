import React, { useState, useEffect } from 'react';
import {
  getStoredSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection
} from '../layer1_data/supabaseClient';
import { IconHistory, IconCheckBox, IconAlertTriangle, IconRefresh } from './SvgIcons';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rowCount?: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getStoredSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveSupabaseCredentials(url, anonKey);
    if (onCredentialsUpdated) onCredentialsUpdated();
    onClose();
  };

  const handleCopySql = () => {
    const sql = `-- WaveScope Supabase Schema
create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  mac_address text unique not null,
  vendor text,
  first_seen timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id) on delete cascade,
  timestamp timestamptz default now(),
  rssi numeric,
  snr numeric,
  band text,
  link_rate numeric,
  diagnosis text,
  confidence numeric
);

create table if not exists connection_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id) on delete cascade,
  event_type text check (event_type in ('connect', 'disconnect')),
  timestamp timestamptz default now()
);

create table if not exists network_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  health_score numeric,
  healthy_count int,
  attention_count int,
  critical_count int
);

alter table devices enable row level security;
alter table readings enable row level security;
alter table connection_events enable row level security;
alter table network_health_snapshots enable row level security;

create policy "Public Devices" on devices for all to anon, authenticated using (true) with check (true);
create policy "Public Readings" on readings for all to anon, authenticated using (true) with check (true);
create policy "Public Events" on connection_events for all to anon, authenticated using (true) with check (true);
create policy "Public Snapshots" on network_health_snapshots for all to anon, authenticated using (true) with check (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-[#E2E5E9] rounded-2xl shadow-panel max-w-xl w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-card">
              <IconHistory size={20} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-black tracking-tight">Supabase Historical Tracking</h2>
              <p className="font-mono text-[11.5px] text-[#6B7280]">
                Persist telemetry readings, disconnect/reconnect logs & health score timelines
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-[#6B7280] hover:text-black text-[20px] font-bold px-2 py-1 cursor-pointer"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B4045] mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              className="w-full font-mono text-[12.5px] p-2.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl focus:border-black focus:bg-white outline-none transition-colors"
              placeholder="https://your-project-ref.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="font-mono text-[10.5px] text-[#6B7280] mt-1">
              Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project URL
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B4045] mb-1">
              Supabase Anon / Publishable Key
            </label>
            <input
              type="password"
              className="w-full font-mono text-[12.5px] p-2.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl focus:border-black focus:bg-white outline-none transition-colors"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
            <p className="font-mono text-[10.5px] text-[#6B7280] mt-1">
              Or set <code className="bg-[#ECEEF1] px-1 py-0.5 rounded text-black">VITE_SUPABASE_URL</code> & <code className="bg-[#ECEEF1] px-1 py-0.5 rounded text-black">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-[#ECEEF1] px-1 py-0.5 rounded text-black">.env.local</code>
            </p>
          </div>

          {/* SQL Schema Copy Button */}
          <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-xl flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-bold text-black">Database Tables Setup</div>
              <div className="font-mono text-[10.5px] text-[#6B7280]">
                Requires 4 tables: <code className="text-black">devices</code>, <code className="text-black">readings</code>, <code className="text-black">connection_events</code>, <code className="text-black">network_health_snapshots</code>
              </div>
            </div>
            <button
              type="button"
              className="btn-instrument-secondary text-[11px] py-1.5 px-3 rounded-lg flex-shrink-0 cursor-pointer"
              onClick={handleCopySql}
            >
              {copiedSql ? '✓ Copied SQL' : 'Copy SQL Schema'}
            </button>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-[12px] flex items-start gap-2.5 font-mono ${
                testResult.success
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
              }`}
            >
              {testResult.success ? <IconCheckBox size={16} /> : <IconAlertTriangle size={16} />}
              <div>
                <strong>{testResult.success ? 'Connected Successfully: ' : 'Connection Failed: '}</strong>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-[#E2E5E9] pt-4">
          <button
            type="button"
            className="btn-instrument-secondary text-[12px] py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
            onClick={handleTest}
            disabled={isTesting || !url || !anonKey}
          >
            <IconRefresh size={14} className={isTesting ? 'animate-spin' : ''} />
            <span>{isTesting ? 'Testing Probe...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-instrument-secondary text-[12px] py-2 px-4 rounded-xl cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-instrument-primary text-[12px] py-2 px-5 rounded-xl shadow-card cursor-pointer"
              onClick={handleSave}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
