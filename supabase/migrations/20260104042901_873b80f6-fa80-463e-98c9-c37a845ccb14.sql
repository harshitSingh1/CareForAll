-- Add new columns for enhanced verification workflow
ALTER TABLE public.submitted_cases 
ADD COLUMN IF NOT EXISTS is_critical boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_ai_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS medical_disclaimer text;

-- Update status check constraint (drop if exists and recreate)
-- Valid statuses: pending_review, approved, modified, rejected, critical
COMMENT ON COLUMN public.submitted_cases.status IS 'Valid values: pending_review, approved, modified, rejected, critical';
COMMENT ON COLUMN public.submitted_cases.is_critical IS 'True if case was flagged as critical - requires urgent attention';
COMMENT ON COLUMN public.submitted_cases.is_ai_locked IS 'True if AI suggestions should be locked/hidden for this case';
COMMENT ON COLUMN public.submitted_cases.medical_disclaimer IS 'Optional medical disclaimer added by reviewer';