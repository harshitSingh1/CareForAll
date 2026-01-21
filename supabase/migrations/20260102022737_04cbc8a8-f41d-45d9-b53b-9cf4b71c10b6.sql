-- Fix: Rate Limit Bypass via Direct Table Access
-- Drop the overly permissive policy that allows any authenticated user to manage rate limits
DROP POLICY IF EXISTS "Service can manage rate limits" ON public.rate_limits;

-- Create a restrictive policy for service_role only
-- Edge functions using service_role_key will be able to manage rate limits
-- Regular authenticated users cannot directly access this table
-- They must use the check_rate_limit() SECURITY DEFINER function which has proper controls
CREATE POLICY "Service role only can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);