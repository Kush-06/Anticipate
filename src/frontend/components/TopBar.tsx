import { useNavigate } from "react-router";
import { AppIcon } from "./AppIcon";

interface TopBarProps {
  showNotifications?: boolean;
}

export function TopBar({ showNotifications = true }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <>
      <div style={{ height: "max(calc(16px * var(--d)), env(safe-area-inset-top))", flexShrink: 0 }} />
      <div className="anp-top">
        <div className="av-logo">anticipate.</div>
        {showNotifications && (
          <button 
            className="anp-icon-btn" 
            onClick={() => navigate("/notifications")} 
            aria-label="Notifications"
          >
            <AppIcon name="bell" size={19} />
          </button>
        )}
      </div>
    </>
  );
}
