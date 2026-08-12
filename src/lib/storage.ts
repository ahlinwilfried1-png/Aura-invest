/**
 * Safe local and session storage wrappers that gracefully handle QuotaExceededError
 * and restrict payload sizes to prevent browser crashes.
 */

export function safeSetLocalStorage(key: string, value: any): boolean {
  try {
    const stringified = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringified);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] localStorage.setItem failed for key "${key}":`, err);
    return attemptQuotaRecoveryAndSave(key, value);
  }
}

function attemptQuotaRecoveryAndSave(key: string, value: any): boolean {
  try {
    let lightweight: any = value;
    if (typeof value === 'string') {
      try {
        lightweight = JSON.parse(value);
      } catch (_) {
        lightweight = value;
      }
    }

    if (Array.isArray(lightweight)) {
      // Keep at most 25 items and strip base64 images > 500 chars
      lightweight = lightweight.slice(0, 25).map((item: any) => {
        if (item && typeof item === 'object') {
          const copy = { ...item };
          if (copy.imageUrl && typeof copy.imageUrl === 'string' && copy.imageUrl.length > 150000) {
            copy.imageUrl = null;
          }
          if (copy.screenshotUrl && typeof copy.screenshotUrl === 'string' && copy.screenshotUrl.length > 150000) {
            copy.screenshotUrl = null;
          }
          return copy;
        }
        return item;
      });
    } else if (lightweight && typeof lightweight === 'object') {
      const copy = { ...lightweight };
      if (copy.imageUrl && typeof copy.imageUrl === 'string' && copy.imageUrl.length > 150000) {
        copy.imageUrl = null;
      }
      if (copy.screenshotUrl && typeof copy.screenshotUrl === 'string' && copy.screenshotUrl.length > 150000) {
        copy.screenshotUrl = null;
      }
      lightweight = copy;
    }

    const stringified = typeof lightweight === 'string' ? lightweight : JSON.stringify(lightweight);
    localStorage.setItem(key, stringified);
    return true;
  } catch (err2) {
    console.warn(`[SafeStorage] Secondary save failed for key "${key}", clearing heavy cache keys...`, err2);
    
    // Clear known non-critical heavy keys if quota is still full
    try {
      const nonEssentialKeys = [
        'aurainvest_withdrawal_proofs',
        'fintech_withdrawal_proofs',
        'fintech_revenue_logs',
        'fintech_announcements',
        'fintech_faqs',
        'fintech_tickets'
      ];
      for (const k of nonEssentialKeys) {
        if (k !== key) {
          try {
            localStorage.removeItem(k);
          } catch (_) {}
        }
      }
      
      const str = typeof value === 'string' ? value.slice(0, 5000) : JSON.stringify(value).slice(0, 5000);
      localStorage.setItem(key, str);
      return true;
    } catch (finalErr) {
      console.warn(`[SafeStorage] Could not write key "${key}" to localStorage:`, finalErr);
      return false;
    }
  }
}

export function safeGetLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] localStorage.getItem failed for key "${key}":`, err);
    return null;
  }
}

export function safeRemoveLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] localStorage.removeItem failed for key "${key}":`, err);
    return false;
  }
}

export function safeSetSessionStorage(key: string, value: any): boolean {
  try {
    const stringified = typeof value === 'string' ? value : JSON.stringify(value);
    sessionStorage.setItem(key, stringified);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] sessionStorage.setItem failed for key "${key}":`, err);
    return false;
  }
}

export function safeGetSessionStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] sessionStorage.getItem failed for key "${key}":`, err);
    return null;
  }
}

export function safeRemoveSessionStorage(key: string): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] sessionStorage.removeItem failed for key "${key}":`, err);
    return false;
  }
}
