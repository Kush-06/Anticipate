import { useState } from 'react';
import { 
  Briefcase, 
  Home, 
  FileText, 
  Heart, 
  PiggyBank, 
  MoreHorizontal, 
  X,
  Calendar
} from 'lucide-react';
import { useTimeline } from '../context/TimelineContext';
import { addTimelineItems } from '@backend/timelineService';
import { UID_KEY } from '../context/ProfileContext';
import { calculateTimelineItems } from '../utils/timelineUpdateLogic';

interface TimelineUpdatePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const LIFE_EVENTS = [
  {
    id: 'new-job',
    label: 'New job / promotion',
    icon: <Briefcase size={20} />,
  },
  {
    id: 'moving-out',
    label: 'Moving out',
    icon: <Home size={20} />,
  },
  {
    id: 'freelance',
    label: 'Going freelance',
    icon: <FileText size={20} />,
  },
  {
    id: 'life-change',
    label: 'Big life change',
    icon: <Heart size={20} />,
  },
  {
    id: 'saving',
    label: 'Saving for something',
    icon: <PiggyBank size={20} />,
  },
  {
    id: 'other',
    label: 'Something else',
    icon: <MoreHorizontal size={20} />,
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
    if (!selectedEventId) return;
    
    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem(UID_KEY);
      if (userId && date) {
        const items = calculateTimelineItems(selectedEventId, date, details);
        await addTimelineItems(userId, items);
        await refreshTimeline();
        startClose();
      } else if (!date) {
        alert("Please select a target date");
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
          <p className="ut-subtitle">Select an upcoming milestone to adapt your custom timeline and learning track.</p>
          
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
          background: rgba(28, 26, 36, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fade-in 0.25s ease-out;
        }

        .ut-popup {
          width: 100%;
          max-width: 360px;
          background: var(--p-bg);
          border-radius: 32px 32px 0 0;
          padding: 16px 20px 40px;
          padding-bottom: max(40px, env(safe-area-inset-bottom));
          max-height: 92vh;
          overflow-y: auto;
          color: var(--p-ink);
          box-shadow: 0 -10px 40px rgba(28, 26, 36, 0.12);
          animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          border-top: 1.5px solid var(--p-line);
        }

        .ut-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          margin-bottom: 24px;
        }

        .ut-handle {
          width: 42px;
          height: 4px;
          background: var(--p-line-2);
          border-radius: 2px;
          margin-bottom: 12px;
          opacity: 0.8;
        }

        .ut-close {
          position: absolute;
          right: 0;
          top: -4px;
          background: var(--p-card);
          border: 1.5px solid var(--p-line);
          color: var(--p-ink-2);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }

        .ut-close:hover {
          color: var(--p-coral);
          border-color: var(--p-coral);
          transform: scale(1.08);
        }

        .ut-title {
          font-family: var(--p-display);
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 8px;
          text-align: left;
          color: var(--p-ink);
          letter-spacing: -0.02em;
        }

        .ut-subtitle {
          font-family: var(--p-sans);
          font-size: 14px;
          color: var(--p-ink-2);
          margin-bottom: 24px;
          line-height: 1.45;
        }

        .ut-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .ut-card {
          background: var(--p-card);
          border: 1.5px solid var(--p-line);
          border-radius: 20px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--p-ink);
          box-shadow: 0 2px 6px rgba(28, 26, 36, 0.01);
        }

        .ut-card:hover {
          transform: translateY(-2px);
          border-color: var(--p-line-2);
          box-shadow: 0 6px 16px rgba(28, 26, 36, 0.04);
        }

        .ut-card.active {
          background: var(--p-coral-tint);
          border-color: var(--p-coral);
          transform: scale(1.02);
          box-shadow: 0 4px 14px rgba(233, 105, 74, 0.12);
        }

        .ut-card-icon {
          width: 48px;
          height: 48px;
          background: var(--p-bg-2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--p-ink-2);
          transition: all 0.2s ease;
        }

        .ut-card.active .ut-card-icon {
          background: var(--p-coral);
          color: white;
          transform: scale(1.05);
        }

        .ut-card-label {
          font-family: var(--p-display);
          font-size: 13.5px;
          font-weight: 700;
          text-align: center;
          color: var(--p-ink);
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
          font-family: var(--p-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--p-ink-3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding-left: 2px;
        }

        .ut-input-group input {
          background: var(--p-card);
          border: 1.5px solid var(--p-line);
          border-radius: 16px;
          padding: 14px 16px;
          color: var(--p-ink);
          font-size: 14.5px;
          outline: none;
          font-family: var(--p-sans);
          transition: all 0.2s ease;
        }

        .ut-input-group input:focus {
          border-color: var(--p-coral);
          box-shadow: 0 0 0 3px var(--p-coral-tint);
        }

        .ut-date-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ut-date-input .icon {
          position: absolute;
          left: 14px;
          color: var(--p-ink-3);
          pointer-events: none;
        }

        .ut-date-input input {
          width: 100%;
          padding-left: 42px;
        }

        .ut-activate {
          background: var(--p-coral);
          color: white;
          border: none;
          border-radius: 20px;
          padding: 18px;
          font-size: 15px;
          font-weight: 700;
          font-family: var(--p-display);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(233, 105, 74, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }

        .ut-activate:hover:not(:disabled) {
          background: #d85637;
          box-shadow: 0 6px 16px rgba(233, 105, 74, 0.35);
        }

        .ut-activate:active:not(:disabled) {
          transform: scale(0.98);
        }

        .ut-activate:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--p-line);
          color: var(--p-ink-3);
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
