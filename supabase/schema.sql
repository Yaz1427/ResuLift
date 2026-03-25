-- ============================================================
-- ResuLift Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  credits integer default 0,
  plan text default 'free' check (plan in ('free', 'basic', 'premium')),
  stripe_customer_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- TABLE: analyses
-- ============================================================
create table public.analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('basic', 'premium')),
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  resume_url text not null,
  resume_filename text not null,
  job_title text,
  job_company text,
  job_description text not null,
  ats_score integer check (ats_score between 0 and 100),
  result jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ============================================================
-- TABLE: payments
-- ============================================================
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  analysis_id uuid references public.analyses(id),
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  amount integer not null, -- in cents
  currency text default 'usd',
  status text default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_analyses_user_id on public.analyses(user_id);
create index idx_analyses_status on public.analyses(status);
create index idx_analyses_created_at on public.analyses(created_at desc);
create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_stripe_session_id on public.payments(stripe_session_id);
create index idx_payments_analysis_id on public.payments(analysis_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.payments enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Analyses policies
create policy "Users can view own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own analyses"
  on public.analyses for update
  using (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
create policy "Service role full access on analyses"
  on public.analyses for all
  using (auth.role() = 'service_role');

create policy "Service role full access on profiles"
  on public.profiles for all
  using (auth.role() = 'service_role');

-- Payments policies
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Service role full access on payments"
  on public.payments for all
  using (auth.role() = 'service_role');

-- ============================================================
-- STORAGE: resumes bucket
-- ============================================================
-- Run in Supabase Dashboard or via API:
-- insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false);

-- Storage policies (run after creating bucket)
-- create policy "Users can upload own resumes"
--   on storage.objects for insert
--   with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users can read own resumes"
--   on storage.objects for select
--   using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

-- Migration: free analysis
alter table public.profiles add column if not exists free_analysis_used boolean default false;

-- ============================================================
-- MIGRATIONS
-- ============================================================

-- Add free_analysis_used to profiles (run if not already done)
alter table public.profiles
  add column if not exists free_analysis_used boolean default false;

-- Add share_id to analyses for public sharing
alter table public.analyses
  add column if not exists share_id uuid unique;

-- Add optimized_cv_url for future storage of generated CVs
alter table public.analyses
  add column if not exists optimized_cv_url text;

-- Add avatar_url to profiles for CV photo
alter table public.profiles
  add column if not exists avatar_url text;

-- Create avatars storage bucket (run once in Supabase dashboard or via CLI)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
-- create policy "Avatar public read" on storage.objects for select using (bucket_id = 'avatars');
-- create policy "Avatar owner upload" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Avatar owner update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Avatar owner delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
