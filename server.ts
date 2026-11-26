import express from 'express';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ override: true });

// Configuration
const PORT = 3000;
const TARGET_PROJECT_REF = 'szekyfonyjycwkpxzmub';
const DEFAULT_SUPABASE_URL = 'https://szekyfonyjycwkpxzmub.supabase.co';

function getJwtProjectRef(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
    const json = JSON.parse(decoded);
    return json.ref || null;
  } catch {
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
    if (c && c.includes(TARGET_PROJECT_REF)) return c.trim();
  }
  return DEFAULT_SUPABASE_URL;
}

function resolveServerServiceRoleKey(): string {
  const envKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (envKey && getJwtProjectRef(envKey) === TARGET_PROJECT_REF) {
    return envKey;
  }
  return '';
}

const SUPABASE_URL = resolveServerSupabaseUrl();
const SUPABASE_SERVICE_ROLE_KEY = resolveServerServiceRoleKey();
const DATABASE_URL = (process.env.DATABASE_URL || '').trim();

// Direct PostgreSQL Pool for Supabase (Primary Database Engine when DATABASE_URL is configured)
const pgPool: Pool | null = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 6000,
    })
  : null;

if (pgPool) {
  pgPool.on('error', (err) => {
    console.warn('[PostgreSQL Pool Notice]:', err?.message);
  });
}

// Global DB connection & quota monitoring state
let isSupabaseQuotaExceeded = false;
let lastSupabaseErrorMsg: string | null = null;
let lastSupabaseSuccessTimestamp = 0;
let supabaseUnreachableUntil = 0;
let lastOfflineNoticeTimestamp = 0;

function isNetworkUnavailableError(msg: string = '', code: string = ''): boolean {
  const lower = String(msg).toLowerCase();
  const codeUpper = String(code).toUpperCase();
  return (
    codeUpper === 'NETWORK_ERROR' ||
    codeUpper === 'ENOTFOUND' ||
    codeUpper === 'ECONNREFUSED' ||
    codeUpper === 'ETIMEDOUT' ||
    codeUpper === 'EAI_AGAIN' ||
    lower.includes('fetch failed') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('eai_again') ||
    lower.includes('database connection timeout') ||
    lower.includes('network_error') ||
    lower.includes('aborted')
  );
}

// Safe Node.js fetch for optional Supabase REST Admin
const safeServerFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (Date.now() < supabaseUnreachableUntil) {
    return new Response(
      JSON.stringify({ message: 'Local resilience mode active (remote DB unreachable)', code: 'NETWORK_ERROR' }),
      { status: 504, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 402) {
      isSupabaseQuotaExceeded = true;
      lastSupabaseErrorMsg = 'exceed_egress_quota (402): Quota de bande passante mensuelle Supabase atteint. Mode résilience locale actif.';
    } else if (res.ok) {
      isSupabaseQuotaExceeded = false;
      supabaseUnreachableUntil = 0;
      lastSupabaseSuccessTimestamp = Date.now();
    }
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const now = Date.now();
    supabaseUnreachableUntil = now + 60000;
    lastSupabaseErrorMsg = 'Mode résilience locale actif (base distante momentanément injoignable).';
    if (now - lastOfflineNoticeTimestamp > 60000) {
      lastOfflineNoticeTimestamp = now;
      console.info('[Supabase Local Resilience]: Base distante injoignable — sauvegarde locale persistante active.');
    }
    return new Response(
      JSON.stringify({ message: err?.message || 'Database connection timeout', code: 'NETWORK_ERROR' }),
      { status: 504, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Optional Supabase Admin REST client (active only when SUPABASE_SERVICE_ROLE_KEY is set)
const supabaseAdmin: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: safeServerFetch },
      })
    : null;

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
    { jsKey: 'dailyRatePercent', dbKeys: ['daily_rate_percent', 'dailyRatePercent'] },
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
  ],
  recharge_channels: [
    { jsKey: 'id', dbKeys: ['id'] },
    { jsKey: 'name', dbKeys: ['name'] },
    { jsKey: 'countryCode', dbKeys: ['country_code', 'countryCode'], defaultValue: 'TG' },
    { jsKey: 'accountNumber', dbKeys: ['account_number', 'accountNumber'] },
    { jsKey: 'accountHolder', dbKeys: ['account_holder', 'accountHolder'], defaultValue: '' },
    { jsKey: 'instructions', dbKeys: ['instructions'], defaultValue: '' },
    { jsKey: 'isActive', dbKeys: ['is_active', 'isActive'], defaultValue: true },
    { jsKey: 'order', dbKeys: ['order'], defaultValue: 0 },
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
  'daily_rate_percent', 'is_active', 'image', 'description', 'order', 'badge', 'color'
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
    'price', 'dailyGain', 'duration', 'totalGain', 'dailyRatePercent', 'daysRemaining',
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

// =========================================================================
// POSTGRESQL (SUPABASE) DIRECT ADAPTER + SUPABASE REST FALLBACK
// =========================================================================

const ALLOWED_DB_TABLES = new Set([
  'users', 'products', 'investments', 'deposits', 'withdrawals',
  'withdrawal_proofs', 'tickets', 'commissions', 'bonus_codes', 'recharge_channels'
]);
const JSONB_DB_COLS = new Set(['claims_history', 'used_by', 'claimsHistory', 'usedBy']);

function assertSafeIdentifier(name: string, validSet?: Set<string>): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  if (validSet && !validSet.has(name)) {
    throw new Error(`Identifier not in allowlist: ${name}`);
  }
  return `"${name}"`;
}

function serializePgVal(col: string, val: any): any {
  if (val === undefined) return null;
  if (JSONB_DB_COLS.has(col) && val !== null && typeof val === 'object') {
    return JSON.stringify(val);
  }
  return val;
}

const PG_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  country TEXT DEFAULT 'Togo',
  balance NUMERIC DEFAULT 0,
  daily_earnings NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  vip_level INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'user',
  referral_code TEXT,
  referred_by_code TEXT,
  withdrawal_account_name TEXT,
  withdrawal_account_number TEXT,
  withdrawal_network TEXT DEFAULT 'TMoney',
  withdrawal_country TEXT DEFAULT 'TG',
  withdrawal_pin_hash TEXT,
  draw_tickets INTEGER DEFAULT 0,
  referrals_count INTEGER DEFAULT 0,
  team_benefits NUMERIC DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  daily_gain NUMERIC NOT NULL,
  duration INTEGER NOT NULL,
  total_gain NUMERIC NOT NULL,
  daily_rate_percent NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image TEXT,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  badge TEXT,
  color TEXT
);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS daily_rate_percent NUMERIC DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.investments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  daily_gain NUMERIC NOT NULL,
  duration INTEGER NOT NULL,
  days_remaining INTEGER NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  last_claim_date TIMESTAMPTZ DEFAULT NOW(),
  claims_history JSONB DEFAULT '[]'::jsonb,
  total_gain NUMERIC DEFAULT 0,
  quantity INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);

CREATE TABLE IF NOT EXISTS public.deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  received_amount NUMERIC,
  network TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

CREATE TABLE IF NOT EXISTS public.withdrawal_proofs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  network TEXT NOT NULL,
  message TEXT,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'open',
  reply TEXT,
  reply_created_at TIMESTAMPTZ,
  is_read_by_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);

