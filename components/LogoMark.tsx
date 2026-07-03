type LogoMarkProps = {
  small?: boolean;
  className?: string;
};

export default function LogoMark({
  small = false,
  className = "",
}: LogoMarkProps) {
  const sizeClass = small ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl";

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-[#c7ad75]/30 bg-[#11100d] shadow-[0_10px_24px_rgba(0,0,0,0.28),0_0_18px_rgba(199,173,117,0.10)] ${sizeClass} ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#f5f0e8]/10 via-transparent to-[#c7ad75]/10" />

      <svg
        className="relative h-full w-full"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M21.5 10.2C18.2 11.5 16.2 14.1 16.2 17.2V30.2C16.2 37 21.1 41.4 27.6 41.4C32.2 41.4 35.9 39.3 38.2 35.7C38.8 34.8 38.1 33.7 37 34.1C34.7 35 32.3 35.4 29.9 35.1C25.7 34.6 23.1 31.8 23.1 27.6V11.4C23.1 10.5 22.4 9.9 21.5 10.2Z"
          fill="var(--theme-text)"
        />

        <circle
          cx="33.8"
          cy="19.3"
          r="4.2"
          fill="var(--theme-accent)"
        />

        <path
          d="M21.5 10.2C18.2 11.5 16.2 14.1 16.2 17.2V30.2C16.2 37 21.1 41.4 27.6 41.4C32.2 41.4 35.9 39.3 38.2 35.7"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeLinecap="round"
        />

        <circle
          cx="33.8"
          cy="19.3"
          r="4.2"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-[#f5f0e8]/10" />
    </div>
  );
}