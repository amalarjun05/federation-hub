-- Create role enum for admin hierarchy
CREATE TYPE public.app_role AS ENUM ('super_admin', 'state_member', 'employee');

-- Create user_roles table for role management (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    designation TEXT,
    district TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create chat_channels table
CREATE TABLE public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_direct_message BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Create channel_members table for DMs
CREATE TABLE public.channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (channel_id, user_id)
);

ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    reactions JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- RLS Policies

-- User roles: users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Super admins can manage all roles
CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Profiles: users can view all profiles
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Profiles: users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Profiles: users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Chat channels: authenticated users can view channels
CREATE POLICY "Authenticated users can view channels"
ON public.chat_channels FOR SELECT
TO authenticated
USING (
    is_direct_message = false 
    OR EXISTS (
        SELECT 1 FROM public.channel_members 
        WHERE channel_id = chat_channels.id AND user_id = auth.uid()
    )
);

-- Chat channels: authenticated users can create channels
CREATE POLICY "Authenticated users can create channels"
ON public.chat_channels FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Channel members: users can view their memberships
CREATE POLICY "Users can view channel memberships"
ON public.channel_members FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.channel_members cm 
    WHERE cm.channel_id = channel_members.channel_id AND cm.user_id = auth.uid()
));

-- Channel members: authenticated users can add members
CREATE POLICY "Authenticated users can add members"
ON public.channel_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- Chat messages: users can view messages in their channels
CREATE POLICY "Users can view messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_channels c
        WHERE c.id = channel_id AND (
            c.is_direct_message = false
            OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = c.id AND user_id = auth.uid())
        )
    )
);

-- Chat messages: authenticated users can send messages
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Chat messages: users can update their own messages (for reactions)
CREATE POLICY "Users can update own messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);

-- Storage policies for chat attachments
CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Handle new user creation - create profile and assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default general channel
INSERT INTO public.chat_channels (id, name, description, is_direct_message)
VALUES ('00000000-0000-0000-0000-000000000001', 'General', 'General discussion channel', false);