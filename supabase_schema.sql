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

-- =========================================================================================
-- ACTIVATION DU ROW LEVEL SECURITY (RLS) & POLITIQUES DE SÉCURITÉ
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
        EXECUTE format('CREATE POLICY "Public Access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- =========================================================================================
-- CANAUX DE RECHARGE OFFICIELS TOGO
-- =========================================================================================

INSERT INTO public.recharge_channels (id, name, country_code, account_number, account_holder, instructions, is_active, "order")
VALUES
    ('rc-tg-tmoney', 'TMoney / Mixx By Yas (Togo)', 'TG', '+228 90 00 00 00', 'Service Recharge Gold Speed Togo', 'Effectuez le transfert vers ce numéro TMoney (*145#) puis saisissez la référence de transaction SMS reçue.', true, 1),
    ('rc-tg-moov', 'Moov Money / Flooz (Togo)', 'TG', '+228 99 00 00 00', 'Service Recharge Gold Speed Togo', 'Effectuez le transfert vers ce numéro Moov Money (*155#) puis saisissez la référence de transaction SMS reçue.', true, 2)
ON CONFLICT (id) DO NOTHING;
