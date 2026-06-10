import type { SpineItem } from '@shared/types'
import type { Topic } from '../data/topics'

const KEYWORD_TOPIC_IDS: Array<{ topicId: string; keywords: string[] }> = [
  { topicId: 'buying-a-home', keywords: ['buying-a-home', 'buying a home', 'home buying', 'housing', 'mortgage', 'house', 'moving costs'] },
  { topicId: 'career', keywords: ['hedge fund', 'salary', 'pay rise', 'switching roles', 'review'] },
  { topicId: 'starting-work', keywords: ['starting-work', 'starting work', 'first job', 'new job', 'payslip', 'student loan', 'auto-enrolment', 'auto enrolment'] },
  { topicId: 'renting', keywords: ['renting', 'renter', 'tenancy', 'deposit', 'guarantor', 'bills budget'] },
  { topicId: 'foundations', keywords: ['foundations', 'emergency fund', 'inflation', 'compound interest', 'open banking'] },
  { topicId: 'relationships', keywords: ['relationships', 'partner', 'joint account', 'marriage allowance'] },
  { topicId: 'family', keywords: ['family', 'baby', 'child benefit', 'maternity', 'paternity', 'junior isa'] },
  { topicId: 'cars', keywords: ['cars', 'car', 'driving', 'pcp', 'hp finance'] },
  { topicId: 'debt', keywords: ['debt', 'payoff', 'avalanche', 'snowball'] },
  { topicId: 'investing-101', keywords: ['investing', 'stocks', 'shares', 'index fund', 'risk', 'volatility'] },
  { topicId: 'taxes-wealth', keywords: ['tax', 'capital gains', 'state pension', 'tax bracket'] },
  { topicId: 'mastering-credit', keywords: ['credit', 'bnpl', 'credit score'] },
  { topicId: 'windfalls', keywords: ['windfall', 'allowance', '30-day pause'] },
]

function normalize(value: string): string {
  return value.toLowerCase().replace(/[·&]/g, ' ')
}

export function getTimelineItemDestination(item: SpineItem, topics: Topic[]): string | null {
  if (item.lessonPath?.startsWith('/topic/')) return item.lessonPath

  const text = normalize(`${item.title} ${item.tag} ${item.id}`)

  const keywordMatch = KEYWORD_TOPIC_IDS.find(({ topicId, keywords }) => {
    if (!topics.some((topic) => topic.id === topicId)) return false
    return keywords.some((keyword) => text.includes(normalize(keyword)))
  })
  if (keywordMatch) return `/topic/${keywordMatch.topicId}`

  const exactTopic = topics.find((topic) => {
    const topicText = normalize(`${topic.id} ${topic.title}`)
    return text.includes(normalize(topic.id)) || text.includes(topicText)
  })

  return exactTopic ? `/topic/${exactTopic.id}` : null
}
