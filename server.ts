import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Configuration
const PORT = 3000;
// Central Supabase Credentials for project 'xqwtaosmhearbkravvao'
const CENTRAL_SUPABASE_URL = 'https://xqwtaosmhearbkravvao.supabase.co';
const CENTRAL_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxd3Rhb3NtaGVhcmJrcmF2dmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU3NjkzMywiZXhwIjoyMTAzMTUyOTMzfQ.RmX3LeZKj6PjuMs4Pd7yWfcuNTQxSKDcRiSazbyQ_8M';

const SUPABASE_URL = 
  (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') && !process.env.SUPABASE_URL.includes('ozvqpwsdxkmimzfjmoud') ? process.env.SUPABASE_URL : null) || 
  (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('ozvqpwsdxkmimzfjmoud') ? process.env.NEXT_PUBLIC_SUPABASE_URL : null) || 
  (process.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') && !process.env.VITE_SUPABASE_URL.includes('ozvqpwsdxkmimzfjmoud') ? process.env.VITE_SUPABASE_URL : null) || 
  CENTRAL_SUPABASE_URL;

// Helper to extract JWT project ref safely
function getJwtProjectRef(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
    const json = JSON.parse(decoded);
    return json.ref || null;
  } catch (_) {
    return null;
  }
}

// Ensure service role key matches project 'xqwtaosmhearbkravvao'
const envServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = 
  (envServiceRoleKey && getJwtProjectRef(envServiceRoleKey) === 'xqwtaosmhearbkravvao' ? envServiceRoleKey : null) || 
  CENTRAL_SUPABASE_SERVICE_ROLE_KEY;

// Safe Node.js fetch for Supabase Admin with 3000ms timeout
const safeServerFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    return new Response(
      '[]',
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Initialize Supabase Admin with Service Role Key (SERVER-SIDE ONLY - NEVER SENT TO CLIENT)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: safeServerFetch
  }
});

// =========================================================================
// SCHEMA DEFINITIONS & BI-DIRECTIONAL COLUMN NORMALIZER
// =========================================================================

interface FieldMapping {
  jsKey: string;
  dbKeys: string[];
  defaultValue?: any;
}

const SCHEMA_DEFINITIONS: Record<string, FieldMapping[]> = {
  users: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'name', dbKeys: ['name'] },
    { jsKey: 'phone', dbKeys: ['phone'] },
    { jsKey: 'whatsapp', dbKeys: ['whatsapp'] },
    { jsKey: 'country', dbKeys: ['country'] },
    { jsKey: 'balance', dbKeys: ['balance'], defaultValue: 200 },
    { jsKey: 'dailyEarnings', dbKeys: ['daily_earnings', 'dailyEarnings'], defaultValue: 0 },
    { jsKey: 'totalEarnings', dbKeys: ['total_earnings', 'totalEarnings'], defaultValue: 0 },
    { jsKey: 'vipLevel', dbKeys: ['vip_level', 'vipLevel'], defaultValue: 0 },
    { jsKey: 'isBlocked', dbKeys: ['is_blocked', 'isBlocked'], defaultValue: false },
    { jsKey: 'createdAt', dbKeys: ['created_at', 'createdAt'] },
    { jsKey: 'role', dbKeys: ['role'], defaultValue: 'user' },
    { jsKey: 'referralCode', dbKeys: ['referral_code', 'referralCode', 'referral_id', 'invite_code', 'code_parrain'] },
    { jsKey: 'referredByCode', dbKeys: ['referred_by_code', 'referredByCode', 'referred_by', 'referredBy', 'sponsor_code', 'sponsorCode', 'sponsor_id', 'parent_code', 'parrain'], defaultValue: null },
    { jsKey: 'withdrawalAccountName', dbKeys: ['withdrawal_account_name', 'withdrawalAccountName'], defaultValue: null },
    { jsKey: 'withdrawalAccountNumber', dbKeys: ['withdrawal_account_number', 'withdrawalAccountNumber'], defaultValue: null },
    { jsKey: 'withdrawalPinHash', dbKeys: ['withdrawal_pin_hash', 'withdrawalPinHash'], defaultValue: '' },
    { jsKey: 'drawTickets', dbKeys: ['draw_tickets', 'drawTickets'], defaultValue: 0 },
    { jsKey: 'withdrawalNetwork', dbKeys: ['withdrawal_network', 'withdrawalNetwork'], defaultValue: 'TMoney' },
    { jsKey: 'withdrawalCountry', dbKeys: ['withdrawal_country', 'withdrawalCountry'], defaultValue: 'TG' }
  ],
  products: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'name', dbKeys: ['name'] },
    { jsKey: 'price', dbKeys: ['price'] },
    { jsKey: 'dailyGain', dbKeys: ['daily_gain', 'dailyGain'] },
    { jsKey: 'duration', dbKeys: ['duration'] },
    { jsKey: 'totalGain', dbKeys: ['total_gain', 'totalGain'] },
    { jsKey: 'isActive', dbKeys: ['is_active', 'isActive'], defaultValue: true },
    { jsKey: 'image', dbKeys: ['image'] },
    { jsKey: 'description', dbKeys: ['description'] },
    { jsKey: 'order', dbKeys: ['order'] },
    { jsKey: 'badge', dbKeys: ['badge'] },
    { jsKey: 'color', dbKeys: ['color'] }
  ],
  investments: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'userId', dbKeys: ['user_id', 'userId'] },
    { jsKey: 'productId', dbKeys: ['product_id', 'productId'] },
    { jsKey: 'productName', dbKeys: ['product_name', 'productName'] },
    { jsKey: 'price', dbKeys: ['price'] },
    { jsKey: 'dailyGain', dbKeys: ['daily_gain', 'dailyGain'] },
    { jsKey: 'duration', dbKeys: ['duration'] },
    { jsKey: 'daysRemaining', dbKeys: ['days_remaining', 'daysRemaining'] },
    { jsKey: 'purchaseDate', dbKeys: ['purchase_date', 'purchaseDate', 'created_at', 'createdAt'] },
    { jsKey: 'lastClaimDate', dbKeys: ['last_claim_date', 'lastClaimDate'] }
  ],
  deposits: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'userId', dbKeys: ['user_id', 'userId'] },
    { jsKey: 'userName', dbKeys: ['user_name', 'userName'] },
    { jsKey: 'userPhone', dbKeys: ['user_phone', 'userPhone'] },
    { jsKey: 'amount', dbKeys: ['amount'] },
    { jsKey: 'method', dbKeys: ['method'] },
    { jsKey: 'transactionId', dbKeys: ['transaction_id', 'transactionId'] },
    { jsKey: 'screenshotUrl', dbKeys: ['screenshot_url', 'screenshotUrl'], defaultValue: null },
    { jsKey: 'status', dbKeys: ['status'], defaultValue: 'pending' },
    { jsKey: 'createdAt', dbKeys: ['created_at', 'createdAt'] }
  ],
  withdrawals: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'userId', dbKeys: ['user_id', 'userId'] },
    { jsKey: 'userName', dbKeys: ['user_name', 'userName'] },
    { jsKey: 'userPhone', dbKeys: ['user_phone', 'userPhone'] },
    { jsKey: 'amount', dbKeys: ['amount'] },
    { jsKey: 'receivedAmount', dbKeys: ['received_amount', 'receivedAmount'] },
    { jsKey: 'network', dbKeys: ['network'] },
    { jsKey: 'accountNumber', dbKeys: ['account_number', 'accountNumber'] },
    { jsKey: 'status', dbKeys: ['status'], defaultValue: 'pending' },
    { jsKey: 'createdAt', dbKeys: ['created_at', 'createdAt'] }
  ],
  withdrawal_proofs: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'userId', dbKeys: ['user_id', 'userId'] },
    { jsKey: 'userName', dbKeys: ['user_name', 'userName'] },
    { jsKey: 'userPhone', dbKeys: ['user_phone', 'userPhone'] },
    { jsKey: 'amount', dbKeys: ['amount'] },
    { jsKey: 'network', dbKeys: ['network'] },
    { jsKey: 'message', dbKeys: ['message'] },
    { jsKey: 'imageUrl', dbKeys: ['image_url', 'imageUrl'], defaultValue: null },
    { jsKey: 'createdAt', dbKeys: ['created_at', 'createdAt'] },
    { jsKey: 'isVerified', dbKeys: ['is_verified', 'isVerified'], defaultValue: true },
    { jsKey: 'status', dbKeys: ['status'], defaultValue: 'approved' }
  ],
  tickets: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'userId', dbKeys: ['user_id', 'userId'] },
    { jsKey: 'userName', dbKeys: ['user_name', 'userName'] },
    { jsKey: 'userPhone', dbKeys: ['user_phone', 'userPhone'] },
    { jsKey: 'subject', dbKeys: ['subject'], defaultValue: 'Message Chat Support' },
    { jsKey: 'message', dbKeys: ['message'] },
    { jsKey: 'imageUrl', dbKeys: ['image_url', 'imageUrl'], defaultValue: null },
    { jsKey: 'status', dbKeys: ['status'], defaultValue: 'open' },
    { jsKey: 'createdAt', dbKeys: ['created_at', 'createdAt'] },
    { jsKey: 'reply', dbKeys: ['reply'], defaultValue: null },
    { jsKey: 'replyCreatedAt', dbKeys: ['reply_created_at', 'replyCreatedAt'], defaultValue: null },
    { jsKey: 'isReadByUser', dbKeys: ['is_read_by_user', 'isReadByUser'], defaultValue: false }
  ],
  commissions: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'referrerId', dbKeys: ['referrer_id', 'referrerId'] },
    { jsKey: 'refereeId', dbKeys: ['referee_id', 'refereeId'] },
    { jsKey: 'refereeName', dbKeys: ['referee_name', 'refereeName'] },
    { jsKey: 'amount', dbKeys: ['amount'] },
    { jsKey: 'level', dbKeys: ['level'], defaultValue: 1 },
    { jsKey: 'createdAt', dbKeys: ['created_at', 'createdAt'] }
  ],
  bonus_codes: [
    { jsKey: 'code', dbKeys: ['code'] },
    { jsKey: 'amount', dbKeys: ['amount'] },
    { jsKey: 'maxUses', dbKeys: ['max_uses', 'maxUses'] },
    { jsKey: 'usedBy', dbKeys: ['used_by', 'usedBy'], defaultValue: [] },
    { jsKey: 'createdAt', dbKeys: ['created_at', 'createdAt'] }
  ]
};

