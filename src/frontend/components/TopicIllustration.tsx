import React from "react";

interface TopicIllustrationProps {
  iconName: string;
  size?: number;
  style?: React.CSSProperties;
}

export function TopicIllustration({ iconName, size = 44, style }: TopicIllustrationProps) {
  // Determine illustration type
  let type: "payslip" | "contract" | "pension" | "tax" | "saving" | "moving" | "investing" = "contract";
  
  const name = iconName.toLowerCase();
  if (name.includes("payslip") || name === "🧾") {
    type = "payslip";
  } else if (name.includes("pension") || name === "👵" || name === "🏦") {
    type = "pension";
  } else if (name.includes("tax") || name === "📅" || name === "💷") {
    type = "tax";
  } else if (name.includes("saving") || name === "🐷" || name === "💰") {
    type = "saving";
  } else if (name.includes("moving") || name === "🏠") {
    type = "moving";
  } else if (name.includes("investing") || name === "📈") {
    type = "investing";
  } else {
    // contract, employment, benefits, etc.
    type = "contract";
  }

  // Set colors based on category
  let background = "#FFF0E8";
  let accent = "#FF6B35";

  if (type === "pension") {
    background = "#F0EDFF";
    accent = "#8B7CF6";
  } else if (type === "tax") {
    background = "#FFF8E1";
    accent = "#FFB800";
  } else if (type === "saving" || type === "moving" || type === "investing") {
    background = "#E8F7F0";
    accent = "#4CAF82";
  }

  // Render SVG content centered inside a 44x44 card
  const renderSVG = () => {
    switch (type) {
      case "payslip":
        return (
          <>
            {/* Shape 1: Document body */}
            <rect x="12" y="8" width="20" height="28" rx="3" fill={accent} />
            {/* Shape 2: Text line 1 */}
            <rect x="16" y="14" width="12" height="2" rx="1" fill={background} />
            {/* Shape 3: Text line 2 */}
            <rect x="16" y="20" width="12" height="2" rx="1" fill={background} />
            {/* Shape 4: Coin shape */}
            <circle cx="30" cy="30" r="6" fill={accent} />
          </>
        );
      case "pension":
        return (
          <>
            {/* Shape 1: Pot */}
            <rect x="14" y="26" width="16" height="12" rx="3" fill={accent} />
            {/* Shape 2: Leaf 1 */}
            <ellipse cx="16" cy="18" rx="5" ry="8" transform="rotate(-30 16 18)" fill={accent} />
            {/* Shape 3: Leaf 2 */}
            <ellipse cx="28" cy="18" rx="5" ry="8" transform="rotate(30 28 18)" fill={accent} />
          </>
        );
      case "tax":
        return (
          <>
            {/* Shape 1: Calendar Base */}
            <rect x="10" y="12" width="24" height="24" rx="4" fill={accent} />
            {/* Shape 2: Binder Ring Left */}
            <rect x="14" y="8" width="4" height="8" rx="2" fill={accent} />
            {/* Shape 3: Binder Ring Right */}
            <rect x="26" y="8" width="4" height="8" rx="2" fill={accent} />
            {/* Shape 4: Highlight Dot */}
            <circle cx="22" cy="24" r="5" fill={background} />
          </>
        );
      case "saving":
        return (
          <>
            {/* Shape 1: Piggy Body */}
            <circle cx="22" cy="24" r="12" fill={accent} />
            {/* Shape 2: Snout */}
            <rect x="32" y="20" width="6" height="8" rx="3" fill={accent} />
            {/* Shape 3: Ear */}
            <ellipse cx="16" cy="12" rx="3" ry="5" transform="rotate(-20 16 12)" fill={accent} />
            {/* Shape 4: Slot */}
            <rect x="20" y="16" width="4" height="2" rx="1" fill={background} />
          </>
        );
      case "moving":
        return (
          <>
            {/* Shape 1: House Base */}
            <rect x="11" y="20" width="22" height="16" rx="3" fill={accent} />
            {/* Shape 2: Rotated Roof */}
            <rect x="14" y="10" width="16" height="16" rx="4" transform="rotate(45 22 18)" fill={accent} />
            {/* Shape 3: Door */}
            <rect x="19" y="27" width="6" height="9" rx="1.5" fill={background} />
            {/* Shape 4: Key Circle */}
            <circle cx="35" cy="27" r="4" fill={accent} />
          </>
        );
      case "investing":
        return (
          <>
            {/* Shape 1: Bar 1 */}
            <rect x="10" y="24" width="6" height="12" rx="3" fill={accent} />
            {/* Shape 2: Bar 2 */}
            <rect x="19" y="16" width="6" height="20" rx="3" fill={accent} />
            {/* Shape 3: Bar 3 */}
            <rect x="28" y="8" width="6" height="28" rx="3" fill={accent} />
          </>
        );
      case "contract":
      default:
        return (
          <>
            {/* Shape 1: Document Base */}
            <rect x="11" y="8" width="22" height="28" rx="3" fill={accent} />
            {/* Shape 2: Line 1 */}
            <rect x="15" y="14" width="14" height="2" rx="1" fill={background} />
            {/* Shape 3: Pen diagonal */}
            <rect x="25" y="12" width="5" height="20" rx="2.5" transform="rotate(30 25 12)" fill={accent} />
          </>
        );
    }
  };

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "16px",
        background: background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style
      }}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        {renderSVG()}
      </svg>
    </div>
  );
}
