import { supabase } from './supabase';
import { normalizeFromDbRow, prepareForDbPayload } from './dbMapper';

// Resilient fetch helper with timeout and content-type verification
async function resilientFetch(url: string, options: RequestInit = {}, timeoutMs: number = 6000): Promise<{ ok: boolean; status: number; data: any; isJson: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      try {
        const data = await res.json();
        return { ok: res.ok, status: res.status, data, isJson: true };
      } catch (_) {
        return { ok: false, status: res.status, data: null, isJson: false };
      }
    } else {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, data: text, isJson: false };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { ok: false, status: 0, data: null, isJson: false };
  }
}

export async function fetchAllTablesMaster(force: boolean = false): Promise<any | null> {
  try {
    const url = force ? '/api/admin/fetch-all?force=true' : '/api/admin/fetch-all';
    const res = await resilientFetch(url, {}, 8000);
    if (res.ok && res.isJson && res.data && res.data.success && res.data.data) {
      return res.data.data;
    }
  } catch (_) {}
  return null;
}

export async function loginUserInDatabase(phone: string, password: string, country?: string): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const res = await resilientFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, country })
    }, 8000);

    if (res.isJson && res.data) {
      if (res.data.success && res.data.user) {
        return { success: true, user: normalizeFromDbRow('users', res.data.user) };
      }
      if (res.data.error) {
        return { success: false, error: res.data.error };
      }
    }
  } catch (err: any) {
    console.warn('[Login Endpoint Error]:', err);
  }
  return { success: false, error: "Impossible de joindre le serveur d'authentification pour le moment." };
}

export async function registerUserInDatabase(user: any): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const res = await resilientFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }, 8000);

    if (res.isJson && res.data) {
      if (res.data.success && res.data.user) {
        return { success: true, user: normalizeFromDbRow('users', res.data.user) };
      }
      if (res.data.error) {
        let msg = res.data.error;
        if (msg.includes('users_phone_key') || msg.includes('unique constraint') || msg.includes('23505') || msg.includes('already exists')) {
          msg = 'Ce numéro possède déjà un compte, veuillez vous connecter.';
        }
        return { success: false, error: msg };
      }
    }
  } catch (err: any) {
    console.warn('[Register Endpoint Error]:', err);
  }

  // Fallback: Direct upsert via Supabase client
  const fallbackRes = await upsertItem('users', user);
  if (!fallbackRes.success && fallbackRes.error) {
    let msg = fallbackRes.error;
    if (msg.includes('users_phone_key') || msg.includes('unique constraint') || msg.includes('23505') || msg.includes('already exists')) {
      msg = 'Ce numéro possède déjà un compte, veuillez vous connecter.';
    }
    return { success: false, error: msg };
  }
  return fallbackRes;
}

export async function fetchTableData<T>(tableName: string): Promise<T[] | null> {
  // 1. Try authoritative server route first (Bypasses RLS with Service Role)
  try {
    const res = await resilientFetch(`/api/admin/fetch-table?tableName=${encodeURIComponent(tableName)}`, {}, 6000);
    if (res.ok && res.isJson && res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data.map((row: any) => normalizeFromDbRow(tableName, row)) as T[];
    }
  } catch (_) {}

  // 2. Fallback: Direct Supabase client fetch with timeout
  try {
    const queryPromise = supabase.from(tableName).select('*').limit(10000);
    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) => 
      setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000)
    );
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' fetch notice:`, error.message);
      return null;
    }
    return (data || []).map((row: any) => normalizeFromDbRow(tableName, row)) as T[];
  } catch (err) {
    console.warn(`[Supabase] Error connecting to table '${tableName}':`, err);
    return null;
  }
}

export async function upsertItem<T>(tableName: string, item: T): Promise<{ success: boolean; error?: string }> {
  // 1. Try authoritative Service Role execute endpoint
  try {
    const res = await resilientFetch('/api/admin/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', tableName, item })
    }, 6000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return { success: true };
    }
  } catch (_) {}

  // 2. Fallback: Direct client upsert with prepared db payload
  try {
    const payload = prepareForDbPayload(tableName, item);
    const conflictCol = (payload as any).id ? 'id' : ((payload as any).code ? 'code' : undefined);
    const queryPromise = supabase.from(tableName).upsert(payload as any, conflictCol ? { onConflict: conflictCol } : undefined);
    const timeoutPromise = new Promise<{ error: any }>((resolve) => 
      setTimeout(() => resolve({ error: { message: 'Timeout' } }), 6000)
    );
    const { error } = await Promise.race([queryPromise, timeoutPromise]);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' upsert error:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase] Error saving to '${tableName}':`, err);
    return { success: false, error: err?.message || 'Erreur de connexion Supabase' };
  }
}

