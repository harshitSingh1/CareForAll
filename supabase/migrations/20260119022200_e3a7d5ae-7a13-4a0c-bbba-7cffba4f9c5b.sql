-- Allow professionals to update cases (so reviews persist)

-- Remove overly-restrictive update policies
DROP POLICY IF EXISTS "Doctors can update medical cases" ON public.submitted_cases;
DROP POLICY IF EXISTS "Advisors can update wellness cases" ON public.submitted_cases;

-- Doctors: can update any submitted case
CREATE POLICY "Doctors can update submitted cases"
ON public.submitted_cases
FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Advisors: can update any submitted case
CREATE POLICY "Advisors can update submitted cases"
ON public.submitted_cases
FOR UPDATE
USING (
  has_role(auth.uid(), 'advisor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'advisor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);
