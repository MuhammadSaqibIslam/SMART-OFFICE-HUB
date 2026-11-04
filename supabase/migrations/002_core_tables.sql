-- ============================================
-- INVENTORY CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.inventory_categories (name, description) VALUES
  ('Furniture', 'Office furniture including desks, chairs, tables'),
  ('Electronics', 'Electronic devices and accessories'),
  ('Appliances', 'Office appliances like printers, coffee machines'),
  ('Pantry', 'Pantry and kitchen supplies'),
  ('Stationery', 'Office stationery and paper supplies')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INVENTORY ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.inventory_categories(id),
  description TEXT,
  sku TEXT UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_threshold >= 0),
  unit TEXT NOT NULL DEFAULT 'pcs',
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inventory"
  ON public.inventory_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert inventory"
  ON public.inventory_items FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory"
  ON public.inventory_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory"
  ON public.inventory_items FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- INVENTORY TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  previous_stock INTEGER NOT NULL,
  updated_stock INTEGER NOT NULL,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read transactions"
  ON public.inventory_transactions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON public.inventory_transactions FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================
-- EMPLOYEES
-- ============================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  email TEXT,
  department TEXT,
  job_title TEXT,
  contact_number TEXT,
  joining_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read employees"
  ON public.employees FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert employees"
  ON public.employees FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON public.employees FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete employees"
  ON public.employees FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- HARDWARE ASSETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.hardware_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  purchase_date DATE,
  purchase_cost NUMERIC(10,2),
  warranty_expiry DATE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'under_maintenance', 'missing', 'retired')),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hardware_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read assets"
  ON public.hardware_assets FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert assets"
  ON public.hardware_assets FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update assets"
  ON public.hardware_assets FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete assets"
  ON public.hardware_assets FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER hardware_assets_updated_at
  BEFORE UPDATE ON public.hardware_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ASSET ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.hardware_assets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  return_condition TEXT CHECK (return_condition IN ('good', 'damaged', 'needs_repair', 'incomplete')),
  accessories TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'transferred')),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read assignments"
  ON public.asset_assignments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert assignments"
  ON public.asset_assignments FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments"
  ON public.asset_assignments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER asset_assignments_updated_at
  BEFORE UPDATE ON public.asset_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ASSET HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.hardware_assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read asset history"
  ON public.asset_history FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert asset history"
  ON public.asset_history FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================
-- PURCHASE REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'ordered', 'received')),
  notes TEXT,
  requested_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read purchase requests"
  ON public.purchase_requests FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert purchase requests"
  ON public.purchase_requests FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase requests"
  ON public.purchase_requests FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete purchase requests"
  ON public.purchase_requests FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER purchase_requests_updated_at
  BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- PURCHASE REQUEST ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchase_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inventory_items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read purchase request items"
  ON public.purchase_request_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert purchase request items"
  ON public.purchase_request_items FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete purchase request items"
  ON public.purchase_request_items FOR DELETE
  TO authenticated USING (true);

-- ============================================
-- ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================
-- RLS for inventory_categories
-- ============================================
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categories"
  ON public.inventory_categories FOR SELECT
  TO authenticated USING (true);
