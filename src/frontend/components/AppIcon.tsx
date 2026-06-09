/* eslint-disable react-refresh/only-export-components */
type IconName =
  | "home" | "learn" | "community" | "profile" | "bell" | "arrowRight" | "chevronRight"
  | "chevronDown" | "chevronLeft" | "check" | "play" | "clock" | "settings" | "plus"
  | "briefcase" | "house" | "calendar" | "receipt" | "bank" | "document"
  | "piggy" | "chart" | "shield" | "flag" | "sparkle" | "handshake" | "lock";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <><path d="M3.5 10.5L12 3.5l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></>,
  community: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
  learn: <><path d="M3 5.5a1 1 0 011-1h6a2.5 2.5 0 012 1 2.5 2.5 0 012-1h6a1 1 0 011 1v12a1 1 0 01-1 1h-6a2.2 2.2 0 00-2 1 2.2 2.2 0 00-2-1H4a1 1 0 01-1-1z" /><path d="M12 5.5v13" /></>,
  profile: <><circle cx="12" cy="8" r="3.6" /><path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /></>,
  bell: <><path d="M6 9a6 6 0 0112 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5z" /><path d="M9.5 19a2.5 2.5 0 005 0" /></>,
  arrowRight: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  chevronRight: <><path d="M9 5l7 7-7 7" /></>,
  chevronDown: <><path d="M5 9l7 7 7-7" /></>,
  chevronLeft: <><path d="M15 5l-7 7 7 7" /></>,
  check: <><path d="M4 12.5l5 5L20 6.5" /></>,
  play: <><path d="M7 5l11 7-11 7z" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
  settings: <><circle cx="12" cy="12" r="3.2" /><path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6" /></>,
  briefcase: <><rect x="3.5" y="7.5" width="17" height="12" rx="2.2" /><path d="M8.5 7.5V6a2 2 0 012-2h3a2 2 0 012 2v1.5" /><path d="M3.5 12.5h17" /></>,
  house: <><path d="M4 11l8-6.5 8 6.5" /><path d="M6 9.8V20h12V9.8" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2.2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  receipt: <><path d="M6 3.5h12v17l-2.2-1.4-2.2 1.4-2.2-1.4-2.2 1.4L6 20.5z" /><path d="M9 8.5h6M9 12.5h6" /></>,
  bank: <><path d="M4 9.5l8-5 8 5" /><path d="M5.5 9.5v8M10 9.5v8M14 9.5v8M18.5 9.5v8" /><path d="M3.5 20.5h17" /></>,
  document: <><path d="M6 3.5h7l5 5V20a1 1 0 01-1 1H6a1 1 0 01-1-1V4.5a1 1 0 011-1z" /><path d="M13 3.5V9h5" /><path d="M8.5 13h7M8.5 16.5h5" /></>,
  piggy: <><path d="M3.5 12.5c0-3.3 3.1-5.5 7-5.5 4.2 0 7.5 2.4 7.5 6 0 1.6-.7 3-1.8 4v2.5h-2.5l-.6-1.3a9 9 0 01-4 0L15.5 19.5H13V19a7.6 7.6 0 01-3.5-2.5H6.5L5 14.5h-.5a2 2 0 01-1-2z" /></>,
  chart: <><path d="M4 20V4M4 20h16" /><path d="M8 16l3.5-4 3 2.5L20 8" /></>,
  shield: <><path d="M12 3.5l7 2.5v5c0 4.6-3 7.8-7 9-4-1.2-7-4.4-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  flag: <><path d="M6 21V4" /><path d="M6 4.5h11l-2.2 3.5L17 11.5H6" /></>,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></>,
  handshake: <><path d="M4 8.5h3l3 2.8c.7.6.7 1.7 0 2.3-.6.6-1.5.6-2.1 0L6 12" /><path d="M20 8.5h-3l-4 3.5" /><path d="M13 12l2.2 2.1c.6.6.6 1.5 0 2.1-.5.6-1.5.6-2 0l-.4-.4-.5.5c-.6.6-1.5.6-2.1 0" /><path d="M4 8.5V15M20 8.5V15" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
};

export function AppIcon({
  name,
  size = 22,
  stroke = 1.8,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const paths = PATHS[name] ?? PATHS.document;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

export function iconForTrack(trackId: string): IconName {
  if (trackId.includes("first-job") || trackId.includes("job")) return "briefcase";
  if (trackId.includes("moving") || trackId.includes("house")) return "house";
  if (trackId.includes("tax") || trackId.includes("calendar")) return "calendar";
  if (trackId.includes("payslip") || trackId.includes("pay")) return "receipt";
  if (trackId.includes("pension")) return "bank";
  if (trackId.includes("saving") || trackId.includes("budget")) return "piggy";
  if (trackId.includes("invest")) return "chart";
  return "document";
}