export async function insertItem<T>(tableName: string, item: T): Promise<{ success: boolean; error?: string }> {
  // 1. Try authoritative Service Role execute endpoint
  try {
    const res = await resilientFetch('/api/admin/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', tableName, item })
    }, 6000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return { success: true };
    }
  } catch (_) {}

  // 2. Fallback: Direct client insert with prepared db payload
  try {
    const payload = prepareForDbPayload(tableName, item);
    const { error } = await supabase.from(tableName).insert(payload as any);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' insert error:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase] Error inserting to '${tableName}':`, err);
    return { success: false, error: err?.message || 'Erreur de connexion Supabase' };
  }
}

export async function updateItem<T>(
  tableName: string,
  updates: Partial<T>,
  idValue: string,
  idCol: string = 'id'
): Promise<{ success: boolean; error?: string }> {
  // 1. Try authoritative Service Role execute endpoint
  try {
    const res = await resilientFetch('/api/admin/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', tableName, updates, idValue, idCol })
    }, 6000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return { success: true };
    }
  } catch (_) {}

  // 2. Fallback: Direct client update with prepared db payload (allowDefaults = false to prevent overwriting unincluded columns)
  try {
    const payload = prepareForDbPayload(tableName, updates, null, false);
    const { error } = await supabase.from(tableName).update(payload as any).eq(idCol, idValue);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' update error:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase] Error updating '${tableName}':`, err);
    return { success: false, error: err?.message || 'Erreur de connexion Supabase' };
  }
}

export async function syncTableData<T>(tableName: string, items: T[]): Promise<{ success: boolean; error?: string }> {
  if (!items || items.length === 0) return { success: true };

  // 1. Try authoritative Service Role execute endpoint
  try {
    const res = await resilientFetch('/api/admin/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', tableName, items })
    }, 8000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return { success: true };
    }
  } catch (_) {}

  // 2. Fallback: Direct client sync
  try {
    const payloads = items.map(item => prepareForDbPayload(tableName, item));
    const { error } = await supabase.from(tableName).upsert(payloads as any);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' sync error:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase] Error syncing to table '${tableName}':`, err);
    return { success: false, error: err?.message || 'Erreur de connexion Supabase' };
  }
}

export async function deleteRecord(tableName: string, primaryKeyValue: string, idColName: string = 'id'): Promise<{ success: boolean; error?: string }> {
  // 1. Try authoritative Service Role execute endpoint
  try {
    const res = await resilientFetch('/api/admin/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', tableName, idValue: primaryKeyValue, idCol: idColName })
    }, 6000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return { success: true };
    }
  } catch (_) {}

  // 2. Fallback: Direct client delete
  try {
    const { error } = await supabase.from(tableName).delete().eq(idColName, primaryKeyValue);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' delete error:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase] Error deleting from table '${tableName}':`, err);
    return { success: false, error: err?.message || 'Erreur de connexion Supabase' };
  }
}

export async function saveSystemConfig<T>(configKey: string, value: T): Promise<{ success: boolean; error?: string }> {
  const payload = Array.isArray(value) ? value : [value];
  const item = {
    code: configKey,
    amount: 0,
    maxUses: 0,
    usedBy: payload as any,
    createdAt: new Date().toISOString()
  };

  return upsertItem('bonus_codes', item);
}

export async function deleteSystemConfig(configKey: string): Promise<{ success: boolean; error?: string }> {
  return deleteRecord('bonus_codes', configKey, 'code');
}

export async function fetchSystemConfig<T>(configKey: string, fallbackValue: T): Promise<T> {
  try {
    const { data, error } = await supabase.from('bonus_codes').select('*').eq('code', configKey).single();
    if (error || !data) {
      return fallbackValue;
    }
    const norm = normalizeFromDbRow('bonus_codes', data);
    if (Array.isArray(fallbackValue)) {
      return (norm.usedBy || fallbackValue) as unknown as T;
    }
    if (norm.usedBy && Array.isArray(norm.usedBy) && norm.usedBy.length > 0) {
      return norm.usedBy[0] as unknown as T;
    }
    return fallbackValue;
  } catch (err) {
    return fallbackValue;
  }
}

// Purchase Investment via Dedicated ACID Server Route
export async function buyProductInvestment(
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<{ success: boolean; error?: string; newBalance?: number; investments?: any[]; user?: any }> {
  try {
    const res = await resilientFetch('/api/investments/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, quantity })
    }, 10000);

    if (res.isJson && res.data) {
      return res.data;
    }
  } catch (err: any) {
    console.warn('[Buy Investment Endpoint Error]:', err);
  }
  return { success: false, error: "Erreur lors de la communication avec le serveur d'achat." };
}

