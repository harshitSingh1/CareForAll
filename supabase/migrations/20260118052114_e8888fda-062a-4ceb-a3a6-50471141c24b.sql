-- Expand alerts check constraints to match app-generated alert types & severities

-- 1) alert_type: allow the full set used by the app (keep legacy values too)
ALTER TABLE public.alerts
  DROP CONSTRAINT IF EXISTS alerts_alert_type_check;

ALTER TABLE public.alerts
  ADD CONSTRAINT alerts_alert_type_check
  CHECK (
    alert_type = ANY (
      ARRAY[
        -- legacy
        'mood', 'health', 'stress',

        -- wellness / insights
        'wellness_check', 'stress_pattern', 'mood_variability', 'recurring_symptom',
        'sleep_pattern', 'energy_pattern', 'mental_wellness', 'social_wellness',
        'work_life_balance', 'check_in_reminder', 'strategies_reminder',
        'consult_doctor', 'wellness_score_drop',

        -- medicines
        'medicine_missed', 'medicine_pattern',

        -- expert / case workflow
        'case_reviewed', 'case_review', 'critical_case', 'urgent_consultation', 'medical_disclaimer'
      ]::text[]
    )
  );

-- 2) severity: allow values used by UI + keep legacy
ALTER TABLE public.alerts
  DROP CONSTRAINT IF EXISTS alerts_severity_check;

ALTER TABLE public.alerts
  ADD CONSTRAINT alerts_severity_check
  CHECK (
    severity = ANY (
      ARRAY[
        -- app UI
        'low', 'medium', 'high', 'critical',
        -- legacy
        'info', 'warning'
      ]::text[]
    )
  );