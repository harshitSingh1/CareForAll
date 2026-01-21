-- Create medical_documents table
CREATE TABLE public.medical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  document_date DATE,
  hospital_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own documents" 
ON public.medical_documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents" 
ON public.medical_documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.medical_documents FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false);

-- Storage policies
CREATE POLICY "Users can view their own medical documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own medical documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own medical documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);