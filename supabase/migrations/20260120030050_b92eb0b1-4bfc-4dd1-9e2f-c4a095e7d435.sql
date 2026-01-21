-- Create vault_pins table to store user vault PIN codes (hashed)
CREATE TABLE public.vault_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vault_pins ENABLE ROW LEVEL SECURITY;

-- Users can view their own pin record (to check if PIN exists)
CREATE POLICY "Users can view their own vault pin"
ON public.vault_pins
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own vault pin
CREATE POLICY "Users can create their own vault pin"
ON public.vault_pins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own vault pin
CREATE POLICY "Users can update their own vault pin"
ON public.vault_pins
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own vault pin
CREATE POLICY "Users can delete their own vault pin"
ON public.vault_pins
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_vault_pins_updated_at
BEFORE UPDATE ON public.vault_pins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();