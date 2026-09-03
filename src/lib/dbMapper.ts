/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Bi-directional Database Mapper & Normalizer for Supabase PostgreSQL tables
 * Converts seamlessly between JS Model (camelCase) and Supabase Schema (snake_case / camelCase)
 */

export interface FieldMapping {
  jsKey: string;
  dbKeys: string[]; // Primary snake_case and fallback camelCase column names
  defaultValue?: any;
}

export const SCHEMA_DEFINITIONS: Record<string, FieldMapping[]> = {
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

/**
 * Transforms a raw row from Supabase into a clean, typed JS Model object (camelCase)
 */
export function normalizeFromDbRow<T = any>(tableName: string, dbRow: any): T {
  if (!dbRow || typeof dbRow !== 'object') return dbRow;

  const mappings = SCHEMA_DEFINITIONS[tableName];
  if (!mappings) {
    // Generic fallback: map any snake_case keys to camelCase
    const result: any = { ...dbRow };
    for (const key of Object.keys(dbRow)) {
      if (key.includes('_')) {
        const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        if (!(camel in result)) {
          result[camel] = dbRow[key];
        }
      }
    }
    return result as T;
  }

  const jsObject: any = {};

  for (const m of mappings) {
    let valueFound = false;

    // 1. Direct camelCase check
    if (m.jsKey in dbRow && dbRow[m.jsKey] !== undefined) {
      jsObject[m.jsKey] = dbRow[m.jsKey];
      valueFound = true;
    } else {
      // 2. Check all possible DB column variations (e.g. created_at, createdAt)
      for (const dbKey of m.dbKeys) {
        if (dbKey in dbRow && dbRow[dbKey] !== undefined) {
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

  // Preserve other custom properties that might be on the object
  for (const k of Object.keys(dbRow)) {
    if (!(k in jsObject)) {
      const camel = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (!(camel in jsObject)) {
        jsObject[camel] = dbRow[k];
      }
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
 * Transforms a JS Model object into a DB payload prepared for Supabase
 * @param tableName Table name
 * @param jsObject JS Model object
 * @param targetColStyle 'snake_case' (standard SQL) | 'camelCase' | 'auto'
 */
export function prepareForDbPayload(
  tableName: string, 
  jsObject: any, 
  knownColumns?: Set<string> | null,
  allowDefaults: boolean = true
): Record<string, any> {
  if (!jsObject || typeof jsObject !== 'object') return jsObject;

  const mappings = SCHEMA_DEFINITIONS[tableName];
  const payload: Record<string, any> = {};

  if (!mappings) {
    // If no explicit mapping, pass fields as-is
    return { ...jsObject };
  }

  for (const m of mappings) {
    // Find the value in jsObject (check jsKey first, then dbKeys)
    let val = jsObject[m.jsKey];
    if (val === undefined) {
      for (const dbk of m.dbKeys) {
        if (jsObject[dbk] !== undefined) {
          val = jsObject[dbk];
          break;
        }
      }
    }

    // ONLY apply default values if allowDefaults is true (e.g. for creating new records, NOT for partial updates)
    if (allowDefaults && val === undefined && m.defaultValue !== undefined) {
      val = m.defaultValue;
    }

    if (val !== undefined) {
      // If we know the exact columns present in Supabase table:
      if (knownColumns && knownColumns.size > 0) {
        let matched = false;
        for (const candidate of m.dbKeys) {
          if (knownColumns.has(candidate)) {
            payload[candidate] = val;
            matched = true;
            break;
          }
        }
        if (!matched && knownColumns.has(m.jsKey)) {
          payload[m.jsKey] = val;
        }
      } else {
        // Default to the first DB key (standard snake_case, e.g. created_at)
        const primaryDbKey = m.dbKeys[0];
        payload[primaryDbKey] = val;
      }
    }
  }

  // Preserve any extra properties not found in schema definitions
  for (const k of Object.keys(jsObject)) {
    const isMapped = mappings.some(m => m.jsKey === k || m.dbKeys.includes(k));
    if (!isMapped && jsObject[k] !== undefined) {
      payload[k] = jsObject[k];
    }
  }

  return payload;
}
