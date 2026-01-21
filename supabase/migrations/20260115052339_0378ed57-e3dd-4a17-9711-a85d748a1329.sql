-- Create medicines table to store user's medicines
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  instructions TEXT,
  times_per_day INTEGER NOT NULL DEFAULT 1,
  schedule_times TIME[] NOT NULL DEFAULT ARRAY['08:00:00'::TIME],
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  days_duration INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicine_doses table to track individual dose times and their status
CREATE TABLE public.medicine_doses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_doses ENABLE ROW LEVEL SECURITY;

-- RLS policies for medicines
CREATE POLICY "Users can view their own medicines"
  ON public.medicines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicines"
  ON public.medicines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicines"
  ON public.medicines FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for medicine_doses
CREATE POLICY "Users can view their own doses"
  ON public.medicine_doses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own doses"
  ON public.medicine_doses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own doses"
  ON public.medicine_doses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own doses"
  ON public.medicine_doses FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_medicines_user_active ON public.medicines(user_id, is_active);
CREATE INDEX idx_medicine_doses_user_status ON public.medicine_doses(user_id, status);
CREATE INDEX idx_medicine_doses_scheduled ON public.medicine_doses(scheduled_at);

-- Trigger for updated_at on medicines
CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();