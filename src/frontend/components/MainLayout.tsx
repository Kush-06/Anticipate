import { Outlet, useNavigate, useLocation } from "react-router";
import { AppIcon } from "./AppIcon";

const TABS = [
  { name: "home",      path: "/",          icon: "home"      as const, label: "Home"      },
  { name: "learn",     path: "/learn",     icon: "learn"     as const, label: "Learn"     },
  { name: "community", path: "/community", icon: "community" as const, label: "Community" },
  { name: "profile",   path: "/profile",   icon: "profile"   as const, label: "Profile"   },
];

export function MainLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  let currentTab = "home";
  if (pathname === "/learn" || pathname.startsWith("/learn/")) currentTab = "learn";
  else if (pathname === "/community" || pathname.startsWith("/community/")) currentTab = "community";
  else if (pathname.startsWith("/profile")) currentTab = "profile";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div key={currentTab} className="anp-tab-content" style={{ flex: 1, overflow: "hidden" }}>
        <Outlet />
      </div>
      <div className="av-tabbar">
        {TABS.map((tab) => {
          const active = currentTab === tab.name;
          return (
            <button
              key={tab.name}
              className={`av-tab${active ? " is-active" : ""}`}
              onClick={() => navigate(tab.path)}
              aria-label={`${tab.label} tab`}
            >
              <span className="av-tab__ico">
                <AppIcon name={tab.icon} size={22} stroke={active ? 2 : 1.8} />
              </span>
              <span className="av-tab__lbl">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
