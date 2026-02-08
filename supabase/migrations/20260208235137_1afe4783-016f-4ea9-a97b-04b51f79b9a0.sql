
-- Fix the permissive INSERT policy on system_logs
-- Drop the overly permissive policy
DROP POLICY "Authenticated users can insert logs" ON public.system_logs;

-- Create a more restrictive policy: users can only insert logs for themselves
CREATE POLICY "Users can insert own logs"
  ON public.system_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