// Submit Deposit Request
export async function submitDepositRequest(
  depositData: any
): Promise<{ success: boolean; error?: string; deposit?: any }> {
  try {
    const res = await resilientFetch('/api/deposits/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(depositData)
    }, 8000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return res.data;
    }
  } catch (_) {}

  // Fallback to direct client upsert
  const upRes = await upsertItem('deposits', depositData);
  return { success: upRes.success, error: upRes.error, deposit: depositData };
}

// Submit Withdrawal Request
export async function submitWithdrawalRequest(
  withdrawalData: any
): Promise<{ success: boolean; error?: string; withdrawal?: any }> {
  try {
    const res = await resilientFetch('/api/withdrawals/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withdrawalData)
    }, 8000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return res.data;
    }
  } catch (_) {}

  // Fallback to direct client upsert
  const upRes = await upsertItem('withdrawals', withdrawalData);
  return { success: upRes.success, error: upRes.error, withdrawal: withdrawalData };
}

// Submit Chat Support Ticket
export async function submitSupportTicket(
  ticketData: any
): Promise<{ success: boolean; error?: string; ticket?: any }> {
  try {
    const res = await resilientFetch('/api/tickets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    }, 8000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return res.data;
    }
  } catch (_) {}

  // Fallback to direct client upsert
  const upRes = await upsertItem('tickets', ticketData);
  return { success: upRes.success, error: upRes.error, ticket: ticketData };
}

// Reply to Chat Support Ticket
export async function replySupportTicket(
  ticketId: string,
  reply: string
): Promise<{ success: boolean; error?: string; ticket?: any }> {
  try {
    const res = await resilientFetch('/api/tickets/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, reply })
    }, 8000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return res.data;
    }
  } catch (_) {}

  const nowIso = new Date().toISOString();
  return updateItem('tickets', {
    reply,
    status: 'closed',
    isReadByUser: false,
    replyCreatedAt: nowIso
  }, ticketId);
}

// Send Direct Admin Message to User
export async function sendAdminDirectSupportTicket(
  userId: string,
  message: string,
  subject?: string
): Promise<{ success: boolean; error?: string; ticket?: any }> {
  try {
    const res = await resilientFetch('/api/tickets/direct-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message, subject })
    }, 8000);
    if (res.ok && res.isJson && res.data && res.data.success) {
      return res.data;
    }
  } catch (_) {}

  return { success: false, error: 'Erreur réseau lors de la transmission du message' };
}

// Process Deposit (Admin)
export async function adminProcessDeposit(
  depositId: string,
  status: 'approved' | 'rejected',
  fallbackDepositData?: any
): Promise<{ success: boolean; error?: string; message?: string; alreadyApproved?: boolean; newBalance?: number }> {
  try {
    const res = await resilientFetch('/api/admin/deposits/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId, status, fallbackDepositData })
    }, 8000);
    if (res.isJson && res.data) {
      return res.data;
    }
  } catch (_) {}

  // Fallback to direct client update
  return updateItem('deposits', { status }, depositId);
}

// Process Withdrawal (Admin)
export async function adminProcessWithdrawal(
  withdrawalId: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await resilientFetch('/api/admin/withdrawals/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId, status })
    }, 8000);
    if (res.isJson && res.data) {
      return res.data;
    }
  } catch (_) {}

  // Fallback to direct client update
  return updateItem('withdrawals', { status }, withdrawalId);
}

// Update User Balance (Admin)
export async function adminUpdateUserBalance(
  userId: string,
  amount: number,
  isDirectSet: boolean = false
): Promise<{ success: boolean; error?: string; newBalance?: number; userId?: string }> {
  try {
    const res = await resilientFetch('/api/admin/users/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, isDirectSet })
    }, 8000);
    if (res.isJson && res.data) {
      return res.data;
    }
  } catch (_) {}

  return { success: true };
}

// Update User Role (Admin)
export async function adminUpdateUserRole(
  userId: string,
  role: 'admin' | 'user'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await resilientFetch('/api/admin/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    }, 8000);
    if (res.isJson && res.data) {
      return res.data;
    }
  } catch (_) {}

  return updateItem('users', { role }, userId);
}

// Update User Block Status (Admin)
export async function adminUpdateUserBlock(
  userId: string,
  isBlocked: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await resilientFetch('/api/admin/users/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isBlocked })
    }, 8000);
    if (res.isJson && res.data) {
      return res.data;
    }
  } catch (_) {}

  return updateItem('users', { isBlocked }, userId);
}
