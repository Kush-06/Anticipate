import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

function readDotEnvValue(name: string): string | undefined {
  const envPath = resolve('.env')
  if (!existsSync(envPath)) return undefined

  const line = readFileSync(envPath, 'utf-8')
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${name}=`))

  if (!line) return undefined
  return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')
}

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? readDotEnvValue('VITE_SUPABASE_URL')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Pass SUPABASE_SERVICE_ROLE_KEY as a one-off shell environment variable; do not add it to the frontend .env file.')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const now = Date.now()
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()

const threads = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    topic_id: 'starting-work',
    title: 'How much tax am I paying on a £25k salary?',
    created_at: hoursAgo(4),
    author_nickname: 'Anonymous Badger 482',
    user_id: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    topic_id: 'starting-work',
    title: 'Is auto-enrolment pension really free money?',
    created_at: hoursAgo(24),
    author_nickname: 'Anonymous Panda 123',
    user_id: null,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    topic_id: 'renting',
    title: 'Landlord trying to deduct £200 for "cleaning"',
    created_at: hoursAgo(2),
    author_nickname: 'Anonymous Fox 719',
    user_id: null,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    topic_id: 'buying-a-home',
    title: 'Is a Lifetime ISA (LISA) worth it?',
    created_at: hoursAgo(12),
    author_nickname: 'Anonymous Owl 554',
    user_id: null,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    topic_id: 'debt',
    title: 'Snowball vs Avalanche method?',
    created_at: hoursAgo(1),
    author_nickname: 'Anonymous Otter 881',
    user_id: null,
  },
]

const messages = [
  {
    id: '11111111-aaaa-4111-8111-111111111111',
    thread_id: '11111111-1111-4111-8111-111111111111',
    content: 'I just got my first payslip and it says tax code 1257L. I don\'t understand how much of it is actually tax vs national insurance. Anyone can break it down?',
    created_at: hoursAgo(4),
    author_nickname: 'Anonymous Badger 482',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '11111111-bbbb-4111-8111-111111111111',
    thread_id: '11111111-1111-4111-8111-111111111111',
    content: '1257L means you get £12,570 tax-free per year. Anything above that is taxed at 20% (up to £50k). National Insurance is separate, usually about 8% of your salary above £242/week. You can use online tools like Salary Calculator to check!',
    created_at: hoursAgo(3.5),
    author_nickname: 'Anonymous Bear 910',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '22222222-aaaa-4222-8222-222222222222',
    thread_id: '22222222-2222-4222-8222-222222222222',
    content: 'My employer says they match 3% if I contribute 5%. Why would I do that if it reduces my take-home pay? I need the cash now.',
    created_at: hoursAgo(24),
    author_nickname: 'Anonymous Panda 123',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '22222222-bbbb-4222-8222-222222222222',
    thread_id: '22222222-2222-4222-8222-222222222222',
    content: 'Yes! It is literally a 100% return on your 3% portion. If you opt out, you\'re rejecting free money that your employer is contractually obliged to pay you. Over 40 years, that extra 3% compounding is huge!',
    created_at: hoursAgo(22),
    author_nickname: 'Anonymous Koala 632',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '33333333-aaaa-4333-8333-333333333333',
    thread_id: '33333333-3333-4333-8333-333333333333',
    content: 'My tenancy ended last week and the landlord wants £200 for cleaning the kitchen, but it was spotless. What are my rights?',
    created_at: hoursAgo(2),
    author_nickname: 'Anonymous Fox 719',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '33333333-bbbb-4333-8333-333333333333',
    thread_id: '33333333-3333-4333-8333-333333333333',
    content: 'Your deposit must be protected in a scheme (TDP). Do NOT agree to the deduction. Dispute it through the scheme. The landlord has to prove the place was dirtier than when you moved in (using the check-in inventory). They usually back down when you say you\'ll dispute it.',
    created_at: hoursAgo(1.8),
    author_nickname: 'Anonymous Robin 111',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '44444444-aaaa-4444-8444-444444444444',
    thread_id: '44444444-4444-4444-8444-444444444444',
    content: 'I\'m 23 and want to buy a house in 5 years. Should I use a Cash LISA or Stocks & Shares LISA?',
    created_at: hoursAgo(12),
    author_nickname: 'Anonymous Owl 554',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '44444444-bbbb-4444-8444-444444444444',
    thread_id: '44444444-4444-4444-8444-444444444444',
    content: 'Absolutely worth it for the 25% government bonus! If your timeline is 5 years, a Cash LISA is safer because stock markets can go down in the short term. Just make sure the house you buy is under £450k, otherwise there\'s a 25% penalty on withdrawal.',
    created_at: hoursAgo(11),
    author_nickname: 'Anonymous Falcon 302',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '55555555-aaaa-4555-8555-555555555555',
    thread_id: '55555555-5555-4555-8555-555555555555',
    content: 'I have £3k on a credit card (19% APR) and a £2k student overdraft (0% APR but interest starting soon). Which one do I pay off first?',
    created_at: hoursAgo(1),
    author_nickname: 'Anonymous Otter 881',
    user_id: null,
    is_sage_reply: false,
  },
  {
    id: '55555555-bbbb-4555-8555-555555555555',
    thread_id: '55555555-5555-4555-8555-555555555555',
    content: 'Avalanche method: pay off the 19% credit card first because it has the highest interest. It mathematically saves you the most money. Snowball is good for psychological wins (paying smallest balance first), but here the credit card interest is too high to ignore!',
    created_at: hoursAgo(0.8),
    author_nickname: 'Anonymous Squirrel 225',
    user_id: null,
    is_sage_reply: false,
  },
]

const { error: threadsError } = await supabase
  .from('forum_threads')
  .upsert(threads, { onConflict: 'id' })

if (threadsError) {
  console.error('Forum thread seed failed:', threadsError.message)
  process.exit(1)
}

const { error: messagesError } = await supabase
  .from('forum_messages')
  .upsert(messages, { onConflict: 'id' })

if (messagesError) {
  console.error('Forum message seed failed:', messagesError.message)
  process.exit(1)
}

console.log(`Seeded ${threads.length} forum threads and ${messages.length} forum messages.`)
