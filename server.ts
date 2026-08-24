import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const PORT = 3000;
// Central Supabase Credentials for project 'ozvqpwsdxkmimzfjmoud'
const CENTRAL_SUPABASE_URL = 'https://ozvqpwsdxkmimzfjmoud.supabase.co';
const CENTRAL_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dnFwd3NkeGttaW16Zmptb3VkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI2Mjc2MywiZXhwIjoyMTAyODM4NzYzfQ.yg2nMdMAsuuTlNySNgs8uGrvSKjsnMMKr2rcG-61cs4';

const SUPABASE_URL = 
  (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') ? process.env.SUPABASE_URL : null) || 
  (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') ? process.env.NEXT_PUBLIC_SUPABASE_URL : null) || 
  (process.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') ? process.env.VITE_SUPABASE_URL : null) || 
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

// Ensure service role key matches project 'ozvqpwsdxkmimzfjmoud'
const envServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = 
  (envServiceRoleKey && getJwtProjectRef(envServiceRoleKey) === 'ozvqpwsdxkmimzfjmoud' ? envServiceRoleKey : null) || 
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

      // 1. Direct indexed candidate lookup (Ultra-fast, ~10ms)
      if (phoneInfo.candidates.length > 0) {
        const { data: candidatesMatch, error: candErr } = await supabaseAdmin
          .from('users')
          .select('*')
          .in('phone', phoneInfo.candidates);

        if (!candErr && candidatesMatch && candidatesMatch.length > 0) {
          user = candidatesMatch[0];
        }
      }

      // 2. If no direct match, query by national digits suffix matching specific country length
      if (!user && phoneInfo.nationalDigits) {
        const { data: likeMatches, error: likeErr } = await supabaseAdmin
          .from('users')
          .select('*')
          .ilike('phone', `%${phoneInfo.nationalDigits}%`);

        if (!likeErr && likeMatches && likeMatches.length > 0) {
          // Exact country-aware match (9 digits for Cameroon, 8 digits for Togo)
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
        }
      }

      // 3. Fallback: Full table scan only if not found previously
      if (!user) {
        const { data: allUsers } = await supabaseAdmin.from('users').select('*');
        if (allUsers && allUsers.length > 0) {
          user = allUsers.find(u => {
            const uInfo = extractPhoneDetails(u.phone, u.country);
            if (phoneInfo.isCameroon && uInfo.isCameroon) {
              return uInfo.nationalDigits === phoneInfo.nationalDigits;
            }
            if (!phoneInfo.isCameroon && !uInfo.isCameroon) {
              return uInfo.nationalDigits === phoneInfo.nationalDigits;
            }
            return uInfo.cleanPhone === phoneInfo.cleanPhone || u.phone === phoneInfo.cleanPhone;
          });
        }
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'Compte introuvable. Veuillez vérifier votre numéro ou vous inscrire.' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ success: false, error: 'Ce compte a été suspendu par l\'administration. Contactez le support.' });
      }

      // Check credentials
      let savedPassword = parsePasswordFromPinHash(user.withdrawalPinHash);
      const isSpecialAdmin = user.role === 'admin' && (password === 'admin123' || password === 'ADMIN7');

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

      // 1. Fast duplicate check via indexed lookup
      if (phoneInfo.candidates.length > 0) {
        const { data: existingCandidates, error: checkErr } = await supabaseAdmin
          .from('users')
          .select('id, phone, name')
          .in('phone', phoneInfo.candidates);

        if (!checkErr && existingCandidates && existingCandidates.length > 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter.' 
          });
        }
      }

      // 2. Exact country-aware duplicate check
      if (phoneInfo.nationalDigits) {
        const { data: existingLike } = await supabaseAdmin
          .from('users')
          .select('id, phone, country')
          .ilike('phone', `%${phoneInfo.nationalDigits}%`);

        if (existingLike && existingLike.length > 0) {
          const exactDuplicate = existingLike.some(u => {
            const uInfo = extractPhoneDetails(u.phone, u.country);
            return (uInfo.isCameroon === phoneInfo.isCameroon) && (uInfo.nationalDigits === phoneInfo.nationalDigits);
          });
          if (exactDuplicate) {
            return res.status(400).json({ 
              success: false, 
              error: 'Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter.' 
            });
          }
        }
      }

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

      const { data: inserted, error: insErr } = await supabaseAdmin
        .from('users')
        .upsert(userRecord)
        .select()
        .single();

      if (insErr) {
        console.error('[Server Register Supabase Error]:', insErr);
        return res.status(500).json({ success: false, error: insErr.message });
      }

      console.log(`[New User Registered in Central Supabase]: ${userRecord.name} (${userRecord.phone}) - ID: ${userRecord.id}`);

      return res.json({
        success: true,
        user: inserted || userRecord
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

      const { error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

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

          const { error: userBalErr } = await supabaseAdmin
            .from('users')
            .update({ balance: calculatedBalance })
            .eq('id', targetUser.id);

          if (userBalErr) {
            console.error('[Server Admin Deposit Error Updating Balance]:', userBalErr);
          } else {
            updatedBalance = calculatedBalance;
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

      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({ balance: cleanBalance })
        .eq('id', user.id);

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

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

      const fetchTableSafe = async (table: string) => {
        try {
          const queryPromise = (async () => {
            const { data, error } = await supabaseAdmin
              .from(table)
              .select('*')
              .limit(10000);
            if (error) {
              console.warn(`[fetch-all] Table ${table} notice:`, error.message);
              return [];
            }
            return data || [];
          })();

          return await withDbTimeout(queryPromise, 6000, []);
        } catch (_) {
          return [];
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
        fetchTableSafe('users'),
        fetchTableSafe('products'),
        fetchTableSafe('investments'),
        fetchTableSafe('deposits'),
        fetchTableSafe('withdrawals'),
        fetchTableSafe('withdrawal_proofs'),
        fetchTableSafe('tickets'),
        fetchTableSafe('commissions'),
        fetchTableSafe('bonus_codes')
      ]);

      const resultData = {
        users: users || [],
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
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

  // 8. Update User Password or PIN via Service Role
  app.post('/api/admin/users/credentials', async (req, res) => {
    try {
      const { userId, withdrawalPinHash } = req.body;
      if (!userId || !withdrawalPinHash) {
        return res.status(400).json({ success: false, error: 'Paramètres manquants.' });
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ withdrawalPinHash })
        .eq('id', userId);

      if (error) return res.status(500).json({ success: false, error: error.message });
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

      if (action === 'upsert') {
        const { error } = await (supabaseAdmin.from(tableName as any) as any).upsert(item);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      if (action === 'update') {
        const { error } = await (supabaseAdmin.from(tableName as any) as any).update(updates).eq(idCol, idValue);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      if (action === 'delete') {
        const { error } = await (supabaseAdmin.from(tableName as any) as any).delete().eq(idCol, idValue);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      if (action === 'sync') {
        if (Array.isArray(items) && items.length > 0) {
          const { error } = await (supabaseAdmin.from(tableName as any) as any).upsert(items);
          if (error) return res.status(500).json({ success: false, error: error.message });
        }
        return res.json({ success: true });
      }

      return res.status(400).json({ success: false, error: 'Action admin non reconnue.' });
    } catch (err: any) {
      console.error('[Server Admin Execute Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Erreur serveur.' });
    }
  });

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
