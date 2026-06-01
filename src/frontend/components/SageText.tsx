import { useState, useEffect } from "react";
import type { ReactNode } from "react";

interface SageTextProps {
  children: ReactNode;
  trigger?: any;
  style?: React.CSSProperties;
}

export function SageText({ children, trigger, style }: SageTextProps) {
  const [currentText, setCurrentText] = useState(children);
  const [isFading, setIsFading] = useState(false);

  // If trigger is provided, use it. If children is a string, use it. Otherwise, fallback to undefined.
  const compKey = trigger !== undefined ? trigger : (typeof children === "string" ? children : undefined);

  useEffect(() => {
    if (compKey === undefined) {
      setCurrentText(children);
      return;
    }
    setIsFading(true);
    const timer = setTimeout(() => {
      setCurrentText(children);
      setIsFading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [compKey]);

  return (
    <p
      className={`anp-sage-card__text ${isFading ? "anp-sage-card__text--fade-out" : "anp-sage-card__text--fade-in"}`}
      style={style}
    >
      {currentText}
    </p>
  );
}
