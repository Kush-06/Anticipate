import { useState } from "react";
import { useNavigate } from "react-router";
import { useTimeline } from "../context/TimelineContext";
import type { TimelineTrack } from "../context/TimelineContext";
import { useProfile } from "../context/ProfileContext";
import { AnticipateLogo } from "./RobotIcon";
import { useDragToDismiss } from "./useDragToDismiss";
import { SageText } from "./SageText";
import { TopicIllustration } from "./TopicIllustration";
import { SageAvatar } from "./SageAvatar";

export function TimelineOverview() {
  const navigate = useNavigate();
  const { tracks, sageMessage, addTrack, unreadCount } = useTimeline();

  // Expand/Collapse state
  const [expandedTracks, setExpandedTracks] = useState<Record<string, boolean>>({
    "first-job": true,
    "moving-out": false,
  });

  // Sheet State
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [firstSalaryDate, setFirstSalaryDate] = useState("");

  const addSheetDrag = useDragToDismiss(() => setShowAddSheet(false), showAddSheet);

  const toggleExpand = (id: string) => {
    setExpandedTracks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddSheet = () => {
    setShowAddSheet(true);
    setSelectedCategory(null);
    setCompanyName("");
    setStartDate("");
    setFirstSalaryDate("");
  };

  const handleActivateTrack = () => {
    if (selectedCategory === null) return;

    const categories = [
      { label: "New job", icon: "💼", color: "purple" as const },
      { label: "Moving out", icon: "🏠", color: "green" as const },
      { label: "Going freelance", icon: "🧾", color: "navy" as const },
      { label: "Big life change", icon: "💖", color: "coral" as const },
      { label: "Saving for something", icon: "🐷", color: "amber" as const },
      { label: "Something else", icon: "💬", color: "purple" as const },
    ];

    const cat = categories[selectedCategory];
    const trackTitle = companyName ? `${cat.label}. ${companyName}.` : `${cat.label}.`;
    
    // Create new track with steps
    const newTrack: TimelineTrack = {
      id: `custom-track-${Date.now()}`,
      title: trackTitle,
      subtitle: "Step 1 of 3",
      icon: cat.icon,
      color: cat.color,
      currentStep: 1,
      totalSteps: 3,
      startDate: startDate || "Upcoming",
      steps: [
        {
          title: "Understand your contract details",
          status: "active",
          dateLabel: startDate ? `Scheduled ${startDate}` : "Scheduled today",
          lessonPath: "/decoder/view/employment-contract",
        },
        {
          title: "Check tax code settings",
          status: "pending",
          dateLabel: "Unlocks after step 1",
          lessonPath: "/topic/taxes/subtopic/tax-codes",
        },
        {
          title: "Understand your pension scheme",
          status: "pending",
          dateLabel: "Unlocks after step 2",
          lessonPath: "/topic/pension/subtopic/auto-enrolment",
        },
      ],
    };

    addTrack(newTrack);
    setShowAddSheet(false);
  };

  // Categories grid details
  const categoriesList = [
    { label: "New job or promotion", icon: "💼" },
    { label: "Moving out", icon: "🏠" },
    { label: "Going freelance", icon: "🧾" },
    { label: "Big life change", icon: "💖" },
    { label: "Saving for something", icon: "🐷" },
    { label: "Something else", icon: "💬" },
  ];

  // Count active tracks (excluding Tax Calendar)
  const activeTracks = tracks.filter(t => t.id !== "tax-calendar");
  const activeCount = activeTracks.length;
  // Let's say 1 is upcoming or compute dynamically
  const upcomingCount = activeTracks.filter(t => t.startDate.toLowerCase().includes("august") || t.startDate === "Upcoming").length;
  const activeLabelCount = activeCount - upcomingCount;

  const { resetProfile } = useProfile();

  return (
    <div className="anp-doc-lib" style={{ position: "relative" }}>
      {/* Top Header */}
      <div 
        className="anp-doc-view__topbar" 
        style={{ 
          borderBottom: "none", 
          paddingBottom: "4px",
          paddingTop: "max(calc(16px * var(--d)), env(safe-area-inset-top))"
        }}
      >
        <div style={{ flex: 1 }}>
          <AnticipateLogo />
          <h1 className="anp-home__title" style={{ fontSize: "24px", marginBottom: "2px" }}>Your timeline</h1>
          <p style={{ color: "var(--p-ink-3)", fontSize: "12px", fontWeight: 600 }}>
            {activeLabelCount} active. {upcomingCount} upcoming
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Reset profile button */}
          <button
            onClick={resetProfile}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid var(--p-line)",
              background: "var(--p-card)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: "var(--p-ink)"
            }}
            title="Reset profile"
            aria-label="Reset profile"
          >
            🔄
          </button>

          {/* Bell Icon for notifications */}
          <button
            onClick={() => navigate("/notifications")}
            style={{
              position: "relative",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid var(--p-line)",
              background: "var(--p-card)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px"
            }}
            aria-label="View notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span
                className="anp-notif-dot"
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  background: "var(--p-coral)",
                  color: "white",
                  fontSize: "9px",
                  fontWeight: "bold",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1.5px solid var(--p-card)"
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Plus button to open sheet */}
          <button
            onClick={handleOpenAddSheet}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid var(--p-line)",
              background: "var(--p-card)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: "var(--p-ink)"
            }}
            aria-label="Add Life Event"
          >
            +
          </button>
        </div>
      </div>

      {/* Simulated Check-in banner (Demo Trigger) */}
      <div 
        onClick={() => navigate("/check-in")}
        style={{
          margin: "8px 16px 4px",
          padding: "10px 14px",
          background: "var(--p-plum-tint)",
          border: "1.5px solid var(--p-plum)",
          borderRadius: "var(--r-md)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "var(--shadow-card)",
          transition: "transform 0.15s ease"
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/check-in");
        }}
      >
        <span style={{ fontSize: "16px" }}>👋</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--p-plum)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Yesterday was a big one!</div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--p-ink)" }}>Complete your First Salary Check-in ➔</div>
        </div>
      </div>

      {/* Scrollable timeline overview content */}
      <div className="anp-doc-lib__scroll" style={{ paddingTop: "8px" }}>
        
        {/* Sage Message Bar Card */}
        <div 
          className="anp-sage-card" 
          style={{ 
            background: "#FFF0E8", 
            border: "none", 
            boxShadow: "0px 2px 12px rgba(255,107,53,0.08)", 
            borderRadius: "20px", 
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "20px"
          }}
        >
          <SageAvatar size={48} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "10px", textTransform: "uppercase", color: "#FFB800", fontWeight: 600, letterSpacing: "0.06em" }}>
              Sage
            </span>
            <SageText>{sageMessage}</SageText>
          </div>
        </div>

        {/* Active Track List Section */}
        <div style={{ marginBottom: "20px" }}>
          <p className="anp-home__section-label">Active</p>
          {tracks.filter((t) => t.id !== "tax-calendar").map((track) => {
            const isExpanded = expandedTracks[track.id] || false;
            
            // Calculate progress percentage
            const completedCount = track.steps.filter(s => s.status === "completed").length;
            const progressPct = (completedCount / track.totalSteps) * 100;
            
            let topBorderColor = "#FF6B35";
            if (track.id === "first-job") topBorderColor = "#FF6B35";
            else if (track.id === "moving-out") topBorderColor = "#4CAF82";
            else if (track.id === "tax-calendar") topBorderColor = "#FFB800";

            return (
              <div 
                key={track.id}
                style={{
                  background: "var(--p-card)",
                  border: "none",
                  borderTop: `3px solid ${topBorderColor}`,
                  borderRadius: "20px",
                  boxShadow: "0px 2px 12px rgba(255,107,53,0.08)",
                  padding: "14px",
                  marginBottom: "12px",
                  overflow: "hidden"
                }}
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(track.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                >
                  <TopicIllustration iconName={track.icon} size={38} style={{ borderRadius: "10px" }} />

                  {/* Body Title */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--p-ink)", lineHeight: 1.2 }}>
                      {track.title}
                    </h3>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--p-ink-3)", marginTop: "2px" }}>
                      {track.subtitle}
                    </p>
                  </div>

                  {/* Expanded Chevron indicator */}
                  <span 
                    style={{ 
                      color: "var(--p-ink-3)", 
                      fontSize: "14px", 
                      fontWeight: "bold",
                      display: "inline-block",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: `transform ${isExpanded ? "250ms" : "200ms"} ease-out`
                    }}
                  >
                    ▾
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: "4px", background: "var(--p-line)", borderRadius: "2px", margin: "10px 0 6px", overflow: "hidden" }}>
                  <div 
                    className="anp-progress-bar-fill"
                    style={{ 
                      width: `${progressPct}%`, 
                      background: topBorderColor, 
                      borderRadius: "2px"
                    }} 
                  />
                </div>

                {/* Expanded Steps vertical line track */}
                <div 
                  style={{ 
                    maxHeight: isExpanded ? "500px" : "0px",
                    opacity: isExpanded ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out"
                  }}
                >
                  <div style={{ padding: "12px 2px 4px", display: "flex", flexDirection: "column", gap: "0" }}>
                    {track.steps.map((step, idx) => {
                      const isLast = idx === track.steps.length - 1;
                      
                      return (
                        <div 
                          key={idx} 
                          className={isExpanded ? "anp-step-animate" : ""} 
                          style={{ 
                            display: "flex", 
                            gap: "14px", 
                            position: "relative",
                            animationDelay: `${idx * 40}ms`,
                            opacity: isExpanded ? 1 : 0
                          }}
                        >
                          {/* Left Line & Bubble */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            {/* Dot indicator */}
                            {step.status === "completed" && (
                              <div 
                                style={{ 
                                  width: "22px", 
                                  height: "22px", 
                                  borderRadius: "50%", 
                                  background: "#4CAF82", 
                                  color: "white", 
                                  display: "flex", 
                                  alignItems: "center", 
                                  justifyContent: "center", 
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  zIndex: 2
                                }}
                              >
                                ✓
                              </div>
                            )}
                            {step.status === "active" && (
                              <div 
                                style={{ 
                                  width: "22px", 
                                  height: "22px", 
                                  borderRadius: "50%", 
                                  background: "#FF6B35", 
                                  color: "white", 
                                  display: "flex", 
                                  alignItems: "center", 
                                  justifyContent: "center", 
                                  fontSize: "9px",
                                  fontWeight: "bold",
                                  zIndex: 2
                                }}
                              >
                                ▶
                              </div>
                            )}
                            {step.status === "pending" && (
                              <div 
                                style={{ 
                                  width: "22px", 
                                  height: "22px", 
                                  borderRadius: "50%", 
                                  background: "#F5F0EB", 
                                  color: "#B8A99A", 
                                  display: "flex", 
                                  alignItems: "center", 
                                  justifyContent: "center", 
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  zIndex: 2
                                }}
                              >
                                {idx + 1}
                              </div>
                            )}

                            {/* Vertical Line */}
                            {!isLast && (
                              <div 
                                style={{ 
                                  width: "1.5px", 
                                  flex: 1, 
                                  background: "#EDE5DC",
                                  margin: "4px 0",
                                  minHeight: "26px",
                                  zIndex: 1
                                }} 
                              />
                            )}
                          </div>

                          {/* Right Content */}
                          <div style={{ flex: 1, paddingBottom: isLast ? "0" : "18px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                              <h4 
                                style={{ 
                                  fontSize: "13px", 
                                  fontWeight: step.status === "active" ? 700 : 600, 
                                  color: step.status === "pending" ? "var(--p-ink-3)" : "var(--p-ink)", 
                                  lineHeight: 1.3 
                                }}
                              >
                                {step.title}
                              </h4>
                              
                              <span 
                                style={{ 
                                  fontSize: "11px", 
                                  color: step.status === "active" ? "var(--p-plum)" : "var(--p-ink-3)",
                                  fontWeight: step.status === "active" ? 700 : 500,
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {step.dateLabel}
                              </span>
                            </div>

                            {/* Start button for active steps */}
                            {step.status === "active" && step.lessonPath && (
                              <button
                                onClick={() => navigate(step.lessonPath!)}
                                style={{
                                  marginTop: "8px",
                                  padding: "6px 14px",
                                  background: "var(--p-plum)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "var(--r-pill)",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center"
                                }}
                              >
                                Start now
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Always On Track List Section */}
        <div>
          <p className="anp-home__section-label">Always on</p>
          {tracks.filter((t) => t.id === "tax-calendar").map((track) => {
            let topBorderColor = "#FFB800"; // Always on tax calendar is warning yellow

            return (
              <div 
                key={track.id}
                style={{
                  background: "var(--p-card)",
                  border: "none",
                  borderTop: `3px solid ${topBorderColor}`,
                  borderRadius: "20px",
                  boxShadow: "0px 2px 12px rgba(255,107,53,0.08)",
                  padding: "14px",
                  marginBottom: "12px",
                  overflow: "hidden"
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <TopicIllustration iconName={track.icon} size={38} style={{ borderRadius: "10px" }} />

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--p-ink)", lineHeight: 1.2 }}>
                      {track.title}
                    </h3>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--p-ink-3)", marginTop: "2px" }}>
                      {track.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Life Event Bottom Sheet Modal */}
      <div 
        className={`anp-tooltip-overlay ${showAddSheet ? "anp-tooltip-overlay--visible" : ""}`}
        onClick={() => setShowAddSheet(false)}
        style={{ zIndex: 60 }}
      />
      
      <div 
        className={`anp-tooltip ${showAddSheet ? "anp-tooltip--visible" : ""}`}
        onTouchStart={addSheetDrag.onTouchStart}
        onTouchMove={addSheetDrag.onTouchMove}
        onTouchEnd={addSheetDrag.onTouchEnd}
        style={{ 
          zIndex: 65,
          maxHeight: "92%",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingBottom: "max(calc(20px * var(--d)), env(safe-area-inset-bottom))",
          ...addSheetDrag.style
        }}
      >
        {/* Drag Handle */}
        <div 
          style={{
            width: "40px",
            height: "5px",
            background: "var(--p-line-2)",
            borderRadius: "10px",
            alignSelf: "center",
            marginTop: "-8px",
            marginBottom: "4px"
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--p-ink)" }}>
            What is happening in your life?
          </h2>
          <button 
            onClick={() => setShowAddSheet(false)}
            style={{ background: "transparent", border: "none", fontSize: "20px", color: "var(--p-ink-3)", cursor: "pointer", fontWeight: "bold" }}
          >
            ×
          </button>
        </div>

        {/* Categories Grid (2 Columns) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {categoriesList.map((cat, idx) => {
            const isSelected = selectedCategory === idx;
            return (
              <div
                key={idx}
                onClick={() => setSelectedCategory(idx)}
                style={{
                  background: isSelected ? "var(--p-plum-tint)" : "var(--p-card)",
                  border: isSelected ? "2px solid var(--p-plum)" : "1.5px solid var(--p-line)",
                  borderRadius: "var(--r-lg)",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease"
                }}
              >
                <span style={{ fontSize: "24px" }}>{cat.icon}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--p-ink)", fontFamily: "var(--font-body)", lineHeight: 1.2 }}>
                  {cat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--p-ink-2)", textTransform: "uppercase" }}>
              Company or role
            </label>
            <input
              type="text"
              placeholder="e.g. Deloitte, Freelance Designer (Optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{
                background: "var(--p-card)",
                border: "1.5px solid var(--p-line)",
                borderRadius: "var(--r-md)",
                padding: "10px 12px",
                fontSize: "16px",
                color: "var(--p-ink)",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--p-ink-2)", textTransform: "uppercase" }}>
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  background: "var(--p-card)",
                  border: "1.5px solid var(--p-line)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 10px",
                  fontSize: "16px",
                  color: "var(--p-ink)",
                  outline: "none",
                  width: "100%"
                }}
              />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--p-ink-2)", textTransform: "uppercase" }}>
                First salary
              </label>
              <input
                type="date"
                value={firstSalaryDate}
                onChange={(e) => setFirstSalaryDate(e.target.value)}
                style={{
                  background: "var(--p-card)",
                  border: "1.5px solid var(--p-line)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 10px",
                  fontSize: "16px",
                  color: "var(--p-ink)",
                  outline: "none",
                  width: "100%"
                }}
              />
            </div>
          </div>
        </div>

        {/* Info Line */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--p-plum)", background: "var(--p-plum-tint)", padding: "8px 12px", borderRadius: "var(--r-md)", marginTop: "4px" }}>
          <span style={{ fontSize: "14px" }}>🦉</span>
          <p style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.35 }}>
            Sage will schedule lessons around these dates automatically
          </p>
        </div>

        {/* Activate Button */}
        <button
          onClick={handleActivateTrack}
          disabled={selectedCategory === null}
          style={{
            background: selectedCategory === null ? "var(--p-line)" : "var(--p-plum)",
            color: selectedCategory === null ? "var(--p-ink-4)" : "white",
            border: "none",
            borderRadius: "var(--r-xl)",
            padding: "14px",
            fontFamily: "var(--font-display)",
            fontSize: "15px",
            fontWeight: 700,
            cursor: selectedCategory === null ? "not-allowed" : "pointer",
            width: "100%",
            marginTop: "6px",
            transition: "all 0.15s ease"
          }}
        >
          Activate this track
        </button>
      </div>
    </div>
  );
}
