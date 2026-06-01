import { Outlet, useNavigate, useLocation } from "react-router";

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  let currentTab = "home";
  if (location.pathname === "/learn") {
    currentTab = "learn";
  } else if (location.pathname.startsWith("/decoder")) {
    currentTab = "decoder";
  } else if (location.pathname.startsWith("/timeline")) {
    currentTab = "timeline";
  } else if (location.pathname.startsWith("/profile")) {
    currentTab = "profile";
  }

  const renderTab = (tabName: string, path: string, icon: string, label: string) => {
    const isActive = currentTab === tabName;
    return (
      <button
        className={`anp-tabs__item ${isActive ? "anp-tabs__item--active" : ""}`}
        onClick={() => navigate(path)}
        aria-label={`${label} Tab`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "4px 0",
          flex: 1,
          color: isActive ? "#FF6B35" : "#B8A99A"
        }}
      >
        <div
          style={{
            width: "48px",
            height: "32px",
            background: isActive ? "#FFF0E8" : "transparent",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s ease"
          }}
        >
          <span style={{ fontSize: "18px" }}>{icon}</span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginTop: "1px"
          }}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Tab content area */}
      <div key={currentTab} className="anp-tab-content" style={{ flex: 1, overflow: "hidden" }}>
        <Outlet />
      </div>

      {/* Bottom Tab Bar */}
      <div 
        className="anp-tabs" 
        style={{ 
          background: "#FFFFFF", 
          borderTop: "1px solid #EDE5DC", 
          boxShadow: "0px -1px 0px #EDE5DC",
          height: "calc(64px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          flexShrink: 0
        }}
      >
        {renderTab("home", "/", "🏠", "Home")}
        {renderTab("learn", "/learn", "📚", "Learn")}
        {renderTab("decoder", "/decoder", "🔍", "Decoder")}
        {renderTab("timeline", "/timeline", "⏳", "Timeline")}
        {renderTab("profile", "/profile", "👤", "Profile")}
      </div>
    </div>
  );
}
