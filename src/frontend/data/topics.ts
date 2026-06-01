export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface SubTopic {
  id: string;
  title: string;
  completed: boolean;
  content: string;
  quiz: QuizQuestion[];
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  color: string;
  completion: number;
  subTopics: SubTopic[];
  topicQuiz: QuizQuestion[];
}

const lessonModules = import.meta.glob<string>(
  '../content/lessons/**/*.md',
  { query: '?raw', import: 'default', eager: true }
)

function getContent(topicId: string, subTopicId: string): string {
  const key = `/src/frontend/content/lessons/${topicId}/${subTopicId}.md`
  return lessonModules[key] ?? ''
}

export const topics: Topic[] = [
  {
    id: "starting-work",
    title: "Starting Work",
    icon: "💼",
    color: "#3b82f6",
    completion: 0,
    subTopics: [
      { id: "lesson-01", title: "Decoding Your Payslip",       completed: false, content: getContent("starting-work", "lesson-01"), quiz: [] },
      { id: "lesson-02", title: "The Auto-Enrolment Pension",  completed: false, content: getContent("starting-work", "lesson-02"), quiz: [] },
      { id: "lesson-03", title: "The 50/30/20 Rule",           completed: false, content: getContent("starting-work", "lesson-03"), quiz: [] },
      { id: "lesson-04", title: "Student Loan Repayments",     completed: false, content: getContent("starting-work", "lesson-04"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "renting",
    title: "Renting",
    icon: "🔑",
    color: "#10b981",
    completion: 0,
    subTopics: [
      { id: "lesson-05", title: "Deposits & Guarantors",  completed: false, content: getContent("renting", "lesson-05"), quiz: [] },
      { id: "lesson-06", title: "Budgeting for Bills",    completed: false, content: getContent("renting", "lesson-06"), quiz: [] },
      { id: "lesson-07", title: "Renters' Insurance",     completed: false, content: getContent("renting", "lesson-07"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "buying-a-home",
    title: "Buying a Home",
    icon: "🏡",
    color: "#f59e0b",
    completion: 0,
    subTopics: [
      { id: "lesson-08", title: "Mortgages 101",                completed: false, content: getContent("buying-a-home", "lesson-08"), quiz: [] },
      { id: "lesson-09", title: "The Lifetime ISA (LISA)",      completed: false, content: getContent("buying-a-home", "lesson-09"), quiz: [] },
      { id: "lesson-10", title: "The Hidden Costs of Buying",   completed: false, content: getContent("buying-a-home", "lesson-10"), quiz: [] },
      { id: "lesson-11", title: "Mortgage Approval Bootcamp",   completed: false, content: getContent("buying-a-home", "lesson-11"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "relationships",
    title: "Money & Relationships",
    icon: "💑",
    color: "#ec4899",
    completion: 0,
    subTopics: [
      { id: "lesson-12", title: "The Money Talk",         completed: false, content: getContent("relationships", "lesson-12"), quiz: [] },
      { id: "lesson-13", title: "Joint Accounts",         completed: false, content: getContent("relationships", "lesson-13"), quiz: [] },
      { id: "lesson-14", title: "The Marriage Allowance", completed: false, content: getContent("relationships", "lesson-14"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "family",
    title: "Family Finances",
    icon: "👶",
    color: "#8b5cf6",
    completion: 0,
    subTopics: [
      { id: "lesson-15", title: "Maternity & Paternity Pay", completed: false, content: getContent("family", "lesson-15"), quiz: [] },
      { id: "lesson-16", title: "Free Money for Parents",    completed: false, content: getContent("family", "lesson-16"), quiz: [] },
      { id: "lesson-17", title: "Junior ISAs (JISAs)",       completed: false, content: getContent("family", "lesson-17"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "career",
    title: "Career & Pay",
    icon: "📈",
    color: "#f97316",
    completion: 0,
    subTopics: [
      { id: "lesson-18", title: "Salary Negotiation",        completed: false, content: getContent("career", "lesson-18"), quiz: [] },
      { id: "lesson-19", title: "Avoiding Lifestyle Creep",  completed: false, content: getContent("career", "lesson-19"), quiz: [] },
      { id: "lesson-20", title: "Pension Consolidation",     completed: false, content: getContent("career", "lesson-20"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "cars",
    title: "Cars & Transport",
    icon: "🚗",
    color: "#06b6d4",
    completion: 0,
    subTopics: [
      { id: "lesson-24", title: "Car Finance Demystified",    completed: false, content: getContent("cars", "lesson-24"), quiz: [] },
      { id: "lesson-25", title: "The True Cost of Driving",   completed: false, content: getContent("cars", "lesson-25"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "debt",
    title: "Managing Debt",
    icon: "📉",
    color: "#ef4444",
    completion: 0,
    subTopics: [
      { id: "lesson-29", title: "The Debt Spectrum",     completed: false, content: getContent("debt", "lesson-29"), quiz: [] },
      { id: "lesson-30", title: "Payoff Strategies",     completed: false, content: getContent("debt", "lesson-30"), quiz: [] },
      { id: "lesson-31", title: "Getting Free Help",     completed: false, content: getContent("debt", "lesson-31"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "windfalls",
    title: "Windfalls & Allowances",
    icon: "🎁",
    color: "#84cc16",
    completion: 0,
    subTopics: [
      { id: "lesson-34", title: "The 30-Day Pause",         completed: false, content: getContent("windfalls", "lesson-34"), quiz: [] },
      { id: "lesson-35", title: "Maximising Allowances",    completed: false, content: getContent("windfalls", "lesson-35"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "foundations",
    title: "The Foundations",
    icon: "💡",
    color: "#6366f1",
    completion: 0,
    subTopics: [
      { id: "lesson-36", title: "The Power of Compound Interest", completed: false, content: getContent("foundations", "lesson-36"), quiz: [] },
      { id: "lesson-37", title: "The Emergency Fund",             completed: false, content: getContent("foundations", "lesson-37"), quiz: [] },
      { id: "lesson-38", title: "Inflation",                      completed: false, content: getContent("foundations", "lesson-38"), quiz: [] },
      { id: "lesson-39", title: "Open Banking",                   completed: false, content: getContent("foundations", "lesson-39"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "mastering-credit",
    title: "Mastering Credit",
    icon: "💳",
    color: "#14b8a6",
    completion: 0,
    subTopics: [
      { id: "lesson-40", title: "Demystifying UK Credit Scores", completed: false, content: getContent("mastering-credit", "lesson-40"), quiz: [] },
      { id: "lesson-41", title: "Credit Card Jedi",              completed: false, content: getContent("mastering-credit", "lesson-41"), quiz: [] },
      { id: "lesson-42", title: "Buy Now, Pay Later (BNPL)",     completed: false, content: getContent("mastering-credit", "lesson-42"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "investing-101",
    title: "Investing 101",
    icon: "📊",
    color: "#22c55e",
    completion: 0,
    subTopics: [
      { id: "lesson-43", title: "Stocks & Shares ISAs vs. Cash ISAs", completed: false, content: getContent("investing-101", "lesson-43"), quiz: [] },
      { id: "lesson-44", title: "What is an Index Fund?",             completed: false, content: getContent("investing-101", "lesson-44"), quiz: [] },
      { id: "lesson-45", title: "Risk and Volatility",                completed: false, content: getContent("investing-101", "lesson-45"), quiz: [] },
      { id: "lesson-46", title: "Pound Cost Averaging",               completed: false, content: getContent("investing-101", "lesson-46"), quiz: [] },
      { id: "lesson-47", title: "Ethical & ESG Investing",            completed: false, content: getContent("investing-101", "lesson-47"), quiz: [] },
    ],
    topicQuiz: [],
  },
  {
    id: "taxes-wealth",
    title: "Taxes & Wealth Building",
    icon: "🏦",
    color: "#a855f7",
    completion: 0,
    subTopics: [
      { id: "lesson-48", title: "The UK Tax Brackets",    completed: false, content: getContent("taxes-wealth", "lesson-48"), quiz: [] },
      { id: "lesson-49", title: "Capital Gains Tax (CGT)", completed: false, content: getContent("taxes-wealth", "lesson-49"), quiz: [] },
      { id: "lesson-50", title: "The State Pension",       completed: false, content: getContent("taxes-wealth", "lesson-50"), quiz: [] },
    ],
    topicQuiz: [],
  },
];

export function getTopicById(id: string): Topic | undefined {
  return topics.find(topic => topic.id === id);
}

export function getSubTopicById(topicId: string, subTopicId: string): SubTopic | undefined {
  const topic = getTopicById(topicId);
  return topic?.subTopics.find(sub => sub.id === subTopicId);
}
