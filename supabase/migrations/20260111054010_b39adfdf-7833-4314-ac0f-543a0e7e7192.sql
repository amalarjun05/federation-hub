-- Create invoices table for cloud storage
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doc_id TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'INVOICE',
  doc_date DATE NOT NULL,
  due_date DATE,
  from_name TEXT,
  from_address TEXT,
  from_gst TEXT,
  from_pan TEXT,
  client_name TEXT,
  client_address TEXT,
  client_gst TEXT,
  client_pan TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  bank_name TEXT,
  bank_account_no TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  tax_rate NUMERIC DEFAULT 18,
  notes TEXT,
  logo_src TEXT,
  logo_size INTEGER DEFAULT 100,
  sig_src TEXT,
  sig_size INTEGER DEFAULT 100,
  design_color TEXT DEFAULT 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  design_font TEXT DEFAULT 'font-modern',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles_settings table for saved from/bank defaults
CREATE TABLE public.invoice_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_type TEXT NOT NULL, -- 'from', 'bank', 'client'
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_type)
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for invoice_profiles
CREATE POLICY "Users can view their own profiles" 
ON public.invoice_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles" 
ON public.invoice_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" 
ON public.invoice_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_profiles_updated_at
BEFORE UPDATE ON public.invoice_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();