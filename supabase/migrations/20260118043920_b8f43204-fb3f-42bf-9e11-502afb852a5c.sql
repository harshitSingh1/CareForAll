-- Fix 1: doctor_profiles - Require authentication and limit exposed data
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Users can view verified doctor profiles" ON public.doctor_profiles;

-- Create a more restrictive policy that requires authentication
CREATE POLICY "Authenticated users can view verified doctor profiles"
ON public.doctor_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_verified = true
);

-- Fix 2: rate_limits - Block all direct client access
-- The check_rate_limit() function uses SECURITY DEFINER and will still work
DROP POLICY IF EXISTS "Service role only can manage rate limits" ON public.rate_limits;

-- Create a policy that blocks all client access (service role bypasses RLS anyway)
CREATE POLICY "No direct access to rate limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);