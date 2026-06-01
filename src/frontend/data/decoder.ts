export interface DecoderTerm {
  phrase: string;
  type: "flag" | "definition" | "positive";
  explanation: string;
  lessonPath?: string;
}

export interface DecoderSection {
  title: string;
  content: string;
  terms: DecoderTerm[];
}

export interface FlaggedItemSummary {
  severity: "serious" | "worth-knowing" | "positive";
  title: string;
  description: string;
}

export interface ComparisonColumn {
  title: string;
  clause: string;
  description: string;
}

export interface ComparisonCard {
  title: string;
  thisDoc: ComparisonColumn;
  typical: ComparisonColumn;
}

export interface DecoderDocument {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  status: "Available" | "Locked" | "New";
  flagsCount: number;
  sections: DecoderSection[];
  verdict: string;
  flaggedItems: FlaggedItemSummary[];
  comparison?: ComparisonCard;
  suggestedLesson: {
    message: string;
    path: string;
    title: string;
  };
}

export const decoderDocuments: DecoderDocument[] = [
  {
    id: "employment-contract",
    icon: "📋",
    title: "Employment Contract",
    subtitle: "Covers notice periods, salary, restrictive covenants.",
    status: "Available",
    flagsCount: 2,
    sections: [
      {
        title: "Section 1. Parties",
        content: "This agreement is made between Anticipate Ltd ('the Employer') and the Employee.",
        terms: []
      },
      {
        title: "Section 2. Job Title",
        content: "The Employee shall be employed as a Junior Software Engineer.",
        terms: []
      },
      {
        title: "Section 3. Hours of Work",
        content: "The Employee's normal working hours are 37.5 hours per week, Monday to Friday.",
        terms: []
      },
      {
        title: "Section 4. Notice Period",
        content: "During the probationary period either party may terminate this agreement with 1 weeks notice. After the probationary period the employee must provide 3 months written notice of resignation.",
        terms: [
          {
            phrase: "3 months written notice",
            type: "flag",
            explanation: "3 months is longer than average for a graduate role. Most entry level positions require 1 month. This limits your flexibility if another opportunity comes up.",
            lessonPath: "/topic/employment/subtopic/notice"
          }
        ]
      },
      {
        title: "Section 5. Remuneration",
        content: "The employee shall receive a gross annual salary of 28000 pounds payable monthly in arrears. The company operates auto enrolment pension in line with current legislation.",
        terms: [
          {
            phrase: "gross annual salary",
            type: "definition",
            explanation: "This is your salary before tax and deductions are taken off. Your actual take home pay will be lower once income tax, National Insurance and pension contributions are removed.",
            lessonPath: "/topic/taxes/subtopic/income-tax"
          },
          {
            phrase: "auto enrolment pension",
            type: "positive",
            explanation: "This means your employer automatically puts you into a pension scheme. Your employer contributes on top of your own contributions. This is a good thing, do not opt out without understanding what you would lose.",
            lessonPath: "/topic/pension/subtopic/auto-enrolment"
          }
        ]
      },
      {
        title: "Section 6. Restrictive covenants",
        content: "For a period of 12 months following termination the employee shall not solicit or employ any person who was an employee of the company during the preceding 12 months.",
        terms: [
          {
            phrase: "12 months following termination",
            type: "flag",
            explanation: "This means for a full year after leaving you cannot take colleagues with you to a new employer. This is common but worth being aware of before you leave.",
            lessonPath: "/topic/employment/subtopic/contracts"
          }
        ]
      }
    ],
    verdict: "This employment contract is mostly standard, but contains a few clauses that require attention. Specifically, the notice period is longer than typical for entry-level positions, and the restrictive covenants are quite broad. Make sure you are comfortable with these constraints before signing.",
    flaggedItems: [
      {
        severity: "serious",
        title: "Notice Period",
        description: "The 3-month notice period is longer than typical for entry-level roles, which may restrict your mobility."
      },
      {
        severity: "worth-knowing",
        title: "Restrictive Covenants",
        description: "A 12-month restriction on soliciting former colleagues is common but relatively long."
      },
      {
        severity: "positive",
        title: "Pension Auto-Enrolment",
        description: "The company automatically enrols you into a pension scheme with employer matching contributions."
      }
    ],
    comparison: {
      title: "Notice Period Clause",
      thisDoc: {
        title: "This document",
        clause: "3 months notice",
        description: "Required to give 3 months' written notice after probation."
      },
      typical: {
        title: "Typical",
        clause: "1 month notice",
        description: "Standard entry-level notice period is 1 month."
      }
    },
    suggestedLesson: {
      message: "Would you like to learn more about how notice periods and contracts affect your career flexibility?",
      path: "/topic/employment/subtopic/notice",
      title: "Notice Periods"
    }
  },
  {
    id: "first-payslip",
    icon: "💷",
    title: "First Payslip",
    subtitle: "Covers gross pay, NI, income tax, pension deductions.",
    status: "Available",
    flagsCount: 0,
    sections: [
      {
        title: "Section 1. Summary of Earnings",
        content: "Basic Salary Gross Pay: £2333.33. Total Additions: £0.00. Employee Net Pay: £1850.20.",
        terms: [
          {
            phrase: "Gross Pay",
            type: "definition",
            explanation: "This is your total earnings before any deductions (like tax or pension) are taken out. It is the number you usually see on your job offer.",
            lessonPath: "/topic/taxes/subtopic/income-tax"
          },
          {
            phrase: "Net Pay",
            type: "definition",
            explanation: "This is your actual 'take-home pay' after all tax, National Insurance, and pension contributions have been deducted from your gross pay.",
            lessonPath: "/topic/taxes/subtopic/income-tax"
          }
        ]
      },
      {
        title: "Section 2. Deductions Detail",
        content: "The following amounts have been withheld: PAYE Tax: £240.50. National Insurance NI: £142.63. Workplace Pension Contribution: £100.00.",
        terms: [
          {
            phrase: "PAYE Tax",
            type: "definition",
            explanation: "PAYE stands for Pay As You Earn. Your employer deducts this income tax automatically from your salary on behalf of HMRC.",
            lessonPath: "/topic/taxes/subtopic/income-tax"
          },
          {
            phrase: "National Insurance NI",
            type: "definition",
            explanation: "National Insurance is a tax paid by employees and employers to fund state benefits, including the State Pension and the NHS.",
            lessonPath: "/topic/taxes/subtopic/national-insurance"
          },
          {
            phrase: "Pension Contribution",
            type: "positive",
            explanation: "This is the money deducted from your paycheck and put into your retirement fund. It is tax-free and often matched by your employer.",
            lessonPath: "/topic/pension/subtopic/contributions"
          }
        ]
      }
    ],
    verdict: "Your first payslip shows accurate deductions matching standard tax codes. Your take-home (Net) pay represents roughly 79% of your Gross pay, which is standard for this tax bracket. All pension contributions are correctly routed.",
    flaggedItems: [
      {
        severity: "positive",
        title: "Pension Matching",
        description: "Pension contributions are actively building your retirement fund with tax relief applied."
      },
      {
        severity: "positive",
        title: "Tax Code Alignment",
        description: "Your PAYE tax deduction reflects the standard tax-free allowance of £12,570 per year."
      }
    ],
    suggestedLesson: {
      message: "Would you like to learn more about how Income Tax and PAYE are calculated?",
      path: "/topic/taxes/subtopic/income-tax",
      title: "Income Tax"
    }
  },
  {
    id: "tenancy-agreement",
    icon: "🏠",
    title: "Tenancy Agreement",
    subtitle: "Covers deposit clauses, notice periods, responsibilities.",
    status: "New",
    flagsCount: 1,
    sections: [
      {
        title: "Section 1. Security Deposit",
        content: "The Tenant shall pay a security deposit of £1500. The Landlord confirms this will be protected under a government-approved Tenancy Deposit Scheme TDS within 30 days.",
        terms: [
          {
            phrase: "Tenancy Deposit Scheme TDS",
            type: "positive",
            explanation: "Your deposit must be registered in a government-backed protection scheme by law. This ensures you get your money back at the end of your tenancy, provided you meet the terms of your agreement.",
            lessonPath: "/topic/employment/subtopic/contracts"
          }
        ]
      },
      {
        title: "Section 2. Break Clause",
        content: "Either party may terminate this agreement by giving 2 months written notice after the initial 4 months.",
        terms: [
          {
            phrase: "2 months written notice",
            type: "positive",
            explanation: "A 2-month notice period is standard and fair for residential tenancies. It gives both you and the landlord reasonable time to make alternative plans.",
            lessonPath: "/topic/employment/subtopic/notice"
          }
        ]
      },
      {
        title: "Section 3. Landlord Access",
        content: "The Landlord or their agent may enter the premises at any time without notice to inspect the condition of the Property or show potential tenants around.",
        terms: [
          {
            phrase: "enter the premises at any time without notice",
            type: "flag",
            explanation: "This is an illegal clause! Landlords are legally required to provide at least 24 hours written notice before entering, except in an emergency. This violates your right to 'quiet enjoyment'.",
            lessonPath: "/topic/employment/subtopic/contracts"
          }
        ]
      }
    ],
    verdict: "This tenancy agreement is mostly standard except for a critical, illegal clause regarding landlord access. You have a legal right to quiet enjoyment, and the landlord cannot enter without notice. Ensure this clause is removed or revised before signing.",
    flaggedItems: [
      {
        severity: "serious",
        title: "Unrestricted Landlord Access",
        description: "The clause allowing entry without notice is illegal. 24 hours notice is legally required."
      },
      {
        severity: "positive",
        title: "Deposit Scheme Protection",
        description: "Your deposit is properly registered with a government TDS, securing your money."
      }
    ],
    comparison: {
      title: "Landlord Entry Clause",
      thisDoc: {
        title: "This document",
        clause: "At any time without notice",
        description: "Allows landlord access without prior warning or consent."
      },
      typical: {
        title: "Typical",
        clause: "24-hour written notice",
        description: "Landlord must give at least 24 hours notice and inspect at reasonable times."
      }
    },
    suggestedLesson: {
      message: "Would you like to learn more about your rights and covenants in contracts?",
      path: "/topic/employment/subtopic/contracts",
      title: "Employment Contracts & Terms"
    }
  },
  {
    id: "freelance-contract",
    icon: "💼",
    title: "Freelance Contract",
    subtitle: "Covers IR35, payment terms, termination.",
    status: "Locked",
    flagsCount: 0,
    sections: [],
    verdict: "This document is locked. Complete more lessons to unlock this summary.",
    flaggedItems: [],
    suggestedLesson: {
      message: "Unlock this document to view suggested lessons.",
      path: "/",
      title: "Learn"
    }
  }
];
