/**
 * SUPABASE CLIENT SINGLETON
 * Handles connection initialization, environment variables, local storage overrides,
 * and live connectivity testing.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'wavescope_supabase_url';
const STORAGE_KEY_KEY = 'wavescope_supabase_anon_key';

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string = '';
let currentAnonKey: string = '';

export function getStoredSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  return {
    url: storedUrl.trim() || envUrl.trim(),
    anonKey: storedKey.trim() || envKey.trim()
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function initSupabase(url?: string, anonKey?: string): SupabaseClient | null {
  const creds = getStoredSupabaseCredentials();
  const activeUrl = (url || creds.url).trim();
  const activeKey = (anonKey || creds.anonKey).trim();

  if (!activeUrl || !activeKey || !activeUrl.startsWith('http')) {
    supabaseInstance = null;
    currentUrl = '';
    currentAnonKey = '';
    return null;
  }

  if (supabaseInstance && currentUrl === activeUrl && currentAnonKey === activeKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(activeUrl, activeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    currentUrl = activeUrl;
    currentAnonKey = activeKey;
    return supabaseInstance;
  } catch (err) {
    console.error('[WaveScope] Failed to initialize Supabase client:', err);
    supabaseInstance = null;
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    return initSupabase();
  }
  return supabaseInstance;
}

export function saveSupabaseCredentials(url: string, anonKey: string): boolean {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (typeof window !== 'undefined') {
    if (cleanUrl) localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (cleanKey) localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }

  initSupabase(cleanUrl, cleanKey);
  return isSupabaseConfigured();
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string; rowCount?: number }> {
  const client = url && anonKey ? createClient(url.trim(), anonKey.trim(), { auth: { persistSession: false } }) : getSupabase();

  if (!client) {
    return { success: false, message: 'Supabase URL and Anon Key are missing or invalid.' };
  }

  try {
    // Attempt a lightweight probe against devices table
    const { error, count } = await client
      .from('devices')
      .select('id', { count: 'exact', head: true });

    if (error) {
      // Table might not exist or RLS might be restricting
      return {
        success: false,
        message: `Database responded with error: ${error.message} (Code: ${error.code || 'UNKNOWN'})`
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase database & verified tables.',
      rowCount: count ?? 0
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err.message || 'Network error'}`
    };
  }
}
