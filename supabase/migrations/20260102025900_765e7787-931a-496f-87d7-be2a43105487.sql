-- Add assigned_professional_id column for auto-assignment
ALTER TABLE public.submitted_cases
ADD COLUMN IF NOT EXISTS assigned_professional_id UUID;

-- Add constraint to track assignment
ALTER TABLE public.submitted_cases
DROP CONSTRAINT IF EXISTS submitted_cases_status_check;

ALTER TABLE public.submitted_cases
ADD CONSTRAINT submitted_cases_status_check
CHECK (status IN ('pending_review', 'in_review', 'approved', 'modified', 'flagged', 'completed'));

-- Allow doctors to view cases assigned to them
DROP POLICY IF EXISTS "Doctors can view assigned medical cases" ON public.submitted_cases;
CREATE POLICY "Doctors can view assigned medical cases"
ON public.submitted_cases
FOR SELECT
USING (
  (category = 'medical' AND has_role(auth.uid(), 'doctor'::app_role)) OR
  assigned_professional_id = auth.uid()
);

-- Allow advisors to view cases assigned to them
DROP POLICY IF EXISTS "Advisors can view assigned wellness cases" ON public.submitted_cases;
CREATE POLICY "Advisors can view assigned wellness cases"
ON public.submitted_cases
FOR SELECT
USING (
  (category = 'wellness' AND has_role(auth.uid(), 'advisor'::app_role)) OR
  assigned_professional_id = auth.uid()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_submitted_cases_assigned ON public.submitted_cases(assigned_professional_id);
CREATE INDEX IF NOT EXISTS idx_submitted_cases_category_status ON public.submitted_cases(category, status);

-- Allow verified doctor profiles to be viewed by authenticated users (for consultation booking)
DROP POLICY IF EXISTS "Users can view verified doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Users can view verified doctor profiles"
ON public.doctor_profiles
FOR SELECT
USING (is_verified = true);