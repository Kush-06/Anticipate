import { useState } from 'react';
import { 
  Briefcase, 
  Home, 
  FileText, 
  Heart, 
  PiggyBank, 
  MoreHorizontal, 
  X,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useTimeline } from '../context/TimelineContext';
import { seedTimeline } from '@backend/timelineService';
import { UID_KEY } from '../context/ProfileContext';
import type { SpineItem } from '../utils/timelineGenerator';

interface TimelineUpdatePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LifeEvent {
  id: string;
  label: string;
  icon: React.ReactNode;
  trackName: string;
  items: SpineItem[];
}

const LIFE_EVENTS: LifeEvent[] = [
  {
    id: 'new-job',
    label: 'New job / promotion',
    icon: <Briefcase size={20} />,
    trackName: 'Starting Work',
    items: [
      {
        id: "new-job-pension-upd",
        status: "pending",
        when: "In 3 months",
        title: "Pension auto-enrolment kicks in",
        tag: "New job · pension",
        lessonPath: "/topic/starting-work/subtopic/lesson-02",
        group: "this-week",
      },
      {
        id: "new-job-budget-upd",
        status: "pending",
        when: "Before first payday",
        title: "Set up your 50/30/20 budget",
        tag: "New job · budgeting",
        lessonPath: "/topic/starting-work/subtopic/lesson-03",
        group: "coming-up",
      },
      {
        id: "career-negotiation-upd",
        status: "pending",
        when: "Next review",
        title: "Master your next salary negotiation",
        tag: "Career · growth",
        lessonPath: "/topic/career/subtopic/lesson-18",
        group: "later",
      }
    ]
  },
  {
    id: 'moving-out',
    label: 'Moving out',
    icon: <Home size={20} />,
    trackName: 'Renting',
    items: [
      {
        id: "move-deposit-upd",
        status: "pending",
        when: "Before move-in",
        title: "Check tenancy deposit protection",
        tag: "Moving out · deposit",
        lessonPath: "/topic/renting/subtopic/lesson-05",
        group: "this-week",
      },
      {
        id: "move-insurance-upd",
        status: "pending",
        when: "In 2 weeks",
        title: "Arrange renters' insurance",
        tag: "Moving out · insurance",
        lessonPath: "/topic/renting/subtopic/lesson-07",
        group: "coming-up",
      },
      {
        id: "move-bills-upd",
        status: "pending",
        when: "Before you move",
        title: "Build your first bills budget",
        tag: "Moving out · bills",
        lessonPath: "/topic/renting/subtopic/lesson-06",
        group: "this-week",
      }
    ]
  },
  {
    id: 'freelance',
    label: 'Going freelance',
    icon: <FileText size={20} />,
    trackName: 'Taxes & Wealth',
    items: [
      {
        id: "freelance-tax-upd",
        status: "pending",
        when: "This week",
        title: "Register for Self Assessment",
        tag: "Freelance · tax",
        lessonPath: "/topic/taxes-wealth/subtopic/lesson-26",
        group: "this-week",
      },
      {
        id: "freelance-pension-upd",
        status: "pending",
        when: "Next month",
        title: "Set up a private pension (SIPP)",
        tag: "Freelance · pension",
        lessonPath: "/topic/starting-work/subtopic/lesson-02",
        group: "coming-up",
      }
    ]
  },
  {
    id: 'life-change',
    label: 'Big life change',
    icon: <Heart size={20} />,
    trackName: 'Foundations',
    items: [
      {
        id: "foundations-emergency-upd",
        status: "pending",
        when: "This month",
        title: "Review your emergency fund",
        tag: "Foundations · safety",
        lessonPath: "/topic/foundations/subtopic/lesson-12",
        group: "this-week",
      },
      {
        id: "foundations-budget-upd",
        status: "pending",
        when: "Coming up",
        title: "Re-calculate your monthly budget",
        tag: "Foundations · spend",
        lessonPath: "/topic/foundations/subtopic/lesson-13",
        group: "coming-up",
      }
    ]
  },
  {
    id: 'saving',
    label: 'Saving for something',
    icon: <PiggyBank size={20} />,
    trackName: 'Investing 101',
    items: [
      {
        id: "save-isa-upd",
        status: "pending",
        when: "This week",
        title: "Open a Stocks & Shares ISA",
        tag: "Investing · ISA",
        lessonPath: "/topic/investing-101/subtopic/lesson-21",
        group: "this-week",
      },
      {
        id: "save-compounding-upd",
        status: "pending",
        when: "Coming up",
        title: "Understand the power of compounding",
        tag: "Investing · growth",
        lessonPath: "/topic/investing-101/subtopic/lesson-22",
        group: "coming-up",
      }
    ]
  },
  {
    id: 'other',
    label: 'Something else',
    icon: <MoreHorizontal size={20} />,
    trackName: 'Foundations',
    items: [
      {
        id: "other-review-upd",
        status: "pending",
        when: "Today",
        title: "Review your financial foundations",
        tag: "Personal finance",
        lessonPath: "/topic/foundations",
        group: "this-week",
      }
    ]
  }
];

