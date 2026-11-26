-- =========================================================================================
-- GOLD SPEED PLATFORM - SCHEMA SUPABASE COMPLET (TOGO)
-- Projet: https://szekyfonyjycwkpxzmub.supabase.co
-- À exécuter dans le SQL Editor de Supabase (https://supabase.com/dashboard/project/szekyfonyjycwkpxzmub/sql)
-- =========================================================================================

-- 1. TABLE DES UTILISATEURS (USERS)
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

-- 2. TABLE DES PRODUITS D'INVESTISSEMENT (PRODUCTS)
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

-- 3. TABLE DES INVESTISSEMENTS UTILISATEURS (INVESTMENTS)
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

-- 4. TABLE DES DEMANDES DE DÉPÔT / RECHARGE (DEPOSITS)
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

-- 5. TABLE DES DEMANDES DE RETRAIT (WITHDRAWALS)
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

-- 6. TABLE DES PREUVES DE RETRAIT PUBLIQUES (WITHDRAWAL_PROOFS)
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

-- 7. TABLE DES TICKETS DE SUPPORT (TICKETS)
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

-- 8. TABLE DES COMMISSIONS DE PARRAINAGE (COMMISSIONS)
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

-- 9. TABLE DES CODES BONUS (BONUS_CODES)
CREATE TABLE IF NOT EXISTS public.bonus_codes (
    code TEXT PRIMARY KEY,
    amount NUMERIC NOT NULL,
    max_uses INTEGER DEFAULT 100,
    used_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLE DES CANAUX DE RECHARGE TOGO (RECHARGE_CHANNELS)
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

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS daily_rate_percent NUMERIC DEFAULT 0;

-- =========================================================================================
-- ACTIVATION DU ROW LEVEL SECURITY (RLS) & POLITIQUES DE SÉCURITÉ STRICTES
-- =========================================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_channels ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Service Role Full Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Service Role Full Access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Read Proofs" ON public.withdrawal_proofs;
CREATE POLICY "Public Read Proofs" ON public.withdrawal_proofs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Read Channels" ON public.recharge_channels;
CREATE POLICY "Public Read Channels" ON public.recharge_channels FOR SELECT TO anon, authenticated USING (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON public.products, public.withdrawal_proofs, public.recharge_channels TO anon, authenticated;

-- =========================================================================================
-- PLANS D'INVESTISSEMENT OFFICIELS GOLD SPEED (150 JOURS)
-- =========================================================================================

INSERT INTO public.products (id, name, price, daily_gain, duration, total_gain, daily_rate_percent, is_active, image, description, "order", badge, color)
VALUES
    ('iphone-vip1', 'Gold 1', 3000, 900, 150, 135000, 30, true, 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80', 'Formule Gold 1 — Revenu quotidien de 900 FCFA (30%/j) pendant 150 jours. Revenu total : 135 000 FCFA.', 1, 'GOLD 1', 'from-blue-950/70 via-cyan-900/40 to-sky-950/50 border-cyan-500/40'),
    ('iphone-vip2', 'Gold 2', 7000, 2135, 150, 320250, 30.5, true, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80', 'Formule Gold 2 — Revenu quotidien de 2 135 FCFA (30.5%/j) pendant 150 jours. Revenu total : 320 250 FCFA.', 2, 'GOLD 2', 'from-emerald-950/70 via-teal-900/40 to-green-950/50 border-emerald-500/40'),
    ('iphone-vip3', 'Gold 3', 15000, 4650, 150, 697500, 31, true, 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&auto=format&fit=crop&q=80', 'Formule Gold 3 — Revenu quotidien de 4 650 FCFA (31%/j) pendant 150 jours. Revenu total : 697 500 FCFA.', 3, 'GOLD 3', 'from-purple-950/70 via-indigo-900/40 to-violet-950/50 border-purple-500/40'),
    ('iphone-vip4', 'Gold 4', 40000, 12600, 150, 1890000, 31.5, true, 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&auto=format&fit=crop&q=80', 'Formule Gold 4 — Revenu quotidien de 12 600 FCFA (31.5%/j) pendant 150 jours. Revenu total : 1 890 000 FCFA.', 4, 'GOLD 4', 'from-amber-950/70 via-orange-900/40 to-yellow-950/50 border-amber-500/40'),
    ('iphone-vip5', 'Gold 5', 100000, 32000, 150, 4800000, 32, true, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80', 'Formule Gold 5 — Revenu quotidien de 32 000 FCFA (32%/j) pendant 150 jours. Revenu total : 4 800 000 FCFA.', 5, 'GOLD 5', 'from-rose-950/70 via-pink-900/40 to-red-950/50 border-rose-500/40'),
    ('iphone-vip6', 'Gold 6', 250000, 82500, 150, 12375000, 33, true, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80', 'Formule Gold 6 — Revenu quotidien de 82 500 FCFA (33%/j) pendant 150 jours. Revenu total : 12 375 000 FCFA.', 6, 'GOLD 6', 'from-cyan-950/70 via-teal-900/40 to-blue-950/50 border-cyan-400/40'),
    ('iphone-vip7', 'Gold 7', 500000, 170000, 150, 25500000, 34, true, 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop&q=80', 'Formule Gold 7 — Revenu quotidien de 170 000 FCFA (34%/j) pendant 150 jours. Revenu total : 25 500 000 FCFA.', 7, 'GOLD 7', 'from-purple-950/70 via-fuchsia-900/40 to-indigo-950/50 border-purple-400/40'),
    ('iphone-vip8', 'Gold 8', 1000000, 400000, 150, 60000000, 40, true, 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80', 'Formule Gold 8 — Revenu quotidien de 400 000 FCFA (40%/j) pendant 150 jours. Revenu total : 60 000 000 FCFA.', 8, 'GOLD 8', 'from-blue-950/70 via-indigo-900/40 to-sky-950/50 border-blue-400/40')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================================
-- CANAUX DE RECHARGE OFFICIELS TOGO
-- =========================================================================================

INSERT INTO public.recharge_channels (id, name, country_code, account_number, account_holder, instructions, is_active, "order")
VALUES
    ('rc-tg-tmoney', 'TMoney / Mixx By Yas (Togo)', 'TG', '+228 90 00 00 00', 'Service Recharge Gold Speed Togo', 'Effectuez le transfert vers ce numéro TMoney (*145#) puis saisissez la référence de transaction SMS reçue.', true, 1),
    ('rc-tg-moov', 'Moov Money / Flooz (Togo)', 'TG', '+228 99 00 00 00', 'Service Recharge Gold Speed Togo', 'Effectuez le transfert vers ce numéro Moov Money (*155#) puis saisissez la référence de transaction SMS reçue.', true, 2)
ON CONFLICT (id) DO NOTHING;