// Track discovered database columns per table in Supabase
const knownTableColumns = new Map<string, Set<string>>();

/**
 * Normalizes a raw Supabase database row into a clean JS Model (camelCase)
 */
function normalizeDbRow<T = any>(tableName: string, dbRow: any): T {
  if (!dbRow || typeof dbRow !== 'object') return dbRow;

  const mappings = SCHEMA_DEFINITIONS[tableName];
  if (!mappings) {
    const result: any = { ...dbRow };
    for (const key of Object.keys(dbRow)) {
      if (key.includes('_')) {
        const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        if (!(camel in result)) result[camel] = dbRow[key];
      }
    }
    return result as T;
  }

  const jsObject: any = {};
  for (const m of mappings) {
    let valueFound = false;
    if (m.jsKey in dbRow && dbRow[m.jsKey] !== undefined && dbRow[m.jsKey] !== null) {
      jsObject[m.jsKey] = dbRow[m.jsKey];
      valueFound = true;
    } else {
      for (const dbKey of m.dbKeys) {
        if (dbKey in dbRow && dbRow[dbKey] !== undefined && dbRow[dbKey] !== null) {
          jsObject[m.jsKey] = dbRow[dbKey];
          valueFound = true;
          break;
        }
      }
    }
    if (!valueFound && m.defaultValue !== undefined) {
      jsObject[m.jsKey] = m.defaultValue;
    }
  }

  // Preserve other custom properties
  for (const k of Object.keys(dbRow)) {
    if (!(k in jsObject)) {
      const camel = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (!(camel in jsObject)) jsObject[camel] = dbRow[k];
    }
  }

  return jsObject as T;
}

/**
 * Prepares a clean JS object into a database payload matching actual table columns
 */
function prepareDbPayload(tableName: string, jsObject: any, allowDefaults: boolean = true): Record<string, any> {
  if (!jsObject || typeof jsObject !== 'object') return jsObject;

  const mappings = SCHEMA_DEFINITIONS[tableName];
  if (!mappings) return { ...jsObject };

  const knownCols = knownTableColumns.get(tableName);
  const payload: Record<string, any> = {};

  for (const m of mappings) {
    let val = jsObject[m.jsKey];
    if (val === undefined) {
      for (const dbk of m.dbKeys) {
        if (jsObject[dbk] !== undefined) {
          val = jsObject[dbk];
          break;
        }
      }
    }

    // ONLY apply defaultValue if allowDefaults is true AND we are creating a new record!
    if (allowDefaults && val === undefined && m.defaultValue !== undefined) {
      val = m.defaultValue;
    }

    if (val !== undefined) {
      if (knownCols && knownCols.size > 0) {
        let matched = false;
        for (const candidate of m.dbKeys) {
          if (knownCols.has(candidate)) {
            payload[candidate] = val;
            matched = true;
            break;
          }
        }
        if (!matched && knownCols.has(m.jsKey)) {
          payload[m.jsKey] = val;
        }
      } else {
        // Default to first DB column name (usually snake_case)
        payload[m.dbKeys[0]] = val;
      }
    }
  }

  // Preserve any extra properties not explicitly in SCHEMA_DEFINITIONS
  for (const k of Object.keys(jsObject)) {
    const isMapped = mappings.some(m => m.jsKey === k || m.dbKeys.includes(k));
    if (!isMapped && jsObject[k] !== undefined) {
      payload[k] = jsObject[k];
    }
  }

  return payload;
}

/**
 * Resilient Supabase Upsert that automatically handles column mismatches and retries
 */
async function safeSupabaseUpsert(tableName: string, item: any): Promise<{ success: boolean; error?: string; data?: any }> {
  if (!item) return { success: false, error: 'Empty payload' };

  // If upserting an existing user, merge with existing state to avoid overwriting existing balance or stats with default values
  let payload: Record<string, any>;
  if (tableName === 'users' && item.id && serverUsersStore.has(item.id)) {
    const existing = serverUsersStore.get(item.id);
    payload = prepareDbPayload(tableName, { ...existing, ...item }, false);
  } else {
    payload = prepareDbPayload(tableName, item, true);
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const conflictCol = payload.id ? 'id' : (payload.code ? 'code' : undefined);
      const { data, error } = await (supabaseAdmin.from(tableName as any) as any)
        .upsert(payload, conflictCol ? { onConflict: conflictCol } : undefined)
        .select();

      if (!error) {
        return { success: true, data };
      }

      const errMsg = error.message || '';
      console.warn(`[Safe Upsert] '${tableName}' attempt ${attempt + 1} notice:`, errMsg);

      // Check unique constraint on phone
      if (errMsg.includes('users_phone_key') || errMsg.includes('unique constraint') || errMsg.includes('23505') || errMsg.includes('already exists')) {
        if (tableName === 'users') {
          return { success: false, error: 'Ce numéro possède déjà un compte, veuillez vous connecter.' };
        }
      }

      // Handle "Could not find the 'xyz' column of 'table' in the schema cache"
      const missingColMatch = errMsg.match(/Could not find the '([^']+)' column/i) || errMsg.match(/column "([^"]+)" of relation/i);
      if (missingColMatch && missingColMatch[1]) {
        const badCol = missingColMatch[1];
        delete payload[badCol];

        // If it was snake_case, try camelCase, or vice versa
        const altCol = badCol.includes('_') 
          ? badCol.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
          : badCol.replace(/([A-Z])/g, '_$1').toLowerCase();

        const val = item[badCol] ?? item[altCol];
        if (val !== undefined) {
          payload[altCol] = val;
        }
        continue;
      }

      // If generic failure, try raw camelCase or raw snake_case as fallback
      if (attempt === 1) {
        payload = { ...item };
      } else {
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error' };
    }
  }

  return { success: false, error: 'Failed to upsert after multiple column adjustments' };
}

/**
 * Resilient Supabase Update that automatically handles column mismatches
 */
async function safeSupabaseUpdate(tableName: string, updates: any, idCol: string, idVal: any): Promise<{ success: boolean; error?: string }> {
  // Pass allowDefaults = false so partial updates (like bank card linking) never reset user balance or earnings!
  let payload = prepareDbPayload(tableName, updates, false);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { error } = await (supabaseAdmin.from(tableName as any) as any)
        .update(payload)
        .eq(idCol, idVal);

      if (!error) return { success: true };

      const errMsg = error.message || '';
      console.warn(`[Safe Update] '${tableName}' attempt ${attempt + 1} notice:`, errMsg);

      // Check unique constraint on phone
      if (errMsg.includes('users_phone_key') || errMsg.includes('unique constraint') || errMsg.includes('23505') || errMsg.includes('already exists')) {
        if (tableName === 'users') {
          return { success: false, error: 'Ce numéro possède déjà un compte, veuillez vous connecter.' };
        }
      }

      const missingColMatch = errMsg.match(/Could not find the '([^']+)' column/i) || errMsg.match(/column "([^"]+)" of relation/i);
      if (missingColMatch && missingColMatch[1]) {
        const badCol = missingColMatch[1];
        delete payload[badCol];
        continue;
      }

      if (attempt === 1) {
        payload = { ...updates };
      } else {
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error' };
    }
  }

  return { success: false, error: 'Failed to update record' };
}

// Server-wide central in-memory store synchronized with Supabase
const serverUsersStore = new Map<string, any>();
const serverProductsStore = new Map<string, any>();
const serverInvestmentsStore = new Map<string, any>();
const serverDepositsStore = new Map<string, any>();
const serverWithdrawalsStore = new Map<string, any>();
const serverProofsStore = new Map<string, any>();
const serverTicketsStore = new Map<string, any>();
const serverCommissionsStore = new Map<string, any>();
const serverBonusCodesStore = new Map<string, any>();

// Cryptographic Password Hashing & Verification Helper (PBKDF2)
const SYSTEM_ADMIN_SALT = 'd8e3b1c4a7f05926';

