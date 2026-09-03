-- =========================================================================================
-- NUTRIEN FINTECH PLATFORM - SCHEMA SUPABASE COMPLET
-- Projet: https://ykoqcaggjfhpnysvumuu.supabase.co
-- À exécuter dans le SQL Editor de Supabase (https://supabase.com/dashboard/project/ykoqcaggjfhpnysvumuu/sql)
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
    vip_level INTEGER DEFAULT 1,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    role TEXT DEFAULT 'user',
    referral_code TEXT,
    referred_by_code TEXT,
    withdrawal_account_name TEXT,
    withdrawal_account_number TEXT,
    withdrawal_network TEXT,
    withdrawal_country TEXT,
    withdrawal_pin_hash TEXT,
    draw_tickets INTEGER DEFAULT 0,
    referrals_count INTEGER DEFAULT 0,
    team_benefits NUMERIC DEFAULT 0
);

-- Index pour des recherches et connexions ultra-rapides
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

-- 10. TABLE DES CANAUX DE RECHARGE (RECHARGE_CHANNELS)
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

-- Politiques ouvertes pour l'application avec clé Anon & Service Role
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

-- Accorder les permissions de table aux rôles Supabase
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- =========================================================================================
-- INSERTION DES COMPTES ADMINISTRATEURS OFFICIELS
-- =========================================================================================

INSERT INTO public.users (
    id, name, phone, whatsapp, country, balance, daily_earnings, total_earnings,
    vip_level, is_blocked, created_at, role, referral_code,
    withdrawal_account_name, withdrawal_account_number, withdrawal_network, withdrawal_country,
    withdrawal_pin_hash
) VALUES 
    (
        'usr-admin-principal-2026',
        'Administrateur Principal (Nutrien)',
        '+22891902026',
        '+22891902026',
        'Togo',
        5000000,
        250000,
        15000000,
        8,
        false,
        NOW(),
        'admin',
        'ADMIN2026',
        'ADMINISTRATION OFFICIELLE NUTRIEN',
        '91902026',
        'TMoney',
        'TG',
        '{"pwd_hash":"061aca842ac8eba353c7210d2de50edff949e22297578d957653f70f3339f411","salt":"d8e3b1c4a7f05926","pin_hash":"bb4dea4662b8f0835b68faf963a28fb33ec3af548c15e73abd33669809a7d216","net":"TMoney","cty":"TG"}'
    ),
    (
        'usr-admin-master',
        'Directeur Général (Admin)',
        '+22897194059',
        '+22897194059',
        'Togo',
        5000000,
        250000,
        15000000,
        8,
        false,
        NOW(),
        'admin',
        'ADMIN01',
        'ADMINISTRATION NUTRIEN',
        '97194059',
        'TMoney',
        'TG',
        '{"pwd_hash":"68f5732f71f15e27cb55c2a49c1a74be2c82bd890413d0eb46d81d027ea4771e","salt":"d8e3b1c4a7f05926","pin_hash":"78299f684c65d68d08fe5d9075510d0f75622ce73281a4c85917d533f8c6f2ed","net":"TMoney","cty":"TG"}'
    ),
    (
        'usr-admin-sec-9920',
        'Administrateur Sécurisé (Superviseur)',
        '+22890554433',
        '+22890554433',
        'Togo',
        2500000,
        100000,
        5000000,
        8,
        false,
        NOW(),
        'admin',
        'ADMIN02',
        'ADMINISTRATION SECURISEE',
        '90554433',
        'TMoney',
        'TG',
        '{"pwd_hash":"88c92e6b47cc4823036ec1ab924fcdb3c92db21b18fd6486aaa10e72a2f336a8","salt":"d8e3b1c4a7f05926","pin_hash":"bb4dea4662b8f0835b68faf963a28fb33ec3af548c15e73abd33669809a7d216","net":"TMoney","cty":"TG"}'
    )
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_blocked = false;

-- =========================================================================================
-- 8 PLANS OFFICIELS D'INVESTISSEMENT (AGROPROFIT 365 JOURS)
-- =========================================================================================

