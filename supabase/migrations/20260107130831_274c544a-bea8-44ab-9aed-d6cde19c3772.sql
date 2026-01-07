-- Create events table for calendar
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  college_name TEXT NOT NULL,
  fest_name TEXT,
  event_date DATE NOT NULL,
  no_of_days INTEGER DEFAULT 1,
  event_type TEXT,
  requirement TEXT,
  internet_access TEXT,
  contact_name TEXT,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  cost DECIMAL(12,2),
  update_1 TEXT,
  update_2 TEXT,
  update_3 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events can be viewed by all authenticated users
CREATE POLICY "Authenticated users can view events"
ON public.events
FOR SELECT
TO authenticated
USING (true);

-- Super admins and state members can insert events
CREATE POLICY "Admins can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'state_member')
);

-- Super admins and state members can update events
CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'state_member')
);

-- Only super admins can delete events
CREATE POLICY "Super admins can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add trigger for events updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();