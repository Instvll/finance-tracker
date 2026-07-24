type LeftovrLogoVariant = "mark" | "lockup";
type LeftovrLogoSize = "small" | "nav" | "medium" | "menu" | "large";

type LeftovrLogoProps = {
  variant?: LeftovrLogoVariant;
  size?: LeftovrLogoSize;
  subtitle?: string;
  className?: string;
};

export default function LeftovrLogo({
  variant = "mark",
  size = "medium",
  subtitle,
  className = "",
}: LeftovrLogoProps) {
  const classes = [
    "leftovr-logo",
    `leftovr-logo-${variant}`,
    `leftovr-logo-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      <span className="leftovr-logo-mark" aria-hidden="true">
        <svg
          className="leftovr-logo-svg"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="7"
            y="39"
            width="50"
            height="18"
            rx="9"
            fill="var(--brand-slate, #3e4652)"
          />

          <rect
            x="7"
            y="5"
            width="18"
            height="52"
            rx="9"
            fill="var(--brand-sage, #a7b89d)"
          />

          <path
            d="M10.5 8.6c5.4-3.2 10.6-1.7 11.7 2.2v25.4c-2.1 3.7-5.4 5.7-9.8 6.2-2.9.3-4.5-1.5-4.5-4.2V14.5c0-2.7.8-4.8 2.6-5.9Z"
            fill="var(--brand-cream, #f4f1e8)"
            opacity="0.13"
          />

          <path
            d="M24.9 40.2c2.7-2.2 6.3-3.3 10.7-3.3h9.1c4.5 0 8.1 2.3 10.4 6.2-1.6-2.5-4.4-3.7-8.4-3.7H31.3c-2.5 0-4.7.8-6.4 2.4v-1.6Z"
            fill="var(--brand-cream, #f4f1e8)"
            opacity="0.1"
          />

          <circle
            cx="25.2"
            cy="39.7"
            r="7.4"
            fill="var(--brand-cream, #f4f1e8)"
          />

          <circle
            cx="25.2"
            cy="39.7"
            r="7.4"
            stroke="var(--brand-sage-deep, #7f9477)"
            strokeWidth="1.2"
            opacity="0.28"
          />

          <circle cx="22.8" cy="37.2" r="2.15" fill="white" opacity="0.34" />
        </svg>
      </span>

      {variant === "lockup" ? (
        <span className="leftovr-logo-copy">
          <span className="leftovr-logo-wordmark">leftovr</span>

          {subtitle ? (
            <span className="leftovr-logo-subtitle">{subtitle}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}