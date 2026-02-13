
-- Add a permissive base policy on profiles that requires authentication
-- This ensures anonymous/unauthenticated users cannot access the table at all
CREATE POLICY "Authenticated users only"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
