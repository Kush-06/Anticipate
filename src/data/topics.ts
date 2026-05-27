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
}

export const topics: Topic[] = [
  {
    id: "pension",
    title: "Pension & Retirement",
    icon: "🏦",
    color: "#3b82f6",
    completion: 67,
    subTopics: [
      {
        id: "auto-enrolment",
        title: "Auto-Enrolment Basics",
        completed: true,
        content: "pension auto-enrolment",
        quiz: [
          {
            id: "q1",
            question: "What percentage of your qualifying earnings is automatically deducted for pension?",
            options: ["3%", "5%", "8%", "10%"],
            correctAnswer: 1,
            explanation: "At least 5% of your qualifying earnings are deducted each month and placed into your pension pot. Your employer tops this up with a further 3%, making a total of 8%."
          },
          {
            id: "q2",
            question: "When does pension auto-enrolment start?",
            options: ["After 3 months", "After 6 months", "On your first day", "After 1 year"],
            correctAnswer: 2,
            explanation: "Auto-enrolment happens automatically on your first day of work. You don't need to do anything — your employer is legally required to sign you up."
          },
          {
            id: "q3",
            question: "Who contributes to your workplace pension?",
            options: ["Only you", "Only your employer", "Both you and your employer", "The government"],
            correctAnswer: 2,
            explanation: "Both you and your employer contribute. You contribute at least 5% of your qualifying earnings, and your employer adds a minimum of 3%."
          }
        ]
      },
      {
        id: "contributions",
        title: "Understanding Contributions",
        completed: true,
        content: "pension contributions",
        quiz: [
          {
            id: "q1",
            question: "If you earn £30,000, approximately how much goes to your pension monthly?",
            options: ["£50", "£100", "£150", "£200"],
            correctAnswer: 1,
            explanation: "With 5% employee contribution on £30,000 annually, approximately £100 is deducted monthly (£30,000 × 5% ÷ 12 months ≈ £125, but qualifying earnings threshold applies)."
          },
          {
            id: "q2",
            question: "What is the employer's minimum contribution?",
            options: ["1%", "2%", "3%", "5%"],
            correctAnswer: 2,
            explanation: "The employer must contribute a minimum of 3% of your qualifying earnings to your workplace pension scheme."
          },
          {
            id: "q3",
            question: "Can you opt out of auto-enrolment?",
            options: ["Yes, anytime", "No, never", "Only in the first month", "Only after 1 year"],
            correctAnswer: 0,
            explanation: "Yes, you can opt out of auto-enrolment at any time, although it's generally not recommended as you'll lose the employer contribution and tax benefits."
          }
        ]
      },
      {
        id: "tax-relief",
        title: "Tax Relief Benefits",
        completed: false,
        content: "pension tax relief",
        quiz: [
          {
            id: "q1",
            question: "Do pension contributions receive tax relief?",
            options: ["Yes", "No", "Only for high earners", "Only after age 40"],
            correctAnswer: 0,
            explanation: "Yes! Pension contributions receive tax relief, meaning the government tops up your pension by the amount of income tax you would have paid on that money."
          },
          {
            id: "q2",
            question: "What happens to your pension if you change jobs?",
            options: ["You lose it", "It stays in your name", "It goes to your employer", "It's frozen"],
            correctAnswer: 1,
            explanation: "Your pension stays in your name even if you change jobs. You can leave it where it is, transfer it to your new employer's scheme, or consolidate multiple pensions."
          },
          {
            id: "q3",
            question: "At what age can you typically access your pension?",
            options: ["50", "55", "60", "65"],
            correctAnswer: 1,
            explanation: "You can typically access your pension from age 55 (rising to 57 in 2028). However, leaving it longer often means a more comfortable retirement."
          }
        ]
      }
    ]
  },
  {
    id: "taxes",
    title: "Tax & National Insurance",
    icon: "💷",
    color: "#10b981",
    completion: 33,
    subTopics: [
      {
        id: "income-tax",
        title: "Income Tax Basics",
        completed: true,
        content: "income tax",
        quiz: [
          {
            id: "q1",
            question: "What is the personal allowance for 2026/27?",
            options: ["£10,000", "£12,570", "£15,000", "£20,000"],
            correctAnswer: 1,
            explanation: "The personal allowance is £12,570, meaning you don't pay tax on the first £12,570 you earn each year."
          },
          {
            id: "q2",
            question: "What is the basic rate of income tax?",
            options: ["10%", "20%", "30%", "40%"],
            correctAnswer: 1,
            explanation: "The basic rate of income tax is 20%, which applies to income between £12,571 and £50,270."
          },
          {
            id: "q3",
            question: "When does income tax get deducted?",
            options: ["Annually", "Monthly via PAYE", "You pay it yourself", "Only if you're self-employed"],
            correctAnswer: 1,
            explanation: "For employees, income tax is deducted monthly through the PAYE (Pay As You Earn) system before you receive your salary."
          }
        ]
      },
      {
        id: "national-insurance",
        title: "National Insurance",
        completed: false,
        content: "national insurance",
        quiz: [
          {
            id: "q1",
            question: "What does National Insurance pay for?",
            options: ["Healthcare only", "State pension only", "NHS, state pension & benefits", "Private insurance"],
            correctAnswer: 2,
            explanation: "National Insurance contributions pay for the NHS, your state pension, and certain state benefits like maternity allowance and jobseeker's allowance."
          },
          {
            id: "q2",
            question: "What is the employee NI rate for 2026/27?",
            options: ["8%", "10%", "12%", "15%"],
            correctAnswer: 2,
            explanation: "Employees pay 12% National Insurance on earnings between £12,570 and £50,270, and 2% on earnings above that."
          },
          {
            id: "q3",
            question: "When do you start paying National Insurance?",
            options: ["From £0", "From £12,570", "From £20,000", "From £30,000"],
            correctAnswer: 1,
            explanation: "You start paying National Insurance on earnings above £12,570 per year (aligned with the income tax personal allowance)."
          }
        ]
      },
      {
        id: "tax-codes",
        title: "Understanding Tax Codes",
        completed: false,
        content: "tax codes",
        quiz: [
          {
            id: "q1",
            question: "What does a tax code of 1257L mean?",
            options: ["You owe tax", "Standard personal allowance", "Emergency tax", "No tax"],
            correctAnswer: 1,
            explanation: "1257L is the most common tax code, representing the standard personal allowance of £12,570. The number (without the last digit) shows your tax-free amount in hundreds."
          },
          {
            id: "q2",
            question: "Where can you find your tax code?",
            options: ["Payslip", "P60", "Tax code notice from HMRC", "All of these"],
            correctAnswer: 3,
            explanation: "Your tax code appears on your payslip, P60 (end of year statement), and on tax code notices sent by HMRC."
          },
          {
            id: "q3",
            question: "What should you do if your tax code seems wrong?",
            options: ["Ignore it", "Contact HMRC", "Ask your employer to change it", "Pay the difference yourself"],
            correctAnswer: 1,
            explanation: "If you think your tax code is wrong, contact HMRC directly. Your employer can't change it — they must use the code HMRC provides."
          }
        ]
      }
    ]
  },
  {
    id: "employment",
    title: "Employment Rights",
    icon: "📋",
    color: "#f59e0b",
    completion: 50,
    subTopics: [
      {
        id: "contracts",
        title: "Employment Contracts",
        completed: true,
        content: "employment contracts",
        quiz: [
          {
            id: "q1",
            question: "When should you receive a written contract?",
            options: ["Within 1 week", "Within 2 months", "Within 1 day", "Anytime"],
            correctAnswer: 2,
            explanation: "From 2023, employers must provide a written statement of terms (contract) on or before your first day of work."
          },
          {
            id: "q2",
            question: "Can an employer change your contract without consent?",
            options: ["Yes, anytime", "No, never", "Only with your agreement", "Only for pay increases"],
            correctAnswer: 2,
            explanation: "Your employer cannot unilaterally change your contract terms. Changes require mutual agreement or proper consultation processes."
          },
          {
            id: "q3",
            question: "What must be included in an employment contract?",
            options: ["Just salary", "Salary and hours only", "Comprehensive terms including pay, hours, holidays", "Whatever the employer wants"],
            correctAnswer: 2,
            explanation: "Contracts must include pay, hours, holiday entitlement, notice periods, job title, workplace, and other key terms."
          }
        ]
      },
      {
        id: "holiday",
        title: "Holiday Entitlement",
        completed: true,
        content: "holiday entitlement",
        quiz: [
          {
            id: "q1",
            question: "What is the minimum holiday entitlement in the UK?",
            options: ["20 days", "25 days", "28 days (inc. bank holidays)", "30 days"],
            correctAnswer: 2,
            explanation: "UK workers are entitled to 5.6 weeks' holiday per year, which equals 28 days for full-time workers (including bank holidays)."
          },
          {
            id: "q2",
            question: "Do part-time workers get holiday entitlement?",
            options: ["No", "Yes, pro-rated", "Only if working 3+ days", "At employer's discretion"],
            correctAnswer: 1,
            explanation: "Part-time workers get the same entitlement as full-time workers, but calculated pro-rata based on their working pattern."
          },
          {
            id: "q3",
            question: "Can your employer refuse holiday requests?",
            options: ["Never", "Yes, with valid business reasons", "Only in December", "Only for new starters"],
            correctAnswer: 1,
            explanation: "Employers can refuse holiday requests if there are legitimate business reasons, but they must give notice equal to the holiday length requested."
          }
        ]
      },
      {
        id: "notice",
        title: "Notice Periods",
        completed: false,
        content: "notice periods",
        quiz: [
          {
            id: "q1",
            question: "What is the minimum statutory notice period?",
            options: ["None", "1 week", "2 weeks", "1 month"],
            correctAnswer: 1,
            explanation: "The statutory minimum notice is 1 week (after 1 month of service), though your contract may require longer."
          },
          {
            id: "q2",
            question: "Does notice period increase with service?",
            options: ["No", "Yes, by 1 week per year of service", "Only after 10 years", "Only for managers"],
            correctAnswer: 1,
            explanation: "Statutory notice increases by 1 week for each year of service, up to a maximum of 12 weeks after 12 years."
          },
          {
            id: "q3",
            question: "Can you be paid in lieu of notice?",
            options: ["Never", "Yes, if contract allows", "Only if you resign", "Only if dismissed"],
            correctAnswer: 1,
            explanation: "If your contract includes a 'payment in lieu of notice' (PILON) clause, you can be paid instead of working your notice."
          }
        ]
      }
    ]
  },
  {
    id: "benefits",
    title: "Employee Benefits",
    icon: "🎁",
    color: "#8b5cf6",
    completion: 25,
    subTopics: [
      {
        id: "sick-pay",
        title: "Sick Pay",
        completed: true,
        content: "statutory sick pay",
        quiz: [
          {
            id: "q1",
            question: "What is Statutory Sick Pay (SSP)?",
            options: ["Full salary when sick", "£116.75 per week", "Nothing", "50% of salary"],
            correctAnswer: 1,
            explanation: "SSP is £116.75 per week (2026/27 rate) for up to 28 weeks. Many employers offer enhanced sick pay above this minimum."
          },
          {
            id: "q2",
            question: "When does SSP start?",
            options: ["Day 1", "Day 4", "Day 7", "Week 2"],
            correctAnswer: 1,
            explanation: "SSP starts from the 4th consecutive day of sickness. The first 3 days are 'waiting days' with no SSP."
          },
          {
            id: "q3",
            question: "Do you need a doctor's note for SSP?",
            options: ["From day 1", "After 7 days", "After 28 days", "Never"],
            correctAnswer: 1,
            explanation: "You can self-certify for the first 7 days. After that, you need a fit note from your doctor."
          }
        ]
      },
      {
        id: "maternity",
        title: "Maternity & Paternity",
        completed: false,
        content: "parental leave",
        quiz: [
          {
            id: "q1",
            question: "How long is statutory maternity leave?",
            options: ["26 weeks", "39 weeks", "52 weeks", "No limit"],
            correctAnswer: 2,
            explanation: "You're entitled to 52 weeks of maternity leave: 26 weeks 'ordinary' leave plus 26 weeks 'additional' leave."
          },
          {
            id: "q2",
            question: "How much is Statutory Maternity Pay?",
            options: ["Full salary", "90% then £184.03/week", "£500/week", "Nothing"],
            correctAnswer: 1,
            explanation: "SMP is 90% of average earnings for 6 weeks, then £184.03 per week (or 90% if lower) for 33 weeks."
          },
          {
            id: "q3",
            question: "What is statutory paternity leave?",
            options: ["1 week", "2 weeks", "4 weeks", "6 months"],
            correctAnswer: 1,
            explanation: "Statutory paternity leave is 1 or 2 weeks (your choice) taken within 56 days of the birth or adoption."
          }
        ]
      },
      {
        id: "health",
        title: "Health Benefits",
        completed: false,
        content: "health insurance",
        quiz: [
          {
            id: "q1",
            question: "Is private health insurance taxable?",
            options: ["No", "Yes, as a benefit in kind", "Only if over £1000", "Only for directors"],
            correctAnswer: 1,
            explanation: "Private medical insurance is a taxable benefit. You pay tax on its value through your PAYE code."
          },
          {
            id: "q2",
            question: "Can you opt out of company health insurance?",
            options: ["Never", "Usually yes", "Only in first month", "Only if you have private cover"],
            correctAnswer: 1,
            explanation: "Most employers allow you to opt out, though this may affect your overall benefits package."
          },
          {
            id: "q3",
            question: "Does private insurance replace the NHS?",
            options: ["Yes", "No, it supplements NHS care", "Only for emergencies", "Only after retirement"],
            correctAnswer: 1,
            explanation: "Private health insurance supplements NHS care for faster access to certain treatments. Emergency care remains through the NHS."
          }
        ]
      }
    ]
  },
  {
    id: "savings",
    title: "Savings & Budgeting",
    icon: "💰",
    color: "#ec4899",
    completion: 0,
    subTopics: [
      {
        id: "emergency-fund",
        title: "Emergency Funds",
        completed: false,
        content: "emergency savings",
        quiz: [
          {
            id: "q1",
            question: "How much should an emergency fund cover?",
            options: ["1 month expenses", "3-6 months expenses", "1 year expenses", "No specific amount"],
            correctAnswer: 1,
            explanation: "Financial experts recommend saving 3-6 months of essential expenses as an emergency fund to cover unexpected costs."
          },
          {
            id: "q2",
            question: "Where should you keep emergency savings?",
            options: ["Under mattress", "Easy access savings account", "Long-term investments", "Pension"],
            correctAnswer: 1,
            explanation: "Emergency funds should be in an easy access savings account so you can access the money quickly when needed."
          },
          {
            id: "q3",
            question: "Should you save before paying off debt?",
            options: ["Always save first", "Always pay debt first", "Build small emergency fund first", "Depends on interest rates"],
            correctAnswer: 2,
            explanation: "Generally, build a small emergency fund (£1000-£2000) first, then focus on high-interest debt while maintaining the fund."
          }
        ]
      },
      {
        id: "budgeting",
        title: "Creating a Budget",
        completed: false,
        content: "monthly budgeting",
        quiz: [
          {
            id: "q1",
            question: "What is the 50/30/20 budgeting rule?",
            options: ["50% fun, 30% bills, 20% savings", "50% needs, 30% wants, 20% savings", "50% rent, 30% food, 20% other", "Made up rule"],
            correctAnswer: 1,
            explanation: "The 50/30/20 rule suggests allocating 50% of income to needs, 30% to wants, and 20% to savings and debt repayment."
          },
          {
            id: "q2",
            question: "How often should you review your budget?",
            options: ["Daily", "Monthly", "Yearly", "Never"],
            correctAnswer: 1,
            explanation: "Review your budget monthly to track spending, adjust for changes in income or expenses, and stay on track with goals."
          },
          {
            id: "q3",
            question: "Should you budget for irregular expenses?",
            options: ["No", "Yes, set aside monthly amounts", "Only if wealthy", "Only once a year"],
            correctAnswer: 1,
            explanation: "Budget for irregular expenses (car insurance, Christmas, etc.) by setting aside money monthly so you're not caught out."
          }
        ]
      },
      {
        id: "isa",
        title: "ISAs & Tax-Free Savings",
        completed: false,
        content: "individual savings accounts",
        quiz: [
          {
            id: "q1",
            question: "What is the ISA allowance for 2026/27?",
            options: ["£10,000", "£15,000", "£20,000", "£25,000"],
            correctAnswer: 2,
            explanation: "The ISA allowance is £20,000 per tax year — the maximum you can save tax-free across all your ISAs."
          },
          {
            id: "q2",
            question: "Do you pay tax on ISA interest?",
            options: ["Yes, 20%", "Yes, 10%", "No, it's tax-free", "Only if over £50,000"],
            correctAnswer: 2,
            explanation: "ISAs are completely tax-free — you don't pay tax on interest, dividends, or capital gains."
          },
          {
            id: "q3",
            question: "Can you have multiple ISAs?",
            options: ["No", "Yes, but only pay into one per year", "Yes, unlimited", "Only Cash ISAs"],
            correctAnswer: 1,
            explanation: "You can have multiple ISAs but can only open and pay into one of each type (Cash, Stocks & Shares, Lifetime, Innovative) per tax year."
          }
        ]
      }
    ]
  }
];

export function getTopicById(id: string): Topic | undefined {
  return topics.find(topic => topic.id === id);
}

export function getSubTopicById(topicId: string, subTopicId: string): SubTopic | undefined {
  const topic = getTopicById(topicId);
  return topic?.subTopics.find(sub => sub.id === subTopicId);
}
