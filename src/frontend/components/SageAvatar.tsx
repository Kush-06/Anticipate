export function SageAvatar({ size = 48, leafJump = false }: { size?: number; leafJump?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={leafJump ? 'sage-avatar sage-avatar--jump' : 'sage-avatar'}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, overflow: "visible" }}
    >
      <defs>
        <linearGradient id="sage-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE4D4" />
          <stop offset="100%" stopColor="#FFD4B8" />
        </linearGradient>
        <style>{`
          .sage-sprout-grow {
            transform-origin: 50px 34px;
            animation: sage-shoot-grow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          .sage-sprout-sway {
            transform-origin: 50px 34px;
            animation: sage-sway 2.5s ease-in-out infinite;
          }
          .sage-avatar {
            overflow: visible;
          }
          .sage-avatar--jump {
            transform-origin: center center;
            animation: sage-avatar-backflip 0.95s cubic-bezier(0.2, 1.15, 0.36, 1) both;
          }
          .sage-leaf-l {
            transform-origin: 42px 14px;
            animation: sage-unfold-l 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          .sage-leaf-r {
            transform-origin: 58px 14px;
            animation: sage-unfold-r 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          @keyframes sage-shoot-grow {
            0% { transform: scale(0); }
            100% { transform: scale(1); }
          }
          @keyframes sage-sway {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
          }
          @keyframes sage-avatar-backflip {
            0% { transform: translateY(0) rotate(0deg) scale(1); }
            10% { transform: translateY(5px) rotate(0deg) scale(1.14, 0.86); }
            32% { transform: translateY(-56px) rotate(-155deg) scale(0.96, 1.08); }
            56% { transform: translateY(-42px) rotate(-305deg) scale(1); }
            74% { transform: translateY(2px) rotate(-360deg) scale(1.12, 0.88); }
            88% { transform: translateY(-12px) rotate(-360deg) scale(0.98, 1.04); }
            100% { transform: translateY(0) rotate(-360deg) scale(1); }
          }
          @keyframes sage-unfold-l {
            0% { transform: rotate(35deg) scale(0.2); }
            100% { transform: rotate(0deg) scale(1); }
          }
          @keyframes sage-unfold-r {
            0% { transform: rotate(-35deg) scale(0.2); }
            100% { transform: rotate(0deg) scale(1); }
          }
        `}</style>
      </defs>
      <g>
        <g className="sage-sprout-grow">
          <g className="sage-sprout-sway">
            <path d="M50 34 L50 20" stroke="#5fab84" strokeWidth="4.5" strokeLinecap="round" />
            <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" className="sage-leaf-l" />
            <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" className="sage-leaf-r" />
          </g>
        </g>
        <circle cx="50" cy="62" r="30" fill="url(#sage-grad)" stroke="#e9694a" strokeWidth="3.5" />
        <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
        <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
        <circle cx="33" cy="64" r="5" fill="#FFB8A0" fillOpacity="0.6" />
        <circle cx="67" cy="64" r="5" fill="#FFB8A0" fillOpacity="0.6" />
        <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}
