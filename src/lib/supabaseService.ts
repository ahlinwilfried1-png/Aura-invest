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

export async function upsertItem<T>(tableName: string, item: T) {
  try {
    const { error } = await supabase.from(tableName).upsert(item);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' upsert error:`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase] Error saving to '${tableName}':`, err);
  }
}

export async function syncTableData<T>(tableName: string, items: T[]) {
  try {
    if (!items || items.length === 0) return;
    const { error } = await supabase.from(tableName).upsert(items);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' sync error:`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase] Error syncing to table '${tableName}':`, err);
  }
}

export async function deleteRecord(tableName: string, primaryKeyValue: string, idColName: string = 'id') {
  try {
    const { error } = await supabase.from(tableName).delete().eq(idColName, primaryKeyValue);
    if (error) {
      console.warn(`[Supabase] Table '${tableName}' delete error:`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase] Error deleting from table '${tableName}':`, err);
  }
}
