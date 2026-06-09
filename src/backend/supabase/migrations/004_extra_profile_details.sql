-- Migration: Add extra profile columns for conversational questionnaire
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS first_job_company_name text,
ADD COLUMN IF NOT EXISTS first_job_start_date text,
ADD COLUMN IF NOT EXISTS first_job_pay_date text,
ADD COLUMN IF NOT EXISTS first_job_salary text,
ADD COLUMN IF NOT EXISTS uni_degree_years text,
ADD COLUMN IF NOT EXISTS uni_study_year text,
ADD COLUMN IF NOT EXISTS freelance_industry text,
ADD COLUMN IF NOT EXISTS rent_amount text,
ADD COLUMN IF NOT EXISTS tenancy_length text,
ADD COLUMN IF NOT EXISTS family_rent_board text,
ADD COLUMN IF NOT EXISTS moving_city text,
ADD COLUMN IF NOT EXISTS moving_timeframe text,
ADD COLUMN IF NOT EXISTS buying_lisa text,
ADD COLUMN IF NOT EXISTS buying_budget text;
