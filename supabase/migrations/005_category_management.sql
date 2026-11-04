-- ============================================
-- INVENTORY CATEGORY MANAGEMENT
-- Allow authenticated users to add / edit / delete inventory categories
-- (previously only SELECT was permitted). Needed for the Settings page.
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.inventory_categories;
CREATE POLICY "Authenticated users can insert categories"
  ON public.inventory_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.inventory_categories;
CREATE POLICY "Authenticated users can update categories"
  ON public.inventory_categories FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.inventory_categories;
CREATE POLICY "Authenticated users can delete categories"
  ON public.inventory_categories FOR DELETE
  TO authenticated
  USING (true);
