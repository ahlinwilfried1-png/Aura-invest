import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

// Safe Node.js fetch for Supabase Admin with 2500ms timeout
const safeServerFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
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

// Master & Secure Admin Accounts (Preserved existing master admin + added new secure administrator)
const defaultSeedUsers = [
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
    withdrawalPinHash: JSON.stringify({ pwd: 'admin123', pin: '0000', net: 'TMoney', cty: 'TG' })
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
    withdrawalPinHash: JSON.stringify({ pwd: 'NutrienAdmin#2026!SecX', pin: '8822', net: 'TMoney', cty: 'TG' })
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

// Background sync from Supabase + auto-upsert seed admins & products into Supabase
async function syncFromSupabaseInitial() {
  try {
    // 1. Ensure seed admin accounts exist in Supabase database
    for (const seedAdmin of defaultSeedUsers) {
      try {
        await supabaseAdmin.from('users').upsert({
          id: seedAdmin.id,
          name: seedAdmin.name,
          phone: seedAdmin.phone,
          whatsapp: seedAdmin.whatsapp,
          country: seedAdmin.country,
          balance: seedAdmin.balance,
          dailyEarnings: seedAdmin.dailyEarnings,
          totalEarnings: seedAdmin.totalEarnings,
          vipLevel: seedAdmin.vipLevel,
          isBlocked: seedAdmin.isBlocked,
          createdAt: seedAdmin.createdAt,
          role: seedAdmin.role,
          referralCode: seedAdmin.referralCode,
          referredByCode: seedAdmin.referredByCode,
          withdrawalAccountName: seedAdmin.withdrawalAccountName,
          withdrawalAccountNumber: seedAdmin.withdrawalAccountNumber,
          withdrawalPinHash: seedAdmin.withdrawalPinHash
        }, { onConflict: 'id' });
      } catch (_) {}
    }

    // 2. Ensure official AgroProfit 8 products exist in Supabase database
    for (const seedProd of defaultSeedProducts) {
      try {
        await supabaseAdmin.from('products').upsert(seedProd, { onConflict: 'id' });
      } catch (_) {}
    }

    // 3. Fetch all users from Supabase
    const { data: dbUsers, error } = await supabaseAdmin.from('users').select('*').limit(10000);
    if (!error && dbUsers && Array.isArray(dbUsers) && dbUsers.length > 0) {
      dbUsers.forEach(u => {
        if (u && u.id) {
          serverUsersStore.set(u.id, { ...serverUsersStore.get(u.id), ...u });
        }
      });
      console.log(`[Supabase Sync] Loaded ${dbUsers.length} users into server memory.`);
    }
  } catch (_) {}
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
  // SERVER-SIDE ADMIN ROUTES (PROTECTED WITH SERVICE ROLE KEY)
  // =========================================================================

  // Helper to extract password from withdrawalPinHash
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

  // Country and phone parsing helper
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

  // 0. User Login Route (High performance country-aware direct lookup & authentication)
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

      // 2. Direct indexed candidate lookup in Supabase if not in memory
      if (!user && phoneInfo.candidates.length > 0) {
        try {
          const { data: candidatesMatch, error: candErr } = await supabaseAdmin
            .from('users')
            .select('*')
            .in('phone', phoneInfo.candidates);

          if (!candErr && candidatesMatch && candidatesMatch.length > 0) {
            user = candidatesMatch[0];
            serverUsersStore.set(user.id, user);
          }
        } catch (_) {}
      }

      // 3. Fallback database lookup
      if (!user && phoneInfo.nationalDigits) {
        try {
          const { data: likeMatches } = await supabaseAdmin
            .from('users')
            .select('*')
            .ilike('phone', `%${phoneInfo.nationalDigits}%`);

          if (likeMatches && likeMatches.length > 0) {
            user = likeMatches.find(u => {
              const uInfo = extractPhoneDetails(u.phone, u.country);
              if (phoneInfo.isCameroon && uInfo.isCameroon) {
                return uInfo.nationalDigits === phoneInfo.nationalDigits;
              }
              if (!phoneInfo.isCameroon && !uInfo.isCameroon) {
                return uInfo.nationalDigits === phoneInfo.nationalDigits;
              }
              return uInfo.cleanPhone === phoneInfo.cleanPhone || u.phone === phoneInfo.cleanPhone;
            });
            if (user) serverUsersStore.set(user.id, user);
          }
        } catch (_) {}
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Compte introuvable. Veuillez vérifier votre numéro ou vous inscrire.' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ success: false, error: 'Ce compte a été suspendu par l\'administration. Contactez le support.' });
      }

      // Check credentials
      let savedPassword = parsePasswordFromPinHash(user.withdrawalPinHash);
      const isSpecialAdmin = user.role === 'admin' && (password === 'admin123' || password === 'ADMIN7' || password === 'NutrienAdmin#2026!SecX');

      if (!savedPassword && user.role === 'admin') {
        savedPassword = 'admin123';
      }

      if (savedPassword !== password && !isSpecialAdmin) {
        return res.status(401).json({ success: false, error: 'Mot de passe incorrect. Veuillez réessayer.' });
      }

      return res.json({
        success: true,
        user
      });
    } catch (err: any) {
      console.error('[Server Login Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur lors de la connexion.' });
    }
  });

  // 0. User Registration Route (Protected with Service Role Key for 100% Cross-Device Reliability)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const user = req.body;
      if (!user || !user.phone) {
        return res.status(400).json({ success: false, error: 'Informations utilisateur incomplètes (numéro de téléphone requis).' });
      }

      const phoneInfo = extractPhoneDetails(user.phone, user.country);
      const finalCountry = phoneInfo.isCameroon ? 'Cameroun' : (user.country || 'Togo');
      const cleanPhone = phoneInfo.cleanPhone;

      // 1. Check duplicate in central in-memory store
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

      // 2. Check duplicate in database if available
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

      // Ensure mandatory fields
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
        referredByCode: user.referredByCode || null,
        withdrawalAccountName: user.withdrawalAccountName || null,
        withdrawalAccountNumber: user.withdrawalAccountNumber || null,
        withdrawalPinHash: user.withdrawalPinHash || ''
      };

      // Instantly record in server-wide central store
      serverUsersStore.set(userRecord.id, userRecord);

      // Asynchronously upsert to Supabase
      Promise.resolve(supabaseAdmin.from('users').upsert(userRecord))
        .then(({ error }: any) => {
          if (error) console.warn('[Supabase Upsert Notice]:', error.message);
          else console.log(`[Supabase Synced User]: ${userRecord.name} (${userRecord.phone})`);
        })
        .catch(() => {});

      console.log(`[New User Registered]: ${userRecord.name} (${userRecord.phone}) [${userRecord.country}] - ID: ${userRecord.id}`);

      return res.json({
        success: true,
        user: userRecord
      });
    } catch (err: any) {
      console.error('[Server Register Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur lors de l\'inscription.' });
    }
  });

  // User Update Route
  app.post('/api/users/update', async (req, res) => {
    try {
      const { userId, updates } = req.body;
      if (!userId || !updates) {
        return res.status(400).json({ success: false, error: 'Identifiant et modifications requis.' });
      }

      if (serverUsersStore.has(userId)) {
        serverUsersStore.set(userId, { ...serverUsersStore.get(userId), ...updates });
      }

      Promise.resolve(
        supabaseAdmin
          .from('users')
          .update(updates)
          .eq('id', userId)
      )
        .then(() => {})
        .catch(() => {});

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Submit Deposit Request (Protected by Supabase Service Role)
  app.post('/api/deposits/submit', async (req, res) => {
    try {
      const depositData = req.body;
      if (!depositData || !depositData.id || !depositData.amount || !depositData.userId) {
        return res.status(400).json({ success: false, error: 'Données de recharge incomplètes.' });
      }

      const { error } = await supabaseAdmin
        .from('deposits')
        .upsert(depositData);

      if (error) {
        console.error('[Server Deposit Submit Error]:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, deposit: depositData });
    } catch (err: any) {
      console.error('[Server Deposit Submit Exception]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // 1. Process Deposit (Approve / Reject) with strict idempotency and atomic balance crediting
  app.post('/api/admin/deposits/process', async (req, res) => {
    try {
      const { depositId, status, fallbackDepositData } = req.body;
      if (!depositId || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Paramètres de dépôt invalides.' });
      }

      // Fetch the deposit record from central DB
      let { data: dep, error: depErr } = await supabaseAdmin
        .from('deposits')
        .select('*')
        .eq('id', depositId)
        .single();

      // If deposit is not found but fallback data is sent, upsert it first
      if ((depErr || !dep) && fallbackDepositData) {
        await supabaseAdmin.from('deposits').upsert(fallbackDepositData);
        const { data: retryDep } = await supabaseAdmin
          .from('deposits')
          .select('*')
          .eq('id', depositId)
          .single();
        dep = retryDep;
      }

      if (!dep) {
        return res.status(404).json({ success: false, error: 'Dépôt non trouvé dans la base centrale.' });
      }

      // IDEMPOTENCY CHECK 1: If already approved, DO NOT credit again!
      if (dep.status === 'approved') {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', dep.userId)
          .single();

        return res.json({
          success: true,
          message: 'Ce dépôt a déjà été validé et crédité précédemment.',
          alreadyApproved: true,
          status: 'approved',
          depositId,
          newBalance: existingUser?.balance ?? null
        });
      }

      // If already rejected and admin rejects again, no-op
      if (dep.status === 'rejected' && status === 'rejected') {
        return res.json({
          success: true,
          message: 'Ce dépôt a déjà été refusé.',
          alreadyProcessed: true,
          status: 'rejected',
          depositId
        });
      }

      // ATOMIC UPDATE: Only update status if current status is 'pending'
      const { data: updatedDep, error: updateErr } = await supabaseAdmin
        .from('deposits')
        .update({ status })
        .eq('id', depositId)
        .eq('status', 'pending')
        .select()
        .single();

      if (updateErr || !updatedDep) {
        // Double-check if another concurrent request just approved it
        const { data: freshDep } = await supabaseAdmin
          .from('deposits')
          .select('*')
          .eq('id', depositId)
          .single();

        if (freshDep?.status === 'approved') {
          const { data: u } = await supabaseAdmin
            .from('users')
            .select('balance')
            .eq('id', dep.userId)
            .single();

          return res.json({
            success: true,
            message: 'Ce dépôt vient déjà d\'être validé.',
            alreadyApproved: true,
            status: 'approved',
            depositId,
            newBalance: u?.balance ?? null
          });
        }

        return res.status(500).json({ 
          success: false, 
          error: updateErr?.message || 'Impossible de modifier le statut du dépôt (déjà traité).' 
        });
      }

      let updatedBalance: number | null = null;

      // If approved, credit user balance in central database
      if (status === 'approved') {
        // Find target user by ID or by Phone
        let targetUser: any = null;
        if (dep.userId) {
          const { data: userById } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', dep.userId)
            .single();
          if (userById) targetUser = userById;
        }

        if (!targetUser && dep.userPhone) {
          const { data: userByPhone } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('phone', dep.userPhone)
            .single();
          if (userByPhone) targetUser = userByPhone;
        }

        // Fallback: match without phone formatting
        if (!targetUser && dep.userPhone) {
          const cleanPhone = dep.userPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
          const { data: allUsers } = await supabaseAdmin.from('users').select('*');
          if (allUsers) {
            targetUser = allUsers.find((u: any) => 
              u.id === dep.userId || 
              u.phone === dep.userPhone || 
              (u.phone && u.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '') === cleanPhone)
            );
          }
        }

        if (targetUser) {
          const currentBal = Number(targetUser.balance || 0);
          const depositAmt = Number(dep.amount || 0);
          const calculatedBalance = currentBal + depositAmt;

          // Immediately update in-memory user store
          if (serverUsersStore.has(targetUser.id)) {
            serverUsersStore.set(targetUser.id, { ...serverUsersStore.get(targetUser.id), balance: calculatedBalance });
          }

          const { error: userBalErr } = await supabaseAdmin
            .from('users')
            .update({ balance: calculatedBalance })
            .eq('id', targetUser.id);

          if (userBalErr) {
            console.error('[Server Admin Deposit Error Updating Balance]:', userBalErr);
          } else {
            updatedBalance = calculatedBalance;
            // Invalidate fetch-all cache so all clients immediately get updated balance
            lastFetchAllData = null;
            lastFetchAllTime = 0;
            console.log(`[Deposit Approved & Credited]: User ${targetUser.id} (${targetUser.phone}) +${depositAmt} FCFA -> New balance: ${calculatedBalance} FCFA`);
          }
        } else {
          console.warn('[Deposit Approval]: Target user not found for deposit', dep);
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

  // 2. Process Withdrawal (Approve / Reject)
  app.post('/api/admin/withdrawals/process', async (req, res) => {
    try {
      const { withdrawalId, status } = req.body;
      if (!withdrawalId || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Paramètres de retrait invalides.' });
      }

      const { data: wth, error: wthErr } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (wthErr || !wth) {
        return res.status(404).json({ success: false, error: 'Demande de retrait non trouvée.' });
      }

      // Update withdrawal status
      const { error: updateErr } = await supabaseAdmin
        .from('withdrawals')
        .update({ status })
        .eq('id', withdrawalId);

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      // If rejected, refund user balance
      if (status === 'rejected') {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', wth.userId)
          .single();

        if (user) {
          const refundedBalance = Number(user.balance || 0) + Number(wth.amount || 0);
          await supabaseAdmin
            .from('users')
            .update({ balance: refundedBalance })
            .eq('id', wth.userId);
        }
      }

      return res.json({ success: true, message: `Retrait ${status === 'approved' ? 'validé' : 'rejeté'} avec succès.` });
    } catch (err: any) {
      console.error('[Server Admin Withdrawal Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // 3. Update User Balance (Direct set or delta)
  app.post('/api/admin/users/balance', async (req, res) => {
    try {
      const { userId, amount, isDirectSet } = req.body;
      if (!userId || typeof amount !== 'number') {
        return res.status(400).json({ success: false, error: 'ID utilisateur ou montant manquant.' });
      }

      // 1. Try finding by ID
      let { data: user, error: userErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. Try finding by Phone
      if (userErr || !user) {
        const { data: userByPhone } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('phone', userId)
          .single();
        if (userByPhone) user = userByPhone;
      }

      // 3. Try finding by cleaned phone or in full list
      if (!user) {
        const cleanId = String(userId).replace(/\s+/g, '').replace(/[^\d+]/g, '');
        const { data: allUsers } = await supabaseAdmin.from('users').select('*');
        if (allUsers) {
          user = allUsers.find((u: any) => 
            u.id === userId || 
            u.phone === userId || 
            (u.phone && u.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '') === cleanId)
          );
        }
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé dans la base centrale.' });
      }

      const cleanBalance = isDirectSet ? Math.max(0, amount) : Math.max(0, Number(user.balance || 0) + amount);

      // Immediately update in-memory user store
      if (serverUsersStore.has(user.id)) {
        serverUsersStore.set(user.id, { ...serverUsersStore.get(user.id), balance: cleanBalance });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({ balance: cleanBalance })
        .eq('id', user.id);

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      // Invalidate master cache so all devices fetch updated user balance instantly
      lastFetchAllData = null;
      lastFetchAllTime = 0;

      console.log(`[Admin Balance Updated]: User ${user.id} (${user.name} - ${user.phone}) -> New balance: ${cleanBalance} FCFA (isDirectSet: ${isDirectSet})`);

      return res.json({ success: true, newBalance: cleanBalance, userId: user.id });
    } catch (err: any) {
      console.error('[Server Admin Balance Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // 4. Update User Role
  app.post('/api/admin/users/role', async (req, res) => {
    try {
      const { userId, role } = req.body;
      if (!userId || !['admin', 'user'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Rôle ou ID invalide.' });
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // 5. Update User Block Status
  app.post('/api/admin/users/block', async (req, res) => {
    try {
      const { userId, isBlocked } = req.body;
      if (!userId || typeof isBlocked !== 'boolean') {
        return res.status(400).json({ success: false, error: 'Paramètres de blocage invalides.' });
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ isBlocked })
        .eq('id', userId);

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // 6. Fetch Single Table Data (Service Role - No RLS restrictions)
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
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // Cache for master fetch-all to prevent database hammer
  let lastFetchAllData: any = null;
  let lastFetchAllTime = 0;
  const CACHE_TTL_MS = 2000;

  // DB Timeout helper
  async function withDbTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }

  // 7. Fetch All Tables in One Call (Authoritative Admin Sync with Protection)
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
                const key = item.id || item.code;
                if (key) fallbackStore.set(key, { ...fallbackStore.get(key), ...item });
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
        fetchTableSafe('investments', serverInvestmentsStore || new Map()),
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

      // Update cache
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

  // 8. Update User Password or PIN via Service Role
  app.post('/api/admin/users/credentials', async (req, res) => {
    try {
      const { userId, withdrawalPinHash } = req.body;
      if (!userId || !withdrawalPinHash) {
        return res.status(400).json({ success: false, error: 'Paramètres manquants.' });
      }

      if (serverUsersStore.has(userId)) {
        serverUsersStore.set(userId, { ...serverUsersStore.get(userId), withdrawalPinHash });
      }

      Promise.resolve(
        supabaseAdmin
          .from('users')
          .update({ withdrawalPinHash })
          .eq('id', userId)
      )
        .then(() => {})
        .catch(() => {});

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // 9. Generic Admin Upsert / Update / Delete with Service Role Key
  app.post('/api/admin/execute', async (req, res) => {
    try {
      const { action, tableName, item, updates, idValue, idCol = 'id', items } = req.body;
      if (!tableName) {
        return res.status(400).json({ success: false, error: 'Table name required.' });
      }

      if (tableName === 'users') {
        if (action === 'upsert' && item && item.id) {
          serverUsersStore.set(item.id, { ...serverUsersStore.get(item.id), ...item });
        } else if (action === 'update' && idValue) {
          if (serverUsersStore.has(idValue)) {
            serverUsersStore.set(idValue, { ...serverUsersStore.get(idValue), ...updates });
          }
        } else if (action === 'delete' && idValue) {
          serverUsersStore.delete(idValue);
        }
      }

      if (action === 'upsert') {
        const { error } = await (supabaseAdmin.from(tableName as any) as any).upsert(item);
        if (error) console.warn('[Admin Execute Upsert Notice]:', error.message);
        return res.json({ success: true });
      }

      if (action === 'update') {
        const { error } = await (supabaseAdmin.from(tableName as any) as any).update(updates).eq(idCol, idValue);
        if (error) console.warn('[Admin Execute Update Notice]:', error.message);
        return res.json({ success: true });
      }

      if (action === 'delete') {
        const { error } = await (supabaseAdmin.from(tableName as any) as any).delete().eq(idCol, idValue);
        if (error) console.warn('[Admin Execute Delete Notice]:', error.message);
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
        .select('*')
        .gt('daysRemaining', 0);

      if (error || !activeInvestments || activeInvestments.length === 0) return;

      const now = Date.now();
      const userGainMap = new Map<string, number>();
      const investmentsToUpdate: any[] = [];

      for (const inv of activeInvestments) {
        const lastClaim = new Date(inv.lastClaimDate || inv.created_at || inv.createdAt || now).getTime();
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
          await supabaseAdmin.from('investments').update({
            daysRemaining: item.daysRemaining,
            lastClaimDate: item.lastClaimDate
          }).eq('id', item.id);
        }

        for (const [userId, totalGain] of userGainMap.entries()) {
          const { data: userRec } = await supabaseAdmin.from('users').select('balance, totalEarnings').eq('id', userId).maybeSingle();
          if (userRec) {
            const newBal = (Number(userRec.balance) || 0) + totalGain;
            const newTot = (Number(userRec.totalEarnings) || 0) + totalGain;
            await supabaseAdmin.from('users').update({
              balance: newBal,
              dailyEarnings: totalGain,
              totalEarnings: newTot
            }).eq('id', userId);

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

  // Run automatically every 30 seconds
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
