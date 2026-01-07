-- Add end_date column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date date;

-- Add category and activity columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS activity text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS details text;

-- Rename college_name to event_name for clarity (keeping college_name as it exists)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_name text;

-- Insert placeholder events
INSERT INTO public.events (college_name, event_name, event_date, end_date, category, activity, details, status) VALUES
('St. Joseph College', 'Tech Fest 2026', '2026-01-15', '2026-01-17', 'Technical', 'Workshop', 'Annual tech festival with coding competitions', 'Pending'),
('MIT Campus', 'Cultural Night', '2026-01-20', '2026-01-21', 'Cultural', 'Performance', 'Music and dance performances', 'Accepted'),
('IIT Delhi', 'Hackathon 2026', '2026-02-01', '2026-02-03', 'Technical', 'Competition', '48-hour coding hackathon', 'Awaiting Confirmation'),
('NIT Trichy', 'Sports Meet', '2026-02-10', '2026-02-12', 'Sports', 'Tournament', 'Inter-college sports tournament', 'Pending'),
('Anna University', 'Science Expo', '2026-02-15', '2026-02-16', 'Academic', 'Exhibition', 'Science and innovation exhibition', 'Completed');

-- Add is_approved column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;