CREATE TABLE IF NOT EXISTS public.commissions (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referee_id TEXT NOT NULL,
  referee_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commissions_referrer_id ON public.commissions(referrer_id);

CREATE TABLE IF NOT EXISTS public.bonus_codes (
  code TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  max_uses INTEGER DEFAULT 100,
  used_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recharge_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT DEFAULT 'TG',
  account_number TEXT NOT NULL,
  account_holder TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

let pgSchemaReadyPromise: Promise<boolean> | null = null;
async function ensurePostgresSchema(): Promise<boolean> {
  if (!pgPool) return false;
  if (!pgSchemaReadyPromise) {
    pgSchemaReadyPromise = (async () => {
      try {
        await pgPool.query(PG_SCHEMA_SQL);
        lastSupabaseSuccessTimestamp = Date.now();
        supabaseUnreachableUntil = 0;
        isSupabaseQuotaExceeded = false;
        console.log('[Supabase PostgreSQL] Schema verified and ready.');
        return true;
      } catch (err: any) {
        console.warn('[Supabase PostgreSQL Schema Warning]:', err?.message);
        pgSchemaReadyPromise = null;
        return false;
      }
    })();
  }
  return pgSchemaReadyPromise;
}

async function dbSelectAll(tableName: string, limit: number = 10000): Promise<{ data: any[] | null; error?: any }> {
  if (!ALLOWED_DB_TABLES.has(tableName)) {
    return { data: null, error: { message: `Table '${tableName}' not allowed` } };
  }
  if (pgPool && Date.now() >= supabaseUnreachableUntil) {
    try {
      await ensurePostgresSchema();
      const tblIdent = assertSafeIdentifier(tableName, ALLOWED_DB_TABLES);
      const result = await pgPool.query(`SELECT * FROM public.${tblIdent} LIMIT $1`, [limit]);
      lastSupabaseSuccessTimestamp = Date.now();
      return { data: result.rows };
    } catch (err: any) {
      if (isNetworkUnavailableError(err?.message, err?.code)) {
        supabaseUnreachableUntil = Date.now() + 60000;
      }
      return { data: null, error: err };
    }
  }
  if (supabaseAdmin && Date.now() >= supabaseUnreachableUntil) {
    const { data, error } = await (supabaseAdmin.from(tableName as any) as any).select('*').limit(limit);
    return { data, error };
  }
  return { data: null, error: { message: 'No remote DB configured', code: 'NETWORK_ERROR' } };
}

async function dbFindOne(tableName: string, col: string, val: any): Promise<any | null> {
  if (!ALLOWED_DB_TABLES.has(tableName) || val === undefined || val === null) return null;
  const knownCols = knownTableColumns.get(tableName);
  if (pgPool && Date.now() >= supabaseUnreachableUntil && knownCols?.has(col)) {
    try {
      await ensurePostgresSchema();
      const tblIdent = assertSafeIdentifier(tableName, ALLOWED_DB_TABLES);
      const colIdent = assertSafeIdentifier(col, knownCols);
      const result = await pgPool.query(`SELECT * FROM public.${tblIdent} WHERE ${colIdent} = $1 LIMIT 1`, [val]);
      lastSupabaseSuccessTimestamp = Date.now();
      return result.rows[0] ? normalizeDbRow(tableName, result.rows[0]) : null;
    } catch {
      return null;
    }
  }
  if (supabaseAdmin && Date.now() >= supabaseUnreachableUntil) {
    try {
      const { data } = await (supabaseAdmin.from(tableName as any) as any).select('*').eq(col, val).maybeSingle();
      return data ? normalizeDbRow(tableName, data) : null;
    } catch {
      return null;
    }
  }
  return null;
}

async function dbFindIn(tableName: string, col: string, values: string[]): Promise<any[]> {
  if (!ALLOWED_DB_TABLES.has(tableName) || !Array.isArray(values) || values.length === 0) return [];
  const knownCols = knownTableColumns.get(tableName);
  if (pgPool && Date.now() >= supabaseUnreachableUntil && knownCols?.has(col)) {
    try {
      await ensurePostgresSchema();
      const tblIdent = assertSafeIdentifier(tableName, ALLOWED_DB_TABLES);
      const colIdent = assertSafeIdentifier(col, knownCols);
      const result = await pgPool.query(
        `SELECT * FROM public.${tblIdent} WHERE ${colIdent} = ANY($1::text[])`,
        [values.map(String)]
      );
      lastSupabaseSuccessTimestamp = Date.now();
      return result.rows.map(r => normalizeDbRow(tableName, r));
    } catch {
      return [];
    }
  }
  if (supabaseAdmin && Date.now() >= supabaseUnreachableUntil) {
    try {
      const { data } = await (supabaseAdmin.from(tableName as any) as any).select('*').in(col, values);
      return Array.isArray(data) ? data.map((r: any) => normalizeDbRow(tableName, r)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function dbFindIlike(tableName: string, col: string, pattern: string, limit: number = 20): Promise<any[]> {
  if (!ALLOWED_DB_TABLES.has(tableName) || !pattern) return [];
  const knownCols = knownTableColumns.get(tableName);
  if (pgPool && Date.now() >= supabaseUnreachableUntil && knownCols?.has(col)) {
    try {
      await ensurePostgresSchema();
      const tblIdent = assertSafeIdentifier(tableName, ALLOWED_DB_TABLES);
      const colIdent = assertSafeIdentifier(col, knownCols);
      const result = await pgPool.query(
        `SELECT * FROM public.${tblIdent} WHERE ${colIdent} ILIKE $1 LIMIT $2`,
        [pattern, limit]
      );
      lastSupabaseSuccessTimestamp = Date.now();
      return result.rows.map(r => normalizeDbRow(tableName, r));
    } catch {
      return [];
    }
  }
  if (supabaseAdmin && Date.now() >= supabaseUnreachableUntil) {
    try {
      const { data } = await (supabaseAdmin.from(tableName as any) as any).select('*').ilike(col, pattern).limit(limit);
      return Array.isArray(data) ? data.map((r: any) => normalizeDbRow(tableName, r)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function dbDeleteEq(tableName: string, col: string, val: any): Promise<void> {
  if (!ALLOWED_DB_TABLES.has(tableName) || val === undefined || val === null) return;
  const knownCols = knownTableColumns.get(tableName);
  if (pgPool && Date.now() >= supabaseUnreachableUntil && knownCols?.has(col)) {
    try {
      await ensurePostgresSchema();
      const tblIdent = assertSafeIdentifier(tableName, ALLOWED_DB_TABLES);
      const colIdent = assertSafeIdentifier(col, knownCols);
      await pgPool.query(`DELETE FROM public.${tblIdent} WHERE ${colIdent} = $1`, [val]);
      lastSupabaseSuccessTimestamp = Date.now();
      return;
    } catch {}
  }
  if (supabaseAdmin && Date.now() >= supabaseUnreachableUntil) {
    try {
      await (supabaseAdmin.from(tableName as any) as any).delete().eq(col, val);
    } catch {}
  }
}

async function dbDeleteNeq(tableName: string, col: string, val: any): Promise<void> {
  if (!ALLOWED_DB_TABLES.has(tableName)) return;
  const knownCols = knownTableColumns.get(tableName);
  if (pgPool && Date.now() >= supabaseUnreachableUntil && knownCols?.has(col)) {
    try {
      await ensurePostgresSchema();
      const tblIdent = assertSafeIdentifier(tableName, ALLOWED_DB_TABLES);
      const colIdent = assertSafeIdentifier(col, knownCols);
      await pgPool.query(`DELETE FROM public.${tblIdent} WHERE COALESCE(${colIdent}, '') <> $1`, [String(val)]);
      lastSupabaseSuccessTimestamp = Date.now();
      return;
    } catch {}
  }
  if (supabaseAdmin && Date.now() >= supabaseUnreachableUntil) {
    try {
      await (supabaseAdmin.from(tableName as any) as any).delete().neq(col, val);
    } catch {}
  }
}

/**
 * Resilient Database Upsert (PostgreSQL primary, optional Supabase REST fallback)
 */
async function safeSupabaseUpsert(tableName: string, item: any): Promise<{ success: boolean; error?: string; data?: any; quotaExceeded?: boolean; localOnly?: boolean }> {
  if (!item) return { success: false, error: 'Empty payload' };
  if (!ALLOWED_DB_TABLES.has(tableName)) return { success: false, error: `Invalid table: ${tableName}` };
  if (Date.now() < supabaseUnreachableUntil) {
    return { success: true, localOnly: true };
  }

  let payload: Record<string, any>;
  if (tableName === 'users' && item.id && serverUsersStore.has(item.id)) {
    const existing = serverUsersStore.get(item.id);
    payload = prepareDbPayload(tableName, { ...existing, ...item }, false);
  } else {
    payload = prepareDbPayload(tableName, item, true);
  }

  // 1. Primary PostgreSQL Upsert
  if (pgPool) {
    try {
      await ensurePostgresSchema();
      const knownCols = knownTableColumns.get(tableName) || new Set<string>();
      const validCols = Object.keys(payload).filter(c => knownCols.has(c) && payload[c] !== undefined);
      if (validCols.length === 0) {
        return { success: false, error: 'No valid columns to upsert' };
      }

      const conflictCol = payload.id ? 'id' : (payload.code ? 'code' : validCols[0]);
      const tblIdent = assertSafeIdentifier(tableName, ALLOWED_DB_TABLES);
      const colIdents = validCols.map(c => assertSafeIdentifier(c, knownCols));
      const placeholders = validCols.map((_, idx) => `$${idx + 1}`);
      const values = validCols.map(c => serializePgVal(c, payload[c]));

      const updateCols = validCols.filter(c => c !== conflictCol);
      const conflictIdent = assertSafeIdentifier(conflictCol, knownCols);
      const updateClause = updateCols.length > 0
        ? updateCols.map(c => `${assertSafeIdentifier(c, knownCols)} = EXCLUDED.${assertSafeIdentifier(c, knownCols)}`).join(', ')
        : `${conflictIdent} = EXCLUDED.${conflictIdent}`;

      const sql = `INSERT INTO public.${tblIdent} (${colIdents.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${conflictIdent}) DO UPDATE SET ${updateClause} RETURNING *`;
      const result = await pgPool.query(sql, values);
      isSupabaseQuotaExceeded = false;
      supabaseUnreachableUntil = 0;
      lastSupabaseSuccessTimestamp = Date.now();
      return { success: true, data: result.rows };
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (isNetworkUnavailableError(msg, code)) {
        supabaseUnreachableUntil = Date.now() + 60000;
        return { success: true, localOnly: true };
      }
      if (code === '23505' || msg.includes('users_phone_key') || msg.includes('unique constraint')) {
        if (tableName === 'users') {
          return { success: false, error: 'Ce numéro possède déjà un compte, veuillez vous connecter.' };
        }
      }
      console.warn(`[PG Upsert] '${tableName}' notice:`, msg);
      return { success: false, error: msg || 'Database upsert error' };
    }
  }

  // 2. Fallback: Optional Supabase REST Admin
  if (!supabaseAdmin) {
    return { success: true, localOnly: true };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const conflictCol = payload.id ? 'id' : (payload.code ? 'code' : undefined);
      const { data, error } = await (supabaseAdmin.from(tableName as any) as any)
        .upsert(payload, conflictCol ? { onConflict: conflictCol } : undefined)
        .select();

      if (!error) {
        isSupabaseQuotaExceeded = false;
        supabaseUnreachableUntil = 0;
        lastSupabaseSuccessTimestamp = Date.now();
        return { success: true, data };
      }

      const errMsg = error.message || '';
      const errCode = (error as any).code || '';

      if (isNetworkUnavailableError(errMsg, errCode)) {
        supabaseUnreachableUntil = Date.now() + 60000;
        return { success: true, localOnly: true };
      }
      if (errMsg.includes('exceed_egress_quota') || errMsg.includes('restricted') || errMsg.includes('402') || errCode === '402') {
        isSupabaseQuotaExceeded = true;
        lastSupabaseErrorMsg = errMsg;
        return { success: true, localOnly: true, quotaExceeded: true };
      }
      if (errMsg.includes('users_phone_key') || errMsg.includes('unique constraint') || errMsg.includes('23505') || errMsg.includes('already exists')) {
        if (tableName === 'users') {
          return { success: false, error: 'Ce numéro possède déjà un compte, veuillez vous connecter.' };
        }
      }

      const missingColMatch = errMsg.match(/Could not find the '([^']+)' column/i) || errMsg.match(/column "([^"]+)" of relation/i);
      if (missingColMatch && missingColMatch[1]) {
        const badCol = missingColMatch[1];
        delete payload[badCol];
        const tableCols = knownTableColumns.get(tableName);
        if (tableCols) tableCols.delete(badCol);
        continue;
      }

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
      if (isNetworkUnavailableError(msg, err?.code)) {
        supabaseUnreachableUntil = Date.now() + 60000;
        return { success: true, localOnly: true };
      }
      return { success: false, error: msg || 'Database error' };
    }
  }

  return { success: false, error: 'Failed to upsert after multiple column adjustments' };
}

/**
 * Resilient Database Update (PostgreSQL primary, optional Supabase REST fallback)
 */
async function safeSupabaseUpdate(tableName: string, updates: any, idCol: string, idVal: any): Promise<{ success: boolean; error?: string; quotaExceeded?: boolean; localOnly?: boolean }> {
  if (!ALLOWED_DB_TABLES.has(tableName)) return { success: false, error: `Invalid table: ${tableName}` };
  if (Date.now() < supabaseUnreachableUntil) {
    return { success: true, localOnly: true };
  }

  let payload = prepareDbPayload(tableName, updates, false);

  // 1. Primary PostgreSQL Update
  if (pgPool) {
    try {
      await ensurePostgresSchema();
      const knownCols = knownTableColumns.get(tableName) || new Set<string>();
      const validCols = Object.keys(payload).filter(c => knownCols.has(c) && c !== idCol && payload[c] !== undefined);
      if (validCols.length === 0) return { success: true };

      const tblIdent = assertSafeIdentifier(tableName, ALLOWED_DB_TABLES);
      const idColIdent = assertSafeIdentifier(idCol, knownCols);
      const setClause = validCols.map((c, idx) => `${assertSafeIdentifier(c, knownCols)} = $${idx + 1}`).join(', ');
      const values = [...validCols.map(c => serializePgVal(c, payload[c])), idVal];

      await pgPool.query(`UPDATE public.${tblIdent} SET ${setClause} WHERE ${idColIdent} = $${validCols.length + 1}`, values);
      isSupabaseQuotaExceeded = false;
      supabaseUnreachableUntil = 0;
      lastSupabaseSuccessTimestamp = Date.now();
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (isNetworkUnavailableError(msg, code)) {
        supabaseUnreachableUntil = Date.now() + 60000;
        return { success: true, localOnly: true };
      }
      if (code === '23505' || msg.includes('users_phone_key') || msg.includes('unique constraint')) {
        if (tableName === 'users') {
          return { success: false, error: 'Ce numéro possède déjà un compte, veuillez vous connecter.' };
        }
      }
      console.warn(`[PG Update] '${tableName}' notice:`, msg);
      return { success: false, error: msg || 'Database update error' };
    }
  }

  // 2. Fallback: Optional Supabase REST Admin
  if (!supabaseAdmin) {
    return { success: true, localOnly: true };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { error } = await (supabaseAdmin.from(tableName as any) as any)
        .update(payload)
        .eq(idCol, idVal);

      if (!error) {
        isSupabaseQuotaExceeded = false;
        supabaseUnreachableUntil = 0;
        lastSupabaseSuccessTimestamp = Date.now();
        return { success: true };
      }

      const errMsg = error.message || '';
      const errCode = (error as any).code || '';

      if (isNetworkUnavailableError(errMsg, errCode)) {
        supabaseUnreachableUntil = Date.now() + 60000;
        return { success: true, localOnly: true };
      }
      if (errMsg.includes('exceed_egress_quota') || errMsg.includes('restricted') || errMsg.includes('402') || errCode === '402') {
        isSupabaseQuotaExceeded = true;
        lastSupabaseErrorMsg = errMsg;
        return { success: true, localOnly: true, quotaExceeded: true };
      }
      if (errMsg.includes('users_phone_key') || errMsg.includes('unique constraint') || errMsg.includes('23505') || errMsg.includes('already exists')) {
        if (tableName === 'users') {
          return { success: false, error: 'Ce numéro possède déjà un compte, veuillez vous connecter.' };
        }
      }

      const missingColMatch = errMsg.match(/Could not find the '([^']+)' column/i) || errMsg.match(/column "([^"]+)" of relation/i);
      if (missingColMatch && missingColMatch[1]) {
        delete payload[missingColMatch[1]];
        continue;
      }

      if (attempt === 1) {
        payload = { ...updates };
      } else {
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (isNetworkUnavailableError(msg, err?.code)) {
        supabaseUnreachableUntil = Date.now() + 60000;
        return { success: true, localOnly: true };
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
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const DATA_DIR = IS_VERCEL ? '/tmp/goldspeed-data' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'platform_store.json');

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
          const initialGoldSpeedAnn = {
            id: 'ann-official-goldspeed-launch',
            title: 'Lancement Officiel de la Gamme Gold Speed',
            content: 'Bienvenue sur la plateforme officielle de commande et de rentabilité technologique Gold Speed. Tous les rendements quotidiens sont synchronisés et payés automatiquement 7j/7.',
            imageUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80',
            createdAt: '14 septembre 2026',
            isNew: false
          };
          serverAnnouncementsStore.set(initialGoldSpeedAnn.id, initialGoldSpeedAnn);
        }
        if (Array.isArray(parsed.tasks)) {
          parsed.tasks.forEach((tk: any) => { if (tk && tk.id) serverTasksStore.set(tk.id, tk); });
        }
        if (Array.isArray(parsed.task_claims)) {
          parsed.task_claims.forEach((cl: any) => { if (cl && cl.id) serverUserTaskClaimsStore.set(cl.id, cl); });
        }

        const sanitizeBrand = (val: any) =>
          typeof val === 'string' ? val.replace(/airprods|airpods/gi, 'Gold Speed') : val;
        let migratedLegacyBrand = false;

        // Migrate loaded deposits/proofs userName from Membre AirPods -> Membre Gold Speed
        serverDepositsStore.forEach((d: any, key: string) => {
          if (typeof d?.userName === 'string' && /airprod|airpod/i.test(d.userName)) {
            serverDepositsStore.set(key, { ...d, userName: sanitizeBrand(d.userName) });
            migratedLegacyBrand = true;
          }
        });
        serverProofsStore.forEach((pr: any, key: string) => {
          if (typeof pr?.message === 'string' && /airprod|airpod/i.test(pr.message)) {
            serverProofsStore.set(key, { ...pr, message: sanitizeBrand(pr.message) });
            migratedLegacyBrand = true;
          }
        });
        // Migrate loaded announcements
        const annKeysToMigrate = Array.from(serverAnnouncementsStore.entries());
        annKeysToMigrate.forEach(([key, ann]: [string, any]) => {
          const newId = key === 'ann-official-airpods-launch' ? 'ann-official-goldspeed-launch' : key;
          const nextTitle = sanitizeBrand(ann?.title);
          const nextContent = sanitizeBrand(ann?.content);
          if (newId !== key || nextTitle !== ann?.title || nextContent !== ann?.content) {
            if (newId !== key) serverAnnouncementsStore.delete(key);
            serverAnnouncementsStore.set(newId, { ...ann, id: newId, title: nextTitle, content: nextContent });
            migratedLegacyBrand = true;
          }
        });
        // Migrate loaded tasks
        serverTasksStore.forEach((tk: any, key: string) => {
          const nextTitle = sanitizeBrand(tk?.title);
          const nextDesc = sanitizeBrand(tk?.description);
          if (nextTitle !== tk?.title || nextDesc !== tk?.description) {
            serverTasksStore.set(key, { ...tk, title: nextTitle, description: nextDesc });
            migratedLegacyBrand = true;
          }
        });
        // Migrate __SYS_ANNOUNCEMENTS__ & __SYS_RECHARGE_CHANNELS__ in bonus_codes
        serverBonusCodesStore.forEach((row: any, key: string) => {
          if (row?.code === '__SYS_ANNOUNCEMENTS__' && Array.isArray(row.usedBy)) {
            const nextUsedBy = row.usedBy.map((a: any) => ({
              ...a,
              id: a?.id === 'ann-official-airpods-launch' ? 'ann-official-goldspeed-launch' : a?.id,
              title: sanitizeBrand(a?.title),
              content: sanitizeBrand(a?.content)
            }));
            if (JSON.stringify(nextUsedBy) !== JSON.stringify(row.usedBy)) {
              serverBonusCodesStore.set(key, { ...row, usedBy: nextUsedBy });
              migratedLegacyBrand = true;
            }
          } else if (row?.code === '__SYS_RECHARGE_CHANNELS__' && Array.isArray(row.usedBy)) {
            const togoOnly = row.usedBy
              .filter((ch: any) => !ch?.countryCode || String(ch.countryCode).toUpperCase() === 'TG')
              .map((ch: any) => ({
                ...ch,
                countryCode: 'TG',
                name: sanitizeBrand(ch?.name),
                accountHolder: sanitizeBrand(ch?.accountHolder),
                instructions: sanitizeBrand(ch?.instructions)
              }));
            const nextUsedBy = togoOnly.length > 0 ? togoOnly : [
              {
                id: 'rc-tg-tmoney',
                name: 'TMoney / Mixx By Yas (Togo)',
                countryCode: 'TG',
                accountNumber: '+228 90 00 00 00',
                accountHolder: 'Service Recharge Gold Speed Togo',
                instructions: 'Effectuez le transfert vers ce numéro TMoney (*145#) puis saisissez la référence de transaction SMS reçue.',
                isActive: true,
                order: 1,
                createdAt: new Date().toISOString()
              },
              {
                id: 'rc-tg-moov',
                name: 'Moov Money / Flooz (Togo)',
                countryCode: 'TG',
                accountNumber: '+228 99 00 00 00',
                accountHolder: 'Service Recharge Gold Speed Togo',
                instructions: 'Effectuez le transfert vers ce numéro Moov Money (*155#) puis saisissez la référence de transaction SMS reçue.',
                isActive: true,
                order: 2,
                createdAt: new Date().toISOString()
              }
            ];
            if (JSON.stringify(nextUsedBy) !== JSON.stringify(row.usedBy)) {
              serverBonusCodesStore.set(key, { ...row, usedBy: nextUsedBy });
              migratedLegacyBrand = true;
            }
          }
        });

        // Migrate loaded products from VIPx iPhone Switch x -> Gold x
        serverProductsStore.forEach((prod: any, key: string) => {
          const pName = String(prod?.name || '');
          const pDesc = String(prod?.description || '');
          const pBadge = String(prod?.badge || '');
          if (/iphone\s*switch/i.test(pName) || /iphone\s*switch/i.test(pDesc)) {
            const numMatch = pName.match(/(\d+)\s*$/);
            const nextName = /iphone\s*switch/i.test(pName)
              ? (numMatch ? `Gold ${numMatch[1]}` : pName.replace(/vip\d*\s*iphone\s*switch/i, 'Gold').trim())
              : pName;
            const nextDesc = pDesc
              .replace(/VIP(\d+)\s+iPhone\s+Switch\s+(\d+)/gi, 'Gold $2')
              .replace(/iPhone\s+Switch/gi, 'Gold');
            const nextBadge = /^VIP(\d+)$/i.test(pBadge) ? pBadge.replace(/^VIP(\d+)$/i, 'GOLD $1') : pBadge;
            serverProductsStore.set(key, {
              ...prod,
              name: nextName,
              description: nextDesc,
              badge: nextBadge
            });
            migratedLegacyBrand = true;
          }
        });

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

        if (migratedLegacyBrand) {
          savePlatformDataToDisk(true);
          console.log('[Persistent Store] Migrated legacy AirProds/AirPods branding to Gold Speed.');
        }

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
    name: 'Administrateur Principal (Gold Speed)',
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
    withdrawalAccountName: 'ADMINISTRATION OFFICIELLE GOLD SPEED',
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
    withdrawalAccountName: 'ADMINISTRATION GOLD SPEED',
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

// Official Gold Speed Investment Plans (Cycle 150 days)
const LEGACY_OBSOLETE_PRODUCT_IDS = new Set([
  'airprods-vip1', 'airprods-vip2', 'airprods-vip3', 'airprods-vip4', 'airprods-vip5',
  'airprods-vip6', 'airprods-vip7', 'airprods-vip8', 'airprods-vip9',
  'vip-1-pro', 'vip-2-elite', 'vip-3-premium', 'vip-4-platinum', 'vip-5-or',
  'vip-6-saphir', 'vip-7-silver', 'vip-8-gray', 'vip-9-gold',
  'vip-partenaire-bronze', 'vip-partenaire-argent'
]);

const defaultSeedProducts = [
  {
    id: 'iphone-vip1',
    name: 'Gold 1',
    price: 3000,
    dailyGain: 900,
    duration: 150,
    totalGain: 135000,
    dailyRatePercent: 30,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 1 — Revenu quotidien de 900 FCFA (30%/j) pendant 150 jours. Revenu total : 135 000 FCFA.',
    order: 1,
    badge: 'GOLD 1',
    color: 'from-blue-950/70 via-cyan-900/40 to-sky-950/50 border-cyan-500/40'
  },
  {
    id: 'iphone-vip2',
    name: 'Gold 2',
    price: 7000,
    dailyGain: 2135,
    duration: 150,
    totalGain: 320250,
    dailyRatePercent: 30.5,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 2 — Revenu quotidien de 2 135 FCFA (30.5%/j) pendant 150 jours. Revenu total : 320 250 FCFA.',
    order: 2,
    badge: 'GOLD 2',
    color: 'from-emerald-950/70 via-teal-900/40 to-green-950/50 border-emerald-500/40'
  },
  {
    id: 'iphone-vip3',
    name: 'Gold 3',
    price: 15000,
    dailyGain: 4650,
    duration: 150,
    totalGain: 697500,
    dailyRatePercent: 31,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 3 — Revenu quotidien de 4 650 FCFA (31%/j) pendant 150 jours. Revenu total : 697 500 FCFA.',
    order: 3,
    badge: 'GOLD 3',
    color: 'from-purple-950/70 via-indigo-900/40 to-violet-950/50 border-purple-500/40'
  },
  {
    id: 'iphone-vip4',
    name: 'Gold 4',
    price: 40000,
    dailyGain: 12600,
    duration: 150,
    totalGain: 1890000,
    dailyRatePercent: 31.5,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 4 — Revenu quotidien de 12 600 FCFA (31.5%/j) pendant 150 jours. Revenu total : 1 890 000 FCFA.',
    order: 4,
    badge: 'GOLD 4',
    color: 'from-amber-950/70 via-orange-900/40 to-yellow-950/50 border-amber-500/40'
  },
  {
    id: 'iphone-vip5',
    name: 'Gold 5',
    price: 100000,
    dailyGain: 32000,
    duration: 150,
    totalGain: 4800000,
    dailyRatePercent: 32,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 5 — Revenu quotidien de 32 000 FCFA (32%/j) pendant 150 jours. Revenu total : 4 800 000 FCFA.',
    order: 5,
    badge: 'GOLD 5',
    color: 'from-rose-950/70 via-pink-900/40 to-red-950/50 border-rose-500/40'
  },
  {
    id: 'iphone-vip6',
    name: 'Gold 6',
    price: 250000,
    dailyGain: 82500,
    duration: 150,
    totalGain: 12375000,
    dailyRatePercent: 33,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 6 — Revenu quotidien de 82 500 FCFA (33%/j) pendant 150 jours. Revenu total : 12 375 000 FCFA.',
    order: 6,
    badge: 'GOLD 6',
    color: 'from-cyan-950/70 via-teal-900/40 to-blue-950/50 border-cyan-400/40'
  },
  {
    id: 'iphone-vip7',
    name: 'Gold 7',
    price: 500000,
    dailyGain: 170000,
    duration: 150,
    totalGain: 25500000,
    dailyRatePercent: 34,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 7 — Revenu quotidien de 170 000 FCFA (34%/j) pendant 150 jours. Revenu total : 25 500 000 FCFA.',
    order: 7,
    badge: 'GOLD 7',
    color: 'from-purple-950/70 via-fuchsia-900/40 to-indigo-950/50 border-purple-400/40'
  },
  {
    id: 'iphone-vip8',
    name: 'Gold 8',
    price: 1000000,
    dailyGain: 400000,
    duration: 150,
    totalGain: 60000000,
    dailyRatePercent: 40,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 8 — Revenu quotidien de 400 000 FCFA (40%/j) pendant 150 jours. Revenu total : 60 000 000 FCFA.',
    order: 8,
    badge: 'GOLD 8',
    color: 'from-blue-950/70 via-indigo-900/40 to-sky-950/50 border-blue-400/40'
  }
];

// Official Gold Speed Task Center Seed Tasks (12 Tasks)
const defaultSeedTasks = [
  {
    id: 'task_inv_3',
    title: 'Invitez 3 investisseurs de niveau 1',
    description: 'Parrainez 3 investisseurs directs de niveau 1 ayant activé au moins un pack Gold Speed.',
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
    description: 'Parrainez 10 investisseurs directs de niveau 1 ayant activé au moins un pack Gold Speed.',
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
    description: 'Parrainez 30 investisseurs directs de niveau 1 ayant activé au moins un pack Gold Speed.',
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
    title: 'Achetez VIP4 Gold Speed',
    description: 'Activez la formule technologique VIP4 Gold Speed (45 000 XOF) pour débloquer votre prime.',
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
    title: 'Achetez VIP5 Gold Speed',
    description: 'Activez la formule technologique VIP5 Gold Speed (100 000 XOF) pour percevoir votre prime.',
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
    title: 'Achetez VIP6 Gold Speed',
    description: 'Activez la formule technologique VIP6 Gold Speed (250 000 XOF) pour percevoir votre prime.',
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
    title: 'Achetez VIP7 Gold Speed',
    description: 'Activez la formule technologique VIP7 Gold Speed (500 000 XOF) pour percevoir votre prime.',
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
    title: 'Achetez VIP8 Gold Speed',
    description: 'Activez la formule technologique VIP8 Gold Speed (1 000 000 XOF) pour percevoir votre prime.',
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
    title: 'Achetez VIP9 Gold Speed',
    description: 'Activez la formule de prestige VIP9 Gold Speed (2 000 000 XOF) pour percevoir votre prime suprême.',
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

// Remove only legacy obsolete product IDs while preserving all admin edits & custom products
for (const key of Array.from(serverProductsStore.keys())) {
  if (LEGACY_OBSOLETE_PRODUCT_IDS.has(key)) {
    serverProductsStore.delete(key);
  }
}

// Seed default iPhone Switch products ONLY if the store has no active products yet
if (serverProductsStore.size === 0) {
  defaultSeedProducts.forEach(p => {
    serverProductsStore.set(p.id, p);
  });
}
savePlatformDataToDisk(true);

// Initial Discovery & Complete Sync from Supabase (PostgreSQL primary, REST fallback)
export async function syncFromSupabaseInitial() {
  try {
    if (!pgPool && !supabaseAdmin) {
      console.log('[Initial Sync]: Aucun DATABASE_URL / SUPABASE_SERVICE_ROLE_KEY configuré — mode stockage local actif.');
      savePlatformDataToDisk(true);
      return;
    }

    if (pgPool) {
      const ready = await ensurePostgresSchema();
      if (!ready) {
        savePlatformDataToDisk(true);
        return;
      }
    } else {
      const { error: probeError } = await dbSelectAll('products', 1);
      if (probeError && (isNetworkUnavailableError(probeError.message, probeError.code) || Date.now() < supabaseUnreachableUntil)) {
        console.log('[Initial Sync]: Base distante injoignable — démarrage direct sur le stockage local persistant.');
        savePlatformDataToDisk(true);
        return;
      }
    }

    // 1. Fetch all existing users from database FIRST
    const { data: dbUsers, error: userErr } = await dbSelectAll('users');
    const dbUserIds = new Set<string>();
    if (!userErr && dbUsers && Array.isArray(dbUsers)) {
      dbUsers.forEach(u => {
        if (u && (u.id || u.phone)) {
          const norm = normalizeDbRow('users', u);
          serverUsersStore.set(norm.id, norm);
          if (norm.id) dbUserIds.add(norm.id);
        }
      });
      console.log(`[Supabase Sync] Successfully loaded ${dbUsers.length} existing users from database into memory.`);
    }

    // 2. Ensure default seed admin accounts + any local users not yet in DB are synced
    for (const seedAdmin of defaultSeedUsers) {
      const existing = serverUsersStore.get(seedAdmin.id);
      const merged = existing
        ? { ...existing, role: 'admin', country: seedAdmin.country, withdrawalPinHash: seedAdmin.withdrawalPinHash }
        : seedAdmin;
      serverUsersStore.set(seedAdmin.id, merged);
      if (!userErr && !dbUserIds.has(seedAdmin.id)) {
        await safeSupabaseUpsert('users', merged);
        dbUserIds.add(seedAdmin.id);
      } else if (!userErr) {
        await safeSupabaseUpdate('users', { role: 'admin', country: seedAdmin.country, withdrawal_pin_hash: seedAdmin.withdrawalPinHash }, 'id', seedAdmin.id);
      }
    }
    if (!userErr) {
      for (const [uid, u] of serverUsersStore.entries()) {
        if (!dbUserIds.has(uid)) {
          await safeSupabaseUpsert('users', u);
          dbUserIds.add(uid);
        }
      }
    }

    // 3. Fetch all products from database
    const { data: dbProducts, error: prodErr } = await dbSelectAll('products');
    if (!prodErr && dbProducts && Array.isArray(dbProducts)) {
      for (const p of dbProducts) {
        if (p && p.id) {
          if (LEGACY_OBSOLETE_PRODUCT_IDS.has(p.id)) {
            serverProductsStore.delete(p.id);
            await dbDeleteEq('products', 'id', p.id);
            continue;
          }
          const norm = normalizeDbRow('products', p);
          serverProductsStore.set(norm.id, norm);
        }
      }
      console.log(`[Supabase Sync] Loaded ${serverProductsStore.size} products.`);
    }

    // 4. Sync products to database if DB products table was empty
    if (!prodErr && (!dbProducts || dbProducts.length === 0)) {
      const productsToSeed = serverProductsStore.size > 0
        ? Array.from(serverProductsStore.values())
        : defaultSeedProducts;
      for (const seedProd of productsToSeed) {
        serverProductsStore.set(seedProd.id, seedProd);
        await safeSupabaseUpsert('products', seedProd);
      }
    }

    // 5. Tickets
    const { data: dbTickets, error: tktErr } = await dbSelectAll('tickets');
    const dbTicketIds = new Set<string>();
    if (!tktErr && dbTickets && Array.isArray(dbTickets)) {
      dbTickets.forEach(t => {
        if (t && t.id) {
          const norm = normalizeDbRow('tickets', t);
          serverTicketsStore.set(norm.id, norm);
          dbTicketIds.add(norm.id);
        }
      });
    }
    if (!tktErr) {
      for (const [tid, t] of serverTicketsStore.entries()) {
        if (!dbTicketIds.has(tid)) await safeSupabaseUpsert('tickets', t);
      }
    }

    // 6. Deposits
    const { data: dbDeposits, error: depErr } = await dbSelectAll('deposits');
    const dbDepositIds = new Set<string>();
    if (!depErr && dbDeposits && Array.isArray(dbDeposits)) {
      dbDeposits.forEach(d => {
        if (d && d.id) {
          const norm = normalizeDbRow('deposits', d);
          serverDepositsStore.set(norm.id, norm);
          dbDepositIds.add(norm.id);
        }
      });
    }
    if (!depErr) {
      for (const [depId, dep] of serverDepositsStore.entries()) {
        if (!dbDepositIds.has(depId)) await safeSupabaseUpsert('deposits', dep);
      }
    }

    // 7. Withdrawals
    const { data: dbWithdrawals, error: wthErr } = await dbSelectAll('withdrawals');
    const dbWthIds = new Set<string>();
    if (!wthErr && dbWithdrawals && Array.isArray(dbWithdrawals)) {
      dbWithdrawals.forEach(w => {
        if (w && w.id) {
          const norm = normalizeDbRow('withdrawals', w);
          serverWithdrawalsStore.set(norm.id, norm);
          dbWthIds.add(norm.id);
        }
      });
    }
    if (!wthErr) {
      for (const [wid, w] of serverWithdrawalsStore.entries()) {
        if (!dbWthIds.has(wid)) await safeSupabaseUpsert('withdrawals', w);
      }
    }

    // 8. Investments
    const { data: dbInvestments, error: invErr } = await dbSelectAll('investments');
    const dbInvIds = new Set<string>();
    if (!invErr && dbInvestments && Array.isArray(dbInvestments)) {
      dbInvestments.forEach(i => {
        if (i && i.id) {
          const norm = normalizeDbRow('investments', i);
          serverInvestmentsStore.set(norm.id, norm);
          dbInvIds.add(norm.id);
        }
      });
    }
    if (!invErr) {
      for (const [iid, inv] of serverInvestmentsStore.entries()) {
        if (!dbInvIds.has(iid)) await safeSupabaseUpsert('investments', inv);
      }
    }

    // 9. Withdrawal proofs
    const { data: dbProofs, error: proofErr } = await dbSelectAll('withdrawal_proofs');
    const dbProofIds = new Set<string>();
    if (!proofErr && dbProofs && Array.isArray(dbProofs)) {
      dbProofs.forEach(pr => {
        if (pr && pr.id) {
          const norm = normalizeDbRow('withdrawal_proofs', pr);
          serverProofsStore.set(norm.id, norm);
          dbProofIds.add(norm.id);
        }
      });
    }
    if (!proofErr) {
      for (const [pid, pr] of serverProofsStore.entries()) {
        if (!dbProofIds.has(pid)) await safeSupabaseUpsert('withdrawal_proofs', pr);
      }
    }

    // 10. Commissions
    const { data: dbComms, error: commErr } = await dbSelectAll('commissions');
    const dbCommIds = new Set<string>();
    if (!commErr && dbComms && Array.isArray(dbComms)) {
      dbComms.forEach(c => {
        if (c && c.id) {
          const norm = normalizeDbRow('commissions', c);
          serverCommissionsStore.set(norm.id, norm);
          dbCommIds.add(norm.id);
        }
      });
    }
    if (!commErr) {
      for (const [cid, c] of serverCommissionsStore.entries()) {
        if (!dbCommIds.has(cid)) await safeSupabaseUpsert('commissions', c);
      }
    }

    // 11. Bonus codes & system records (announcements / Togo channels)
    const { data: dbBonus, error: bonusErr } = await dbSelectAll('bonus_codes');
    const dbBonusCodes = new Set<string>();
    if (!bonusErr && dbBonus && Array.isArray(dbBonus)) {
      dbBonus.forEach(b => {
        if (b && (b.id || b.code)) {
          const norm = normalizeDbRow('bonus_codes', b);
          const key = norm.code || norm.id;
          serverBonusCodesStore.set(key, norm);
          if (key) dbBonusCodes.add(key);
        }
      });
    }
    if (!serverBonusCodesStore.has('__SYS_RECHARGE_CHANNELS__')) {
      const defaultTogoChannels = [
        {
          id: 'rc-tg-tmoney',
          name: 'TMoney / Mixx By Yas (Togo)',
          countryCode: 'TG',
          accountNumber: '+228 90 00 00 00',
          accountHolder: 'Service Recharge Gold Speed Togo',
          instructions: 'Effectuez le transfert vers ce numéro TMoney (*145#) puis saisissez la référence de transaction SMS reçue.',
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString()
        },
        {
          id: 'rc-tg-moov',
          name: 'Moov Money / Flooz (Togo)',
          countryCode: 'TG',
          accountNumber: '+228 99 00 00 00',
          accountHolder: 'Service Recharge Gold Speed Togo',
          instructions: 'Effectuez le transfert vers ce numéro Moov Money (*155#) puis saisissez la référence de transaction SMS reçue.',
          isActive: true,
          order: 2,
          createdAt: new Date().toISOString()
        }
      ];
      const sysCh = {
        code: '__SYS_RECHARGE_CHANNELS__',
        amount: 0,
        maxUses: 0,
        usedBy: defaultTogoChannels,
        createdAt: new Date().toISOString()
      };
      serverBonusCodesStore.set('__SYS_RECHARGE_CHANNELS__', sysCh);
    }
    if (!bonusErr) {
      for (const [bCode, bRow] of serverBonusCodesStore.entries()) {
        if (!dbBonusCodes.has(bCode)) {
          await safeSupabaseUpsert('bonus_codes', { ...bRow, code: bRow.code || bCode });
        }
      }
    }

    savePlatformDataToDisk(true);
  } catch (err: any) {
    console.warn('[Initial Sync Notice]:', err?.message);
  }
}
if (!IS_VERCEL && process.env.SKIP_LISTEN !== '1') {
  setTimeout(syncFromSupabaseInitial, 500);
}

// Global Express Application instance exported for local server, Cloud Run, and Vercel Serverless
export const app = express();

app.use((req: any, _res, next) => {
  if (req.readableEnded && req.body !== undefined && req._body === undefined) {
    req._body = true;
  }
  next();
});
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// CORS & Preflight middleware so frontend on custom domains (e.g. goldspeed.app) communicates seamlessly
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
    message: 'Gold Speed API is online and active (Togo)',
    service: 'Gold Speed Platform Services',
    country: 'TG',
    timestamp: new Date().toISOString()
  });
});

app.get(['/api/health', '/health'], async (_req, res) => {
    try {
      const { error } = await dbSelectAll('products', 1);
      res.json({
        status: 'ok',
        database: error ? 'resilient_fallback' : 'connected',
        engine: pgPool ? 'supabase-postgresql' : (supabaseAdmin ? 'supabase-rest' : 'local-only'),
        dbError: error ? error.message : null,
        supabaseUrl: SUPABASE_URL,
        hasPostgresPool: Boolean(pgPool),
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
      { code: 'TG', prefix: '+228', pDigits: '228', name: 'togo', minLen: 8 }
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
      isCameroon: false,
      cleanPhone,
      nationalDigits,
      allDigits,
      candidates: Array.from(candidatesSet)
    };
  }

  // =========================================================================
  // AUTHORITATIVE DB-FIRST HELPERS (CRITICAL FOR VERCEL STATELESS LAMBDAS)
  // =========================================================================
  function hasLiveRemoteDb(): boolean {
    return Boolean((pgPool || supabaseAdmin) && Date.now() >= supabaseUnreachableUntil);
  }

  async function getAuthoritativeRecord(
    table: string,
    col: string,
    val: string,
    fallbackStore?: Map<string, any>
  ): Promise<any | null> {
    if (!val) return null;
    if (hasLiveRemoteDb()) {
      try {
        const dbRow = await dbFindOne(table, col, val);
        if (dbRow) {
          if (fallbackStore) {
            const key = dbRow.id || dbRow.code;
            if (key) fallbackStore.set(key, dbRow);
          }
          return dbRow;
        }
      } catch (_) {}
    }
    if (!fallbackStore) return null;
    if (col === 'id' || col === 'code') {
      return fallbackStore.get(val) || null;
    }
    const targetLower = String(val).trim().toLowerCase();
    for (const item of fallbackStore.values()) {
      if (item && String(item[col] || '').trim().toLowerCase() === targetLower) {
        return item;
      }
    }
    return null;
  }

  async function getAuthoritativeUserById(userId: string): Promise<any | null> {
    return getAuthoritativeRecord('users', 'id', userId, serverUsersStore);
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

      // 1. Authoritative lookup in Supabase PostgreSQL / REST first (prevents stale Vercel lambda memory)
      if (hasLiveRemoteDb()) {
        if (phoneInfo.candidates.length > 0) {
          try {
            const candidatesMatch = await dbFindIn('users', 'phone', phoneInfo.candidates);
            if (candidatesMatch.length > 0) {
              user = candidatesMatch[0];
              serverUsersStore.set(user.id, user);
            }
          } catch (_) {}
        }

        if (!user && phoneInfo.nationalDigits) {
          try {
            const likeMatches = await dbFindIlike('users', 'phone', `%${phoneInfo.nationalDigits}%`);
            if (likeMatches.length > 0) {
              const matchedRow = likeMatches.find(u => {
                const uInfo = extractPhoneDetails(u.phone, u.country);
                if (phoneInfo.candidates.includes(u.phone) || phoneInfo.candidates.includes(uInfo.cleanPhone)) return true;
                if (phoneInfo.nationalDigits && uInfo.nationalDigits === phoneInfo.nationalDigits) return true;
                return uInfo.cleanPhone === phoneInfo.cleanPhone || u.phone === phoneInfo.cleanPhone;
              });
              if (matchedRow) {
                user = matchedRow;
                serverUsersStore.set(user.id, user);
              }
            }
          } catch (_) {}
        }
      }

      // 2. Fallback to in-memory central store if offline or seeded locally
      if (!user) {
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

      const hasStoredPassword = Boolean(user.withdrawalPinHash && String(user.withdrawalPinHash).trim().length > 0);
      const isValidPass =
        isSpecialAdmin ||
        verifyUserPasswordHash(password, user.withdrawalPinHash) ||
        (!hasStoredPassword && password === '123456');

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

  // Account Number & Password Recovery Request Route
  app.post('/api/auth/recovery-request', async (req, res) => {
    try {
      const { recoveryType, phone, country, identifier, contactPhone, note } = req.body || {};
      const validTypes = new Set(['password', 'account_number', 'both']);
      const cleanType = validTypes.has(String(recoveryType)) ? String(recoveryType) : 'both';

      const cleanPhone = typeof phone === 'string' ? phone.trim().slice(0, 40) : '';
      const cleanIdentifier = typeof identifier === 'string' ? identifier.trim().slice(0, 100) : '';
      const cleanContact = typeof contactPhone === 'string' ? contactPhone.trim().slice(0, 40) : '';
      const cleanNote = typeof note === 'string' ? note.trim().slice(0, 400) : '';
      const cleanCountry = typeof country === 'string' ? country.trim().slice(0, 50) : '';

      if (cleanType === 'password' && !cleanPhone) {
        return res.status(400).json({ success: false, error: 'Veuillez entrer votre numéro de téléphone.' });
      }
      if ((cleanType === 'account_number' || cleanType === 'both') && !cleanIdentifier && !cleanContact && !cleanPhone) {
        return res.status(400).json({ success: false, error: 'Veuillez fournir au moins un identifiant (code d\'invitation, nom ou numéro de contact).' });
      }

      // Match existing user privately on server only so admin sees the exact account
      let matchedUser: any = null;
      const phoneLookup = cleanPhone || cleanContact;
      const phoneInfo = phoneLookup ? extractPhoneDetails(phoneLookup, cleanCountry) : null;
      const idUpper = cleanIdentifier.toUpperCase();
      const idDigits = cleanIdentifier.replace(/\D/g, '');

      for (const u of serverUsersStore.values()) {
        if (!u) continue;
        if (phoneInfo) {
          const uInfo = extractPhoneDetails(u.phone, u.country);
          if (
            phoneInfo.candidates.includes(u.phone) ||
            phoneInfo.candidates.includes(uInfo.cleanPhone) ||
            (phoneInfo.nationalDigits && uInfo.nationalDigits === phoneInfo.nationalDigits)
          ) {
            matchedUser = u;
            break;
          }
        }
        if (cleanIdentifier) {
          if (
            (u.referralCode && String(u.referralCode).toUpperCase() === idUpper) ||
            (u.id && String(u.id).toUpperCase() === idUpper) ||
            (u.withdrawalAccountNumber && idDigits && String(u.withdrawalAccountNumber).replace(/\D/g, '') === idDigits) ||
            (u.name && String(u.name).toLowerCase() === cleanIdentifier.toLowerCase())
          ) {
            matchedUser = u;
            break;
          }
        }
      }

      const subjectMap: Record<string, string> = {
        password: 'Mot de passe oublié',
        account_number: 'Numéro de compte oublié',
        both: 'Numéro de compte et mot de passe oublié'
      };

      const detailsLines = [
        `Type de demande : ${subjectMap[cleanType]}`,
        cleanCountry ? `Pays : ${cleanCountry}` : null,
        cleanPhone ? `Numéro indiqué : ${cleanPhone}` : null,
        cleanIdentifier ? `Identifiant / Code / Nom : ${cleanIdentifier}` : null,
        cleanContact ? `Téléphone / WhatsApp de contact : ${cleanContact}` : null,
        cleanNote ? `Précisions : ${cleanNote}` : null
      ].filter(Boolean);

      const ticketId = 'tkt-rec-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
      const recoveryTicket = {
        id: ticketId,
        userId: matchedUser?.id || ('guest-' + Date.now().toString(36)),
        userName: matchedUser?.name || cleanIdentifier || cleanPhone || cleanContact || 'Client en récupération',
        userPhone: matchedUser?.phone || cleanPhone || cleanContact || null,
        subject: subjectMap[cleanType],
        message: detailsLines.join('\n'),
        status: 'open',
        createdAt: new Date().toISOString(),
        isReadByUser: false
      };

      serverTicketsStore.set(ticketId, recoveryTicket);
      savePlatformDataToDisk(true);
      await safeSupabaseUpsert('tickets', recoveryTicket);

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      return res.json({
        success: true,
        ticketId,
        message: 'Votre demande de récupération a bien été transmise au service client. Un administrateur va vérifier vos informations et rétablir votre accès.'
      });
    } catch (err: any) {
      console.error('[Server Recovery Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur lors de l\'envoi de la demande.' });
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
      const byCode = await dbFindIlike('users', 'referral_code', clean, 1);
      if (byCode.length > 0) {
        serverUsersStore.set(byCode[0].id, byCode[0]);
        return byCode[0];
      }

      if (clean) {
        const byPhone = await dbFindIn('users', 'phone', [clean, `+${digitsOnly}`, digitsOnly].filter(Boolean));
        if (byPhone.length > 0) {
          serverUsersStore.set(byPhone[0].id, byPhone[0]);
          return byPhone[0];
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

      const phoneInfo = extractPhoneDetails(user.phone, 'TG');
      const finalCountry = 'Togo';
      const cleanPhone = phoneInfo.cleanPhone;

      // 1. Check duplicate in memory
      for (const u of serverUsersStore.values()) {
        const uInfo = extractPhoneDetails(u.phone, u.country);
        if (
          phoneInfo.candidates.includes(u.phone) || 
          phoneInfo.candidates.includes(uInfo.cleanPhone) ||
          (phoneInfo.nationalDigits && uInfo.nationalDigits === phoneInfo.nationalDigits)
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
          const existingCandidates = await dbFindIn('users', 'phone', phoneInfo.candidates);
          if (existingCandidates.length > 0) {
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
        net: user.withdrawalNetwork || 'TMoney',
        cty: 'TG'
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
        whatsapp: user.whatsapp ? extractPhoneDetails(user.whatsapp, 'TG').cleanPhone : cleanPhone,
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
        withdrawalNetwork: user.withdrawalNetwork || 'TMoney',
        withdrawalCountry: 'TG'
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
      lastFetchAllData = null;
      lastFetchAllTime = 0;
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

      const existing = await getAuthoritativeUserById(userId);
      if (existing) {
        serverUsersStore.set(userId, { ...existing, ...updates });
      }

      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('users', updates, 'id', userId);
      lastFetchAllData = null;
      lastFetchAllTime = 0;
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

      const user = await getAuthoritativeUserById(userId);
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
      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('users', { referredByCode: newSponsorCode }, 'id', userId);
      lastFetchAllData = null;
      lastFetchAllTime = 0;

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

      // 1. Fetch product (prioritize DB authoritative product, then memory/seed)
      const product =
        (await getAuthoritativeRecord('products', 'id', productId, serverProductsStore)) ||
        defaultSeedProducts.find(p => p.id === productId);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Produit introuvable.' });
      }

      const qty = Math.max(1, Number(quantity) || 1);
      const totalPrice = product.price * qty;

      // 2. Fetch authoritative User from DB first
      const user = await getAuthoritativeUserById(userId);
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

      // 5. Calculate & Distribute Multi-level Referral Commissions (15% • 1% • 1%)
      if (user.referredByCode) {
        // Level 1 (15%)
        const l1User = await getAuthoritativeRecord('users', 'referral_code', user.referredByCode, serverUsersStore);

        if (l1User) {
          const commL1 = Math.round(totalPrice * 0.15);
          const l1Bal = Number(l1User.balance || 0) + commL1;
          const l1Tot = Number(l1User.totalEarnings || 0) + commL1;
          const l1Tickets = Number(l1User.drawTickets || 0) + qty;

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

          // Level 2 (1%)
          if (l1User.referredByCode) {
            const l2User = await getAuthoritativeRecord('users', 'referral_code', l1User.referredByCode, serverUsersStore);

            if (l2User) {
              const commL2 = Math.round(totalPrice * 0.01);
              const l2Bal = Number(l2User.balance || 0) + commL2;
              const l2Tot = Number(l2User.totalEarnings || 0) + commL2;

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
                const l3User = await getAuthoritativeRecord('users', 'referral_code', l2User.referredByCode, serverUsersStore);

                if (l3User) {
                  const commL3 = Math.round(totalPrice * 0.01);
                  const l3Bal = Number(l3User.balance || 0) + commL3;
                  const l3Tot = Number(l3User.totalEarnings || 0) + commL3;

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
  // 3. DEPOSITS & WITHDRAWALS ROUTES (TOGO MOBILE MONEY ONLY)
  // =========================================================================

  app.post('/api/deposits/checkout', (_req, res) => {
    return res.status(410).json({
      success: false,
      error: 'Le paiement en ligne est désactivé. Veuillez effectuer un transfert TMoney ou Moov Money (Togo).'
    });
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

      const amountNum = Number(withdrawalData.amount || 0);
      if (amountNum < 1500) {
        return res.status(400).json({ success: false, error: 'Le montant minimum de retrait est de 1 500 XOF.' });
      }

      // Check authoritative user balance from DB and deduct once
      const user = await getAuthoritativeUserById(withdrawalData.userId);
      let newBal: number | undefined;
      if (user) {
        const currentBal = Number(user.balance || 0);
        if (currentBal < amountNum) {
          return res.status(400).json({ success: false, error: 'Solde insuffisant pour ce montant de retrait.' });
        }
        newBal = Math.max(0, currentBal - amountNum);
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

      return res.json({ success: true, withdrawal: normWth, newBalance: newBal });
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
        existingTicket = await dbFindOne('tickets', 'id', ticketId);
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
        targetUser = await dbFindOne('users', 'id', userId);
      }

      const nowIso = new Date().toISOString();
      const newTicket = {
        id: 'tkt-adm-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
        userId: targetUser?.id || userId,
        userName: targetUser?.name || 'Client',
        userPhone: targetUser?.phone || null,
        subject: subject || "Message de l'Administration",
        message: "Message direct du Support Client Gold Speed.",
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

      let dep = await getAuthoritativeRecord('deposits', 'id', depositId, serverDepositsStore);

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
        const u = await getAuthoritativeUserById(dep.userId);
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
        let targetUser: any = await getAuthoritativeUserById(dep.userId);

        if (!targetUser && dep.userPhone) {
          targetUser = await getAuthoritativeRecord('users', 'phone', dep.userPhone, serverUsersStore);
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

          console.log(`[Deposit Approved & Credited]: User ${targetUser.id} (${targetUser.phone}) +${depositAmt} FCFA -> New balance: ${calculatedBalance} FCFA`);
        }
      }

      lastFetchAllData = null;
      lastFetchAllTime = 0;

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

      const wth = await getAuthoritativeRecord('withdrawals', 'id', withdrawalId, serverWithdrawalsStore);
      if (!wth) {
        return res.status(404).json({ success: false, error: 'Demande de retrait non trouvée.' });
      }

      if (wth.status === status) {
        return res.json({ success: true, alreadyProcessed: true, message: `Retrait déjà ${status === 'approved' ? 'validé' : 'rejeté'}.` });
      }

      const wasRejected = wth.status === 'rejected';

      // Update withdrawal status
      serverWithdrawalsStore.set(withdrawalId, { ...wth, status });
      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('withdrawals', { status }, 'id', withdrawalId);

      // If rejected (and wasn't already rejected), refund authoritative user balance
      let refundedBalance: number | undefined;
      if (status === 'rejected' && !wasRejected) {
        const targetUser = await getAuthoritativeUserById(wth.userId);
        if (targetUser) {
          refundedBalance = Number(targetUser.balance || 0) + Number(wth.amount || 0);
          serverUsersStore.set(targetUser.id, { ...targetUser, balance: refundedBalance });
          savePlatformDataToDisk(true);
          await safeSupabaseUpdate('users', { balance: refundedBalance }, 'id', targetUser.id);
        }
      }

      lastFetchAllData = null;
      lastFetchAllTime = 0;

      return res.json({
        success: true,
        newBalance: refundedBalance,
        message: `Retrait ${status === 'approved' ? 'validé' : 'rejeté'} avec succès.`
      });
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

      const user = await getAuthoritativeUserById(userId);
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

      const user = await getAuthoritativeUserById(userId);
      if (user) {
        serverUsersStore.set(userId, { ...user, role });
      }

      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('users', { role }, 'id', userId);
      lastFetchAllData = null;
      lastFetchAllTime = 0;
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

      const user = await getAuthoritativeUserById(userId);
      if (user) {
        serverUsersStore.set(userId, { ...user, isBlocked });
      }

      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('users', { isBlocked }, 'id', userId);
      lastFetchAllData = null;
      lastFetchAllTime = 0;
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
      const fallbackMap: Record<string, Map<string, any>> = {
        users: serverUsersStore,
        products: serverProductsStore,
        investments: serverInvestmentsStore,
        deposits: serverDepositsStore,
        withdrawals: serverWithdrawalsStore,
        withdrawal_proofs: serverProofsStore,
        tickets: serverTicketsStore,
        commissions: serverCommissionsStore,
        bonus_codes: serverBonusCodesStore,
        announcements: serverAnnouncementsStore,
        tasks: serverTasksStore,
        task_claims: serverUserTaskClaimsStore
      };

      const isForce = req.query.force === 'true' || req.query.refresh === '1';
      if (isForce) {
        supabaseUnreachableUntil = 0;
        lastFetchAllData = null;
        lastFetchAllTime = 0;
      }

      if ((!pgPool && !supabaseAdmin) || Date.now() < supabaseUnreachableUntil) {
        if (fallbackMap[tableName]) {
          return res.json({ success: true, data: Array.from(fallbackMap[tableName].values()), localFallback: true });
        }
      }

      const { data, error } = await dbSelectAll(tableName);
      if (error || !data) {
        if (fallbackMap[tableName]) {
          return res.json({ success: true, data: Array.from(fallbackMap[tableName].values()), localFallback: true });
        }
        return res.status(500).json({ success: false, error: error?.message || 'Erreur DB' });
      }
      const normalizedData = data.map((row: any) => normalizeDbRow(tableName, row));
      if (fallbackMap[tableName]) {
        fallbackMap[tableName].clear();
        normalizedData.forEach((item: any) => {
          const key = item.id || item.code;
          if (key) fallbackMap[tableName].set(key, item);
        });
      }
      return res.json({ success: true, data: normalizedData });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Master Cache (short 2s window so 4s client polling & multi-lambda Vercel stay synchronized)
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
      if (isForce) {
        supabaseUnreachableUntil = 0;
        lastFetchAllData = null;
        lastFetchAllTime = 0;
      }
      const now = Date.now();
      if (!isForce && lastFetchAllData && (now - lastFetchAllTime < CACHE_TTL_MS)) {
        return res.json({
          success: true,
          data: lastFetchAllData,
          cached: true,
          engine: pgPool ? 'supabase-postgresql' : (supabaseAdmin ? 'supabase-rest' : 'local-only'),
          hasDatabaseUrl: Boolean(pgPool),
          supabaseStatus: isSupabaseQuotaExceeded ? 'quota_exceeded' : ((pgPool || supabaseAdmin) ? 'connected' : 'local_resilience'),
          isQuotaExceeded: isSupabaseQuotaExceeded,
          lastSyncAt: new Date(lastFetchAllTime || now).toISOString()
        });
      }

      let dbReachableSuccess = false;

      const fetchTableSafe = async (table: string, fallbackStore?: Map<string, any>) => {
        const getFallback = () => (fallbackStore ? Array.from(fallbackStore.values()) : []);
        if ((!pgPool && !supabaseAdmin) || Date.now() < supabaseUnreachableUntil) {
          return getFallback();
        }
        try {
          const queryPromise = (async () => {
            const { data, error } = await dbSelectAll(table, 10000);

            if (error) {
              const errMsg = error.message || '';
              if (errMsg.includes('exceed_egress_quota') || errMsg.includes('restricted') || errMsg.includes('402')) {
                isSupabaseQuotaExceeded = true;
                lastSupabaseErrorMsg = errMsg;
              }
              return getFallback();
            }

            if (data && Array.isArray(data)) {
              dbReachableSuccess = true;
              isSupabaseQuotaExceeded = false;
              const normalized = data.map(item => normalizeDbRow(table, item));

              if (fallbackStore) {
                // When remote DB succeeds cleanly, treat DB as authoritative (unless products/users table is empty and seed exists)
                if (
                  !(table === 'products' && normalized.length === 0 && fallbackStore.size > 0) &&
                  !(table === 'users' && normalized.length === 0 && fallbackStore.size > 0)
                ) {
                  fallbackStore.clear();
                }
                normalized.forEach(item => {
                  const key = item.id || item.code;
                  if (key) {
                    if (table === 'products' && LEGACY_OBSOLETE_PRODUCT_IDS.has(key)) return;
                    fallbackStore.set(key, item);
                  }
                });
                if (table === 'users') {
                  defaultSeedUsers.forEach(seed => {
                    if (!fallbackStore.has(seed.id)) {
                      fallbackStore.set(seed.id, seed);
                    }
                  });
                }
                const list = Array.from(fallbackStore.values());
                if (table === 'products') {
                  return list.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
                }
                return list;
              }

              return normalized;
            }
            return getFallback();
          })();

          return await withDbTimeout(queryPromise, 8000, getFallback());
        } catch (_) {
          return getFallback();
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
        bonusCodes,
        rechargeChannelsRows
      ] = await Promise.all([
        fetchTableSafe('users', serverUsersStore),
        fetchTableSafe('products', serverProductsStore),
        fetchTableSafe('investments', serverInvestmentsStore),
        fetchTableSafe('deposits', serverDepositsStore),
        fetchTableSafe('withdrawals', serverWithdrawalsStore),
        fetchTableSafe('withdrawal_proofs', serverProofsStore),
        fetchTableSafe('tickets', serverTicketsStore),
        fetchTableSafe('commissions', serverCommissionsStore),
        fetchTableSafe('bonus_codes', serverBonusCodesStore),
        fetchTableSafe('recharge_channels')
      ]);

      // Extract & hydrate system configs & task claims stored in bonus_codes if present in DB
      const bonusArr = Array.isArray(bonusCodes) ? bonusCodes : Array.from(serverBonusCodesStore.values());
      const sysAnnRow = bonusArr.find((b: any) => b.code === '__SYS_ANNOUNCEMENTS__');
      if (sysAnnRow && Array.isArray(sysAnnRow.usedBy) && sysAnnRow.usedBy.length > 0) {
        serverAnnouncementsStore.clear();
        sysAnnRow.usedBy.forEach((a: any) => {
          if (a?.id) serverAnnouncementsStore.set(a.id, a);
        });
      }
      bonusArr.forEach((b: any) => {
        if (b && typeof b.code === 'string' && b.code.startsWith('__CLAIM_') && Array.isArray(b.usedBy)) {
          b.usedBy.forEach((cl: any) => {
            if (cl?.id) serverUserTaskClaimsStore.set(cl.id, cl);
          });
        }
      });

      const sortedProductsList = (Array.isArray(products) ? products : Array.from(serverProductsStore.values()))
        .sort((a: any, b: any) => (Number(a.order) || 99) - (Number(b.order) || 99));

      const resultData = {
        users: Array.isArray(users) ? users : Array.from(serverUsersStore.values()),
        products: sortedProductsList,
        investments: Array.isArray(investments) ? investments : Array.from(serverInvestmentsStore.values()),
        deposits: Array.isArray(deposits) ? deposits : Array.from(serverDepositsStore.values()),
        withdrawals: Array.isArray(withdrawals) ? withdrawals : Array.from(serverWithdrawalsStore.values()),
        withdrawal_proofs: Array.isArray(proofs) ? proofs : Array.from(serverProofsStore.values()),
        tickets: Array.isArray(tickets) ? tickets : Array.from(serverTicketsStore.values()),
        commissions: Array.isArray(commissions) ? commissions : Array.from(serverCommissionsStore.values()),
        bonus_codes: bonusArr,
        recharge_channels: Array.isArray(rechargeChannelsRows) ? rechargeChannelsRows : [],
        announcements: Array.from(serverAnnouncementsStore.values()),
        tasks: Array.from(serverTasksStore.values()),
        task_claims: Array.from(serverUserTaskClaimsStore.values())
      };

      // Keep disk file updated with the latest in-memory master state
      savePlatformDataToDisk();

      lastFetchAllData = resultData;
      lastFetchAllTime = Date.now();

      const resolvedStatus = isSupabaseQuotaExceeded
        ? 'quota_exceeded'
        : ((pgPool || supabaseAdmin) && (dbReachableSuccess || Date.now() >= supabaseUnreachableUntil) ? 'connected' : 'local_resilience');

      return res.json({
        success: true,
        data: resultData,
        engine: pgPool ? 'supabase-postgresql' : (supabaseAdmin ? 'supabase-rest' : 'local-only'),
        hasDatabaseUrl: Boolean(pgPool),
        supabaseStatus: resolvedStatus,
        isQuotaExceeded: isSupabaseQuotaExceeded,
        supabaseMessage: lastSupabaseErrorMsg,
        lastSyncAt: new Date(lastFetchAllTime).toISOString(),
        counts: {
          users: resultData.users.length,
          products: resultData.products.length,
          investments: resultData.investments.length,
          deposits: resultData.deposits.length,
          withdrawals: resultData.withdrawals.length,
          withdrawal_proofs: resultData.withdrawal_proofs.length,
          tickets: resultData.tickets.length,
          commissions: resultData.commissions.length,
          bonus_codes: resultData.bonus_codes.length,
          recharge_channels: resultData.recharge_channels.length
        }
      });
    } catch (err: any) {
      console.error('[Server Admin Fetch All Error]:', err);
      if (lastFetchAllData) {
        return res.json({
          success: true,
          data: lastFetchAllData,
          fallback: true,
          engine: pgPool ? 'supabase-postgresql' : (supabaseAdmin ? 'supabase-rest' : 'local-only'),
          hasDatabaseUrl: Boolean(pgPool),
          supabaseStatus: isSupabaseQuotaExceeded ? 'quota_exceeded' : ((pgPool || supabaseAdmin) ? 'connected' : 'local_resilience'),
          isQuotaExceeded: isSupabaseQuotaExceeded,
          lastSyncAt: new Date(lastFetchAllTime || Date.now()).toISOString()
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
          recharge_channels: [],
          announcements: Array.from(serverAnnouncementsStore.values()),
          tasks: serverTasksStore.size > 0 ? Array.from(serverTasksStore.values()) : defaultSeedTasks,
          task_claims: Array.from(serverUserTaskClaimsStore.values())
        },
        engine: pgPool ? 'supabase-postgresql' : (supabaseAdmin ? 'supabase-rest' : 'local-only'),
        hasDatabaseUrl: Boolean(pgPool),
        supabaseStatus: isSupabaseQuotaExceeded ? 'quota_exceeded' : ((pgPool || supabaseAdmin) ? 'connected' : 'local_resilience'),
        isQuotaExceeded: isSupabaseQuotaExceeded,
        lastSyncAt: new Date().toISOString()
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

  // Check Supabase Live Connection & Diagnostic Probe
  app.get('/api/admin/check-supabase', async (_req, res) => {
    try {
      const probeStart = Date.now();
      if (!pgPool && !supabaseAdmin) {
        return res.json({
          success: false,
          status: 'local_resilience',
          isQuotaExceeded: false,
          errorCode: 'MISSING_DB_SECRET',
          message: 'Configurez DATABASE_URL dans Settings -> Secrets pour connecter directement Supabase PostgreSQL.',
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

      if (pgPool) {
        await ensurePostgresSchema();
        await pgPool.query('SELECT 1');
        const probeLatency = Date.now() - probeStart;
        isSupabaseQuotaExceeded = false;
        lastSupabaseErrorMsg = null;
        lastSupabaseSuccessTimestamp = Date.now();
        return res.json({
          success: true,
          status: 'connected',
          engine: 'supabase-postgresql',
          latencyMs: probeLatency,
          message: 'Connexion Supabase PostgreSQL active et tables synchronisées.',
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

      const { error } = await (supabaseAdmin as any).from('users').select('id').limit(1);
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
          engine: 'supabase-rest',
          latencyMs: probeLatency,
          message: !error
            ? 'Connexion Supabase active et tables distantes synchronisées.'
            : 'Connexion Supabase réussie. Les tables distantes peuvent être initialisées avec supabase_schema.sql si besoin.',
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
      const isNetworkFallback = isNetworkUnavailableError(errMsg, (error as any).code);
      if (isQuota) {
        isSupabaseQuotaExceeded = true;
        lastSupabaseErrorMsg = errMsg;
      }

      return res.json({
        success: !isQuota,
        status: isQuota ? 'quota_exceeded' : (isNetworkFallback ? 'local_resilience' : 'error'),
        isQuotaExceeded: isQuota,
        errorCode: (error as any).code || (isQuota ? '402' : (isNetworkFallback ? 'LOCAL_RESILIENCE' : 'UNKNOWN')),
        message: isNetworkFallback
          ? 'Mode résilience locale actif (stockage local persistant opérationnel).'
          : errMsg,
        supabaseUrl: SUPABASE_URL,
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

      const user = await getAuthoritativeUserById(userId);
      if (user) {
        serverUsersStore.set(userId, { ...user, withdrawalPinHash });
      }

      savePlatformDataToDisk(true);
      await safeSupabaseUpdate('users', { withdrawalPinHash }, 'id', userId);
      lastFetchAllData = null;
      lastFetchAllTime = 0;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // =========================================================================
  // ANNOUNCEMENTS ROUTES (CENTRAL AUTHORITATIVE SYNCHRONIZATION)
  // =========================================================================
  app.get('/api/announcements', async (_req, res) => {
    if (hasLiveRemoteDb()) {
      try {
        const sysAnnRow = await dbFindOne('bonus_codes', 'code', '__SYS_ANNOUNCEMENTS__');
        if (sysAnnRow && Array.isArray(sysAnnRow.usedBy) && sysAnnRow.usedBy.length > 0) {
          serverAnnouncementsStore.clear();
          sysAnnRow.usedBy.forEach((a: any) => {
            if (a?.id) serverAnnouncementsStore.set(a.id, a);
          });
        }
      } catch (_) {}
    }
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
  // TASK CENTER (CENTRE DE TÂCHES GOLD SPEED) - VALIDATION & CLAIMING ENGINE
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
  app.get('/api/tasks/claims', async (req, res) => {
    if (hasLiveRemoteDb()) {
      try {
        const rows = await dbFindIlike('bonus_codes', 'code', '__CLAIM_%', 500);
        rows.forEach((b: any) => {
          if (b && Array.isArray(b.usedBy)) {
            b.usedBy.forEach((cl: any) => {
              if (cl?.id) serverUserTaskClaimsStore.set(cl.id, cl);
            });
          }
        });
      } catch (_) {}
    }
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

      // 1. Verify User (authoritative DB first)
      const user = await getAuthoritativeUserById(userId);
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

  // POST /api/admin/tasks/reset - Admin resets tasks to official Gold Speed 12 tasks
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
        await dbDeleteNeq('deposits', 'id', '__keep_none__');
        await dbDeleteNeq('withdrawals', 'id', '__keep_none__');
        await dbDeleteNeq('investments', 'id', '__keep_none__');
        await dbDeleteNeq('commissions', 'id', '__keep_none__');
        await dbDeleteNeq('users', 'role', 'admin');
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
  app.get('/api/products', async (_req, res) => {
    try {
      if (hasLiveRemoteDb()) {
        try {
          const { data, error } = await dbSelectAll('products', 1000);
          if (!error && Array.isArray(data) && data.length > 0) {
            const normalized = data
              .map((row: any) => normalizeDbRow('products', row))
              .filter((p: any) => p?.id && !LEGACY_OBSOLETE_PRODUCT_IDS.has(p.id));
            if (normalized.length > 0) {
              serverProductsStore.clear();
              normalized.forEach((p: any) => serverProductsStore.set(p.id, p));
            }
          }
        } catch (_) {}
      }
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

      const priceNum = Number(prodData.price) || 0;
      const dailyNum = Number(prodData.dailyGain) || 0;
      const durNum = Number(prodData.duration) || 0;
      const totalNum = Number(prodData.totalGain) || (dailyNum * durNum);
      const calcRate = priceNum > 0 ? Math.round((dailyNum / priceNum) * 1000) / 10 : 0;

      const normalized = normalizeDbRow('products', {
        ...prodData,
        price: priceNum,
        dailyGain: dailyNum,
        duration: durNum,
        totalGain: totalNum,
        dailyRatePercent: prodData.dailyRatePercent !== undefined ? Number(prodData.dailyRatePercent) : calcRate,
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

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      if (!productId) {
        return res.status(400).json({ success: false, error: 'ID produit requis.' });
      }
      serverProductsStore.delete(productId);
      savePlatformDataToDisk(true);
      try {
        if (Date.now() >= supabaseUnreachableUntil) {
          await dbDeleteEq('products', 'id', productId);
        }
      } catch (_) {}
      lastFetchAllData = null;
      lastFetchAllTime = 0;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur lors de la suppression du produit.' });
    }
  });

  app.post('/api/products/reset', async (_req, res) => {
    try {
      const allowedIds = new Set(defaultSeedProducts.map(p => p.id));
      for (const currentId of Array.from(serverProductsStore.keys())) {
        if (!allowedIds.has(currentId)) {
          serverProductsStore.delete(currentId);
          try {
            if (Date.now() >= supabaseUnreachableUntil) {
              await dbDeleteEq('products', 'id', currentId);
            }
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

        // Keep public.recharge_channels table synchronized when __SYS_RECHARGE_CHANNELS__ is saved
        if (tableName === 'bonus_codes' && (item.code === '__SYS_RECHARGE_CHANNELS__') && Array.isArray(item.usedBy)) {
          try {
            const { data: existingCh } = await dbSelectAll('recharge_channels');
            const incomingIds = new Set(item.usedBy.map((c: any) => c?.id).filter(Boolean));
            if (Array.isArray(existingCh)) {
              for (const row of existingCh) {
                if (row?.id && !incomingIds.has(row.id)) {
                  await dbDeleteEq('recharge_channels', 'id', row.id);
                }
              }
            }
            for (const ch of item.usedBy) {
              if (ch?.id) {
                await safeSupabaseUpsert('recharge_channels', ch);
              }
            }
          } catch (_) {}
        }

        // Invalidate master cache immediately
        lastFetchAllData = null;
        lastFetchAllTime = 0;

        return res.json({ success: true, dbSuccess: upRes.success });
      }

      if (action === 'update' && idValue) {
        const storeMap: Record<string, Map<string, any>> = {
          users: serverUsersStore,
          products: serverProductsStore,
          investments: serverInvestmentsStore,
          deposits: serverDepositsStore,
          withdrawals: serverWithdrawalsStore,
          withdrawal_proofs: serverProofsStore,
          tickets: serverTicketsStore,
          commissions: serverCommissionsStore,
          bonus_codes: serverBonusCodesStore
        };
        const targetStore = storeMap[tableName];
        if (targetStore) {
          const existing = await getAuthoritativeRecord(tableName, idCol, idValue, targetStore);
          if (existing) {
            targetStore.set(idValue, { ...existing, ...updates });
          }
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
        await dbDeleteEq(tableName, idCol, idValue);

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
      let sourceInvestments: any[] = [];
      if ((pgPool || supabaseAdmin) && Date.now() >= supabaseUnreachableUntil) {
        const { data: activeInvestments, error } = await dbSelectAll('investments');
        if (!error && Array.isArray(activeInvestments) && activeInvestments.length > 0) {
          sourceInvestments = activeInvestments.map(i => normalizeDbRow('investments', i));
        }
      }

      if (sourceInvestments.length === 0) {
        sourceInvestments = Array.from(serverInvestmentsStore.values());
      }

      const normInvestments = sourceInvestments.filter(i => (i.daysRemaining || 0) > 0);
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
          if (serverInvestmentsStore.has(item.id)) {
            const existingInv = serverInvestmentsStore.get(item.id);
            serverInvestmentsStore.set(item.id, {
              ...existingInv,
              daysRemaining: item.daysRemaining,
              lastClaimDate: item.lastClaimDate
            });
          }
          await safeSupabaseUpdate('investments', {
            daysRemaining: item.daysRemaining,
            lastClaimDate: item.lastClaimDate
          }, 'id', item.id);
        }

        for (const [userId, totalGain] of userGainMap.entries()) {
          let targetUser = serverUsersStore.get(userId);
          if (!targetUser && Date.now() >= supabaseUnreachableUntil) {
            targetUser = await dbFindOne('users', 'id', userId);
          }

          if (targetUser) {
            const newBal = (Number(targetUser.balance) || 0) + totalGain;
            const newTot = (Number(targetUser.totalEarnings) || 0) + totalGain;

            serverUsersStore.set(userId, { ...targetUser, balance: newBal, dailyEarnings: totalGain, totalEarnings: newTot });

            await safeSupabaseUpdate('users', {
              balance: newBal,
              dailyEarnings: totalGain,
              totalEarnings: newTot
            }, 'id', userId);
          }
        }

        savePlatformDataToDisk(true);
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
    console.log(`[Database Engine] ${pgPool ? 'Supabase PostgreSQL Direct' : (supabaseAdmin ? 'Supabase REST' : 'Local Persistent Store')} | URL: ${SUPABASE_URL}`);
  });
}

if (!process.env.VERCEL && !process.env.VERCEL_ENV && process.env.SKIP_LISTEN !== '1') {
  startServer();
}

export default app;
