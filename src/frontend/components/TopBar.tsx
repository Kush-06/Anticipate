import { useNavigate } from "react-router";
import { AppIcon } from "./AppIcon";

interface TopBarProps {
  showNotifications?: boolean;
  subtitle?: string;
}

export function TopBar({ showNotifications = true, subtitle }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <>
      <div style={{ height: "max(calc(16px * var(--d)), env(safe-area-inset-top))", flexShrink: 0 }} />
      <div className="anp-top" style={subtitle ? { paddingBottom: 8, gap: 12, alignItems: "center" } : undefined}>
        <div style={subtitle ? { display: "flex", flexDirection: "column", flex: 1 } : undefined}>
          <div className="av-logo">anticipate.</div>
          {subtitle && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -2 }}>
              <span style={{ fontSize: 11, color: "var(--p-ink-3)" }}>{subtitle}</span>
            </div>
          )}
        </div>
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