export function TimelineUpdatePopup({ isOpen, onClose }: TimelineUpdatePopupProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { refreshTimeline } = useTimeline();

  if (!isOpen && !isClosing) return null;

  const selectedEvent = LIFE_EVENTS.find(e => e.id === selectedEventId);

  const startClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      // Reset state after animation
      setSelectedEventId(null);
      setDetails('');
      setDate('');
    }, 280);
  };

  const handleActivate = async () => {
    if (!selectedEventId || !selectedEvent) return;
    
    setIsSubmitting(true);
    // Start closing immediately for better perceived performance
    startClose();

    try {
      const userId = localStorage.getItem(UID_KEY);
      if (userId) {
        await seedTimeline(userId, selectedEvent.items);
        await refreshTimeline();
      }
    } catch (err) {
      console.error('Failed to update timeline:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`ut-overlay ${isClosing ? 'ut-overlay--closing' : ''}`} onClick={startClose}>
      <div className={`ut-popup ${isClosing ? 'ut-popup--closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="ut-header">
          <div className="ut-handle" />
          <button className="ut-close" onClick={startClose}><X size={18} /></button>
        </div>

        <div className="ut-content">
          <h2 className="ut-title">What's happening in your life?</h2>
          
          <div className="ut-grid">
            {LIFE_EVENTS.map(event => (
              <button 
                key={event.id}
                className={`ut-card ${selectedEventId === event.id ? 'active' : ''}`}
                onClick={() => setSelectedEventId(event.id)}
              >
                <div className="ut-card-icon">{event.icon}</div>
                <div className="ut-card-label">{event.label}</div>
              </button>
            ))}
          </div>

          {selectedEventId && (
            <div className="ut-details animate-in">
              <div className="ut-input-group">
                <label>Details (optional)</label>
                <input 
                  type="text" 
                  placeholder={selectedEventId === 'new-job' ? 'Company / role' : 'Description'}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                />
              </div>

              <div className="ut-input-group">
                <label>Target date</label>
                <div className="ut-date-input">
                  <Calendar size={16} className="icon" />
                  <input 
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </div>

              <button 
                className="ut-activate"
                onClick={handleActivate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Activating...' : 'Activate this track'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ut-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(28, 26, 36, 0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          animation: fade-in 0.2s ease-out;
        }

        .ut-popup {
          width: 100%;
          background: #f4f0e6;
          border-radius: 32px 32px 0 0;
          padding: 16px 20px 40px;
          padding-bottom: max(40px, env(safe-area-inset-bottom));
          max-height: 90vh;
          overflow-y: auto;
          color: #1c1a24;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.08);
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ut-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          margin-bottom: 20px;
        }

        .ut-handle {
          width: 36px;
          height: 4px;
          background: #e6dbc4;
          border-radius: 2px;
          margin-bottom: 12px;
        }

        .ut-close {
          position: absolute;
          right: 0;
          top: -4px;
          background: #ffffff;
          border: none;
          color: #5f5848;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .ut-title {
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: left;
          color: #1c1a24;
        }

        .ut-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .ut-card {
          background: #ffffff;
          border: 1.5px solid #e6dbc4;
          border-radius: 20px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #1c1a24;
        }

        .ut-card.active {
          background: #fbe1d6;
          border-color: #f2ab8d;
        }

        .ut-card-icon {
          width: 44px;
          height: 44px;
          background: #f7f3eb;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5f5848;
        }

        .ut-card.active .ut-card-icon {
          background: #ff9b7d;
          color: white;
        }

        .ut-card-label {
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .ut-details {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-top: 8px;
        }

        .animate-in {
          animation: fade-in-up 0.4s ease-out;
        }

        .ut-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ut-input-group label {
          font-size: 11px;
          font-weight: 800;
          color: #95a4bb;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding-left: 4px;
        }

        .ut-input-group input {
          background: #ffffff;
          border: 1.5px solid #e6dbc4;
          border-radius: 16px;
          padding: 14px 16px;
          color: #1c1a24;
          font-size: 15px;
          outline: none;
          font-family: system-ui, -apple-system, sans-serif;
          transition: border-color 0.2s ease;
        }

        .ut-input-group input:focus {
          border-color: #ff9b7d;
        }

        .ut-date-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ut-date-input .icon {
          position: absolute;
          left: 14px;
          color: #95a4bb;
          pointer-events: none;
        }

        .ut-date-input input {
          width: 100%;
          padding-left: 42px;
        }

        .ut-activate {
          background: #ff7350;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 18px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.2s ease;
          box-shadow: 0 4px 12px rgba(255, 115, 80, 0.2);
          font-family: system-ui, -apple-system, sans-serif;
        }

        .ut-activate:active {
          transform: scale(0.97);
          background: #e9694a;
        }

        .ut-activate:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #e6dbc4;
          box-shadow: none;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }

        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .ut-overlay--closing {
          animation: fade-out 0.28s ease-in forwards;
        }

        .ut-popup--closing {
          animation: slide-down 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
