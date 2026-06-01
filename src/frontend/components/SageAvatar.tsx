export function SageAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        display: "inline-block", 
        verticalAlign: "middle", 
        flexShrink: 0 
      }}
    >
      <defs>
        <linearGradient id="sage-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE4D4" />
          <stop offset="100%" stopColor="#FFD4B8" />
        </linearGradient>
      </defs>
      
      {/* 1. Stem growing from head */}
      <path 
        d="M50 34 L50 20" 
        stroke="#4CAF82" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />

      {/* 2. Leaves growing left and right from the stem */}
      <ellipse 
        cx="42" 
        cy="14" 
        rx="6" 
        ry="10" 
        fill="#4CAF82" 
        className="anp-sage-leaf-left" 
      />
      <ellipse 
        cx="58" 
        cy="14" 
        rx="6" 
        ry="10" 
        fill="#4CAF82" 
        className="anp-sage-leaf-right" 
      />

      {/* 3. Round Head circle with orange border */}
      <circle 
        cx="50" 
        cy="62" 
        r="30" 
        fill="url(#sage-grad)" 
        stroke="#FF6B35" 
        strokeWidth="3.5" 
      />
      
      {/* Eyebrows angled upward for a friendly look */}
      <path d="M38 50 Q 42 46, 45 50" stroke="#1A1207" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M55 50 Q 58 46, 62 50" stroke="#1A1207" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Two oval eyes */}
      <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1A1207" />
      <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1A1207" />

      {/* Rosy cheeks */}
      <circle cx="33" cy="64" r="5" fill="#FFB8A0" fillOpacity="0.6" />
      <circle cx="67" cy="64" r="5" fill="#FFB8A0" fillOpacity="0.6" />

      {/* Smile */}
      <path d="M44 68 Q 50 74, 56 68" stroke="#1A1207" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
