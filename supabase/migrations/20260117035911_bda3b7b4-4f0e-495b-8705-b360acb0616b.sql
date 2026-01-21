-- Allow users to delete their own alerts
CREATE POLICY "Users can delete their own alerts"
ON public.alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to clean up old alerts (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.alerts
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;