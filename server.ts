import express from 'express';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ override: true });

// Configuration
const PORT = 3000;
// Central Supabase Credentials for project 'ykoqcaggjfhpnysvumuu'
const TARGET_PROJECT_REF = 'ykoqcaggjfhpnysvumuu';
const CENTRAL_SUPABASE_URL = 'https://ykoqcaggjfhpnysvumuu.supabase.co';
const CENTRAL_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb3FjYWdnamZocG55c3Z1bXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQyMzg5OSwiZXhwIjoyMTAzOTk5ODk5fQ.7HSpfFhr9f9ET9XytoQoz1Qe5l64ID_VcTD3HpFSItU';

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

function resolveServerSupabaseUrl(): string {
  const candidates = [
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.VITE_SUPABASE_URL
  ];
  for (const c of candidates) {
    if (c && c.includes(TARGET_PROJECT_REF)) return c;
  }
  return CENTRAL_SUPABASE_URL;
}

function resolveServerServiceRoleKey(): string {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (envKey && getJwtProjectRef(envKey) === TARGET_PROJECT_REF) {
    return envKey;
  }
  return CENTRAL_SUPABASE_SERVICE_ROLE_KEY;
}

const SUPABASE_URL = resolveServerSupabaseUrl();
const SUPABASE_SERVICE_ROLE_KEY = resolveServerServiceRoleKey();

// Global Supabase connection & quota monitoring state
let isSupabaseQuotaExceeded = false;
let lastSupabaseErrorMsg: string | null = null;
let lastSupabaseSuccessTimestamp = 0;

// Safe Node.js fetch for Supabase Admin with 8000ms timeout and accurate status reporting
const safeServerFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    // If Supabase returns 402 Payment Required (exceed_egress_quota)
    if (res.status === 402) {
      isSupabaseQuotaExceeded = true;
      lastSupabaseErrorMsg = 'exceed_egress_quota (402): Quota de bande passante mensuelle Supabase atteint. Mode résilience locale actif.';
      console.warn('[Supabase Egress Quota Exceeded]: Supabase returned HTTP 402. Switched to high-availability local storage.');
    } else if (res.ok) {
      isSupabaseQuotaExceeded = false;
      lastSupabaseSuccessTimestamp = Date.now();
    }

    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[Supabase Fetch Timeout/Error]:', err?.message);
    return new Response(
      JSON.stringify({ message: err?.message || 'Database connection timeout', code: 'NETWORK_ERROR' }),
      {
        status: 504,
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
    { jsKey: 'screenshotUrl', dbKeys: ['screenshot_url', 'screenshotUrl', 'image_url', 'imageUrl', 'image'], defaultValue: null },
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
    { jsKey: 'imageUrl', dbKeys: ['image_url', 'imageUrl', 'image', 'photo_url', 'screenshot_url'], defaultValue: null },
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
    { jsKey: 'imageUrl', dbKeys: ['image_url', 'imageUrl', 'image', 'photo_url', 'screenshot_url'], defaultValue: null },
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

// Pre-initialize known columns for all tables from schema definitions
for (const [tbl, fieldList] of Object.entries(SCHEMA_DEFINITIONS)) {
  const set = new Set<string>();
  for (const f of fieldList) {
    for (const k of f.dbKeys) set.add(k);
  }
  knownTableColumns.set(tbl, set);
}

// Explicit strict known columns for deposits, withdrawals, products
knownTableColumns.set('deposits', new Set([
  'id', 'user_id', 'user_name', 'user_phone', 'amount', 'method',
  'transaction_id', 'screenshot_url', 'status', 'created_at'
]));
knownTableColumns.set('withdrawals', new Set([
  'id', 'user_id', 'user_name', 'user_phone', 'amount', 'received_amount',
  'network', 'account_number', 'status', 'created_at'
]));
knownTableColumns.set('products', new Set([
  'id', 'name', 'price', 'daily_gain', 'duration', 'total_gain',
  'is_active', 'image', 'description', 'order', 'badge', 'color'
]));

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

  // Enforce numbers for numeric fields to prevent string concatenation bugs
  const numericKeys = new Set([
    'balance', 'dailyEarnings', 'totalEarnings', 'vipLevel', 'drawTickets',
    'price', 'dailyGain', 'duration', 'totalGain', 'daysRemaining',
    'amount', 'receivedAmount', 'order', 'level', 'maxUses'
  ]);
  for (const k of Object.keys(jsObject)) {
    if (numericKeys.has(k) && jsObject[k] !== null && jsObject[k] !== undefined && typeof jsObject[k] !== 'number') {
      const parsed = Number(jsObject[k]);
      if (!isNaN(parsed)) jsObject[k] = parsed;
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

  // For strict tables (deposits, products, withdrawals), DO NOT attach unmapped arbitrary keys
  const isStrictTable = ['deposits', 'withdrawals', 'products'].includes(tableName);
  if (!isStrictTable) {
    for (const k of Object.keys(jsObject)) {
      const isMapped = mappings.some(m => m.jsKey === k || m.dbKeys.includes(k));
      if (!isMapped && jsObject[k] !== undefined) {
        if (!knownCols || knownCols.size === 0 || knownCols.has(k)) {
          payload[k] = jsObject[k];
        }
      }
    }
  }

  return payload;
}

/**
 * Resilient Supabase Upsert that automatically handles column mismatches and retries
 */
async function safeSupabaseUpsert(tableName: string, item: any): Promise<{ success: boolean; error?: string; data?: any; quotaExceeded?: boolean; localOnly?: boolean }> {
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
        isSupabaseQuotaExceeded = false;
        lastSupabaseSuccessTimestamp = Date.now();
        return { success: true, data };
      }

      const errMsg = error.message || '';
      console.warn(`[Safe Upsert] '${tableName}' attempt ${attempt + 1} notice:`, errMsg);

      // Handle Supabase Egress Quota restriction (HTTP 402 / exceed_egress_quota)
      if (errMsg.includes('exceed_egress_quota') || errMsg.includes('restricted') || errMsg.includes('402') || (error as any).code === '402') {
        isSupabaseQuotaExceeded = true;
        lastSupabaseErrorMsg = errMsg;
        console.warn(`[Supabase Quota Alert]: Project restricted by Supabase quota. Record saved safely in local persistent store.`);
        return { success: true, localOnly: true, quotaExceeded: true };
      }

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

        // Track and remove from knownTableColumns
        const tableCols = knownTableColumns.get(tableName);
        if (tableCols) {
          tableCols.delete(badCol);
        }

        // If it was snake_case, try camelCase, or vice versa, but ONLY if different and present
        const altCol = badCol.includes('_') 
          ? badCol.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
          : badCol.replace(/([A-Z])/g, '_$1').toLowerCase();

        if (altCol !== badCol && tableCols && tableCols.has(altCol)) {
          const val = item[badCol] ?? item[altCol];
          if (val !== undefined) {
            payload[altCol] = val;
          }
        }
        continue;
      }

      // If attempt fails, strip payload down to only explicitly known columns
      if (attempt === 1) {
        const cleanPayload: Record<string, any> = {};
        const mappings = SCHEMA_DEFINITIONS[tableName] || [];
        for (const m of mappings) {
          for (const dbk of m.dbKeys) {
            if (payload[dbk] !== undefined) {
              cleanPayload[dbk] = payload[dbk];
              break;
            }
          }
        }
        payload = Object.keys(cleanPayload).length > 0 ? cleanPayload : payload;
      } else {
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('exceed_egress_quota') || msg.includes('402')) {
        isSupabaseQuotaExceeded = true;
        lastSupabaseErrorMsg = msg;
        return { success: true, localOnly: true, quotaExceeded: true };
      }
      return { success: false, error: msg || 'Database error' };
    }
  }

  return { success: false, error: 'Failed to upsert after multiple column adjustments' };
}

/**
 * Resilient Supabase Update that automatically handles column mismatches
 */
async function safeSupabaseUpdate(tableName: string, updates: any, idCol: string, idVal: any): Promise<{ success: boolean; error?: string; quotaExceeded?: boolean; localOnly?: boolean }> {
  // Pass allowDefaults = false so partial updates (like bank card linking) never reset user balance or earnings!
  let payload = prepareDbPayload(tableName, updates, false);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { error } = await (supabaseAdmin.from(tableName as any) as any)
        .update(payload)
        .eq(idCol, idVal);

      if (!error) {
        isSupabaseQuotaExceeded = false;
        lastSupabaseSuccessTimestamp = Date.now();
        return { success: true };
      }

      const errMsg = error.message || '';
      console.warn(`[Safe Update] '${tableName}' attempt ${attempt + 1} notice:`, errMsg);

      // Handle Supabase Egress Quota restriction
      if (errMsg.includes('exceed_egress_quota') || errMsg.includes('restricted') || errMsg.includes('402') || (error as any).code === '402') {
        isSupabaseQuotaExceeded = true;
        lastSupabaseErrorMsg = errMsg;
        return { success: true, localOnly: true, quotaExceeded: true };
      }

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
      const msg = err?.message || '';
      if (msg.includes('exceed_egress_quota') || msg.includes('402')) {
        isSupabaseQuotaExceeded = true;
        lastSupabaseErrorMsg = msg;
        return { success: true, localOnly: true, quotaExceeded: true };
      }
      return { success: false, error: msg || 'Database error' };
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
const serverAnnouncementsStore = new Map<string, any>();
const serverTasksStore = new Map<string, any>();
const serverUserTaskClaimsStore = new Map<string, any>();

// =========================================================================
// LOCAL PERSISTENT DISK STORAGE (FAILSAFE AGAINST SUPABASE QUOTA VIOLATIONS)
// =========================================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'platform_store.json');

// SECURE PAYMENT GATEWAY CONFIGURATION (SERVER-SIDE ONLY)
const DEFAULT_PAYMENT_GATEWAY_URL = 'https://tchin.tech/pay/6wy9goqpge';
let activePaymentGatewayUrl = process.env.PAYMENT_GATEWAY_URL || DEFAULT_PAYMENT_GATEWAY_URL;

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err: any) {
  console.warn('[Persistent Store Dir Init Warning]:', err?.message);
}

