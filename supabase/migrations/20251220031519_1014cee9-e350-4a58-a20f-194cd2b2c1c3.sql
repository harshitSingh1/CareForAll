-- Update RLS policies for submitted_cases to include advisors for wellness cases
CREATE POLICY "Advisors can view wellness cases"
ON public.submitted_cases
FOR SELECT
USING (category = 'wellness' AND has_role(auth.uid(), 'advisor'::app_role));

CREATE POLICY "Advisors can update wellness cases"
ON public.submitted_cases
FOR UPDATE
USING (category = 'wellness' AND has_role(auth.uid(), 'advisor'::app_role));