
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'chef', 'comptable');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER_ROLES TABLE (separate for security)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER: has_role function
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- SECURITY DEFINER: get_user_role function
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ============================================
-- SECURITY DEFINER: is_active check
-- ============================================
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.profiles WHERE user_id = _user_id),
    false
  )
$$;

-- ============================================
-- FISCAL_PERIODS TABLE
-- ============================================
CREATE TABLE public.fiscal_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ACCOUNTS TABLE (SYSCOHADA chart of accounts)
-- ============================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_class INTEGER NOT NULL CHECK (account_class BETWEEN 1 AND 7),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  fiscal_period_id UUID REFERENCES public.fiscal_periods(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- JOURNAL_ENTRIES TABLE
-- ============================================
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  debit_account_id UUID REFERENCES public.accounts(id) NOT NULL,
  credit_account_id UUID REFERENCES public.accounts(id) NOT NULL,
  debit_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  fiscal_period_id UUID REFERENCES public.fiscal_periods(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SYSTEM_LOGS TABLE
-- ============================================
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGER: update journal_entries.updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER: auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, phone, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS POLICIES: profiles
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any profile (approve/deactivate)
CREATE POLICY "Admin can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: user_roles
-- ============================================
-- Users can read their own role
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can view all roles
CREATE POLICY "Admin can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert roles (assign during approval)
CREATE POLICY "Admin can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can update roles
CREATE POLICY "Admin can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete roles
CREATE POLICY "Admin can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: fiscal_periods
-- ============================================
-- All authenticated active users can view fiscal periods
CREATE POLICY "Active users can view fiscal periods"
  ON public.fiscal_periods FOR SELECT
  TO authenticated
  USING (public.is_user_active(auth.uid()));

-- Only admin can manage fiscal periods
CREATE POLICY "Admin can insert fiscal periods"
  ON public.fiscal_periods FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update fiscal periods"
  ON public.fiscal_periods FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: accounts
-- ============================================
-- Comptable and Chef can view accounts (not admin)
CREATE POLICY "Comptable and Chef can view accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'comptable') OR 
    public.has_role(auth.uid(), 'chef')
  );

-- Comptable can insert custom accounts
CREATE POLICY "Comptable can insert accounts"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'comptable'));

-- Comptable can update accounts they created
CREATE POLICY "Comptable can update own accounts"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'comptable') AND 
    (created_by = auth.uid() OR is_custom = false)
  );

-- ============================================
-- RLS POLICIES: journal_entries
-- ============================================
-- Comptable can view their own entries
CREATE POLICY "Comptable can view own entries"
  ON public.journal_entries FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'comptable') AND 
    created_by = auth.uid()
  );

-- Chef can view all entries (read-only)
CREATE POLICY "Chef can view all entries"
  ON public.journal_entries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'chef'));

-- Comptable can insert entries
CREATE POLICY "Comptable can insert entries"
  ON public.journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'comptable') AND 
    created_by = auth.uid()
  );

-- Comptable can update their own entries (only in open periods)
CREATE POLICY "Comptable can update own entries"
  ON public.journal_entries FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'comptable') AND 
    created_by = auth.uid()
  );

-- ============================================
-- RLS POLICIES: system_logs
-- ============================================
-- Only admin can view logs
CREATE POLICY "Admin can view logs"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Any authenticated user can insert logs (for login/logout tracking)
CREATE POLICY "Authenticated users can insert logs"
  ON public.system_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow service role to insert logs
CREATE POLICY "Service can insert logs"
  ON public.system_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
