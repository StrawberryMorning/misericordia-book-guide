import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if ((!url || !anonKey) && typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('le_loisir_supabase_url');
    const savedKey = localStorage.getItem('le_loisir_supabase_anon_key');
    if (savedUrl && savedKey) {
      url = savedUrl;
      anonKey = savedKey;
    }
  }

  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 20
  );
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('https://') || anonKey.length < 20) {
    return null;
  }
  const keyComb = `${url}::${anonKey}`;
  if (cachedClient && cachedKey === keyComb) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedKey = keyComb;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

// Fallback exported instance for direct usage
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;

export function saveManualSupabaseCredentials(url: string, anonKey: string): boolean {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    if (!cleanUrl.startsWith('https://') || cleanKey.length < 20) {
      return false;
    }
    localStorage.setItem('le_loisir_supabase_url', cleanUrl);
    localStorage.setItem('le_loisir_supabase_anon_key', cleanKey);
    cachedClient = null;
    cachedKey = '';
    return true;
  }
  return false;
}

export function clearManualSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('le_loisir_supabase_url');
    localStorage.removeItem('le_loisir_supabase_anon_key');
    cachedClient = null;
    cachedKey = '';
  }
}
