-- Allow doctors to view ALL submitted cases (both medical and wellness)
-- This gives doctors full visibility to review any case that needs attention
CREATE POLICY "Doctors can view all submitted cases" 
ON public.submitted_cases 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Also allow advisors to view all cases for completeness
CREATE POLICY "Advisors can view all submitted cases" 
ON public.submitted_cases 
FOR SELECT 
USING (has_role(auth.uid(), 'advisor'::app_role));