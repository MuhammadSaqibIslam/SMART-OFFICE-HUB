-- ============================================
-- ACTIVITY LOG ENHANCEMENTS
-- 1. Let authenticated users read all profiles, so the activity log can
--    show WHO performed each action (not just their own profile).
-- 2. Allow deleting activity log entries.
-- ============================================

DROP POLICY IF EXISTS "Authenticated can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can delete activity logs"
  ON public.activity_logs FOR DELETE
  TO authenticated
  USING (true);
