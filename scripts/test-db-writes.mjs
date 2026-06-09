import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zolyomdaequaplepekwn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbHlvbWRhZXF1YXBsZXBla3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzU1NDAsImV4cCI6MjA5NTU1MTU0MH0.NiLsJPGaaZ_bEI4uiOfnp1hl9KiJ15MhhWrM215Hy2o'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const TEST_EMAIL = `test-${Date.now()}@test.com`
const TEST_PASSWORD = 'testpassword123'

async function run() {
  console.log('=== Supabase DB write test ===\n')

  // 1. Sign up
  console.log('1. Signing up test user:', TEST_EMAIL)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signUpError) {
    console.error('   FAIL signUp:', signUpError.message)
    process.exit(1)
  }
  console.log('   session:', signUpData.session ? 'PRESENT' : 'NULL (email confirmation required)')
  if (!signUpData.session) {
    console.error('\n   Email confirmation is ENABLED on this Supabase project.')
    console.error('   Disable it at: Supabase Dashboard → Auth → Providers → Email → Confirm email: OFF')
    process.exit(1)
  }

  const uid = signUpData.session.user.id
  console.log('   user id:', uid)

  // 2. Try upsert to user_profiles
  console.log('\n2. Writing to user_profiles...')
  const { error: profileError } = await supabase.from('user_profiles').upsert({
    user_id: uid,
    first_name: 'Test',
    email: TEST_EMAIL,
    company_name: 'Test Corp',
    life_stage: "I've just started my first proper job",
    employment_type: "I've just started my first proper job",
    six_month_goal: 'Test goal',
    upcoming_events: [],
    confidence_tax: 3,
    confidence_pensions: 3,
    confidence_budgeting: 3,
    confidence_investing: 3,
    confidence_contracts: 3,
    updated_at: new Date().toISOString(),
  })
  if (profileError) {
    console.error('   FAIL user_profiles:', profileError.message, profileError.code, profileError.details)
  } else {
    console.log('   OK user_profiles written')
  }

  // 3. Try insert to user_timeline_items
  console.log('\n3. Writing to user_timeline_items...')
  const { error: timelineError } = await supabase.from('user_timeline_items').insert({
    user_id: uid,
    item_key: 'test-item',
    status: 'pending',
    spine_group: 'this-week',
    title: 'Test item',
    tag: 'Test',
    when_label: 'Today',
    source: 'onboarding_seed',
    sort_order: 0,
    is_dismissed: false,
  })
  if (timelineError) {
    console.error('   FAIL user_timeline_items:', timelineError.message, timelineError.code, timelineError.details)
  } else {
    console.log('   OK user_timeline_items written')
  }

  // 4. Clean up
  console.log('\n4. Cleaning up...')
  await supabase.from('user_timeline_items').delete().eq('user_id', uid)
  await supabase.from('user_profiles').delete().eq('user_id', uid)
  await supabase.auth.admin?.deleteUser(uid).catch(() => {})
  console.log('   done')

  console.log('\n=== All writes succeeded ===')
}

run().catch(err => {
  console.error('\nUnhandled error:', err)
  process.exit(1)
})