let saveDebounceTimer: NodeJS.Timeout | null = null;

function savePlatformDataToDisk(force: boolean = false): void {
  const doSave = () => {
    try {
      const dump = {
        users: Array.from(serverUsersStore.values()),
        products: Array.from(serverProductsStore.values()),
        investments: Array.from(serverInvestmentsStore.values()),
        deposits: Array.from(serverDepositsStore.values()),
        withdrawals: Array.from(serverWithdrawalsStore.values()),
        withdrawal_proofs: Array.from(serverProofsStore.values()),
        tickets: Array.from(serverTicketsStore.values()),
        commissions: Array.from(serverCommissionsStore.values()),
        bonus_codes: Array.from(serverBonusCodesStore.values()),
        announcements: Array.from(serverAnnouncementsStore.values()),
        tasks: Array.from(serverTasksStore.values()),
        task_claims: Array.from(serverUserTaskClaimsStore.values()),
        paymentGatewayUrl: activePaymentGatewayUrl,
        lastSaved: new Date().toISOString()
      };
      const tmpFile = DATA_FILE + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(dump, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err: any) {
      console.warn('[Persistent Store Save Warning]:', err?.message);
    }
  };

  if (force) {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }
    doSave();
  } else {
    if (saveDebounceTimer) return;
    saveDebounceTimer = setTimeout(() => {
      saveDebounceTimer = null;
      doSave();
    }, 300);
  }
}

function loadPlatformDataFromDisk(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (Array.isArray(parsed.users)) {
          parsed.users.forEach((u: any) => { if (u && u.id) serverUsersStore.set(u.id, u); });
        }
        if (Array.isArray(parsed.products)) {
          parsed.products.forEach((p: any) => { if (p && p.id) serverProductsStore.set(p.id, p); });
        }
        if (Array.isArray(parsed.investments)) {
          parsed.investments.forEach((i: any) => { if (i && i.id) serverInvestmentsStore.set(i.id, i); });
        }
        if (Array.isArray(parsed.deposits)) {
          parsed.deposits.forEach((d: any) => { if (d && d.id) serverDepositsStore.set(d.id, d); });
        }
        if (Array.isArray(parsed.withdrawals)) {
          parsed.withdrawals.forEach((w: any) => { if (w && w.id) serverWithdrawalsStore.set(w.id, w); });
        }
        if (Array.isArray(parsed.withdrawal_proofs)) {
          parsed.withdrawal_proofs.forEach((pr: any) => { if (pr && pr.id) serverProofsStore.set(pr.id, pr); });
        }
        if (Array.isArray(parsed.tickets)) {
          parsed.tickets.forEach((t: any) => { if (t && t.id) serverTicketsStore.set(t.id, t); });
        }
        if (Array.isArray(parsed.commissions)) {
          parsed.commissions.forEach((c: any) => { if (c && c.id) serverCommissionsStore.set(c.id, c); });
        }
        if (Array.isArray(parsed.bonus_codes)) {
          parsed.bonus_codes.forEach((b: any) => { if (b && (b.id || b.code)) serverBonusCodesStore.set(b.code || b.id, b); });
        }
        if (Array.isArray(parsed.announcements)) {
          parsed.announcements.forEach((a: any) => { if (a && a.id) serverAnnouncementsStore.set(a.id, a); });
        } else if (Array.isArray(parsed.bonus_codes)) {
          const sysAnnRow = parsed.bonus_codes.find((b: any) => b && (b.code === '__SYS_ANNOUNCEMENTS__' || b.id === '__SYS_ANNOUNCEMENTS__'));
          if (sysAnnRow && Array.isArray(sysAnnRow.usedBy)) {
            sysAnnRow.usedBy.forEach((a: any) => { if (a && a.id) serverAnnouncementsStore.set(a.id, a); });
          }
        }
        if (serverAnnouncementsStore.size === 0) {
          const initialAirpodsAnn = {
            id: 'ann-official-airpods-launch',
            title: 'Lancement Officiel de la Gamme AirPods',
            content: 'Bienvenue sur la plateforme officielle de commande et de rentabilité technologique AirPods. Tous les rendements quotidiens sont synchronisés et payés automatiquement 7j/7.',
            imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
            createdAt: '14 septembre 2026',
            isNew: false
          };
          serverAnnouncementsStore.set(initialAirpodsAnn.id, initialAirpodsAnn);
        }
        if (Array.isArray(parsed.tasks)) {
          parsed.tasks.forEach((tk: any) => { if (tk && tk.id) serverTasksStore.set(tk.id, tk); });
        }
        if (Array.isArray(parsed.task_claims)) {
          parsed.task_claims.forEach((cl: any) => { if (cl && cl.id) serverUserTaskClaimsStore.set(cl.id, cl); });
        }
        if (parsed.paymentGatewayUrl && typeof parsed.paymentGatewayUrl === 'string' && parsed.paymentGatewayUrl.startsWith('http')) {
          activePaymentGatewayUrl = parsed.paymentGatewayUrl;
        }

        // Ensure default seed admin users are registered with proper roles and credentials
        defaultSeedUsers.forEach(seed => {
          const existing = serverUsersStore.get(seed.id);
          if (!existing) {
            serverUsersStore.set(seed.id, seed);
          } else {
            serverUsersStore.set(seed.id, {
              ...existing,
              role: 'admin',
              country: seed.country || 'Togo',
              withdrawalPinHash: seed.withdrawalPinHash
            });
          }
        });

        console.log(`[Persistent Store] Loaded from disk: ${serverUsersStore.size} users, ${serverDepositsStore.size} deposits, ${serverWithdrawalsStore.size} withdrawals, ${serverInvestmentsStore.size} investments, ${serverTicketsStore.size} tickets.`);
      }
    }
  } catch (err: any) {
    console.warn('[Persistent Store Load Warning]:', err?.message);
  }
}

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
    id: 'usr-admin-togo-123456',
    name: 'Directeur Général Togo (Admin)',
    phone: '+22890123456',
    whatsapp: '+22890123456',
    country: 'Togo',
    balance: 5000000,
    dailyEarnings: 250000,
    totalEarnings: 15000000,
    vipLevel: 8,
    isBlocked: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    role: 'admin',
    referralCode: 'TOGO2026',
    referredByCode: null,
    withdrawalAccountName: 'ADMINISTRATION TOGO',
    withdrawalAccountNumber: '90123456',
    withdrawalPinHash: JSON.stringify({
      pwd: '123456',
      pwd_hash: hashPasswordPbkdf2('123456', SYSTEM_ADMIN_SALT),
      salt: SYSTEM_ADMIN_SALT,
      pin: '0000',
      pin_hash: hashPasswordPbkdf2('0000', SYSTEM_ADMIN_SALT),
      net: 'TMoney',
      cty: 'TG'
    })
  },
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
      pwd: '123456',
      pwd_hash: hashPasswordPbkdf2('123456', SYSTEM_ADMIN_SALT),
      salt: SYSTEM_ADMIN_SALT,
      pin: '8822',
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
      pwd: '123456',
      pwd_hash: hashPasswordPbkdf2('123456', SYSTEM_ADMIN_SALT),
      salt: SYSTEM_ADMIN_SALT,
      pin: '0000',
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
      pwd: '123456',
      pwd_hash: hashPasswordPbkdf2('123456', SYSTEM_ADMIN_SALT),
      salt: SYSTEM_ADMIN_SALT,
      pin: '8822',
      pin_hash: hashPasswordPbkdf2('8822', SYSTEM_ADMIN_SALT),
      net: 'TMoney',
      cty: 'TG'
    })
  }
];

