import { supabase } from './supabaseClient'
import type { UserProfile } from '../frontend/context/ProfileContext'
import type { UserStoryFact, StoryFactCategory, StoryFactSource } from '../shared/types'

// Maps a DB row (snake_case) to the UserProfile interface (camelCase)
function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    firstName: row.first_name as string,
    email: row.email as string,
    companyName: row.company_name as string,
    lifeStage: row.life_stage as string,
    employmentType: row.employment_type as string,
    sixMonthGoal: row.six_month_goal as string,
    upcomingEvents: (row.upcoming_events as string[]) ?? [],
    confidenceScores: {
      tax: row.confidence_tax as number,
      pensions: row.confidence_pensions as number,
      budgeting: row.confidence_budgeting as number,
      investing: row.confidence_investing as number,
      contracts: row.confidence_contracts as number,
    },
    livingSituation: row.living_situation as string | undefined,
    planningToMove: row.planning_to_move as string | undefined,
    salary: row.salary as string | undefined,
    studentLoan: row.student_loan as string | undefined,
    hasDebt: row.has_debt as string | undefined,
    interestedTopics: row.interested_topics as string[] | undefined,
    motivation: row.motivation as string | undefined,
    usageFrequency: row.usage_frequency as string | undefined,
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return rowToProfile(data as Record<string, unknown>)
}

export async function upsertProfile(userId: string, profile: UserProfile): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    first_name: profile.firstName,
    email: profile.email,
    company_name: profile.companyName,
    life_stage: profile.lifeStage,
    employment_type: profile.employmentType,
    six_month_goal: profile.sixMonthGoal,
    upcoming_events: profile.upcomingEvents,
    living_situation: profile.livingSituation ?? null,
    planning_to_move: profile.planningToMove ?? null,
    salary: profile.salary ?? null,
    student_loan: profile.studentLoan ?? null,
    has_debt: profile.hasDebt ?? null,
    interested_topics: profile.interestedTopics ?? null,
    motivation: profile.motivation ?? null,
    usage_frequency: profile.usageFrequency ?? null,
    confidence_tax: profile.confidenceScores.tax,
    confidence_pensions: profile.confidenceScores.pensions,
    confidence_budgeting: profile.confidenceScores.budgeting,
    confidence_investing: profile.confidenceScores.investing,
    confidence_contracts: profile.confidenceScores.contracts,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(`upsertProfile failed: ${error.message}`)
}

// Inserts one user_story_facts row per significant onboarding field.
// Called once when onboarding completes.
export async function seedStoryFacts(userId: string, profile: UserProfile): Promise<void> {
  type FactInput = {
    category: StoryFactCategory
    key: string
    value: string
    source: StoryFactSource
    sourceDetail: string
  }

  const facts: FactInput[] = [
    { category: 'life_stage', key: 'life_stage', value: profile.lifeStage, source: 'onboarding', sourceDetail: 'step_2_of_onboarding' },
    { category: 'life_stage', key: 'employment_type', value: profile.employmentType, source: 'onboarding', sourceDetail: 'step_2_of_onboarding' },
    { category: 'goals', key: 'primary_concern', value: profile.sixMonthGoal, source: 'onboarding', sourceDetail: 'step_4_of_onboarding' },
    { category: 'confidence', key: 'confidence_tax', value: String(profile.confidenceScores.tax), source: 'onboarding', sourceDetail: 'step_5_of_onboarding' },
    { category: 'confidence', key: 'confidence_pensions', value: String(profile.confidenceScores.pensions), source: 'onboarding', sourceDetail: 'step_5_of_onboarding' },
    { category: 'confidence', key: 'confidence_budgeting', value: String(profile.confidenceScores.budgeting), source: 'onboarding', sourceDetail: 'step_5_of_onboarding' },
    { category: 'confidence', key: 'confidence_investing', value: String(profile.confidenceScores.investing), source: 'onboarding', sourceDetail: 'step_5_of_onboarding' },
    { category: 'confidence', key: 'confidence_contracts', value: String(profile.confidenceScores.contracts), source: 'onboarding', sourceDetail: 'step_5_of_onboarding' },
  ]

  if (profile.upcomingEvents.length > 0) {
    facts.push({
      category: 'events',
      key: 'upcoming_events',
      value: profile.upcomingEvents.join(', '),
      source: 'onboarding',
      sourceDetail: 'step_3_of_onboarding',
    })
  }
  if (profile.livingSituation) {
    facts.push({ category: 'housing', key: 'living_situation', value: profile.livingSituation, source: 'onboarding', sourceDetail: 'step_2_of_onboarding' })
  }
  if (profile.planningToMove) {
    facts.push({ category: 'housing', key: 'planning_to_move', value: profile.planningToMove, source: 'onboarding', sourceDetail: 'step_2_of_onboarding' })
  }
  if (profile.salary) {
    facts.push({ category: 'finances', key: 'salary', value: profile.salary, source: 'onboarding', sourceDetail: 'step_7_of_onboarding' })
  }
  if (profile.studentLoan) {
    facts.push({ category: 'finances', key: 'student_loan', value: profile.studentLoan, source: 'onboarding', sourceDetail: 'step_6_of_onboarding' })
  }
  if (profile.hasDebt) {
    facts.push({ category: 'finances', key: 'has_debt', value: profile.hasDebt, source: 'onboarding', sourceDetail: 'step_4_of_onboarding' })
  }

  const rows = facts.map((f) => ({
    user_id: userId,
    category: f.category,
    key: f.key,
    value: f.value,
    source: f.source,
    source_detail: f.sourceDetail,
    set_by_ai: false,
    confidence: 1.0,
    is_active: true,
  }))

  await supabase.from('user_story_facts').insert(rows)
}

export async function fetchStoryFacts(userId: string): Promise<UserStoryFact[]> {
  const { data, error } = await supabase
    .from('user_story_facts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    category: row.category as UserStoryFact['category'],
    key: row.key as string,
    value: row.value as string,
    valueJson: row.value_json as Record<string, unknown> | undefined,
    source: row.source as UserStoryFact['source'],
    sourceDetail: row.source_detail as string | undefined,
    setByAi: row.set_by_ai as boolean,
    confidence: Number(row.confidence),
    isActive: row.is_active as boolean,
    supersededBy: row.superseded_by as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }))
}