INSERT INTO public.products (id, name, price, daily_gain, duration, total_gain, is_active, image, description, "order", badge, color)
VALUES 
    (
        'vip-1-pro',
        'VIP NIVEAU 1 (Pro)',
        2500,
        168,
        365,
        61320,
        true,
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        'Pack de démarrage agricole Pro - Rendement quotidien garanti sur 365 jours.',
        1,
        'Populaire',
        'from-amber-950/40 via-amber-900/10 to-transparent border-amber-500/20'
    ),
    (
        'vip-2-elite',
        'VIP NIVEAU 2 (Elite)',
        6000,
        360,
        365,
        131400,
        true,
        'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?w=800&auto=format&fit=crop&q=80',
        'Pack Elite Nutrition végétale & Fertilisant bio à haut rendement.',
        2,
        'Recommandé',
        'from-emerald-950/40 via-emerald-900/10 to-transparent border-emerald-500/20'
    ),
    (
        'vip-3-premium',
        'VIP NIVEAU 3 (Premium)',
        15000,
        744,
        365,
        271560,
        true,
        'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80',
        'Pack Premium Semences sélectionnées & technologie agro-alimentaire.',
        3,
        'Rentable',
        'from-blue-950/40 via-blue-900/10 to-transparent border-blue-500/20'
    ),
    (
        'vip-4-platinum',
        'VIP NIVEAU 4 (Platinum)',
        32000,
        1584,
        365,
        578160,
        true,
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        'Pack Platinum Distribution régionale & Agro-équipement motorisé.',
        4,
        'Haute Performance',
        'from-purple-950/40 via-purple-900/10 to-transparent border-purple-500/20'
    ),
    (
        'vip-6-or',
        'VIP NIVEAU 6 (Or)',
        70000,
        3840,
        365,
        1401600,
        true,
        'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
        'Pack Or Chaîne logistique globale & Valorisation agro-industrielle.',
        5,
        'Investisseur Or',
        'from-amber-950/40 via-yellow-900/10 to-transparent border-yellow-500/30'
    ),
    (
        'vip-7-saphir',
        'VIP NIVEAU 7 (Saphir)',
        250000,
        13800,
        365,
        5037000,
        true,
        'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=80',
        'Pack Saphir Agro-industrie & Transformation industrielle à grande échelle.',
        6,
        'Privilège Saphir',
        'from-sky-950/40 via-cyan-900/10 to-transparent border-cyan-500/30'
    ),
    (
        'vip-partenaire-bronze',
        'VIP PARTENAIRE (Bronze)',
        500000,
        28800,
        365,
        10512000,
        true,
        'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
        'Partenariat Stratégique Bronze - Hub logistique Afrique de l''Ouest.',
        7,
        'Partenaire Bronze',
        'from-orange-950/40 via-amber-900/10 to-transparent border-orange-500/30'
    ),
    (
        'vip-partenaire-argent',
        'VIP PARTENAIRE (Argent)',
        1000000,
        60000,
        365,
        22198650,
        true,
        'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80',
        'Partenariat Stratégique Argent - Franchise agro-financière exclusive.',
        8,
        'Partenaire Argent',
        'from-slate-950/40 via-slate-800/10 to-transparent border-slate-400/40'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    daily_gain = EXCLUDED.daily_gain,
    duration = EXCLUDED.duration,
    total_gain = EXCLUDED.total_gain,
    is_active = EXCLUDED.is_active;

-- =========================================================================================
-- CANAUX DE RECHARGE PAR DÉFAUT (TMONEY, MOOV, MTN, ORANGE)
-- =========================================================================================

INSERT INTO public.recharge_channels (id, name, country_code, account_number, account_holder, instructions, is_active, "order")
VALUES
    ('rc-tmoney', 'TMoney (Togocom)', 'TG', '+228 92812588', 'Service Recharge Nutrien Togo', 'Effectuez le transfert vers ce numéro TMoney puis saisissez la référence de transaction.', true, 1),
    ('rc-moov', 'Moov Money (Flooz)', 'TG', '+228 78829438', 'Service Recharge Nutrien Togo', 'Effectuez le transfert vers ce numéro Moov Money Flooz puis saisissez la référence de transaction.', true, 2),
    ('rc-cm-mtn', 'MTN Mobile Money (MoMo Cameroun)', 'CM', '+237 677 45 12 89', 'Service Recharge Nutrien Cameroun', 'Effectuez le transfert vers ce numéro MTN MoMo puis saisissez l''ID de transaction.', true, 3),
    ('rc-cm-orange', 'Orange Money (OM Cameroun)', 'CM', '+237 688 96 98 68', 'Service Recharge Nutrien Cameroun', 'Effectuez le transfert vers ce numéro Orange Money puis saisissez l''ID de transaction.', true, 4)
ON CONFLICT (id) DO NOTHING;
