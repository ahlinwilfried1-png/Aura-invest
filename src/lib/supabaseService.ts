import { supabase } from './supabase';

const TABLE_SCHEMAS: Record<string, string[]> = {
  users: [
    'id', 'name', 'phone', 'whatsapp', 'country', 'balance', 'dailyEarnings',
    'totalEarnings', 'vipLevel', 'isBlocked', 'createdAt', 'role', 'referralCode',
    'referredByCode', 'withdrawalAccountName', 'withdrawalAccountNumber', 'withdrawalPinHash'
  ],
  products: [
    'id', 'name', 'price', 'dailyGain', 'duration', 'totalGain', 'isActive',
    'image', 'description', 'order', 'badge', 'color'
  ],
  investments: [
    'id', 'userId', 'productId', 'productName', 'price', 'dailyGain',
    'duration', 'daysRemaining', 'purchaseDate', 'lastClaimDate'
  ],
  deposits: [
    'id', 'userId', 'userName', 'userPhone', 'amount', 'method',
    'transactionId', 'screenshotUrl', 'status', 'createdAt'
  ],
  withdrawals: [
    'id', 'userId', 'userName', 'userPhone', 'amount', 'receivedAmount',
    'network', 'accountNumber', 'status', 'createdAt'
  ],
  withdrawal_proofs: [
    'id', 'userId', 'userName', 'userPhone', 'amount', 'network',
    'message', 'imageUrl', 'createdAt', 'isVerified', 'status'
  ],
  tickets: [
    'id', 'userId', 'userName', 'subject', 'message', 'imageUrl',
    'status', 'createdAt', 'reply', 'replyCreatedAt', 'isReadByUser'
  ],
  commissions: [
    'id', 'referrerId', 'refereeId', 'refereeName', 'amount', 'level', 'createdAt'
  ],
  bonus_codes: [
    'code', 'amount', 'maxUses', 'usedBy', 'createdAt'
  ]
};

export function sanitizeItem<T>(tableName: string, item: T): Partial<T> {
  if (!item || typeof item !== 'object') return item;
  const allowedCols = TABLE_SCHEMAS[tableName];
  if (!allowedCols) return item;

  const sanitized: any = {};
  for (const col of allowedCols) {
    if (col in (item as any)) {
      sanitized[col] = (item as any)[col];
    }
  }
  return sanitized as Partial<T>;
}

export async function fetchTableData<T>(tableName: string): Promise<T[] | null> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' fetch error:`, error.message);
      return null;
    }
    return data as T[];
  } catch (err) {
    console.warn(`[Supabase] Error connecting to table '${tableName}':`, err);
    return null;
  }
}

export async function upsertItem<T>(tableName: string, item: T): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanItem = sanitizeItem(tableName, item);
    const { error } = await supabase.from(tableName).upsert(cleanItem as any);
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
  try {
    const cleanItem = sanitizeItem(tableName, item);
    const { error } = await supabase.from(tableName).insert(cleanItem as any);
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
  try {
    const cleanUpdates = sanitizeItem(tableName, updates);
    const { error } = await supabase.from(tableName).update(cleanUpdates as any).eq(idCol, idValue);
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
  try {
    if (!items || items.length === 0) return { success: true };
    const cleanItems = items.map(item => sanitizeItem(tableName, item));
    const { error } = await supabase.from(tableName).upsert(cleanItems as any);
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
  try {
    const payload = Array.isArray(value) ? value : [value];
    const { error } = await supabase.from('bonus_codes').upsert({
      code: configKey,
      amount: 0,
      maxUses: 0,
      usedBy: payload as any,
      createdAt: new Date().toISOString()
    });
    if (error) {
      console.warn(`[Supabase] Save system config '${configKey}' error:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase] Error saving system config '${configKey}':`, err);
    return { success: false, error: err?.message || 'Erreur de connexion Supabase' };
  }
}

export async function deleteSystemConfig(configKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('bonus_codes').delete().eq('code', configKey);
    if (error) {
      console.warn(`[Supabase] Delete system config '${configKey}' error:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase] Error deleting system config '${configKey}':`, err);
    return { success: false, error: err?.message || 'Erreur de connexion Supabase' };
  }
}

export async function fetchSystemConfig<T>(configKey: string, fallbackValue: T): Promise<T> {
  try {
    const { data, error } = await supabase.from('bonus_codes').select('*').eq('code', configKey).single();
    if (error || !data) {
      return fallbackValue;
    }
    if (Array.isArray(fallbackValue)) {
      return (data.usedBy || fallbackValue) as unknown as T;
    }
    if (data.usedBy && Array.isArray(data.usedBy) && data.usedBy.length > 0) {
      return data.usedBy[0] as unknown as T;
    }
    return fallbackValue;
  } catch (err) {
    return fallbackValue;
  }
}


export async function submitDepositRequest(
  depositData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/deposits/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(depositData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) return { success: true };
    }
  } catch (_) {}

  // Fallback to direct client upsert
  return upsertItem('deposits', depositData);
}

export async function adminProcessDeposit(
  depositId: string,
  status: 'approved' | 'rejected',
  fallbackDepositData?: any
): Promise<{ success: boolean; error?: string; message?: string; alreadyApproved?: boolean; newBalance?: number }> {
  try {
    const res = await fetch('/api/admin/deposits/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId, status, fallbackDepositData })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (_) {}

  // Fallback to direct client update
  return updateItem('deposits', { status }, depositId);
}

export async function adminProcessWithdrawal(
  withdrawalId: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/withdrawals/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId, status })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (_) {}

  // Fallback to direct client update
  return updateItem('withdrawals', { status }, withdrawalId);
}

export async function adminUpdateUserBalance(
  userId: string,
  amount: number,
  isDirectSet: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/users/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, isDirectSet })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (_) {}

  return { success: true };
}

export async function adminUpdateUserRole(
  userId: string,
  role: 'admin' | 'user'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (_) {}

  return updateItem('users', { role }, userId);
}

export async function adminUpdateUserBlock(
  userId: string,
  isBlocked: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/users/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isBlocked })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (_) {}

  return updateItem('users', { isBlocked }, userId);
}