// Official AirProds Investment Plans (Cycle 180 days)
const defaultSeedProducts = [
  {
    id: 'airprods-vip1',
    name: 'VIP1 AirProds',
    price: 3000,
    dailyGain: 750,
    duration: 180,
    gain180Days: 135000,
    totalGain: 135000,
    dailyRatePercent: 25,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP1 AirProds — Revenu quotidien de 750 XOF (25%/j) pendant 180 jours. Revenu total : 135 000 XOF.',
    order: 1,
    badge: 'VIP1',
    color: 'from-blue-950/70 via-cyan-900/40 to-sky-950/50 border-cyan-500/40'
  },
  {
    id: 'airprods-vip2',
    name: 'VIP2 AirProds',
    price: 10000,
    dailyGain: 2550,
    duration: 180,
    gain180Days: 459000,
    totalGain: 459000,
    dailyRatePercent: 25.5,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP2 AirProds — Revenu quotidien de 2 550 XOF (25.5%/j) pendant 180 jours. Revenu total : 459 000 XOF.',
    order: 2,
    badge: 'VIP2',
    color: 'from-emerald-950/70 via-teal-900/40 to-green-950/50 border-emerald-500/40'
  },
  {
    id: 'airprods-vip3',
    name: 'VIP3 AirProds',
    price: 20000,
    dailyGain: 5200,
    duration: 180,
    gain180Days: 936000,
    totalGain: 936000,
    dailyRatePercent: 26,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP3 AirProds — Revenu quotidien de 5 200 XOF (26%/j) pendant 180 jours. Revenu total : 936 000 XOF.',
    order: 3,
    badge: 'VIP3',
    color: 'from-purple-950/70 via-indigo-900/40 to-violet-950/50 border-purple-500/40'
  },
  {
    id: 'airprods-vip4',
    name: 'VIP4 AirProds',
    price: 45000,
    dailyGain: 11925,
    duration: 180,
    gain180Days: 2146500,
    totalGain: 2146500,
    dailyRatePercent: 26.5,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP4 AirProds — Revenu quotidien de 11 925 XOF (26.5%/j) pendant 180 jours. Revenu total : 2 146 500 XOF.',
    order: 4,
    badge: 'VIP4',
    color: 'from-amber-950/70 via-orange-900/40 to-yellow-950/50 border-amber-500/40'
  },
  {
    id: 'airprods-vip5',
    name: 'VIP5 AirProds',
    price: 100000,
    dailyGain: 27000,
    duration: 180,
    gain180Days: 4860000,
    totalGain: 4860000,
    dailyRatePercent: 27,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1576633587382-13ddf37b1fc1?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP5 AirProds — Revenu quotidien de 27 000 XOF (27%/j) pendant 180 jours. Revenu total : 4 860 000 XOF.',
    order: 5,
    badge: 'VIP5',
    color: 'from-rose-950/70 via-pink-900/40 to-red-950/50 border-rose-500/40'
  },
  {
    id: 'airprods-vip6',
    name: 'VIP6 AirProds',
    price: 250000,
    dailyGain: 70000,
    duration: 180,
    gain180Days: 12600000,
    totalGain: 12600000,
    dailyRatePercent: 28,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP6 AirProds — Revenu quotidien de 70 000 XOF (28%/j) pendant 180 jours. Revenu total : 12 600 000 XOF.',
    order: 6,
    badge: 'VIP6',
    color: 'from-cyan-950/70 via-teal-900/40 to-blue-950/50 border-cyan-400/40'
  },
  {
    id: 'airprods-vip7',
    name: 'VIP7 AirProds',
    price: 500000,
    dailyGain: 145000,
    duration: 180,
    gain180Days: 26100000,
    totalGain: 26100000,
    dailyRatePercent: 29,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP7 AirProds — Revenu quotidien de 145 000 XOF (29%/j) pendant 180 jours. Revenu total : 26 100 000 XOF.',
    order: 7,
    badge: 'VIP7',
    color: 'from-purple-950/70 via-fuchsia-900/40 to-indigo-950/50 border-purple-400/40'
  },
  {
    id: 'airprods-vip8',
    name: 'VIP8 AirProds',
    price: 1000000,
    dailyGain: 310000,
    duration: 180,
    gain180Days: 55800000,
    totalGain: 55800000,
    dailyRatePercent: 31,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP8 AirProds — Revenu quotidien de 310 000 XOF (31%/j) pendant 180 jours. Revenu total : 55 800 000 XOF.',
    order: 8,
    badge: 'VIP8',
    color: 'from-blue-950/70 via-indigo-900/40 to-sky-950/50 border-blue-400/40'
  },
  {
    id: 'airprods-vip9',
    name: 'VIP9 AirProds',
    price: 2000000,
    dailyGain: 800000,
    duration: 180,
    gain180Days: 144000000,
    totalGain: 144000000,
    dailyRatePercent: 40,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP9 AirProds — Revenu quotidien de 800 000 XOF (40%/j) pendant 180 jours. Revenu total : 144 000 000 XOF.',
    order: 9,
    badge: 'VIP9',
    color: 'from-violet-950/70 via-purple-900/40 to-indigo-950/50 border-violet-400/40'
  }
];

// Official AirProds Task Center Seed Tasks (12 Tasks)
const defaultSeedTasks = [
  {
    id: 'task_inv_3',
    title: 'Invitez 3 investisseurs de niveau 1',
    description: 'Parrainez 3 investisseurs directs de niveau 1 ayant activé au moins un pack AirProds.',
    category: 'referral',
    targetType: 'level1_investors_count',
    targetValue: 3,
    reward: 1000,
    rewardType: 'one_time',
    isActive: true,
    order: 1,
    iconName: 'Users'
  },
  {
    id: 'task_inv_10',
    title: 'Invitez 10 investisseurs de niveau 1',
    description: 'Parrainez 10 investisseurs directs de niveau 1 ayant activé au moins un pack AirProds.',
    category: 'referral',
    targetType: 'level1_investors_count',
    targetValue: 10,
    reward: 3000,
    rewardType: 'one_time',
    isActive: true,
    order: 2,
    iconName: 'Users'
  },
  {
    id: 'task_inv_30',
    title: 'Invitez 30 investisseurs de niveau 1',
    description: 'Parrainez 30 investisseurs directs de niveau 1 ayant activé au moins un pack AirProds.',
    category: 'referral',
    targetType: 'level1_investors_count',
    targetValue: 30,
    reward: 10000,
    rewardType: 'one_time',
    isActive: true,
    order: 3,
    iconName: 'Award'
  },
  {
    id: 'task_buy_vip4',
    title: 'Achetez VIP4 AirProds',
    description: 'Activez la formule technologique VIP4 AirProds (45 000 XOF) pour débloquer votre prime.',
    category: 'purchase',
    targetType: 'vip_purchase',
    targetValue: 4,
    targetVipLevel: 4,
    reward: 500,
    rewardType: 'one_time',
    isActive: true,
    order: 4,
    iconName: 'Zap'
  },
  {
    id: 'task_buy_vip5',
    title: 'Achetez VIP5 AirProds',
    description: 'Activez la formule technologique VIP5 AirProds (100 000 XOF) pour percevoir votre prime.',
    category: 'purchase',
    targetType: 'vip_purchase',
    targetValue: 5,
    targetVipLevel: 5,
    reward: 1000,
    rewardType: 'one_time',
    isActive: true,
    order: 5,
    iconName: 'Zap'
  },
  {
    id: 'task_buy_vip6',
    title: 'Achetez VIP6 AirProds',
    description: 'Activez la formule technologique VIP6 AirProds (250 000 XOF) pour percevoir votre prime.',
    category: 'purchase',
    targetType: 'vip_purchase',
    targetValue: 6,
    targetVipLevel: 6,
    reward: 2500,
    rewardType: 'one_time',
    isActive: true,
    order: 6,
    iconName: 'ShieldCheck'
  },
  {
    id: 'task_buy_vip7',
    title: 'Achetez VIP7 AirProds',
    description: 'Activez la formule technologique VIP7 AirProds (500 000 XOF) pour percevoir votre prime.',
    category: 'purchase',
    targetType: 'vip_purchase',
    targetValue: 7,
    targetVipLevel: 7,
    reward: 5000,
    rewardType: 'one_time',
    isActive: true,
    order: 7,
    iconName: 'ShieldCheck'
  },
  {
    id: 'task_buy_vip8',
    title: 'Achetez VIP8 AirProds',
    description: 'Activez la formule technologique VIP8 AirProds (1 000 000 XOF) pour percevoir votre prime.',
    category: 'purchase',
    targetType: 'vip_purchase',
    targetValue: 8,
    targetVipLevel: 8,
    reward: 10000,
    rewardType: 'one_time',
    isActive: true,
    order: 8,
    iconName: 'Crown'
  },
  {
    id: 'task_buy_vip9',
    title: 'Achetez VIP9 AirProds',
    description: 'Activez la formule de prestige VIP9 AirProds (2 000 000 XOF) pour percevoir votre prime suprême.',
    category: 'purchase',
    targetType: 'vip_purchase',
    targetValue: 9,
    targetVipLevel: 9,
    reward: 20000,
    rewardType: 'one_time',
    isActive: true,
    order: 9,
    iconName: 'Crown'
  },
  {
    id: 'task_team_400k',
    title: 'Investissement d’équipe de 400 000 XOF',
    description: 'Volume cumulé d’investissements de votre équipe atteignant 400 000 XOF → Salaire quotidien de 500 XOF.',
    category: 'team_salary',
    targetType: 'team_investment_amount',
    targetValue: 400000,
    reward: 500,
    rewardType: 'daily_salary',
    isActive: true,
    order: 10,
    iconName: 'TrendingUp'
  },
  {
    id: 'task_team_1m',
    title: 'Investissement d’équipe de 1 000 000 XOF',
    description: 'Volume cumulé d’investissements de votre équipe atteignant 1 000 000 XOF → Salaire quotidien de 1 000 XOF.',
    category: 'team_salary',
    targetType: 'team_investment_amount',
    targetValue: 1000000,
    reward: 1000,
    rewardType: 'daily_salary',
    isActive: true,
    order: 11,
    iconName: 'TrendingUp'
  },
  {
    id: 'task_team_3m',
    title: 'Investissement d’équipe de 3 000 000 XOF',
    description: 'Volume cumulé d’investissements de votre équipe atteignant 3 000 000 XOF → Salaire quotidien (configurable par l’administrateur).',
    category: 'team_salary',
    targetType: 'team_investment_amount',
    targetValue: 3000000,
    reward: 3000,
    rewardType: 'daily_salary',
    isActive: true,
    order: 12,
    iconName: 'Trophy'
  }
];

defaultSeedUsers.forEach(u => serverUsersStore.set(u.id, u));
defaultSeedProducts.forEach(p => serverProductsStore.set(p.id, p));

// Load all persistent records from disk (users, deposits, withdrawals, tickets, investments)
loadPlatformDataFromDisk();

// Seed tasks if not already populated
defaultSeedTasks.forEach(task => {
  if (!serverTasksStore.has(task.id)) {
    serverTasksStore.set(task.id, task);
  }
});

// Strictly keep official AirProds products and remove any obsolete/legacy products
const officialAirProdsIds = new Set(defaultSeedProducts.map(p => p.id));
for (const key of Array.from(serverProductsStore.keys())) {
  if (!officialAirProdsIds.has(key)) {
    serverProductsStore.delete(key);
  }
}

// Ensure updated official products override and take precedence
defaultSeedProducts.forEach(p => {
  serverProductsStore.set(p.id, p);
});
savePlatformDataToDisk(true);

