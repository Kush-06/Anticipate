import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { AppIcon } from "./AppIcon";

const TABS = [
  { name: "home",      path: "/",          icon: "home"      as const, label: "Home"      },
  { name: "learn",     path: "/learn",     icon: "learn"     as const, label: "Learn"     },
  { name: "decoder",   path: "/decoder",   icon: "document"  as const, label: "Decoder"   },
  { name: "community", path: "/community", icon: "community" as const, label: "Community" },
  { name: "profile",   path: "/profile",   icon: "profile"   as const, label: "Profile"   },
];

function getTabForPath(pathname: string): string {
  if (pathname === "/decoder") return "decoder";
  if (pathname === "/learn" || pathname.startsWith("/learn/") || pathname.startsWith("/topic/")) return "learn";
  if (pathname === "/community" || pathname.startsWith("/community/")) return "community";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

export function MainLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lastPaths = useRef<Record<string, string>>({});

  const { search } = useLocation();
  const currentTab = getTabForPath(pathname);

  // Keep the most-recent full URL (path + search params) for whichever tab is active
  useEffect(() => {
    lastPaths.current[currentTab] = pathname + search;
  }, [pathname, search, currentTab]);

  const handleTabPress = (tab: typeof TABS[0]) => {
    if (tab.name === currentTab) {
      // Already on this tab — tap again to go back to its root
      navigate(tab.path);
    } else {
      // Restore the last place the user was in this tab, or fall back to root
      navigate(lastPaths.current[tab.name] ?? tab.path);
    }
  };

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
              onClick={() => handleTabPress(tab)}
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
