import { useNavigate } from "react-router";
import { AppIcon } from "./AppIcon";

export function NotificationsScreen() {
  const navigate = useNavigate();

  return (
    <div className="anp-app" style={{ background: "var(--p-bg)" }}>
      <div style={{ height: "max(calc(16px * var(--d)), env(safe-area-inset-top))", flexShrink: 0 }} />

      <div className="anp-top">
        <button className="anp-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <AppIcon name="chevronLeft" size={19} />
        </button>
        <div className="av-logo">notifications</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="anp-scroll" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <div style={{ textAlign: "center", padding: "calc(40px * var(--d))" }}>
          <AppIcon
            name="bell"
            size={48}
            style={{ color: "var(--p-ink-4)", margin: "0 auto calc(16px * var(--d))" }}
          />
          <div style={{
            fontFamily: "var(--p-display)", fontWeight: 600,
            fontSize: "calc(18px * var(--d))", color: "var(--p-ink)",
            marginBottom: "calc(8px * var(--d))",
          }}>
            No notifications
          </div>
          <div style={{ fontSize: "calc(13px * var(--d))", color: "var(--p-ink-3)" }}>
            You're all caught up
          </div>
        </div>
      </div>
    </div>
  );
}
