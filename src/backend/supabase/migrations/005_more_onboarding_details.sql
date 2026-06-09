-- Migration: Add extra profile columns for the remaining onboarding options
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS working_years_role text,
  ADD COLUMN IF NOT EXISTS working_years_pension text,
  ADD COLUMN IF NOT EXISTS not_working_funds_source text,
  ADD COLUMN IF NOT EXISTS mortgage_payment text,
  ADD COLUMN IF NOT EXISTS mortgage_type text,
  ADD COLUMN IF NOT EXISTS student_rent_amount text,
  ADD COLUMN IF NOT EXISTS student_rent_source text,
  ADD COLUMN IF NOT EXISTS baby_savings_fund text,
  ADD COLUMN IF NOT EXISTS expected_new_salary text,
  ADD COLUMN IF NOT EXISTS car_target_budget text,
  ADD COLUMN IF NOT EXISTS car_purchase_method text;
