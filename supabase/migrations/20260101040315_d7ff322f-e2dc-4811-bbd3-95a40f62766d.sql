-- Fix the category mismatch: Change constraint from 'mental' to 'wellness'
-- Also update existing records and create rate limiting infrastructure

-- Step 1: Update existing 'mental' records to 'wellness'
UPDATE public.submitted_cases 
SET category = 'wellness' 
WHERE category = 'mental';

-- Step 2: Drop the old constraint and add new one with 'wellness'
ALTER TABLE public.submitted_cases 
DROP CONSTRAINT IF EXISTS submitted_cases_category_check;

ALTER TABLE public.submitted_cases 
ADD CONSTRAINT submitted_cases_category_check 
CHECK (category IN ('medical', 'wellness'));

-- Step 3: Create rate limiting table for edge function protection
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_time 
ON public.rate_limits (user_id, action, created_at DESC);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can insert rate limit records (edge functions use service role)
CREATE POLICY "Service can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action text,
  _max_requests integer DEFAULT 20,
  _window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count integer;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (_window_minutes || ' minutes')::interval;
  
  -- Count requests in the window
  SELECT COUNT(*)
  INTO request_count
  FROM public.rate_limits
  WHERE user_id = _user_id
    AND action = _action
    AND created_at > window_start;
  
  -- Check if under limit
  IF request_count < _max_requests THEN
    -- Log this request
    INSERT INTO public.rate_limits (user_id, action)
    VALUES (_user_id, _action);
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', _max_requests - request_count - 1,
      'reset_at', window_start + (_window_minutes || ' minutes')::interval
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_at', window_start + (_window_minutes || ' minutes')::interval
    );
  END IF;
END;
$$;

-- Clean up old rate limit records (older than 24 hours) - can be run periodically
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits
  WHERE created_at < now() - interval '24 hours';
$$;