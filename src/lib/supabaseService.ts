import { supabase } from './supabase';

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

export async function upsertItem<T>(tableName: string, item: T): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).upsert(item as any);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' upsert error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Error saving to '${tableName}':`, err);
    return false;
  }
}

export async function insertItem<T>(tableName: string, item: T): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).insert(item as any);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' insert error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Error inserting to '${tableName}':`, err);
    return false;
  }
}

export async function updateItem<T>(
  tableName: string,
  updates: Partial<T>,
  idValue: string,
  idCol: string = 'id'
): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).update(updates as any).eq(idCol, idValue);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' update error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Error updating '${tableName}':`, err);
    return false;
  }
}

export async function syncTableData<T>(tableName: string, items: T[]): Promise<boolean> {
  try {
    if (!items || items.length === 0) return true;
    const { error } = await supabase.from(tableName).upsert(items as any);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' sync error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Error syncing to table '${tableName}':`, err);
    return false;
  }
}

export async function deleteRecord(tableName: string, primaryKeyValue: string, idColName: string = 'id'): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).delete().eq(idColName, primaryKeyValue);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' delete error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Error deleting from table '${tableName}':`, err);
    return false;
  }
}

export async function saveSystemConfig<T>(configKey: string, value: T): Promise<boolean> {
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
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Error saving system config '${configKey}':`, err);
    return false;
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
