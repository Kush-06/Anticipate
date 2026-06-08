import { useEffect, useState } from "react";
import { SageAvatar } from "./SageAvatar";

export function LoadingScreen({ onFinished, fade = true }: { onFinished: () => void; fade?: boolean }) {
  const [fadeAway, setFadeAway] = useState(false);

  useEffect(() => {
    if (fade) {
      // Start fading out slightly before the 1.5 second loading ends
      const fadeTimer = setTimeout(() => {
        setFadeAway(true);
      }, 1200);

      const finishTimer = setTimeout(() => {
        onFinished();
      }, 1500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
      };
    } else {
      const finishTimer = setTimeout(() => {
        onFinished();
      }, 1200);

      return () => {
        clearTimeout(finishTimer);
      };
    }
  }, [onFinished, fade]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "var(--p-coral, #e9694a)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
        opacity: fadeAway ? 0 : 1,
        transform: fadeAway ? "scale(1.02)" : "scale(1)",
        pointerEvents: fadeAway ? "none" : "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "calc(4px * var(--d, 1))",
        }}
      >
        <SageAvatar size={100} />
        <div
          style={{
            fontFamily: "var(--font-display, 'Bricolage Grotesque')",
            fontWeight: 800,
            fontSize: "calc(32px * var(--d, 1))",
            color: "#ffffff",
            letterSpacing: "-0.03em",
            textTransform: "lowercase",
          }}
        >
          anticipate.
        </div>
      </div>
    </div>
  );
}