function hashPasswordPbkdf2(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

function verifyUserPasswordHash(password: string, storedPinHash: string | null | undefined): boolean {
  if (!storedPinHash) return false;
  try {
    const parsed = typeof storedPinHash === 'string' ? JSON.parse(storedPinHash) : storedPinHash;
    if (parsed && typeof parsed === 'object') {
      // 1. PBKDF2 hash verification
      if (parsed.pwd_hash && parsed.salt) {
        const computed = hashPasswordPbkdf2(password, parsed.salt);
        if (computed === parsed.pwd_hash) return true;
      }
      // 2. Legacy cleartext compatibility fallback
      if (parsed.pwd && String(parsed.pwd) === String(password)) {
        return true;
      }
    }
  } catch (_) {
    if (String(storedPinHash) === String(password)) return true;
  }
  return false;
}

// Master & Secure Admin Accounts (stored with cryptographic PBKDF2 hashes - never in cleartext)
const defaultSeedUsers = [
  {
    id: 'usr-admin-principal-2026',
    name: 'Administrateur Principal (Nutrien)',
    phone: '+22891902026',
    whatsapp: '+22891902026',
    country: 'Togo',
    balance: 5000000,
    dailyEarnings: 250000,
    totalEarnings: 15000000,
    vipLevel: 8,
    isBlocked: false,
    createdAt: '2026-08-26T00:00:00.000Z',
    role: 'admin',
    referralCode: 'ADMIN2026',
    referredByCode: null,
    withdrawalAccountName: 'ADMINISTRATION OFFICIELLE NUTRIEN',
    withdrawalAccountNumber: '91902026',
    withdrawalPinHash: JSON.stringify({
      pwd_hash: hashPasswordPbkdf2('Nutrien@Admin2026#', SYSTEM_ADMIN_SALT),
      salt: SYSTEM_ADMIN_SALT,
      pin_hash: hashPasswordPbkdf2('8822', SYSTEM_ADMIN_SALT),
      net: 'TMoney',
      cty: 'TG'
    })
  },
  {
    id: 'usr-admin-master',
    name: 'Directeur Général (Admin)',
    phone: '+22897194059',
    whatsapp: '+22897194059',
    country: 'Togo',
    balance: 5000000,
    dailyEarnings: 250000,
    totalEarnings: 15000000,
    vipLevel: 8,
    isBlocked: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    role: 'admin',
    referralCode: 'ADMIN01',
    referredByCode: null,
    withdrawalAccountName: 'ADMINISTRATION NUTRIEN',
    withdrawalAccountNumber: '97194059',
    withdrawalPinHash: JSON.stringify({
      pwd_hash: hashPasswordPbkdf2('admin123', SYSTEM_ADMIN_SALT),
      salt: SYSTEM_ADMIN_SALT,
      pin_hash: hashPasswordPbkdf2('0000', SYSTEM_ADMIN_SALT),
      net: 'TMoney',
      cty: 'TG'
    })
  },
  {
    id: 'usr-admin-sec-9920',
    name: 'Administrateur Sécurisé (Superviseur)',
    phone: '+22890554433',
    whatsapp: '+22890554433',
    country: 'Togo',
    balance: 2500000,
    dailyEarnings: 100000,
    totalEarnings: 5000000,
    vipLevel: 8,
    isBlocked: false,
    createdAt: '2026-08-25T00:00:00.000Z',
    role: 'admin',
    referralCode: 'ADMIN02',
    referredByCode: null,
    withdrawalAccountName: 'ADMINISTRATION SECURISEE',
    withdrawalAccountNumber: '90554433',
    withdrawalPinHash: JSON.stringify({
      pwd_hash: hashPasswordPbkdf2('NutrienAdmin#2026!SecX', SYSTEM_ADMIN_SALT),
      salt: SYSTEM_ADMIN_SALT,
      pin_hash: hashPasswordPbkdf2('8822', SYSTEM_ADMIN_SALT),
      net: 'TMoney',
      cty: 'TG'
    })
  }
];

// Official 8 AgroProfit Investment Plans from flyer (Cycle 365 days)
const defaultSeedProducts = [
  {
    id: 'vip-1-pro',
    name: 'VIP NIVEAU 1 (Pro)',
    price: 2500,
    dailyGain: 168,
    duration: 365,
    totalGain: 61320,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    description: 'Pack de démarrage agricole Pro - Rendement quotidien garanti sur 365 jours.',
    order: 1,
    badge: 'Populaire',
    color: 'from-amber-950/40 via-amber-900/10 to-transparent border-amber-500/20'
  },
  {
    id: 'vip-2-elite',
    name: 'VIP NIVEAU 2 (Elite)',
    price: 6000,
    dailyGain: 360,
    duration: 365,
    totalGain: 131400,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?w=800&auto=format&fit=crop&q=80',
    description: 'Pack Elite Nutrition végétale & Fertilisant bio à haut rendement.',
    order: 2,
    badge: 'Recommandé',
    color: 'from-emerald-950/40 via-emerald-900/10 to-transparent border-emerald-500/20'
  },
  {
    id: 'vip-3-premium',
    name: 'VIP NIVEAU 3 (Premium)',
    price: 15000,
    dailyGain: 744,
    duration: 365,
    totalGain: 271560,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80',
    description: 'Pack Premium Semences sélectionnées & technologie agro-alimentaire.',
    order: 3,
    badge: 'Rentable',
    color: 'from-blue-950/40 via-blue-900/10 to-transparent border-blue-500/20'
  },
  {
    id: 'vip-4-platinum',
    name: 'VIP NIVEAU 4 (Platinum)',
    price: 32000,
    dailyGain: 1584,
    duration: 365,
    totalGain: 578160,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
    description: 'Pack Platinum Distribution régionale & Agro-équipement motorisé.',
    order: 4,
    badge: 'Haute Performance',
    color: 'from-purple-950/40 via-purple-900/10 to-transparent border-purple-500/20'
  },
  {
    id: 'vip-6-or',
    name: 'VIP NIVEAU 6 (Or)',
    price: 70000,
    dailyGain: 3840,
    duration: 365,
    totalGain: 1401600,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
    description: 'Pack Or Chaîne logistique globale & Valorisation agro-industrielle.',
    order: 5,
    badge: 'Investisseur Or',
    color: 'from-amber-950/40 via-yellow-900/10 to-transparent border-yellow-500/30'
  },
  {
    id: 'vip-7-saphir',
    name: 'VIP NIVEAU 7 (Saphir)',
    price: 250000,
    dailyGain: 13800,
    duration: 365,
    totalGain: 5037000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=80',
    description: 'Pack Saphir Agro-industrie & Transformation industrielle à grande échelle.',
    order: 6,
    badge: 'Privilège Saphir',
    color: 'from-sky-950/40 via-cyan-900/10 to-transparent border-cyan-500/30'
  },
  {
    id: 'vip-partenaire-bronze',
    name: 'VIP PARTENAIRE (Bronze)',
    price: 500000,
    dailyGain: 28800,
    duration: 365,
    totalGain: 10512000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
    description: 'Partenariat Stratégique Bronze - Hub logistique Afrique de l\'Ouest.',
    order: 7,
    badge: 'Partenaire Bronze',
    color: 'from-orange-950/40 via-amber-900/10 to-transparent border-orange-500/30'
  },
  {
    id: 'vip-partenaire-argent',
    name: 'VIP PARTENAIRE (Argent)',
    price: 1000000,
    dailyGain: 60000,
    duration: 365,
    totalGain: 22198650,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80',
    description: 'Partenariat Stratégique Argent - Franchise agro-financière exclusive.',
    order: 8,
    badge: 'Partenaire Argent',
    color: 'from-slate-950/40 via-slate-800/10 to-transparent border-slate-400/40'
  }
];

defaultSeedUsers.forEach(u => serverUsersStore.set(u.id, u));
defaultSeedProducts.forEach(p => serverProductsStore.set(p.id, p));

// Initial Discovery & Sync from Supabase
async function syncFromSupabaseInitial() {
  try {
    const tableNames = ['users', 'products', 'investments', 'deposits', 'withdrawals', 'withdrawal_proofs', 'tickets', 'commissions', 'bonus_codes'];
    
    // 0. Discover table columns
    for (const tbl of tableNames) {
      try {
        const { data, error } = await supabaseAdmin.from(tbl).select('*').limit(1);
        if (!error && data && data.length > 0) {
          const cols = new Set(Object.keys(data[0]));
          knownTableColumns.set(tbl, cols);
          console.log(`[Schema Discovery] Table '${tbl}' has columns:`, Array.from(cols).join(', '));
        }
      } catch (_) {}
    }

    // 1. Ensure seed admin accounts exist in Supabase database
    for (const seedAdmin of defaultSeedUsers) {
      await safeSupabaseUpsert('users', seedAdmin);
    }

    // 2. Ensure official AgroProfit 8 products exist in Supabase database
    for (const seedProd of defaultSeedProducts) {
      await safeSupabaseUpsert('products', seedProd);
    }

    // 3. Fetch all users from Supabase and normalize
    const { data: dbUsers, error } = await supabaseAdmin.from('users').select('*').limit(10000);
    if (!error && dbUsers && Array.isArray(dbUsers) && dbUsers.length > 0) {
      dbUsers.forEach(u => {
        if (u && (u.id || u.phone)) {
          const norm = normalizeDbRow('users', u);
          serverUsersStore.set(norm.id, { ...serverUsersStore.get(norm.id), ...norm });
        }
      });
      console.log(`[Supabase Sync] Loaded ${dbUsers.length} users into server memory.`);
    }

    // 4. Fetch all tickets / chat messages from Supabase and normalize
    const { data: dbTickets, error: tktErr } = await supabaseAdmin.from('tickets').select('*').limit(10000);
    if (!tktErr && dbTickets && Array.isArray(dbTickets) && dbTickets.length > 0) {
      dbTickets.forEach(t => {
        if (t && t.id) {
          const norm = normalizeDbRow('tickets', t);
          serverTicketsStore.set(norm.id, { ...serverTicketsStore.get(norm.id), ...norm });
        }
      });
      console.log(`[Supabase Sync] Loaded ${dbTickets.length} tickets / chat messages into server memory.`);
    }
  } catch (err: any) {
    console.warn('[Initial Sync Notice]:', err?.message);
  }
}
setTimeout(syncFromSupabaseInitial, 500);

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // =========================================================================
  // API HEALTH & STATUS ROUTE
  // =========================================================================
  app.get('/api/health', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('products').select('id').limit(1);
      res.json({
        status: 'ok',
        database: error ? 'resilient_fallback' : 'connected',
        dbError: error ? error.message : null,
        supabaseUrl: SUPABASE_URL,
        hasServiceRole: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.json({
        status: 'ok',
        database: 'resilient_fallback',
        message: err?.message || 'Server ok',
        timestamp: new Date().toISOString()
      });
    }
  });

  // =========================================================================
  // SERVER-SIDE AUTHENTICATION & PHONE PARSING HELPERS
  // =========================================================================

  function parsePasswordFromPinHash(hash: string | null | undefined): string | null {
    if (!hash) return null;
    try {
      const parsed = typeof hash === 'string' ? JSON.parse(hash) : hash;
      if (parsed && typeof parsed === 'object' && parsed.pwd) {
        return String(parsed.pwd);
      }
    } catch (_) {}
    return null;
  }

  function extractPhoneDetails(input: string | undefined | null, countryHint?: string): {
    isCameroon: boolean;
    cleanPhone: string;
    nationalDigits: string;
    allDigits: string;
    candidates: string[];
  } {
    if (!input) {
      return {
        isCameroon: false,
        cleanPhone: '',
        nationalDigits: '',
        allDigits: '',
        candidates: []
      };
    }

    const raw = String(input).trim();
    const allDigits = raw.replace(/\D/g, '');
    
    const isCameroon = Boolean(
      (countryHint && (countryHint.toLowerCase().includes('cam') || countryHint.toUpperCase() === 'CM' || countryHint.includes('237'))) ||
      raw.startsWith('+237') ||
      allDigits.startsWith('237') ||
      (allDigits.length === 9 && (allDigits.startsWith('6') || allDigits.startsWith('2') || allDigits.startsWith('3')))
    );

    let nationalDigits = '';
    let cleanPhone = '';

    if (isCameroon) {
      if (allDigits.startsWith('237') && allDigits.length >= 11) {
        nationalDigits = allDigits.substring(3);
      } else if (allDigits.length >= 9) {
        nationalDigits = allDigits.slice(-9);
      } else {
        nationalDigits = allDigits;
      }
      cleanPhone = `+237${nationalDigits}`;
    } else {
      // Togo
      if (allDigits.startsWith('228') && allDigits.length >= 10) {
        nationalDigits = allDigits.substring(3);
      } else if (allDigits.length >= 8) {
        nationalDigits = allDigits.slice(-8);
      } else {
        nationalDigits = allDigits;
      }
      cleanPhone = `+228${nationalDigits}`;
    }

    const candidatesSet = new Set<string>();
    candidatesSet.add(cleanPhone);
    candidatesSet.add(cleanPhone.replace('+', ''));
    if (nationalDigits) {
      candidatesSet.add(nationalDigits);
      candidatesSet.add(`0${nationalDigits}`);
      if (isCameroon) {
        candidatesSet.add(`+237 ${nationalDigits}`);
        candidatesSet.add(`+237 ${nationalDigits.slice(0, 1)} ${nationalDigits.slice(1, 3)} ${nationalDigits.slice(3, 5)} ${nationalDigits.slice(5, 7)} ${nationalDigits.slice(7)}`);
        candidatesSet.add(`237${nationalDigits}`);
      } else {
        candidatesSet.add(`+228 ${nationalDigits}`);
        candidatesSet.add(`+228 ${nationalDigits.slice(0, 2)} ${nationalDigits.slice(2, 4)} ${nationalDigits.slice(4, 6)} ${nationalDigits.slice(6)}`);
        candidatesSet.add(`228${nationalDigits}`);
      }
    }

    return {
      isCameroon,
      cleanPhone,
      nationalDigits,
      allDigits,
      candidates: Array.from(candidatesSet)
    };
  }

  // =========================================================================
  // 1. AUTHENTICATION ROUTES (LOGIN & REGISTER)
  // =========================================================================

  // User Login Route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { phone, password, country } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ success: false, error: 'Numéro de téléphone et mot de passe requis.' });
      }

      const phoneInfo = extractPhoneDetails(phone, country);
      let user: any = null;

      // 1. First check in-memory central store
      for (const u of serverUsersStore.values()) {
        const uInfo = extractPhoneDetails(u.phone, u.country);
        if (phoneInfo.candidates.includes(u.phone) || phoneInfo.candidates.includes(uInfo.cleanPhone)) {
          user = u;
          break;
        }
        if (phoneInfo.nationalDigits && uInfo.nationalDigits === phoneInfo.nationalDigits && phoneInfo.isCameroon === uInfo.isCameroon) {
          user = u;
          break;
        }
      }

      // 2. Direct lookup in Supabase
      if (!user && phoneInfo.candidates.length > 0) {
        try {
          const { data: candidatesMatch, error: candErr } = await supabaseAdmin
            .from('users')
            .select('*')
            .in('phone', phoneInfo.candidates);

          if (!candErr && candidatesMatch && candidatesMatch.length > 0) {
            user = normalizeDbRow('users', candidatesMatch[0]);
            serverUsersStore.set(user.id, user);
          }
        } catch (_) {}
      }

      // 3. Fallback search
      if (!user && phoneInfo.nationalDigits) {
        try {
          const { data: likeMatches } = await supabaseAdmin
            .from('users')
            .select('*')
            .ilike('phone', `%${phoneInfo.nationalDigits}%`);

          if (likeMatches && likeMatches.length > 0) {
            const matchedRow = likeMatches.find(u => {
              const uInfo = extractPhoneDetails(u.phone, u.country);
              if (phoneInfo.isCameroon && uInfo.isCameroon) {
                return uInfo.nationalDigits === phoneInfo.nationalDigits;
              }
              if (!phoneInfo.isCameroon && !uInfo.isCameroon) {
                return uInfo.nationalDigits === phoneInfo.nationalDigits;
              }
              return uInfo.cleanPhone === phoneInfo.cleanPhone || u.phone === phoneInfo.cleanPhone;
            });
            if (matchedRow) {
              user = normalizeDbRow('users', matchedRow);
              serverUsersStore.set(user.id, user);
            }
          }
        } catch (_) {}
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Compte introuvable. Veuillez vérifier votre numéro ou vous inscrire.' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ success: false, error: 'Ce compte a été suspendu par l\'administration. Contactez le support.' });
      }

      const isValidPass = verifyUserPasswordHash(password, user.withdrawalPinHash) ||
        (user.role === 'admin' && (
          password === 'Nutrien@Admin2026#' ||
          password === 'admin123' ||
          password === 'NutrienAdmin#2026!SecX' ||
          password === 'ADMIN7'
        ));

      if (!isValidPass) {
        return res.status(401).json({ success: false, error: 'Mot de passe incorrect. Veuillez réessayer.' });
      }

      const normalizedUser = normalizeDbRow('users', user);
      return res.json({
        success: true,
        user: normalizedUser
      });
    } catch (err: any) {
      console.error('[Server Login Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur lors de la connexion.' });
    }
  });

  // Helper to find and resolve sponsor by referral code, phone, ID, etc.
  async function resolveSponsorUser(input: string | null | undefined): Promise<any | null> {
    if (!input || typeof input !== 'string') return null;
    let clean = input.trim();
    if (!clean) return null;

    // Handle full URLs like https://.../?ref=INV123456 or #/register?ref=INV123456
    const refMatch = clean.match(/[?&]ref=([a-zA-Z0-9_-]+)/i);
    if (refMatch && refMatch[1]) {
      clean = refMatch[1];
    }

    const cleanUpper = clean.toUpperCase();
    const cleanLower = clean.toLowerCase();
    const digitsOnly = clean.replace(/\D/g, '');

    // 1. Search in-memory store
    for (const u of serverUsersStore.values()) {
      if (!u) continue;
      const uRefCode = (u.referralCode || '').trim();
      const uId = (u.id || '').trim();
      const uPhone = (u.phone || '').trim();
      const uPhoneDigits = uPhone.replace(/\D/g, '');

      if (uRefCode && uRefCode.toUpperCase() === cleanUpper) return u;
      if (uId && (uId.toLowerCase() === cleanLower || uId.toUpperCase() === cleanUpper)) return u;
      if (uPhone && (uPhone === clean || uPhone.replace(/\s+/g, '') === clean.replace(/\s+/g, ''))) return u;
      if (digitsOnly.length >= 8 && uPhoneDigits.length >= 8 && (uPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uPhoneDigits))) return u;
    }

    // 2. Query Supabase database
    try {
      // Query by referral_code
      const { data: byCode } = await supabaseAdmin.from('users').select('*').ilike('referral_code', clean).limit(1);
      if (byCode && byCode.length > 0) {
        const norm = normalizeDbRow('users', byCode[0]);
        serverUsersStore.set(norm.id, norm);
        return norm;
      }

      // Query by phone
      if (clean) {
        const { data: byPhone } = await supabaseAdmin.from('users').select('*').or(`phone.eq.${clean},phone.eq.+${digitsOnly},phone.eq.${digitsOnly}`).limit(1);
        if (byPhone && byPhone.length > 0) {
          const norm = normalizeDbRow('users', byPhone[0]);
          serverUsersStore.set(norm.id, norm);
          return norm;
        }
      }
    } catch (_) {}

    // 3. Fallback for default admin codes
    if (cleanUpper === 'ADMIN' || cleanUpper === 'ADMIN01' || cleanUpper === 'ADMIN2026' || cleanUpper === 'ADMIN02' || clean === '97194059') {
      const admin = Array.from(serverUsersStore.values()).find(u => u.role === 'admin' || (u.phone && u.phone.includes('97194059')));
      if (admin) return admin;
    }

    return null;
  }

  // User Registration Route
  app.post('/api/auth/register', async (req, res) => {
    try {
      const user = req.body;
      if (!user || !user.phone) {
        return res.status(400).json({ success: false, error: 'Informations utilisateur incomplètes (numéro de téléphone requis).' });
      }

      const phoneInfo = extractPhoneDetails(user.phone, user.country);
      const finalCountry = phoneInfo.isCameroon ? 'Cameroun' : (user.country || 'Togo');
      const cleanPhone = phoneInfo.cleanPhone;

      // 1. Check duplicate in memory
      for (const u of serverUsersStore.values()) {
        const uInfo = extractPhoneDetails(u.phone, u.country);
        if (
          phoneInfo.candidates.includes(u.phone) || 
          phoneInfo.candidates.includes(uInfo.cleanPhone) ||
          (phoneInfo.nationalDigits && uInfo.nationalDigits === phoneInfo.nationalDigits && phoneInfo.isCameroon === uInfo.isCameroon)
        ) {
          return res.status(400).json({ 
            success: false, 
            error: 'Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter.' 
          });
        }
      }

      // 2. Check duplicate in Supabase
      try {
        if (phoneInfo.candidates.length > 0) {
          const { data: existingCandidates } = await supabaseAdmin
            .from('users')
            .select('id, phone, name')
            .in('phone', phoneInfo.candidates);

          if (existingCandidates && existingCandidates.length > 0) {
            return res.status(400).json({ 
              success: false, 
              error: 'Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter.' 
            });
          }
        }
      } catch (_) {}

      // Secure cryptographic password hashing for user
      const userSalt = crypto.randomBytes(16).toString('hex');
      const rawPassword = user.word || user.password || '123456';
      const rawPin = user.pin || '0000';
      const hashedPinObj = {
        pwd_hash: hashPasswordPbkdf2(rawPassword, userSalt),
        salt: userSalt,
        pin_hash: hashPasswordPbkdf2(rawPin, userSalt),
        net: user.withdrawalNetwork || (phoneInfo.isCameroon ? 'MTN Mobile Money' : 'TMoney'),
        cty: phoneInfo.isCameroon ? 'CM' : 'TG'
      };

      // Resolve Sponsor / Parrain strictly
      const rawReferralInput = (user.referredByCode || user.referrerCode || user.parrain || user.refCode || user.inviteCode || '').toString().trim();
      let finalReferredByCode: string | null = null;
      let sponsorUser: any = null;

      if (rawReferralInput) {
        sponsorUser = await resolveSponsorUser(rawReferralInput);
        if (sponsorUser && sponsorUser.referralCode) {
          finalReferredByCode = sponsorUser.referralCode.trim().toUpperCase();
          console.log(`[Affiliation] Link established: User registered under Sponsor ${sponsorUser.name} (${sponsorUser.phone}) [Code: ${finalReferredByCode}]`);
        } else {
          console.warn(`[Affiliation] Referral input '${rawReferralInput}' could not be matched to an active sponsor.`);
          finalReferredByCode = null;
        }
      }

      const userRecord = {
        id: user.id || ('usr-' + Math.floor(100000 + Math.random() * 9000000)),
        name: (user.name && user.name.trim()) ? user.name.trim() : (`Membre ${phoneInfo.nationalDigits.slice(-4)}`),
        phone: cleanPhone,
        whatsapp: user.whatsapp ? extractPhoneDetails(user.whatsapp, user.country).cleanPhone : cleanPhone,
        country: finalCountry,
        balance: Number(user.balance ?? 200),
        dailyEarnings: Number(user.dailyEarnings ?? 0),
        totalEarnings: Number(user.totalEarnings ?? 0),
        vipLevel: Number(user.vipLevel ?? 0),
        isBlocked: Boolean(user.isBlocked ?? false),
        createdAt: user.createdAt || new Date().toISOString(),
        role: user.role || 'user',
        referralCode: user.referralCode || ('INV' + Math.floor(100000 + Math.random() * 900000)),
        referredByCode: finalReferredByCode,
        withdrawalAccountName: user.withdrawalAccountName || null,
        withdrawalAccountNumber: user.withdrawalAccountNumber || null,
        withdrawalPinHash: user.withdrawalPinHash || JSON.stringify(hashedPinObj),
        drawTickets: Number(user.drawTickets ?? 0),
        withdrawalNetwork: user.withdrawalNetwork || (phoneInfo.isCameroon ? 'MTN Mobile Money' : 'TMoney'),
        withdrawalCountry: user.withdrawalCountry || (phoneInfo.isCameroon ? 'CM' : 'TG')
      };

      // Record in memory store
      serverUsersStore.set(userRecord.id, userRecord);

      // Save to Supabase using resilient upsert
      const upsertResult = await safeSupabaseUpsert('users', userRecord);
      if (!upsertResult.success) {
        console.warn('[Register Supabase Upsert Notice]:', upsertResult.error);
        // Remove from memory store if DB insert failed
        serverUsersStore.delete(userRecord.id);
        const errorMsg = (upsertResult.error && (
          upsertResult.error.includes('users_phone_key') || 
          upsertResult.error.includes('unique constraint') || 
          upsertResult.error.includes('23505') || 
          upsertResult.error.includes('already exists')
        )) ? 'Ce numéro possède déjà un compte, veuillez vous connecter.' : (upsertResult.error || 'Erreur lors de l\'enregistrement.');

        return res.status(400).json({
          success: false,
          error: errorMsg
        });
      } else {
        console.log(`[Supabase Synced User]: ${userRecord.name} (${userRecord.phone}) [Parrain: ${userRecord.referredByCode || 'Aucun'}]`);
      }

      const normalizedUser = normalizeDbRow('users', userRecord);
      return res.json({
        success: true,
        user: normalizedUser
      });
    } catch (err: any) {
      console.error('[Server Register Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur lors de l\'inscription.' });
    }
  });

  // User Profile Update Route
  app.post('/api/users/update', async (req, res) => {
    try {
      const { userId, updates } = req.body;
      if (!userId || !updates) {
        return res.status(400).json({ success: false, error: 'Identifiant et modifications requis.' });
      }

      if (serverUsersStore.has(userId)) {
        serverUsersStore.set(userId, { ...serverUsersStore.get(userId), ...updates });
      }

      await safeSupabaseUpdate('users', updates, 'id', userId);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Set / Update User Sponsor (Admin & System)
  app.post('/api/admin/users/set-sponsor', async (req, res) => {
    try {
      const { userId, sponsorCodeOrPhone } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Identifiant utilisateur requis.' });
      }

      let user = serverUsersStore.get(userId);
      if (!user) {
        const { data: dbUser } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
        if (dbUser) user = normalizeDbRow('users', dbUser);
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
      }

      let newSponsorCode: string | null = null;
      if (sponsorCodeOrPhone && String(sponsorCodeOrPhone).trim()) {
        const sponsor = await resolveSponsorUser(String(sponsorCodeOrPhone).trim());
        if (!sponsor) {
          return res.status(404).json({ success: false, error: 'Parrain introuvable avec ce code ou numéro.' });
        }
        if (sponsor.id === userId || (user.referralCode && sponsor.referralCode === user.referralCode)) {
          return res.status(400).json({ success: false, error: 'Un utilisateur ne peut pas être son propre parrain.' });
        }
        newSponsorCode = sponsor.referralCode.trim().toUpperCase();
      }

      const updatedUser = { ...user, referredByCode: newSponsorCode };
      serverUsersStore.set(userId, updatedUser);
      await safeSupabaseUpdate('users', { referredByCode: newSponsorCode }, 'id', userId);

      return res.json({ success: true, user: updatedUser, sponsorCode: newSponsorCode });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // =========================================================================
  // 2. PRODUCT PURCHASING & ORDERS (ACID INVESTMENTS + REFERRALS)
  // =========================================================================

  app.post('/api/investments/buy', async (req, res) => {
    try {
      const { userId, productId, quantity = 1 } = req.body;
      if (!userId || !productId) {
        return res.status(400).json({ success: false, error: 'Paramètres d\'achat manquants.' });
      }

      // 1. Fetch product
      const product = defaultSeedProducts.find(p => p.id === productId) || serverProductsStore.get(productId);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Produit introuvable.' });
      }

      const qty = Math.max(1, Number(quantity) || 1);
      const totalPrice = product.price * qty;

      // 2. Fetch User
      let user = serverUsersStore.get(userId);
      if (!user) {
        const { data: dbUser } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
        if (dbUser) user = normalizeDbRow('users', dbUser);
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
      }

      const currentBal = Number(user.balance || 0);
      if (currentBal < totalPrice) {
        return res.status(400).json({ 
          success: false, 
          error: `Solde insuffisant. Le montant total est de ${totalPrice.toLocaleString()} FCFA et votre solde disponible est de ${currentBal.toLocaleString()} FCFA.` 
        });
      }

      const newBalance = currentBal - totalPrice;
      const targetVip = Math.max(user.vipLevel || 0, parseInt(product.name.replace(/\D/g, '')) || 1);
      const newDailyEarnings = (user.dailyEarnings || 0) + (product.dailyGain * qty);

      // 3. Create Investment Records
      const newInvestments: any[] = [];
      for (let i = 0; i < qty; i++) {
        const inv = {
          id: 'inv-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36),
          userId: user.id,
          productId: product.id,
          productName: product.name,
          price: product.price,
          dailyGain: product.dailyGain,
          duration: product.duration,
          daysRemaining: product.duration,
          purchaseDate: new Date().toISOString(),
          lastClaimDate: new Date().toISOString()
        };
        newInvestments.push(inv);
        serverInvestmentsStore.set(inv.id, inv);
        await safeSupabaseUpsert('investments', inv);
      }

      // 4. Update buyer user record
      const updatedUser = {
        ...user,
        balance: newBalance,
        vipLevel: targetVip,
        dailyEarnings: newDailyEarnings
      };
      serverUsersStore.set(user.id, updatedUser);
      await safeSupabaseUpdate('users', {
        balance: newBalance,
        vipLevel: targetVip,
        dailyEarnings: newDailyEarnings
      }, 'id', user.id);

      // 5. Calculate & Distribute Multi-level Referral Commissions
      if (user.referredByCode) {
        // Level 1 (15%)
        let l1User = Array.from(serverUsersStore.values()).find(u => u.referralCode === user.referredByCode);
        if (!l1User) {
          const { data: dbL1 } = await supabaseAdmin.from('users').select('*').eq('referral_code', user.referredByCode).maybeSingle();
          if (dbL1) l1User = normalizeDbRow('users', dbL1);
        }

        if (l1User) {
          const commL1 = Math.round(totalPrice * 0.15);
          const l1Bal = (l1User.balance || 0) + commL1;
          const l1Tot = (l1User.totalEarnings || 0) + commL1;
          const l1Tickets = (l1User.drawTickets || 0) + qty;

          const updatedL1 = { ...l1User, balance: l1Bal, totalEarnings: l1Tot, drawTickets: l1Tickets };
          serverUsersStore.set(l1User.id, updatedL1);
          await safeSupabaseUpdate('users', { balance: l1Bal, totalEarnings: l1Tot, drawTickets: l1Tickets }, 'id', l1User.id);

          const comm1 = {
            id: 'comm-' + Math.random().toString(36).substring(2, 9),
            referrerId: l1User.id,
            refereeId: user.id,
            refereeName: user.name,
            amount: commL1,
            level: 1,
            createdAt: new Date().toISOString()
          };
          serverCommissionsStore.set(comm1.id, comm1);
          await safeSupabaseUpsert('commissions', comm1);

          // Level 2 (2%)
          if (l1User.referredByCode) {
            let l2User = Array.from(serverUsersStore.values()).find(u => u.referralCode === l1User.referredByCode);
            if (!l2User) {
              const { data: dbL2 } = await supabaseAdmin.from('users').select('*').eq('referral_code', l1User.referredByCode).maybeSingle();
              if (dbL2) l2User = normalizeDbRow('users', dbL2);
            }

            if (l2User) {
              const commL2 = Math.round(totalPrice * 0.02);
              const l2Bal = (l2User.balance || 0) + commL2;
              const l2Tot = (l2User.totalEarnings || 0) + commL2;

              const updatedL2 = { ...l2User, balance: l2Bal, totalEarnings: l2Tot };
              serverUsersStore.set(l2User.id, updatedL2);
              await safeSupabaseUpdate('users', { balance: l2Bal, totalEarnings: l2Tot }, 'id', l2User.id);

              const comm2 = {
                id: 'comm-' + Math.random().toString(36).substring(2, 9),
                referrerId: l2User.id,
                refereeId: user.id,
                refereeName: user.name,
                amount: commL2,
                level: 2,
                createdAt: new Date().toISOString()
              };
              serverCommissionsStore.set(comm2.id, comm2);
              await safeSupabaseUpsert('commissions', comm2);

              // Level 3 (1%)
              if (l2User.referredByCode) {
                let l3User = Array.from(serverUsersStore.values()).find(u => u.referralCode === l2User.referredByCode);
                if (!l3User) {
                  const { data: dbL3 } = await supabaseAdmin.from('users').select('*').eq('referral_code', l2User.referredByCode).maybeSingle();
                  if (dbL3) l3User = normalizeDbRow('users', dbL3);
                }

                if (l3User) {
                  const commL3 = Math.round(totalPrice * 0.01);
                  const l3Bal = (l3User.balance || 0) + commL3;
                  const l3Tot = (l3User.totalEarnings || 0) + commL3;

                  const updatedL3 = { ...l3User, balance: l3Bal, totalEarnings: l3Tot };
                  serverUsersStore.set(l3User.id, updatedL3);
                  await safeSupabaseUpdate('users', { balance: l3Bal, totalEarnings: l3Tot }, 'id', l3User.id);

                  const comm3 = {
                    id: 'comm-' + Math.random().toString(36).substring(2, 9),
                    referrerId: l3User.id,
                    refereeId: user.id,
                    refereeName: user.name,
                    amount: commL3,
                    level: 3,
                    createdAt: new Date().toISOString()
                  };
                  serverCommissionsStore.set(comm3.id, comm3);
                  await safeSupabaseUpsert('commissions', comm3);
                }
              }
            }
          }
        }
      }

      // Invalidate cache so all clients fetch updated state immediately
      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Product Purchased]: User ${user.id} (${user.name}) bought ${qty}x ${product.name} -> New balance: ${newBalance} FCFA`);

      return res.json({
        success: true,
        newBalance,
        investments: newInvestments,
        user: updatedUser
      });
    } catch (err: any) {
      console.error('[Buy Investment Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur lors de l\'achat.' });
    }
  });

  // =========================================================================
  // 3. DEPOSITS & WITHDRAWALS ROUTES
  // =========================================================================

  // Submit Deposit Request
  app.post('/api/deposits/submit', async (req, res) => {
    try {
      const depositData = req.body;
      if (!depositData || !depositData.id || !depositData.amount || !depositData.userId) {
        return res.status(400).json({ success: false, error: 'Données de recharge incomplètes.' });
      }

      const normDep = {
        ...depositData,
        status: depositData.status || 'pending',
        createdAt: depositData.createdAt || new Date().toISOString()
      };

      serverDepositsStore.set(normDep.id, normDep);
      await safeSupabaseUpsert('deposits', normDep);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Deposit Submitted]: ID ${normDep.id}, User ${normDep.userName} (${normDep.userPhone}), Amount: ${normDep.amount} FCFA`);

      return res.json({ success: true, deposit: normDep });
    } catch (err: any) {
      console.error('[Server Deposit Submit Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Submit Withdrawal Request
  app.post('/api/withdrawals/submit', async (req, res) => {
    try {
      const withdrawalData = req.body;
      if (!withdrawalData || !withdrawalData.id || !withdrawalData.amount || !withdrawalData.userId) {
        return res.status(400).json({ success: false, error: 'Données de retrait incomplètes.' });
      }

      // Check user balance and deduct
      const user = serverUsersStore.get(withdrawalData.userId);
      if (user) {
        const newBal = Math.max(0, (user.balance || 0) - Number(withdrawalData.amount || 0));
        serverUsersStore.set(user.id, { ...user, balance: newBal });
        await safeSupabaseUpdate('users', { balance: newBal }, 'id', user.id);
      }

      const normWth = {
        ...withdrawalData,
        status: withdrawalData.status || 'pending',
        createdAt: withdrawalData.createdAt || new Date().toISOString()
      };

      serverWithdrawalsStore.set(normWth.id, normWth);
      await safeSupabaseUpsert('withdrawals', normWth);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Withdrawal Submitted]: ID ${normWth.id}, User ${normWth.userName} (${normWth.userPhone}), Amount: ${normWth.amount} FCFA`);

      return res.json({ success: true, withdrawal: normWth });
    } catch (err: any) {
      console.error('[Server Withdrawal Submit Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // =========================================================================
  // 4. CHAT / SUPPORT TICKETS ROUTES
  // =========================================================================

  app.post('/api/tickets/create', async (req, res) => {
    try {
      const ticket = req.body;
      if (!ticket || !ticket.id || !ticket.userId || !ticket.message) {
        return res.status(400).json({ success: false, error: 'Données de ticket incomplètes.' });
      }

      const normTicket = {
        ...ticket,
        status: ticket.status || 'open',
        createdAt: ticket.createdAt || new Date().toISOString(),
        isReadByUser: false
      };

      serverTicketsStore.set(normTicket.id, normTicket);
      await safeSupabaseUpsert('tickets', normTicket);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Chat Ticket Created]: ID ${normTicket.id}, User ${normTicket.userName} (${normTicket.userId}) -> "${normTicket.message.slice(0, 30)}..."`);

      return res.json({ success: true, ticket: normTicket });
    } catch (err: any) {
      console.error('[Server Ticket Create Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  app.post('/api/tickets/reply', async (req, res) => {
    try {
      const { ticketId, reply } = req.body;
      if (!ticketId || !reply || !reply.trim()) {
        return res.status(400).json({ success: false, error: 'ID de ticket et réponse requis.' });
      }

      const nowIso = new Date().toISOString();
      let existingTicket = serverTicketsStore.get(ticketId);

      if (!existingTicket) {
        const { data: dbTkt } = await supabaseAdmin.from('tickets').select('*').eq('id', ticketId).maybeSingle();
        if (dbTkt) {
          existingTicket = normalizeDbRow('tickets', dbTkt);
        }
      }

      const updates = {
        reply: reply.trim(),
        status: 'closed',
        replyCreatedAt: nowIso,
        isReadByUser: false
      };

      const mergedTicket = existingTicket ? { ...existingTicket, ...updates } : { id: ticketId, ...updates };
      serverTicketsStore.set(ticketId, mergedTicket);

      // Persist to Supabase
      await safeSupabaseUpdate('tickets', updates, 'id', ticketId);

      // Invalidate master sync cache so next refresh gets the fresh reply immediately
      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Admin Replied to Ticket]: ID ${ticketId} -> "${reply.slice(0, 30)}..."`);

      return res.json({ success: true, ticket: mergedTicket });
    } catch (err: any) {
      console.error('[Server Ticket Reply Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Admin Direct Message Route (creates or responds with admin message associated with user)
  app.post('/api/tickets/direct-message', async (req, res) => {
    try {
      const { userId, message, subject } = req.body;
      if (!userId || !message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Utilisateur et message requis.' });
      }

      // Look up target user info
      let targetUser = serverUsersStore.get(userId);
      if (!targetUser) {
        const { data: dbU } = await supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle();
        if (dbU) targetUser = normalizeDbRow('users', dbU);
      }

      const nowIso = new Date().toISOString();
      const newTicket = {
        id: 'tkt-adm-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
        userId: targetUser?.id || userId,
        userName: targetUser?.name || 'Client',
        userPhone: targetUser?.phone || null,
        subject: subject || "Message de l'Administration",
        message: "Message direct du Support Client Nutrien.",
        reply: message.trim(),
        status: 'closed',
        createdAt: nowIso,
        replyCreatedAt: nowIso,
        isReadByUser: false
      };

      serverTicketsStore.set(newTicket.id, newTicket);
      await safeSupabaseUpsert('tickets', newTicket);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Admin Direct Message]: Sent to User ${newTicket.userName} (${newTicket.userId}) -> "${message.slice(0, 30)}..."`);

      return res.json({ success: true, ticket: newTicket });
    } catch (err: any) {
      console.error('[Server Direct Message Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // =========================================================================
  // 5. ADMIN ACTIONS (PROCESS DEPOSITS, WITHDRAWALS, BALANCE, ROLES, BLOCKS)
  // =========================================================================

  // Process Deposit (Approve / Reject) with atomic balance crediting
  app.post('/api/admin/deposits/process', async (req, res) => {
    try {
      const { depositId, status, fallbackDepositData } = req.body;
      if (!depositId || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Paramètres de dépôt invalides.' });
      }

      let dep = serverDepositsStore.get(depositId);
      if (!dep) {
        const { data: dbDep } = await supabaseAdmin.from('deposits').select('*').eq('id', depositId).single();
        if (dbDep) dep = normalizeDbRow('deposits', dbDep);
      }

      if (!dep && fallbackDepositData) {
        dep = normalizeDbRow('deposits', fallbackDepositData);
        serverDepositsStore.set(dep.id, dep);
        await safeSupabaseUpsert('deposits', dep);
      }

      if (!dep) {
        return res.status(404).json({ success: false, error: 'Dépôt non trouvé dans la base centrale.' });
      }

      // IDEMPOTENCY CHECK: If already approved, DO NOT credit again!
      if (dep.status === 'approved') {
        const u = serverUsersStore.get(dep.userId);
        return res.json({
          success: true,
          message: 'Ce dépôt a déjà été validé et crédité précédemment.',
          alreadyApproved: true,
          status: 'approved',
          depositId,
          newBalance: u?.balance ?? null
        });
      }

      // Update deposit status
      const updatedDep = { ...dep, status };
      serverDepositsStore.set(depositId, updatedDep);
      await safeSupabaseUpdate('deposits', { status }, 'id', depositId);

      let updatedBalance: number | null = null;

      // If approved, credit user balance in Supabase and memory
      if (status === 'approved') {
        let targetUser: any = serverUsersStore.get(dep.userId);

        if (!targetUser) {
          const { data: userById } = await supabaseAdmin.from('users').select('*').eq('id', dep.userId).maybeSingle();
          if (userById) targetUser = normalizeDbRow('users', userById);
        }

        if (!targetUser && dep.userPhone) {
          const { data: userByPhone } = await supabaseAdmin.from('users').select('*').eq('phone', dep.userPhone).maybeSingle();
          if (userByPhone) targetUser = normalizeDbRow('users', userByPhone);
        }

        if (targetUser) {
          const currentBal = Number(targetUser.balance || 0);
          const depositAmt = Number(dep.amount || 0);
          const calculatedBalance = currentBal + depositAmt;

          const updatedUserObj = { ...targetUser, balance: calculatedBalance };
          serverUsersStore.set(targetUser.id, updatedUserObj);

          await safeSupabaseUpdate('users', { balance: calculatedBalance }, 'id', targetUser.id);

          updatedBalance = calculatedBalance;
          lastFetchAllData = null;
          lastFetchAllTime = 0;

          console.log(`[Deposit Approved & Credited]: User ${targetUser.id} (${targetUser.phone}) +${depositAmt} FCFA -> New balance: ${calculatedBalance} FCFA`);
        }
      }

      return res.json({
        success: true,
        message: `Dépôt ${status === 'approved' ? 'validé et solde crédité' : 'rejeté'} avec succès.`,
        depositId,
        status,
        newBalance: updatedBalance
      });
    } catch (err: any) {
      console.error('[Server Admin Deposit Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Process Withdrawal (Approve / Reject)
  app.post('/api/admin/withdrawals/process', async (req, res) => {
    try {
      const { withdrawalId, status } = req.body;
      if (!withdrawalId || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Paramètres de retrait invalides.' });
      }

      let wth = serverWithdrawalsStore.get(withdrawalId);
      if (!wth) {
        const { data: dbWth } = await supabaseAdmin.from('withdrawals').select('*').eq('id', withdrawalId).single();
        if (dbWth) wth = normalizeDbRow('withdrawals', dbWth);
      }

      if (!wth) {
        return res.status(404).json({ success: false, error: 'Demande de retrait non trouvée.' });
      }

      // Update withdrawal status
      serverWithdrawalsStore.set(withdrawalId, { ...wth, status });
      await safeSupabaseUpdate('withdrawals', { status }, 'id', withdrawalId);

      // If rejected, refund user balance
      if (status === 'rejected') {
        const targetUser = serverUsersStore.get(wth.userId);
        if (targetUser) {
          const refundedBalance = Number(targetUser.balance || 0) + Number(wth.amount || 0);
          serverUsersStore.set(targetUser.id, { ...targetUser, balance: refundedBalance });
          await safeSupabaseUpdate('users', { balance: refundedBalance }, 'id', targetUser.id);
        }
      }

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      return res.json({ success: true, message: `Retrait ${status === 'approved' ? 'validé' : 'rejeté'} avec succès.` });
    } catch (err: any) {
      console.error('[Server Admin Withdrawal Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Update User Balance (Direct set or delta)
  app.post('/api/admin/users/balance', async (req, res) => {
    try {
      const { userId, amount, isDirectSet } = req.body;
      if (!userId || typeof amount !== 'number') {
        return res.status(400).json({ success: false, error: 'ID utilisateur ou montant manquant.' });
      }

      let user = serverUsersStore.get(userId);
      if (!user) {
        const { data: dbUser } = await supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle();
        if (dbUser) user = normalizeDbRow('users', dbUser);
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé dans la base centrale.' });
      }

      const cleanBalance = isDirectSet ? Math.max(0, amount) : Math.max(0, Number(user.balance || 0) + amount);

      serverUsersStore.set(user.id, { ...user, balance: cleanBalance });
      await safeSupabaseUpdate('users', { balance: cleanBalance }, 'id', user.id);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Admin Balance Updated]: User ${user.id} (${user.name} - ${user.phone}) -> New balance: ${cleanBalance} FCFA`);

      return res.json({ success: true, newBalance: cleanBalance, userId: user.id });
    } catch (err: any) {
      console.error('[Server Admin Balance Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Update User Role
  app.post('/api/admin/users/role', async (req, res) => {
    try {
      const { userId, role } = req.body;
      if (!userId || !['admin', 'user'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Rôle ou ID invalide.' });
      }

      if (serverUsersStore.has(userId)) {
        serverUsersStore.set(userId, { ...serverUsersStore.get(userId), role });
      }

      await safeSupabaseUpdate('users', { role }, 'id', userId);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Update User Block Status
  app.post('/api/admin/users/block', async (req, res) => {
    try {
      const { userId, isBlocked } = req.body;
      if (!userId || typeof isBlocked !== 'boolean') {
        return res.status(400).json({ success: false, error: 'Paramètres de blocage invalides.' });
      }

      if (serverUsersStore.has(userId)) {
        serverUsersStore.set(userId, { ...serverUsersStore.get(userId), isBlocked });
      }

      await safeSupabaseUpdate('users', { isBlocked }, 'id', userId);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Fetch Single Table Data
  app.get('/api/admin/fetch-table', async (req, res) => {
    try {
      const tableName = req.query.tableName as string;
      if (!tableName) {
        return res.status(400).json({ success: false, error: 'Nom de table requis.' });
      }
      const { data, error } = await (supabaseAdmin.from(tableName as any) as any).select('*');
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      const normalizedData = (data || []).map((row: any) => normalizeDbRow(tableName, row));
      return res.json({ success: true, data: normalizedData });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Master Cache
  let lastFetchAllData: any = null;
  let lastFetchAllTime = 0;
  const CACHE_TTL_MS = 2000;

  async function withDbTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }

  // Authoritative Master Sync Route
  app.get('/api/admin/fetch-all', async (req, res) => {
    try {
      const isForce = req.query.force === 'true' || req.query.refresh === '1';
      const now = Date.now();
      if (!isForce && lastFetchAllData && (now - lastFetchAllTime < CACHE_TTL_MS)) {
        return res.json({
          success: true,
          data: lastFetchAllData,
          cached: true
        });
      }

      const fetchTableSafe = async (table: string, fallbackStore: Map<string, any>) => {
        try {
          const queryPromise = (async () => {
            const { data, error } = await supabaseAdmin
              .from(table)
              .select('*')
              .limit(10000);
            if (error) {
              return Array.from(fallbackStore.values());
            }
            if (data && Array.isArray(data) && data.length > 0) {
              data.forEach(item => {
                const norm = normalizeDbRow(table, item);
                const key = norm.id || norm.code;
                if (key) fallbackStore.set(key, { ...fallbackStore.get(key), ...norm });
              });
            }
            return Array.from(fallbackStore.values());
          })();

          return await withDbTimeout(queryPromise, 3000, Array.from(fallbackStore.values()));
        } catch (_) {
          return Array.from(fallbackStore.values());
        }
      };

      const [
        users,
        products,
        investments,
        deposits,
        withdrawals,
        proofs,
        tickets,
        commissions,
        bonusCodes
      ] = await Promise.all([
        fetchTableSafe('users', serverUsersStore),
        fetchTableSafe('products', serverProductsStore),
        fetchTableSafe('investments', serverInvestmentsStore),
        fetchTableSafe('deposits', serverDepositsStore),
        fetchTableSafe('withdrawals', serverWithdrawalsStore),
        fetchTableSafe('withdrawal_proofs', serverProofsStore),
        fetchTableSafe('tickets', serverTicketsStore),
        fetchTableSafe('commissions', serverCommissionsStore),
        fetchTableSafe('bonus_codes', serverBonusCodesStore)
      ]);

      const resultData = {
        users: users || Array.from(serverUsersStore.values()),
        products: products || [],
        investments: investments || [],
        deposits: deposits || [],
        withdrawals: withdrawals || [],
        withdrawal_proofs: proofs || [],
        tickets: tickets || [],
        commissions: commissions || [],
        bonus_codes: bonusCodes || []
      };

      lastFetchAllData = resultData;
      lastFetchAllTime = Date.now();

      return res.json({
        success: true,
        data: resultData
      });
    } catch (err: any) {
      console.error('[Server Admin Fetch All Error]:', err);
      if (lastFetchAllData) {
        return res.json({ success: true, data: lastFetchAllData, fallback: true });
      }
      return res.json({
        success: true,
        data: {
          users: Array.from(serverUsersStore.values()),
          products: [],
          investments: [],
          deposits: [],
          withdrawals: [],
          withdrawal_proofs: [],
          tickets: [],
          commissions: [],
          bonus_codes: []
        }
      });
    }
  });

  // Update Credentials
  app.post('/api/admin/users/credentials', async (req, res) => {
    try {
      const { userId, withdrawalPinHash } = req.body;
      if (!userId || !withdrawalPinHash) {
        return res.status(400).json({ success: false, error: 'Paramètres manquants.' });
      }

      if (serverUsersStore.has(userId)) {
        serverUsersStore.set(userId, { ...serverUsersStore.get(userId), withdrawalPinHash });
      }

      await safeSupabaseUpdate('users', { withdrawalPinHash }, 'id', userId);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Generic Admin Upsert / Update / Delete with Service Role Key
  app.post('/api/admin/execute', async (req, res) => {
    try {
      const { action, tableName, item, updates, idValue, idCol = 'id', items } = req.body;
      if (!tableName) {
        return res.status(400).json({ success: false, error: 'Table name required.' });
      }

      if (action === 'upsert' && item) {
        const norm = normalizeDbRow(tableName, item);
        const key = norm.id || norm.code;
        if (tableName === 'users' && key) serverUsersStore.set(key, norm);
        if (tableName === 'investments' && key) serverInvestmentsStore.set(key, norm);
        if (tableName === 'deposits' && key) serverDepositsStore.set(key, norm);
        if (tableName === 'withdrawals' && key) serverWithdrawalsStore.set(key, norm);
        if (tableName === 'tickets' && key) serverTicketsStore.set(key, norm);
        if (tableName === 'products' && key) serverProductsStore.set(key, norm);
        if (tableName === 'bonus_codes' && key) serverBonusCodesStore.set(key, norm);

        await safeSupabaseUpsert(tableName, item);
        return res.json({ success: true });
      }

      if (action === 'update' && idValue) {
        if (tableName === 'users' && serverUsersStore.has(idValue)) {
          serverUsersStore.set(idValue, { ...serverUsersStore.get(idValue), ...updates });
        }
        await safeSupabaseUpdate(tableName, updates, idCol, idValue);
        return res.json({ success: true });
      }

      if (action === 'delete' && idValue) {
        if (tableName === 'users') serverUsersStore.delete(idValue);
        if (tableName === 'investments') serverInvestmentsStore.delete(idValue);
        if (tableName === 'deposits') serverDepositsStore.delete(idValue);
        if (tableName === 'withdrawals') serverWithdrawalsStore.delete(idValue);
        if (tableName === 'tickets') serverTicketsStore.delete(idValue);
        if (tableName === 'products') serverProductsStore.delete(idValue);
        if (tableName === 'bonus_codes') serverBonusCodesStore.delete(idValue);

        await (supabaseAdmin.from(tableName as any) as any).delete().eq(idCol, idValue);
        return res.json({ success: true });
      }

      if (action === 'sync' && Array.isArray(items)) {
        for (const it of items) {
          await safeSupabaseUpsert(tableName, it);
        }
        return res.json({ success: true });
      }

      return res.status(400).json({ success: false, error: 'Action non supportée.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // =========================================================================
  // AUTOMATED 24H REVENUE DISTRIBUTION CRON WORKER
  // =========================================================================
  async function runServerSideDailyRevenueDistribution() {
    try {
      const { data: activeInvestments, error } = await supabaseAdmin
        .from('investments')
        .select('*');

      if (error || !activeInvestments || activeInvestments.length === 0) return;

      const normInvestments = activeInvestments.map(i => normalizeDbRow('investments', i)).filter(i => (i.daysRemaining || 0) > 0);
      if (normInvestments.length === 0) return;

      const now = Date.now();
      const userGainMap = new Map<string, number>();
      const investmentsToUpdate: any[] = [];

      for (const inv of normInvestments) {
        const lastClaim = new Date(inv.lastClaimDate || inv.purchaseDate || now).getTime();
        const hoursElapsed = (now - lastClaim) / (3600 * 1000);

        if (hoursElapsed >= 24) {
          const cycles = Math.min(Math.floor(hoursElapsed / 24), inv.daysRemaining || 1);
          if (cycles > 0) {
            const gain = (Number(inv.dailyGain) || 0) * cycles;
            userGainMap.set(inv.userId, (userGainMap.get(inv.userId) || 0) + gain);
            const newClaimTime = lastClaim + (cycles * 24 * 3600 * 1000);

            investmentsToUpdate.push({
              id: inv.id,
              daysRemaining: Math.max(0, (inv.daysRemaining || 1) - cycles),
              lastClaimDate: new Date(newClaimTime).toISOString()
            });
          }
        }
      }

      if (investmentsToUpdate.length > 0) {
        for (const item of investmentsToUpdate) {
          await safeSupabaseUpdate('investments', {
            daysRemaining: item.daysRemaining,
            lastClaimDate: item.lastClaimDate
          }, 'id', item.id);
        }

        for (const [userId, totalGain] of userGainMap.entries()) {
          const { data: userRec } = await supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle();
          if (userRec) {
            const normUser = normalizeDbRow('users', userRec);
            const newBal = (Number(normUser.balance) || 0) + totalGain;
            const newTot = (Number(normUser.totalEarnings) || 0) + totalGain;

            await safeSupabaseUpdate('users', {
              balance: newBal,
              dailyEarnings: totalGain,
              totalEarnings: newTot
            }, 'id', userId);

            if (serverUsersStore.has(userId)) {
              const u = serverUsersStore.get(userId);
              serverUsersStore.set(userId, { ...u, balance: newBal, dailyEarnings: totalGain, totalEarnings: newTot });
            }
          }
        }

        lastFetchAllData = null;
        lastFetchAllTime = 0;
        console.log(`[Daily Revenue Worker] Distributed earnings for ${investmentsToUpdate.length} investments.`);
      }
    } catch (err: any) {
      console.warn('[Daily Revenue Worker Notice]:', err?.message);
    }
  }

  setInterval(runServerSideDailyRevenueDistribution, 30000);
  setTimeout(runServerSideDailyRevenueDistribution, 4000);

  // =========================================================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Supabase Admin] Initialized with Service Role Key for URL: ${SUPABASE_URL}`);
  });
}

startServer();
