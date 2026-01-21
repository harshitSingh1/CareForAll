-- Add multi-specialty support for professionals
ALTER TABLE public.doctor_profiles
ADD COLUMN IF NOT EXISTS secondary_specialties text[] NOT NULL DEFAULT '{}'::text[];

-- Store multiple assigned specialties on the case for user-facing tags
ALTER TABLE public.submitted_cases
ADD COLUMN IF NOT EXISTS assigned_specialties text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill assigned_specialties from the legacy singular assigned_specialty column
UPDATE public.submitted_cases
SET assigned_specialties = ARRAY[assigned_specialty]
WHERE assigned_specialty IS NOT NULL
  AND (assigned_specialties IS NULL OR array_length(assigned_specialties, 1) IS NULL);

-- Create per-professional assignment rows so each doctor/advisor sees their assigned queue
CREATE TABLE IF NOT EXISTS public.case_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.submitted_cases(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  specialty text NOT NULL,
  assignment_reason text,
  is_fallback boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT case_assignments_case_professional_unique UNIQUE (case_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_case_assignments_professional_id ON public.case_assignments (professional_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id ON public.case_assignments (case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_specialty ON public.case_assignments (specialty);

ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;

-- Professionals can view their own assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'case_assignments'
      AND policyname = 'Professionals can view their assignments'
  ) THEN
    CREATE POLICY "Professionals can view their assignments"
    ON public.case_assignments
    FOR SELECT
    USING (professional_id = auth.uid());
  END IF;
END $$;

-- Users can view assignment rows for their own cases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'case_assignments'
      AND policyname = 'Users can view assignments for their cases'
  ) THEN
    CREATE POLICY "Users can view assignments for their cases"
    ON public.case_assignments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.submitted_cases c
        WHERE c.id = case_id
          AND c.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Admins can manage all assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'case_assignments'
      AND policyname = 'Admins can manage all assignments'
  ) THEN
    CREATE POLICY "Admins can manage all assignments"
    ON public.case_assignments
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- Backfill assignment rows for any legacy single assignments
INSERT INTO public.case_assignments (case_id, professional_id, specialty, assignment_reason, is_fallback)
SELECT sc.id, sc.assigned_professional_id, COALESCE(sc.assigned_specialty, 'Other'), sc.assignment_reason, COALESCE(sc.is_fallback_assignment, false)
FROM public.submitted_cases sc
WHERE sc.assigned_professional_id IS NOT NULL
ON CONFLICT (case_id, professional_id) DO NOTHING;