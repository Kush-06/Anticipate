
export function RobotIcon() {
  return (
    <svg 
      className="anp-robot" 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "calc(24px * var(--d))",
        height: "calc(24px * var(--d))",
        display: "inline-block",
        verticalAlign: "middle"
      }}
    >
      {/* Antenna */}
      <rect x="46" y="10" width="8" height="15" rx="3" fill="var(--p-plum)" />
      <circle cx="50" cy="8" r="6" fill="var(--p-plum)" className="anp-robot__antenna-light" />
      
      {/* Ears / Bolts */}
      <rect x="15" y="42" width="10" height="20" rx="3" fill="var(--p-line)" />
      <rect x="75" y="42" width="10" height="20" rx="3" fill="var(--p-line)" />

      {/* Head */}
      <rect x="22" y="25" width="56" height="54" rx="14" fill="var(--p-card)" stroke="var(--p-line)" strokeWidth="2" />
      
      {/* Face/Screen */}
      <rect x="28" y="31" width="44" height="42" rx="8" fill="var(--p-bg-2)" />

      {/* Eyes */}
      <ellipse cx="40" cy="48" rx="5" ry="7" fill="var(--p-plum)" className="anp-robot__eye" />
      <ellipse cx="60" cy="48" rx="5" ry="7" fill="var(--p-plum)" className="anp-robot__eye" />

      {/* Mouth */}
      <rect x="42" y="62" width="16" height="4" rx="2" fill="var(--p-plum)" className="anp-robot__mouth" />
    </svg>
  );
}

export function AnticipateLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
      <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--p-ink)", letterSpacing: "-0.01em", fontFamily: "var(--font-display)", textTransform: "lowercase" }}>
        anticipate.
      </span>
    </div>
  );
}
