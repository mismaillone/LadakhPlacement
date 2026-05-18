export const Logo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g clipPath="url(#clip0)">
      <rect width="40" height="40" rx="12" fill="url(#paint0_linear)" />
      {/* Abstract 'L' overlapping with 'P' motif */}
      <path
        d="M12 12C12 10.8954 12.8954 10 14 10H18V28H28C29.1046 28 30 28.8954 30 30C30 31.1046 29.1046 32 28 32H14C12.8954 32 12 31.1046 12 30V12Z"
        fill="white"
      />
      <path
        d="M26 10C29.3137 10 32 12.6863 32 16C32 19.3137 29.3137 22 26 22H18V10H26ZM26 18C27.1046 18 28 17.1046 28 16C28 14.8954 27.1046 14 26 14H22V18H26Z"
        fill="url(#paint1_linear)"
      />
      <circle cx="28" cy="10" r="4" fill="#60A5FA" />
    </g>
    <defs>
      <linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E40AF" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="paint1_linear" x1="18" y1="10" x2="32" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#93C5FD" />
        <stop offset="1" stopColor="#BFDBFE" />
      </linearGradient>
      <clipPath id="clip0">
        <rect width="40" height="40" rx="12" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
