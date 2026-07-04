type LogoMarkProps = {
  small?: boolean;
  className?: string;
};

export default function LogoMark({
  small = false,
  className = "",
}: LogoMarkProps) {
  const sizeClass = small ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl";

  const markTransform = small ? "translate(0.4 -1.4)" : "translate(0.2 -1.2)";

  return (
    <div
      className={`relative shrink-0 overflow-hidden border shadow-[0_10px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] ${sizeClass} ${className}`}
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--theme-text) 10%, transparent), transparent 42%), color-mix(in srgb, var(--theme-card) 88%, var(--theme-bg))",
        borderColor:
          "color-mix(in srgb, var(--theme-accent) 28%, transparent)",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 72% 28%, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent 34%)",
        }}
      />

      <svg
        className="relative h-full w-full"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <g transform={markTransform}>
          <path
            d="M22.2 8.8C18.7 10.1 16.6 12.9 16.6 16.2V30.2C16.6 37.2 21.7 41.8 28.6 41.8C33 41.8 36.6 39.9 39 36.7C39.7 35.8 39 34.7 37.9 35.1C35.9 35.8 33.8 36.1 31.7 35.9C27.2 35.5 24.4 32.6 24.4 28.1V10.1C24.4 9.1 23.3 8.4 22.2 8.8Z"
            fill="var(--theme-text)"
          />

          <circle cx="33" cy="19.1" r="4.4" fill="var(--theme-accent)" />

          <path
            d="M22.2 8.8C18.7 10.1 16.6 12.9 16.6 16.2V30.2C16.6 37.2 21.7 41.8 28.6 41.8C33 41.8 36.6 39.9 39 36.7"
            stroke="color-mix(in srgb, var(--theme-bg) 24%, white)"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.22"
          />

          <circle
            cx="33"
            cy="19.1"
            r="4.4"
            stroke="color-mix(in srgb, var(--theme-bg) 24%, white)"
            strokeWidth="0.8"
            opacity="0.24"
          />
        </g>
      </svg>

      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset"
        style={{
          boxShadow:
            "inset 0 0 0 1px color-mix(in srgb, var(--theme-text) 8%, transparent)",
        }}
      />
    </div>
  );
}