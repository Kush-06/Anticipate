import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTimeline } from "../context/TimelineContext";

export function NotificationView() {
  const navigate = useNavigate();
  const { notifications, markNotificationsAsRead } = useTimeline();

  useEffect(() => {
    markNotificationsAsRead();
  }, []);

  const [isExiting, setIsExiting] = useState(false);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => navigate(-1), 250);
  };

  return (
    <div className={`anp-doc-sum anp-screen-forward ${isExiting ? "anp-screen-backward" : ""}`} style={{ background: "var(--p-bg)" }}>
      {/* Top Header */}
      <div className="anp-doc-sum__topbar" style={{ paddingBottom: "10px" }}>
        <button
          className="anp-doc-sum__back"
          onClick={handleBack}
          aria-label="Go back"
        >
          ‹
        </button>
        <span className="anp-doc-sum__title">Notifications</span>
      </div>

      {/* Notifications List */}
      <div className="anp-doc-sum__scroll">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notifications.map((notif) => {
            const colorVar = `var(--p-${notif.color})`;
            const colorTintVar = `var(--p-${notif.color}-tint)`;

            return (
              <div
                key={notif.id}
                style={{
                  background: "var(--p-card)",
                  border: "1.5px solid var(--p-line)",
                  borderRadius: "var(--r-xl)",
                  padding: "16px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  gap: "12px"
                }}
              >
                {/* Colored Icon Badge */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--r-md)",
                    background: colorTintVar,
                    border: `1.5px solid ${colorVar}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0
                  }}
                >
                  {notif.icon}
                </div>

                {/* Body Content */}
                <div style={{ flex: 1 }}>
                  {/* Sender & Timestamp */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: colorVar, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {notif.sender}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--p-ink-3)", fontWeight: 500 }}>
                      {notif.time}
                    </span>
                  </div>

                  {/* Message details */}
                  <p style={{ fontSize: "12px", color: "var(--p-ink-2)", lineHeight: 1.45, marginBottom: notif.buttons ? "12px" : "0" }}>
                    {notif.message}
                  </p>

                  {/* Buttons (if exist) */}
                  {notif.buttons && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      {notif.buttons.map((btn, idx) => {
                        const isFilled = btn.style === "filled";
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (btn.action === "do-now") {
                                navigate("/decoder/view/first-payslip");
                              } else {
                                navigate(-1);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: "var(--r-md)",
                              fontSize: "11px",
                              fontWeight: 700,
                              fontFamily: "var(--font-display)",
                              cursor: "pointer",
                              border: isFilled ? "none" : `1.5px solid ${colorVar}`,
                              background: isFilled ? colorVar : "transparent",
                              color: isFilled ? "white" : colorVar,
                              transition: "all 0.15s ease"
                            }}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
