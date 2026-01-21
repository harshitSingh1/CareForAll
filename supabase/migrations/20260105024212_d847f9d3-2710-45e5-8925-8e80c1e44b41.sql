-- Add sub_category column to submitted_cases for granular specialty matching
ALTER TABLE public.submitted_cases
ADD COLUMN IF NOT EXISTS sub_category text;

-- Add assigned_specialty column to track which specialty was requested/matched
ALTER TABLE public.submitted_cases
ADD COLUMN IF NOT EXISTS assigned_specialty text;

-- Add assignment_reason column to explain why case was routed to this professional
ALTER TABLE public.submitted_cases
ADD COLUMN IF NOT EXISTS assignment_reason text;

-- Add is_fallback_assignment to track when no specialist was available
ALTER TABLE public.submitted_cases
ADD COLUMN IF NOT EXISTS is_fallback_assignment boolean NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.submitted_cases.sub_category IS 'Granular classification: stress, anxiety, depression, burnout, sleep, lifestyle, general_medicine, etc.';
COMMENT ON COLUMN public.submitted_cases.assigned_specialty IS 'The specialty that was matched or selected for this case';
COMMENT ON COLUMN public.submitted_cases.assignment_reason IS 'Explains why case was assigned to this professional';
COMMENT ON COLUMN public.submitted_cases.is_fallback_assignment IS 'True if no matching specialist was available and case was sent to general pool';