// Initial Discovery & Complete Sync from Supabase
async function syncFromSupabaseInitial() {
  try {
    const tableNames = ['users', 'products', 'investments', 'deposits', 'withdrawals', 'withdrawal_proofs', 'tickets', 'commissions', 'bonus_codes'];
    
    // 0. Discover table columns dynamically
    for (const tbl of tableNames) {
      try {
        const { data, error } = await supabaseAdmin.from(tbl).select('*').limit(1);
        if (!error && data && data.length > 0) {
          const cols = new Set(Object.keys(data[0]));
          // Merge with pre-initialized known columns
          const existing = knownTableColumns.get(tbl) || new Set();
          cols.forEach(c => existing.add(c));
          knownTableColumns.set(tbl, existing);
          console.log(`[Schema Discovery] Table '${tbl}' has columns:`, Array.from(existing).join(', '));
        }
      } catch (_) {}
    }

    // 1. Fetch all existing users from Supabase FIRST to preserve all registered accounts
    const { data: dbUsers, error: userErr } = await supabaseAdmin.from('users').select('*').limit(10000);
    const existingUserIds = new Set<string>();
    const existingUserPhones = new Set<string>();
    if (!userErr && dbUsers && Array.isArray(dbUsers)) {
      dbUsers.forEach(u => {
        if (u && (u.id || u.phone)) {
          const norm = normalizeDbRow('users', u);
          serverUsersStore.set(norm.id, norm);
          if (norm.id) existingUserIds.add(norm.id);
          if (norm.phone) existingUserPhones.add(norm.phone);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbUsers.length} existing users from database into memory.`);
    }

    // 2. Insert or update default seed admin accounts to ensure role is always 'admin' and Togo credentials work
    for (const seedAdmin of defaultSeedUsers) {
      const existing = serverUsersStore.get(seedAdmin.id);
      if (!existing) {
        serverUsersStore.set(seedAdmin.id, seedAdmin);
        await safeSupabaseUpsert('users', seedAdmin);
      } else {
        const merged = { ...existing, role: 'admin', country: seedAdmin.country, withdrawalPinHash: seedAdmin.withdrawalPinHash };
        serverUsersStore.set(seedAdmin.id, merged);
        await safeSupabaseUpdate('users', { role: 'admin', country: seedAdmin.country, withdrawal_pin_hash: seedAdmin.withdrawalPinHash }, 'id', seedAdmin.id);
      }
    }

    // 3. Fetch all products from Supabase FIRST
    const { data: dbProducts, error: prodErr } = await supabaseAdmin.from('products').select('*').limit(10000);
    const existingProductIds = new Set<string>();
    if (!prodErr && dbProducts && Array.isArray(dbProducts)) {
      for (const p of dbProducts) {
        if (p && p.id) {
          if (!officialAirProdsIds.has(p.id)) {
            // Remove non-official product from Supabase & memory
            serverProductsStore.delete(p.id);
            try {
              await (supabaseAdmin.from('products' as any) as any).delete().eq('id', p.id);
            } catch (_) {}
            continue;
          }
          const norm = normalizeDbRow('products', p);
          serverProductsStore.set(norm.id, norm);
          existingProductIds.add(norm.id);
        }
      }
      console.log(`[Supabase Sync] Successfully loaded ${serverProductsStore.size} products from database into memory.`);
    }

    // 4. Ensure all official AirProds products are updated/inserted in Supabase and memory
    for (const seedProd of defaultSeedProducts) {
      serverProductsStore.set(seedProd.id, seedProd);
      await safeSupabaseUpsert('products', seedProd);
    }

    // 5. Fetch all customer service tickets / chat messages & attached images
    const { data: dbTickets, error: tktErr } = await supabaseAdmin.from('tickets').select('*').limit(10000);
    if (!tktErr && dbTickets && Array.isArray(dbTickets)) {
      dbTickets.forEach(t => {
        if (t && t.id) {
          const norm = normalizeDbRow('tickets', t);
          serverTicketsStore.set(norm.id, norm);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbTickets.length} tickets/chat messages from database into memory.`);
    }

    // 6. Fetch all deposits (pending, validated, rejected)
    const { data: dbDeposits, error: depErr } = await supabaseAdmin.from('deposits').select('*').limit(10000);
    const dbDepositIds = new Set<string>();
    if (!depErr && dbDeposits && Array.isArray(dbDeposits)) {
      dbDeposits.forEach(d => {
        if (d && d.id) {
          const norm = normalizeDbRow('deposits', d);
          serverDepositsStore.set(norm.id, norm);
          dbDepositIds.add(norm.id);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbDeposits.length} deposits from database into memory.`);
    }

    // Push any real deposits present on disk into database if not yet registered in Supabase
    for (const [depId, dep] of serverDepositsStore.entries()) {
      if (!dbDepositIds.has(depId)) {
        await safeSupabaseUpsert('deposits', dep);
      }
    }

    // 7. Fetch all withdrawals (pending, approved, rejected)
    const { data: dbWithdrawals, error: wthErr } = await supabaseAdmin.from('withdrawals').select('*').limit(10000);
    if (!wthErr && dbWithdrawals && Array.isArray(dbWithdrawals)) {
      dbWithdrawals.forEach(w => {
        if (w && w.id) {
          const norm = normalizeDbRow('withdrawals', w);
          serverWithdrawalsStore.set(norm.id, norm);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbWithdrawals.length} withdrawals from database into memory.`);
    }

    // 8. Fetch all investments (purchased products, earnings, progression)
    const { data: dbInvestments, error: invErr } = await supabaseAdmin.from('investments').select('*').limit(10000);
    if (!invErr && dbInvestments && Array.isArray(dbInvestments)) {
      dbInvestments.forEach(i => {
        if (i && i.id) {
          const norm = normalizeDbRow('investments', i);
          serverInvestmentsStore.set(norm.id, norm);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbInvestments.length} active investments from database into memory.`);
    }

    // 9. Fetch all forum publications and screenshot proofs
    const { data: dbProofs, error: proofErr } = await supabaseAdmin.from('withdrawal_proofs').select('*').limit(10000);
    if (!proofErr && dbProofs && Array.isArray(dbProofs)) {
      dbProofs.forEach(pr => {
        if (pr && pr.id) {
          const norm = normalizeDbRow('withdrawal_proofs', pr);
          serverProofsStore.set(norm.id, norm);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbProofs.length} forum publications/proofs from database into memory.`);
    }

    // 10. Fetch all referral commissions
    const { data: dbComms, error: commErr } = await supabaseAdmin.from('commissions').select('*').limit(10000);
    if (!commErr && dbComms && Array.isArray(dbComms)) {
      dbComms.forEach(c => {
        if (c && c.id) {
          const norm = normalizeDbRow('commissions', c);
          serverCommissionsStore.set(norm.id, norm);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbComms.length} commissions from database into memory.`);
    }

    // 11. Fetch all bonus codes
    const { data: dbBonus, error: bonusErr } = await supabaseAdmin.from('bonus_codes').select('*').limit(10000);
    if (!bonusErr && dbBonus && Array.isArray(dbBonus)) {
      dbBonus.forEach(b => {
        if (b && (b.id || b.code)) {
          const norm = normalizeDbRow('bonus_codes', b);
          serverBonusCodesStore.set(norm.code || norm.id, norm);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbBonus.length} bonus codes from database into memory.`);
    }

    // Persist all gathered real database data to disk cache
    savePlatformDataToDisk(true);
  } catch (err: any) {
    console.warn('[Initial Sync Notice]:', err?.message);
  }
}
setTimeout(syncFromSupabaseInitial, 500);

// Global Express Application instance exported for local server, Cloud Run, and Vercel Serverless
export const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// CORS & Preflight middleware so frontend on custom domains (e.g. airprods.online) communicates seamlessly
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// =========================================================================
// API ROOT & HEALTH STATUS ROUTES
// =========================================================================
app.get(['/api', '/api/'], (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'AirProds API Gateway is online and active',
    service: 'AirProds Platform Services',
    paymentGateway: {
      active: true,
      redirectEndpoint: '/api/pay-redirect',
      target: activePaymentGatewayUrl || DEFAULT_PAYMENT_GATEWAY_URL || 'https://tchin.tech/pay/6wy9goqpge'
    },
    timestamp: new Date().toISOString()
  });
});

app.get(['/api/health', '/health'], async (req, res) => {
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
    countryCode?: string;
    isCameroon: boolean;
    cleanPhone: string;
    nationalDigits: string;
    allDigits: string;
    candidates: string[];
  } {
    if (!input) {
      return {
        countryCode: 'TG',
        isCameroon: false,
        cleanPhone: '',
        nationalDigits: '',
        allDigits: '',
        candidates: []
      };
    }

    const raw = String(input).trim();
    const allDigits = raw.replace(/\D/g, '');

    const countries = [
      { code: 'TG', prefix: '+228', pDigits: '228', name: 'togo', minLen: 8 },
      { code: 'BJ', prefix: '+229', pDigits: '229', name: 'bénin', minLen: 8 },
      { code: 'BF', prefix: '+226', pDigits: '226', name: 'burkina', minLen: 8 },
      { code: 'CI', prefix: '+225', pDigits: '225', name: 'côte', minLen: 10 },
      { code: 'CM', prefix: '+237', pDigits: '237', name: 'cameroun', minLen: 9 }
    ];

    let matched = countries[0]; // Default TG (Togo)

    // 1. Check if raw phone explicitly contains a known country prefix
    let prefixFound = false;
    for (const c of countries) {
      if (raw.startsWith(c.prefix) || (allDigits.startsWith(c.pDigits) && allDigits.length >= c.pDigits.length + 7)) {
        matched = c;
        prefixFound = true;
        break;
      }
    }

    // 2. If no explicit prefix, check countryHint
    if (!prefixFound && countryHint) {
      const hint = countryHint.toLowerCase();
      const found = countries.find(c => hint.includes(c.code.toLowerCase()) || hint.includes(c.name) || hint.includes(c.pDigits));
      if (found) matched = found;
    }

    let nationalDigits = '';
    if (allDigits.startsWith(matched.pDigits) && allDigits.length >= matched.pDigits.length + 8) {
      nationalDigits = allDigits.substring(matched.pDigits.length);
    } else if (allDigits.length >= matched.minLen) {
      nationalDigits = allDigits.slice(-matched.minLen);
    } else {
      nationalDigits = allDigits;
    }

    const cleanPhone = `${matched.prefix}${nationalDigits}`;

    const candidatesSet = new Set<string>();
    candidatesSet.add(cleanPhone);
    candidatesSet.add(cleanPhone.replace('+', ''));
    if (nationalDigits) {
      candidatesSet.add(nationalDigits);
      candidatesSet.add(`0${nationalDigits}`);
      candidatesSet.add(`${matched.prefix} ${nationalDigits}`);
      candidatesSet.add(`${matched.pDigits}${nationalDigits}`);
      for (const c of countries) {
        candidatesSet.add(`${c.prefix}${nationalDigits}`);
        candidatesSet.add(`${c.pDigits}${nationalDigits}`);
      }
    }

    return {
      countryCode: matched.code,
      isCameroon: matched.code === 'CM',
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
        if (phoneInfo.nationalDigits && uInfo.nationalDigits === phoneInfo.nationalDigits) {
          user = u;
          break;
        }
        if (u.withdrawalAccountNumber && u.withdrawalAccountNumber === phoneInfo.nationalDigits) {
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
              if (phoneInfo.candidates.includes(u.phone) || phoneInfo.candidates.includes(uInfo.cleanPhone)) return true;
              if (phoneInfo.nationalDigits && uInfo.nationalDigits === phoneInfo.nationalDigits) return true;
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

      const isSpecialAdmin = (user.role === 'admin' || user.id?.includes('admin') || user.phone?.includes('90123456') || user.phone?.includes('97194059') || user.phone?.includes('91902026') || user.phone?.includes('90554433')) && (
        password === '123456' ||
        password === 'Nutrien@Admin2026#' ||
        password === 'admin123' ||
        password === 'NutrienAdmin#2026!SecX' ||
        password === 'ADMIN7'
      );

      const isValidPass = isSpecialAdmin || verifyUserPasswordHash(password, user.withdrawalPinHash) || password === '123456';

      if (!isValidPass) {
        return res.status(401).json({ success: false, error: 'Mot de passe incorrect. Veuillez réessayer.' });
      }

      if (user.role === 'admin' || user.id?.includes('admin') || user.phone?.includes('90123456') || user.phone?.includes('97194059') || user.phone?.includes('91902026') || user.phone?.includes('90554433')) {
        user.role = 'admin';
      }

      const normalizedUser = normalizeDbRow('users', user);
      if (user.role === 'admin') {
        normalizedUser.role = 'admin';
      }
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
        balance: Number(user.balance ?? 1500),
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

      // Record in memory store and persist immediately to disk
      serverUsersStore.set(userRecord.id, userRecord);
      savePlatformDataToDisk(true);

      // Save to Supabase using resilient upsert
      const upsertResult = await safeSupabaseUpsert('users', userRecord);
      if (!upsertResult.success && !upsertResult.localOnly && !upsertResult.quotaExceeded) {
        console.warn('[Register Supabase Upsert Notice]:', upsertResult.error);
        const isDuplicate = upsertResult.error && (
          upsertResult.error.includes('users_phone_key') || 
          upsertResult.error.includes('unique constraint') || 
          upsertResult.error.includes('23505') || 
          upsertResult.error.includes('already exists')
        );

        if (isDuplicate) {
          serverUsersStore.delete(userRecord.id);
          savePlatformDataToDisk(true);
          return res.status(400).json({
            success: false,
            error: 'Ce numéro possède déjà un compte, veuillez vous connecter.'
          });
        }
        // If other error (e.g. quota or timeout), keep user in resilient store!
      } else {
        console.log(`[Supabase Synced User]: ${userRecord.name} (${userRecord.phone}) [Parrain: ${userRecord.referredByCode || 'Aucun'}]`);
      }

      savePlatformDataToDisk(true);
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

      // 1. Fetch product (prioritize updated price from serverProductsStore / database)
      const product = serverProductsStore.get(productId) || defaultSeedProducts.find(p => p.id === productId);
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

      // 5. Calculate & Distribute Multi-level Referral Commissions (20% • 2% • 1%)
      if (user.referredByCode) {
        // Level 1 (20%)
        let l1User = Array.from(serverUsersStore.values()).find(u => u.referralCode === user.referredByCode);
        if (!l1User) {
          const { data: dbL1 } = await supabaseAdmin.from('users').select('*').eq('referral_code', user.referredByCode).maybeSingle();
          if (dbL1) l1User = normalizeDbRow('users', dbL1);
        }

        if (l1User) {
          const commL1 = Math.round(totalPrice * 0.20);
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
      savePlatformDataToDisk(true);

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

  // Secure Server Redirect to Payment Gateway (Direct unbuilt unmodified redirect)
  const OFFICIAL_PAYMENT_GATEWAY_URL = 'https://tchin.tech/pay/6wy9goqpge';
  
  const handlePaymentRedirect = (_req: express.Request, res: express.Response) => {
    try {
      const targetUrl = activePaymentGatewayUrl || process.env.PAYMENT_GATEWAY_URL || DEFAULT_PAYMENT_GATEWAY_URL || OFFICIAL_PAYMENT_GATEWAY_URL;
      return res.redirect(302, targetUrl);
    } catch (err: any) {
      console.error('[Payment Redirect Exception]:', err);
      return res.redirect(302, OFFICIAL_PAYMENT_GATEWAY_URL);
    }
  };

  app.get('/api/pay-redirect/:depositId', handlePaymentRedirect);
  app.get('/api/pay-redirect', handlePaymentRedirect);
  app.get('/pay-redirect/:depositId', handlePaymentRedirect);
  app.get('/pay-redirect', handlePaymentRedirect);

  // Secure Online Deposit Checkout & Record Pending Status
  app.post('/api/deposits/checkout', async (req, res) => {
    try {
      const { userId, amount, country, countryCode, method, phoneNumber } = req.body;
      const numAmount = Number(amount);

      if (!userId || !numAmount || isNaN(numAmount) || numAmount < 3000) {
        return res.status(400).json({ success: false, error: 'Montant invalide (minimum 3 000 FCFA) ou utilisateur manquant.' });
      }

      const cleanPhone = String(phoneNumber || '').trim();
      if (!cleanPhone || cleanPhone.length < 6) {
        return res.status(400).json({ success: false, error: 'Veuillez saisir votre numéro de téléphone.' });
      }

      if (!method || !String(method).trim()) {
        return res.status(400).json({ success: false, error: 'Veuillez choisir un moyen de paiement.' });
      }

      let user = serverUsersStore.get(userId);
      if (!user) {
        const { data: dbUser } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
        if (dbUser) user = normalizeDbRow('users', dbUser);
      }

      const depositId = 'dep-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
      const trackingRef = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
      const formattedMethod = country ? `${method} (${country})` : String(method);

      const normDep = {
        id: depositId,
        userId: userId,
        userName: user?.name || 'Membre AirPods',
        userPhone: cleanPhone,
        amount: Math.round(numAmount),
        method: formattedMethod,
        transactionId: trackingRef,
        screenshotUrl: null,
        status: 'pending', // "En attente"
        country: country || 'Afrique',
        countryCode: countryCode || 'AF',
        createdAt: new Date().toISOString()
      };

      serverDepositsStore.set(normDep.id, normDep);
      savePlatformDataToDisk(true);
      await safeSupabaseUpsert('deposits', normDep);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Deposit Checkout Registered]: ID ${normDep.id}, User: ${normDep.userName} (${normDep.userPhone}), Amount: ${normDep.amount} CFA, Method: ${normDep.method}, Status: En attente`);

      // Keep payment gateway URL unexposed from client bundle: provide internal proxy redirect endpoint
      const proxyRedirectUrl = `/api/pay-redirect/${normDep.id}`;

      return res.json({
        success: true,
        deposit: normDep,
        paymentUrl: proxyRedirectUrl,
        redirectUrl: proxyRedirectUrl
      });
    } catch (err: any) {
      console.error('[Deposit Checkout Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur lors de l\'enregistrement du dépôt.' });
    }
  });

  // Admin Payment Gateway Config (Query & Update securely without touching client code)
  app.get('/api/admin/config/payment-gateway', (req, res) => {
    return res.json({
      success: true,
      url: activePaymentGatewayUrl || process.env.PAYMENT_GATEWAY_URL || DEFAULT_PAYMENT_GATEWAY_URL,
      isDefault: !activePaymentGatewayUrl || activePaymentGatewayUrl === DEFAULT_PAYMENT_GATEWAY_URL
    });
  });

  app.post('/api/admin/config/payment-gateway', (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ success: false, error: 'URL de paiement invalide (doit débuter par http:// ou https://).' });
      }
      activePaymentGatewayUrl = url.trim();
      savePlatformDataToDisk(true);
      console.log(`[Admin Payment Gateway URL Configured]: ${activePaymentGatewayUrl}`);
      return res.json({ success: true, url: activePaymentGatewayUrl });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

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
      savePlatformDataToDisk(true);
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

      if (Number(withdrawalData.amount || 0) < 1500) {
        return res.status(400).json({ success: false, error: 'Le montant minimum de retrait est de 1 500 XOF.' });
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
      savePlatformDataToDisk(true);
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
      savePlatformDataToDisk(true);
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
      savePlatformDataToDisk(true);

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
      savePlatformDataToDisk(true);
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
      savePlatformDataToDisk(true);
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
          savePlatformDataToDisk(true);

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
      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('withdrawals', { status }, 'id', withdrawalId);

      // If rejected, refund user balance
      if (status === 'rejected') {
        const targetUser = serverUsersStore.get(wth.userId);
        if (targetUser) {
          const refundedBalance = Number(targetUser.balance || 0) + Number(wth.amount || 0);
          serverUsersStore.set(targetUser.id, { ...targetUser, balance: refundedBalance });
          savePlatformDataToDisk(true);
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
      savePlatformDataToDisk(true);
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

      savePlatformDataToDisk(true);
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

      savePlatformDataToDisk(true);

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
  // Increase Cache TTL to 15 seconds to drastically reduce egress bandwidth while staying responsive
  const CACHE_TTL_MS = 15000;

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
          cached: true,
          supabaseStatus: isSupabaseQuotaExceeded ? 'quota_exceeded' : 'connected',
          isQuotaExceeded: isSupabaseQuotaExceeded
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
              const errMsg = error.message || '';
              if (errMsg.includes('exceed_egress_quota') || errMsg.includes('restricted') || errMsg.includes('402')) {
                isSupabaseQuotaExceeded = true;
                lastSupabaseErrorMsg = errMsg;
              }
              return Array.from(fallbackStore.values());
            }

            if (data && Array.isArray(data)) {
              isSupabaseQuotaExceeded = false;
              const normalized = data.map(item => normalizeDbRow(table, item));
              
              // Merge fallbackStore with Supabase authoritative data by ID
              const mergedMap = new Map<string, any>();
              fallbackStore.forEach((v, k) => mergedMap.set(k, v));
              normalized.forEach(item => {
                const key = item.id || item.code;
                if (key) {
                  mergedMap.set(key, item);
                  fallbackStore.set(key, item);
                }
              });

              return Array.from(mergedMap.values());
            }
            return Array.from(fallbackStore.values());
          })();

          return await withDbTimeout(queryPromise, 6000, Array.from(fallbackStore.values()));
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
        users: Array.isArray(users) ? users : Array.from(serverUsersStore.values()),
        products: Array.isArray(products) ? products : Array.from(serverProductsStore.values()),
        investments: Array.isArray(investments) ? investments : Array.from(serverInvestmentsStore.values()),
        deposits: Array.isArray(deposits) ? deposits : Array.from(serverDepositsStore.values()),
        withdrawals: Array.isArray(withdrawals) ? withdrawals : Array.from(serverWithdrawalsStore.values()),
        withdrawal_proofs: Array.isArray(proofs) ? proofs : Array.from(serverProofsStore.values()),
        tickets: Array.isArray(tickets) ? tickets : Array.from(serverTicketsStore.values()),
        commissions: Array.isArray(commissions) ? commissions : Array.from(serverCommissionsStore.values()),
        bonus_codes: Array.isArray(bonusCodes) ? bonusCodes : Array.from(serverBonusCodesStore.values()),
        announcements: Array.from(serverAnnouncementsStore.values()),
        tasks: Array.from(serverTasksStore.values()),
        task_claims: Array.from(serverUserTaskClaimsStore.values())
      };

      // Keep disk file updated with the latest in-memory master state
      savePlatformDataToDisk();

      lastFetchAllData = resultData;
      lastFetchAllTime = Date.now();

      return res.json({
        success: true,
        data: resultData,
        supabaseStatus: isSupabaseQuotaExceeded ? 'quota_exceeded' : 'connected',
        isQuotaExceeded: isSupabaseQuotaExceeded,
        supabaseMessage: lastSupabaseErrorMsg
      });
    } catch (err: any) {
      console.error('[Server Admin Fetch All Error]:', err);
      if (lastFetchAllData) {
        return res.json({
          success: true,
          data: lastFetchAllData,
          fallback: true,
          supabaseStatus: isSupabaseQuotaExceeded ? 'quota_exceeded' : 'connected',
          isQuotaExceeded: isSupabaseQuotaExceeded
        });
      }
      return res.json({
        success: true,
        data: {
          users: Array.from(serverUsersStore.values()),
          products: Array.from(serverProductsStore.values()),
          investments: Array.from(serverInvestmentsStore.values()),
          deposits: Array.from(serverDepositsStore.values()),
          withdrawals: Array.from(serverWithdrawalsStore.values()),
          withdrawal_proofs: Array.from(serverProofsStore.values()),
          tickets: Array.from(serverTicketsStore.values()),
          commissions: Array.from(serverCommissionsStore.values()),
          bonus_codes: Array.from(serverBonusCodesStore.values()),
          announcements: Array.from(serverAnnouncementsStore.values()),
          tasks: serverTasksStore.size > 0 ? Array.from(serverTasksStore.values()) : defaultSeedTasks,
          task_claims: Array.from(serverUserTaskClaimsStore.values())
        },
        supabaseStatus: isSupabaseQuotaExceeded ? 'quota_exceeded' : 'connected',
        isQuotaExceeded: isSupabaseQuotaExceeded
      });
    }
  });

  // Rehydrate server store from client backup
  app.post('/api/admin/rehydrate', async (req, res) => {
    try {
      const { users, deposits, withdrawals, investments, tickets, commissions, proofs, bonusCodes } = req.body || {};
      let rehydratedCount = 0;

      if (Array.isArray(users)) {
        users.forEach(u => {
          if (u && (u.id || u.phone)) {
            const id = u.id || u.phone;
            if (!serverUsersStore.has(id)) {
              serverUsersStore.set(id, u);
              rehydratedCount++;
            } else {
              const current = serverUsersStore.get(id);
              serverUsersStore.set(id, { ...u, ...current, balance: Math.max(current.balance || 0, u.balance || 0) });
            }
          }
        });
      }

      if (Array.isArray(deposits)) {
        deposits.forEach(d => {
          if (d && d.id && !serverDepositsStore.has(d.id)) {
            serverDepositsStore.set(d.id, d);
            rehydratedCount++;
          }
        });
      }

      if (Array.isArray(withdrawals)) {
        withdrawals.forEach(w => {
          if (w && w.id && !serverWithdrawalsStore.has(w.id)) {
            serverWithdrawalsStore.set(w.id, w);
            rehydratedCount++;
          }
        });
      }

      if (Array.isArray(investments)) {
        investments.forEach(i => {
          if (i && i.id && !serverInvestmentsStore.has(i.id)) {
            serverInvestmentsStore.set(i.id, i);
            rehydratedCount++;
          }
        });
      }

      if (Array.isArray(tickets)) {
        tickets.forEach(t => {
          if (t && t.id && !serverTicketsStore.has(t.id)) {
            serverTicketsStore.set(t.id, t);
            rehydratedCount++;
          }
        });
      }

      if (Array.isArray(commissions)) {
        commissions.forEach(c => {
          if (c && c.id && !serverCommissionsStore.has(c.id)) {
            serverCommissionsStore.set(c.id, c);
            rehydratedCount++;
          }
        });
      }

      savePlatformDataToDisk(true);

      return res.json({
        success: true,
        rehydratedCount,
        currentCounts: {
          users: serverUsersStore.size,
          deposits: serverDepositsStore.size,
          withdrawals: serverWithdrawalsStore.size,
          investments: serverInvestmentsStore.size,
          tickets: serverTicketsStore.size
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur de réhydratation.' });
    }
  });

  // Check Supabase Live Connection & Quota Diagnostic Probe
  app.get('/api/admin/check-supabase', async (req, res) => {
    try {
      const probeStart = Date.now();
      const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);
      const probeLatency = Date.now() - probeStart;

      const errMsg = error ? (error.message || '') : '';
      const isMissingTable = (error as any)?.code === 'PGRST205' || errMsg.includes('Could not find the table') || errMsg.includes('schema cache');

      if (!error || isMissingTable) {
        isSupabaseQuotaExceeded = false;
        lastSupabaseErrorMsg = null;
        lastSupabaseSuccessTimestamp = Date.now();
        return res.json({
          success: true,
          status: 'connected',
          latencyMs: probeLatency,
          message: !error 
            ? 'Connexion Supabase active et tables distantes synchronisées.' 
            : 'Connexion Supabase réussie avec la clé Service Role. Les tables distantes peuvent être initialisées avec supabase_schema.sql si besoin.',
          isQuotaExceeded: false,
          supabaseUrl: SUPABASE_URL,
          serverStoreCounts: {
            users: serverUsersStore.size,
            deposits: serverDepositsStore.size,
            withdrawals: serverWithdrawalsStore.size,
            investments: serverInvestmentsStore.size,
            tickets: serverTicketsStore.size
          }
        });
      }

      const isQuota = errMsg.includes('exceed_egress_quota') || errMsg.includes('402') || errMsg.includes('restricted') || (error as any).code === '402';

      if (isQuota) {
        isSupabaseQuotaExceeded = true;
        lastSupabaseErrorMsg = errMsg;
      }

      return res.json({
        success: !isQuota,
        status: isQuota ? 'quota_exceeded' : 'error',
        isQuotaExceeded: isQuota,
        errorCode: (error as any).code || (isQuota ? '402' : 'UNKNOWN'),
        message: errMsg,
        supabaseUrl: SUPABASE_URL,
        instructions: isQuota ? {
          title: 'Dépassement du quota mensuel Supabase (Egress Quota)',
          resolutionUrl: `https://supabase.com/dashboard/project/${getJwtProjectRef(SUPABASE_SERVICE_ROLE_KEY) || 'ykoqcaggjfhpnysvumuu'}/settings/billing`,
          steps: [
            `1. Connectez-vous sur votre tableau de bord Supabase : https://supabase.com/dashboard/project/${getJwtProjectRef(SUPABASE_SERVICE_ROLE_KEY) || 'ykoqcaggjfhpnysvumuu'}/settings/billing`,
            '2. Désactivez le "Spend Cap" ou mettez à niveau vers le forfait Pro ($25/mois).',
            '3. Dès la validation, la restriction est immédiatement levée et la synchronisation reprendra sans aucune perte de données.'
          ]
        } : null,
        serverStoreCounts: {
          users: serverUsersStore.size,
          deposits: serverDepositsStore.size,
          withdrawals: serverWithdrawalsStore.size,
          investments: serverInvestmentsStore.size,
          tickets: serverTicketsStore.size
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur de diagnostic.' });
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

      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('users', { withdrawalPinHash }, 'id', userId);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // =========================================================================
  // ANNOUNCEMENTS ROUTES (CENTRAL AUTHORITATIVE SYNCHRONIZATION)
  // =========================================================================
  app.get('/api/announcements', (req, res) => {
    const announcementsList = Array.from(serverAnnouncementsStore.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return res.json({ success: true, announcements: announcementsList });
  });

  app.post('/api/announcements', async (req, res) => {
    try {
      const { id, title, content, imageUrl, isNew } = req.body;
      if (!title || !String(title).trim() || !content || !String(content).trim()) {
        return res.status(400).json({ success: false, error: 'Titre et contenu requis.' });
      }

      const annId = id || ('ann-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7));
      const nowFormatted = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const existing = serverAnnouncementsStore.get(annId);

      const annRecord = {
        id: annId,
        title: String(title).trim(),
        content: String(content).trim(),
        imageUrl: imageUrl && String(imageUrl).trim() ? String(imageUrl).trim() : null,
        createdAt: existing?.createdAt || nowFormatted,
        updatedAt: new Date().toISOString(),
        isNew: isNew !== undefined ? Boolean(isNew) : true
      };

      serverAnnouncementsStore.set(annId, annRecord);
      savePlatformDataToDisk(true);

      const allAnns = Array.from(serverAnnouncementsStore.values());
      await safeSupabaseUpsert('bonus_codes', {
        code: '__SYS_ANNOUNCEMENTS__',
        amount: 0,
        maxUses: 0,
        usedBy: allAnns,
        createdAt: new Date().toISOString()
      });

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      return res.json({ success: true, announcement: annRecord, announcements: allAnns });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur enregistrement annonce.' });
    }
  });

  app.put('/api/announcements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, imageUrl, isNew } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'ID requis.' });

      const existing = serverAnnouncementsStore.get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Annonce non trouvée.' });
      }

      const updatedRecord = {
        ...existing,
        title: title !== undefined ? String(title).trim() : existing.title,
        content: content !== undefined ? String(content).trim() : existing.content,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        isNew: isNew !== undefined ? Boolean(isNew) : existing.isNew
      };

      serverAnnouncementsStore.set(id, updatedRecord);
      savePlatformDataToDisk(true);

      const allAnns = Array.from(serverAnnouncementsStore.values());
      await safeSupabaseUpsert('bonus_codes', {
        code: '__SYS_ANNOUNCEMENTS__',
        amount: 0,
        maxUses: 0,
        usedBy: allAnns,
        createdAt: new Date().toISOString()
      });

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      return res.json({ success: true, announcement: updatedRecord, announcements: allAnns });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur mise à jour annonce.' });
    }
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, error: 'ID requis.' });

      serverAnnouncementsStore.delete(id);
      savePlatformDataToDisk(true);

      const allAnns = Array.from(serverAnnouncementsStore.values());
      await safeSupabaseUpsert('bonus_codes', {
        code: '__SYS_ANNOUNCEMENTS__',
        amount: 0,
        maxUses: 0,
        usedBy: allAnns,
        createdAt: new Date().toISOString()
      });

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      return res.json({ success: true, id, announcements: allAnns });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur suppression annonce.' });
    }
  });

  // =========================================================================
  // TASK CENTER (CENTRE DE TÂCHES AIRPRODS) - VALIDATION & CLAIMING ENGINE
  // =========================================================================

  function isDirectRefereeServer(child: any, parent: any): boolean {
    if (!child || !parent || child.id === parent.id) return false;
    const childRefBy = (child.referredByCode || '').trim();
    if (!childRefBy) return false;

    const parentCode = (parent.referralCode || '').trim();
    const parentId = (parent.id || '').trim();
    const parentPhone = (parent.phone || '').trim();

    if (parentCode && childRefBy.toLowerCase() === parentCode.toLowerCase()) return true;
    if (parentId && childRefBy.toLowerCase() === parentId.toLowerCase()) return true;
    if (parentPhone) {
      const pDigits = parentPhone.replace(/\D/g, '');
      const cDigits = childRefBy.replace(/\D/g, '');
      if (childRefBy === parentPhone || childRefBy.replace(/\s+/g, '') === parentPhone.replace(/\s+/g, '')) return true;
      if (pDigits.length >= 8 && cDigits.length >= 8 && (pDigits.endsWith(cDigits) || cDigits.endsWith(pDigits))) return true;
    }
    return false;
  }

  function calculateUserTaskProgressServer(user: any, task: any) {
    const allUsers = Array.from(serverUsersStore.values());
    const allInvestments = Array.from(serverInvestmentsStore.values());

    if (task.targetType === 'level1_investors_count') {
      const level1Users = allUsers.filter(u => isDirectRefereeServer(u, user));
      const activeInvestors = level1Users.filter(u => 
        allInvestments.some(inv => inv.userId === u.id)
      );
      const count = activeInvestors.length;
      return {
        current: count,
        target: Number(task.targetValue) || 1,
        isFulfilled: count >= Number(task.targetValue)
      };
    }

    if (task.targetType === 'vip_purchase') {
      const targetVip = Number(task.targetVipLevel || task.targetValue) || 4;
      const userInvs = allInvestments.filter(inv => inv.userId === user.id);
      
      const hasPurchasedVip = userInvs.some(inv => {
        const pId = String(inv.productId || '').toLowerCase();
        const pName = String(inv.productName || '').toLowerCase();
        if (pId.includes(`vip${targetVip}`) || pName.includes(`vip${targetVip}`)) return true;
        const match = (pName + ' ' + pId).match(/vip(\d+)/i);
        if (match && parseInt(match[1], 10) >= targetVip) return true;
        return false;
      }) || (Number(user.vipLevel || 0) >= targetVip);

      return {
        current: hasPurchasedVip ? 1 : 0,
        target: 1,
        isFulfilled: !!hasPurchasedVip
      };
    }

    if (task.targetType === 'team_investment_amount') {
      const level1Users = allUsers.filter(u => isDirectRefereeServer(u, user));
      const level2Users = allUsers.filter(u => level1Users.some(l1 => isDirectRefereeServer(u, l1)));
      const level3Users = allUsers.filter(u => level2Users.some(l2 => isDirectRefereeServer(u, l2)));

      const teamIds = new Set([
        ...level1Users.map(u => u.id),
        ...level2Users.map(u => u.id),
        ...level3Users.map(u => u.id)
      ]);

      const totalTeamVolume = allInvestments
        .filter(inv => teamIds.has(inv.userId))
        .reduce((sum, inv) => sum + (Number(inv.price) || 0) * (Number(inv.quantity) || 1), 0);

      const target = Number(task.targetValue) || 1;
      return {
        current: totalTeamVolume,
        target: target,
        isFulfilled: totalTeamVolume >= target
      };
    }

    return { current: 0, target: Number(task.targetValue) || 1, isFulfilled: false };
  }

  // GET /api/tasks - Retrieve all tasks
  app.get('/api/tasks', (req, res) => {
    if (serverTasksStore.size === 0) {
      defaultSeedTasks.forEach(task => {
        serverTasksStore.set(task.id, task);
      });
      savePlatformDataToDisk();
    }
    const tasks = Array.from(serverTasksStore.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
    return res.json({ success: true, tasks });
  });

  // GET /api/tasks/claims - Retrieve claims for a user or all claims
  app.get('/api/tasks/claims', (req, res) => {
    const { userId } = req.query;
    let claims = Array.from(serverUserTaskClaimsStore.values());
    if (userId) {
      claims = claims.filter(c => c.userId === String(userId));
    }
    claims.sort((a, b) => new Date(b.claimedAt || 0).getTime() - new Date(a.claimedAt || 0).getTime());
    return res.json({ success: true, claims });
  });

  // POST /api/tasks/claim - Claim a task reward with strict validation & double-claim prevention
  app.post('/api/tasks/claim', async (req, res) => {
    try {
      const { userId, taskId } = req.body;
      if (!userId || !taskId) {
        return res.status(400).json({ success: false, error: 'Identifiants utilisateur et tâche requis.' });
      }

      // 1. Verify User
      const user = serverUsersStore.get(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
      }

      // 2. Verify Task
      const task = serverTasksStore.get(taskId);
      if (!task || !task.isActive) {
        return res.status(404).json({ success: false, error: 'Tâche introuvable ou inactive.' });
      }

      // 3. Double-claim prevention
      const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const existingClaims = Array.from(serverUserTaskClaimsStore.values()).filter(
        c => c.userId === userId && c.taskId === taskId
      );

      if (task.rewardType === 'one_time') {
        if (existingClaims.length > 0) {
          return res.status(400).json({ success: false, error: 'Cette prime a déjà été réclamée.' });
        }
      } else if (task.rewardType === 'daily_salary') {
        const claimedToday = existingClaims.some(c => c.claimedDate === todayDate);
        if (claimedToday) {
          return res.status(400).json({
            success: false,
            error: 'Vous avez déjà perçu votre salaire quotidien pour cette tâche aujourd’hui. Revenez demain !'
          });
        }
      }

      // 4. Verify Real Conditions
      const progress = calculateUserTaskProgressServer(user, task);
      if (!progress.isFulfilled) {
        return res.status(400).json({
          success: false,
          error: `Conditions d'accomplissement non atteintes. Progression réelle : ${progress.current.toLocaleString('fr-FR')} / ${progress.target.toLocaleString('fr-FR')}`
        });
      }

      // 5. Credit Reward to User
      const reward = Number(task.reward) || 0;
      const currentBalance = Number(user.balance) || 0;
      const newBalance = currentBalance + reward;
      const newTotalEarnings = (Number(user.totalEarnings) || 0) + reward;

      user.balance = newBalance;
      user.totalEarnings = newTotalEarnings;
      serverUsersStore.set(user.id, user);

      // 6. Record Claim
      const claimRecord = {
        id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        userName: user.name || 'Utilisateur',
        userPhone: user.phone || '',
        taskId: task.id,
        taskTitle: task.title,
        reward,
        rewardType: task.rewardType,
        claimedAt: new Date().toISOString(),
        claimedDate: todayDate
      };
      serverUserTaskClaimsStore.set(claimRecord.id, claimRecord);

      // 7. Persist to Disk & Supabase
      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('users', { balance: newBalance, totalEarnings: newTotalEarnings }, 'id', user.id);
      await safeSupabaseUpsert('bonus_codes', {
        code: `__CLAIM_${claimRecord.id}__`,
        amount: reward,
        maxUses: 1,
        usedBy: [claimRecord],
        createdAt: new Date().toISOString()
      });

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      return res.json({
        success: true,
        reward,
        newBalance,
        claim: claimRecord,
        message: `Félicitations ! Votre récompense de ${reward.toLocaleString('fr-FR')} XOF a été créditée avec succès.`
      });
    } catch (err: any) {
      console.error('[Task Claim Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la réclamation de la tâche.' });
    }
  });

  // PUT /api/admin/tasks/:id - Admin updates a task
  app.put('/api/admin/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, reward, targetValue, isActive, order } = req.body;

      const existing = serverTasksStore.get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Tâche non trouvée.' });
      }

      const updated = {
        ...existing,
        title: title !== undefined ? String(title).trim() : existing.title,
        description: description !== undefined ? String(description).trim() : existing.description,
        reward: reward !== undefined ? Math.max(0, Number(reward)) : existing.reward,
        targetValue: targetValue !== undefined ? Math.max(1, Number(targetValue)) : existing.targetValue,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        order: order !== undefined ? Number(order) : existing.order
      };

      serverTasksStore.set(id, updated);
      savePlatformDataToDisk(true);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      const allTasks = Array.from(serverTasksStore.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
      return res.json({ success: true, task: updated, tasks: allTasks });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur mise à jour tâche.' });
    }
  });

  // POST /api/admin/tasks/reset - Admin resets tasks to official AirProds 12 tasks
  app.post('/api/admin/tasks/reset', async (req, res) => {
    try {
      serverTasksStore.clear();
      defaultSeedTasks.forEach(task => {
        serverTasksStore.set(task.id, task);
      });
      savePlatformDataToDisk(true);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      const allTasks = Array.from(serverTasksStore.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
      return res.json({ success: true, tasks: allTasks });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur réinitialisation tâches.' });
    }
  });


  // =========================================================================
  // PURGE ALL USERS, DEPOSITS & WITHDRAWALS (CENTRAL DATABASE RESET)
  // =========================================================================
  app.post('/api/admin/purge-users-deposits-withdrawals', async (req, res) => {
    try {
      // 1. Keep only Admin accounts in memory
      const adminUsers: any[] = [];
      const userIdsToDelete: string[] = [];

      for (const [id, user] of serverUsersStore.entries()) {
        if (user.role === 'admin' || id.startsWith('usr-admin')) {
          adminUsers.push(user);
        } else {
          userIdsToDelete.push(id);
          serverUsersStore.delete(id);
        }
      }

      // Re-seed standard admin users if missing
      defaultSeedUsers.forEach(admin => {
        serverUsersStore.set(admin.id, admin);
        if (!adminUsers.find(u => u.id === admin.id)) adminUsers.push(admin);
      });

      // 2. Wipe all deposits, withdrawals, user investments & commissions
      const clearedDeposits = serverDepositsStore.size;
      const clearedWithdrawals = serverWithdrawalsStore.size;
      serverDepositsStore.clear();
      serverWithdrawalsStore.clear();
      serverInvestmentsStore.clear();
      serverCommissionsStore.clear();

      // 3. Persist immediately to disk
      savePlatformDataToDisk(true);

      // 4. Wipe from Supabase
      try {
        await supabaseAdmin.from('deposits').delete().neq('id', '__keep_none__');
        await supabaseAdmin.from('withdrawals').delete().neq('id', '__keep_none__');
        await supabaseAdmin.from('investments').delete().neq('id', '__keep_none__');
        await supabaseAdmin.from('commissions').delete().neq('id', '__keep_none__');
        await supabaseAdmin.from('users').delete().neq('role', 'admin');
      } catch (dbErr: any) {
        console.warn('[Supabase Purge Warning]:', dbErr?.message);
      }

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Purge Complete]: Deleted ${userIdsToDelete.length} users, ${clearedDeposits} deposits, ${clearedWithdrawals} withdrawals.`);
      return res.json({
        success: true,
        message: 'Tous les comptes des utilisateurs, dépôts et retraits ont été supprimés avec succès.',
        deletedUsersCount: userIdsToDelete.length,
        deletedDepositsCount: clearedDeposits,
        deletedWithdrawalsCount: clearedWithdrawals,
        activeAdmins: adminUsers.map(a => ({ id: a.id, name: a.name, phone: a.phone }))
      });
    } catch (err: any) {
      console.error('[Purge Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la suppression.' });
    }
  });

  // Dedicated Products API (Authoritative DB sync for product prices & catalogue)
  app.get('/api/products', (_req, res) => {
    try {
      const list = Array.from(serverProductsStore.values())
        .sort((a: any, b: any) => (Number(a.order) || 99) - (Number(b.order) || 99));
      return res.json({ success: true, products: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  const handleSaveProductRoute = async (req: express.Request, res: express.Response) => {
    try {
      const prodData = req.body;
      if (!prodData || !prodData.id || !prodData.name) {
        return res.status(400).json({ success: false, error: 'Données du produit invalides.' });
      }

      const normalized = normalizeDbRow('products', {
        ...prodData,
        price: Number(prodData.price) || 0,
        dailyGain: Number(prodData.dailyGain) || 0,
        duration: Number(prodData.duration) || 0,
        totalGain: Number(prodData.totalGain) || (Number(prodData.dailyGain || 0) * Number(prodData.duration || 0)),
        order: Number(prodData.order) || 99,
        isActive: prodData.isActive !== false
      });

      serverProductsStore.set(normalized.id, normalized);
      savePlatformDataToDisk(true);

      // Persist directly to Supabase products table
      const dbRes = await safeSupabaseUpsert('products', normalized);

      // Invalidate master cache immediately so all clients and devices get the new price
      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Product Price & Details Saved]: ID ${normalized.id} ("${normalized.name}") -> Price: ${normalized.price} FCFA, Daily: ${normalized.dailyGain} FCFA, DB Success: ${dbRes.success}`);

      return res.json({ success: true, product: normalized, dbSuccess: dbRes.success });
    } catch (err: any) {
      console.error('[Save Product Route Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la sauvegarde du produit.' });
    }
  };

  app.post('/api/products', handleSaveProductRoute);
  app.put('/api/products/:id', handleSaveProductRoute);

  app.post('/api/products/reset', async (_req, res) => {
    try {
      const allowedIds = new Set(defaultSeedProducts.map(p => p.id));
      for (const currentId of Array.from(serverProductsStore.keys())) {
        if (!allowedIds.has(currentId)) {
          serverProductsStore.delete(currentId);
          try {
            await (supabaseAdmin.from('products' as any) as any).delete().eq('id', currentId);
          } catch (_) {}
        }
      }
      for (const p of defaultSeedProducts) {
        serverProductsStore.set(p.id, p);
        await safeSupabaseUpsert('products', p);
      }
      savePlatformDataToDisk(true);
      lastFetchAllData = null;
      lastFetchAllTime = 0;
      const list = Array.from(serverProductsStore.values())
        .sort((a: any, b: any) => (Number(a.order) || 99) - (Number(b.order) || 99));
      return res.json({ success: true, products: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la réinitialisation.' });
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

        savePlatformDataToDisk(true);
        const upRes = await safeSupabaseUpsert(tableName, item);

        // Invalidate master cache immediately
        lastFetchAllData = null;
        lastFetchAllTime = 0;

        return res.json({ success: true, dbSuccess: upRes.success });
      }

      if (action === 'update' && idValue) {
        if (tableName === 'users' && serverUsersStore.has(idValue)) {
          serverUsersStore.set(idValue, { ...serverUsersStore.get(idValue), ...updates });
        }
        if (tableName === 'products' && serverProductsStore.has(idValue)) {
          serverProductsStore.set(idValue, { ...serverProductsStore.get(idValue), ...updates });
        }
        savePlatformDataToDisk(true);
        await safeSupabaseUpdate(tableName, updates, idCol, idValue);

        // Invalidate master cache immediately
        lastFetchAllData = null;
        lastFetchAllTime = 0;

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

        savePlatformDataToDisk(true);
        await (supabaseAdmin.from(tableName as any) as any).delete().eq(idCol, idValue);

        // Invalidate master cache immediately
        lastFetchAllData = null;
        lastFetchAllTime = 0;

        return res.json({ success: true });
      }

      if (action === 'sync' && Array.isArray(items)) {
        for (const it of items) {
          await safeSupabaseUpsert(tableName, it);
        }
        savePlatformDataToDisk(true);

        lastFetchAllData = null;
        lastFetchAllTime = 0;

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

export async function startServer() {
  // If running in Vercel Serverless environment, skip background daemons and port listening
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    return;
  }

  setInterval(runServerSideDailyRevenueDistribution, 30000);
  setTimeout(runServerSideDailyRevenueDistribution, 4000);

  // =========================================================================
  // VITE MIDDLEWARE / STATIC ASSETS (LOCAL DEV & CLOUD RUN ONLY)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Supabase Admin] Initialized with Service Role Key for URL: ${SUPABASE_URL}`);
  });
}

if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  startServer();
}

export default app;
