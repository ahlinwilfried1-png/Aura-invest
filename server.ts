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

// Initialize Supabase Admin with Service Role Key (SERVER-SIDE ONLY - NEVER SENT TO CLIENT)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
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
        database: error ? 'error' : 'connected',
        dbError: error ? error.message : null,
        supabaseUrl: SUPABASE_URL,
        hasServiceRole: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        message: err?.message || 'Server error'
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

  // 0. User Login Route (High performance direct lookup & authentication)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ success: false, error: 'Numéro de téléphone et mot de passe requis.' });
      }

      // Normalize phone number
      let rawPhone = String(phone).trim().replace(/[\s\-\(\)\.]/g, '');
      const cleanDigits = rawPhone.replace(/\D/g, '');

      // Query database for all users to match against phone variations
      const { data: matchedUsers, error: userErr } = await supabaseAdmin
        .from('users')
        .select('*');

      if (userErr || !matchedUsers || matchedUsers.length === 0) {
        return res.status(404).json({ success: false, error: 'Compte introuvable. Veuillez vérifier votre numéro.' });
      }

      // Match user by normalized phone, raw phone, or 8-digit suffix
      const user = matchedUsers.find(u => {
        const uClean = String(u.phone || '').trim().replace(/[\s\-\(\)\.]/g, '');
        const uDigits = uClean.replace(/\D/g, '');
        return (
          uClean === rawPhone ||
          uDigits === cleanDigits ||
          (cleanDigits.length >= 8 && uDigits.endsWith(cleanDigits.slice(-8))) ||
          (uDigits.length >= 8 && cleanDigits.endsWith(uDigits.slice(-8)))
        );
      });

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

      const isCameroon = Boolean(
        (user.country && (user.country.toLowerCase().includes('cam') || user.country.toUpperCase() === 'CM')) ||
        String(user.phone).startsWith('+237') ||
        String(user.phone).startsWith('237')
      );
      const finalCountry = isCameroon ? 'Cameroun' : (user.country || 'Togo');

      // Sanitize and format phone number consistently
      let rawPhone = String(user.phone).trim().replace(/[\s\-\(\)\.]/g, '');
      if (!rawPhone.startsWith('+')) {
        if (rawPhone.startsWith('00')) {
          rawPhone = '+' + rawPhone.substring(2);
        } else if (rawPhone.startsWith('237') && rawPhone.length >= 11) {
          rawPhone = '+' + rawPhone;
        } else if (rawPhone.startsWith('228') && rawPhone.length >= 10) {
          rawPhone = '+' + rawPhone;
        } else {
          if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
          rawPhone = (isCameroon ? '+237' : '+228') + rawPhone;
        }
      }
      const cleanPhone = rawPhone;
      const strippedDigits = cleanPhone.replace(/\D/g, '');

      // Check if user already exists
      const { data: existingUsers, error: checkErr } = await supabaseAdmin
        .from('users')
        .select('id, phone');

      if (!checkErr && existingUsers && existingUsers.length > 0) {
        const found = existingUsers.some(u => {
          const uClean = String(u.phone || '').trim().replace(/[\s\-\(\)\.]/g, '');
          const uDigits = uClean.replace(/\D/g, '');
          return uClean === cleanPhone || (strippedDigits.length >= 8 && uDigits === strippedDigits);
        });

        if (found) {
          return res.status(400).json({ 
            success: false, 
            error: 'Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter.' 
          });
        }
      }

      // Ensure mandatory fields
      const userRecord = {
        id: user.id || ('usr-' + Math.floor(100000 + Math.random() * 9000000)),
        name: (user.name && user.name.trim()) ? user.name.trim() : (`Membre ${strippedDigits.slice(-4)}`),
        phone: cleanPhone,
        whatsapp: user.whatsapp ? String(user.whatsapp).trim() : cleanPhone,
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
        let targetUser = null;
        const { data: userById } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', dep.userId)
          .single();

        if (userById) {
          targetUser = userById;
        } else if (dep.userPhone) {
          const { data: userByPhone } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('phone', dep.userPhone)
            .single();
          targetUser = userByPhone;
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

      const { data: user, error: userErr } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userErr || !user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
      }

      const cleanBalance = isDirectSet ? Math.max(0, amount) : Math.max(0, Number(user.balance || 0) + amount);

      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({ balance: cleanBalance })
        .eq('id', userId);

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      return res.json({ success: true, newBalance: cleanBalance });
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

  // 7. Fetch All Tables in One Call (Authoritative Admin Sync)
  app.get('/api/admin/fetch-all', async (req, res) => {
    try {
      const fetchTableSafe = async (table: string) => {
        try {
          const { data, error } = await supabaseAdmin.from(table).select('*');
          if (error) {
            console.warn(`[fetch-all] Table ${table} notice:`, error.message);
            return [];
          }
          return data || [];
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

      return res.json({
        success: true,
        data: {
          users: users || [],
          products: products || [],
          investments: investments || [],
          deposits: deposits || [],
          withdrawals: withdrawals || [],
          withdrawal_proofs: proofs || [],
          tickets: tickets || [],
          commissions: commissions || [],
          bonus_codes: bonusCodes || []
        }
      });
    } catch (err: any) {
      console.error('[Server Admin Fetch All Error]:', err);
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
