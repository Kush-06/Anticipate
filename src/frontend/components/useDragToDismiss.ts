import { useState, useRef } from "react";

export function useDragToDismiss(onDismiss: () => void, isVisible: boolean) {
  const startY = useRef<number | null>(null);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - startY.current;
    
    // Only allow dragging down (diffY > 0)
    if (diffY > 0) {
      setOffsetY(diffY);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    startY.current = null;

    // Check if dragged > 30% of standard tooltip height (approx 300px)
    // or look at target element client height
    const sheetEl = document.querySelector(".anp-tooltip--visible, .anp-quiz__sheet--open") as HTMLElement;
    const height = sheetEl ? sheetEl.clientHeight : 300;
    
    if (offsetY > height * 0.3) {
      onDismiss();
    }
    
    setOffsetY(0);
  };

  const dragStyle: React.CSSProperties = isVisible && offsetY > 0 ? {
    transform: `translateY(${offsetY}px)`,
    transition: isDragging ? "none" : "transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms cubic-bezier(0.16, 1, 0.3, 1)"
  } : {};

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    style: dragStyle
  };
}
