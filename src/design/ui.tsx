import type { ReactNode } from "react";

// =====================================================================
// PRIMITIVES
//
// The design has no card component — content is separated by hairline
// rules and whitespace. These are the few shapes that genuinely repeat
// across screens, kept here so the vocabulary stays consistent.
// =====================================================================

export function Icon({
  name,
  className = "",
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined ${className}`}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      {name}
    </span>
  );
}

/** Uppercase micro-label. The wide tracking is the point. */
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-body text-label-caps uppercase text-on-surface-variant ${className}`}
    >
      {children}
    </span>
  );
}

/** Pill badge — sage by default, per "Chips/Badges" in the design system. */
export function Chip({
  children,
  className = "bg-secondary-container text-on-secondary-container",
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-[3px] font-body text-[11px] leading-none font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * A figure and its label. Playfair for the number, label-caps beneath —
 * the editorial treatment the design uses everywhere a statistic
 * appears, in place of a filled KPI card.
 */
export function Figure({
  value,
  label,
  detail,
  align = "center",
}: {
  value: ReactNode;
  label: string;
  detail?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`flex flex-col ${
        align === "center" ? "items-center text-center" : "items-start"
      }`}
    >
      <span className="font-display text-headline-md text-on-background">
        {value}
      </span>
      <Label className="mt-2">{label}</Label>
      {detail && (
        <span className="mt-1 font-body text-[11px] text-on-surface-variant/80">
          {detail}
        </span>
      )}
    </div>
  );
}

/** Solid olive CTA. */
export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  type = "button",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "quiet";
  className?: string;
  type?: "button" | "submit";
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-body text-label-caps uppercase transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";

  const variants = {
    primary:
      "bg-primary-container text-on-primary-container hover:bg-primary ambient-shadow",
    ghost:
      "ghost-border text-primary hover:bg-secondary-container/50",
    quiet:
      "text-on-surface-variant hover:text-primary",
  };

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Segmented control — the CONGESTION / ORIGIN-DEST style toggle. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-surface-container p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-1.5 font-body text-label-caps uppercase transition-colors ${
            option.value === value
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** A floating panel over the map: legend, stat card, scrubber. */
export function FloatingCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`glass-panel ambient-shadow rounded-[16px] border border-hairline p-4 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * The left rail every dashboard screen is built around: a fixed-width
 * translucent column beside a full-bleed map.
 */
export function SidePanel({
  children,
  className = "",
  width = "w-[400px]",
}: {
  children: ReactNode;
  className?: string;
  width?: string;
}) {
  return (
    <aside
      className={`glass-panel hairline-r relative z-10 flex h-full ${width} shrink-0 flex-col ${className}`}
    >
      {children}
    </aside>
  );
}

/** A horizontal hairline. Used instead of borders on cards. */
export function Rule({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-hairline ${className}`} />;
}

/**
 * Draws a tiny inline sparkline. Used for the alert-rate and city-flow
 * cards, which the design shows as bare lines with no axes.
 */
export function Sparkline({
  points,
  className = "",
  stroke = "var(--color-primary)",
  height = 48,
}: {
  points: number[];
  className?: string;
  stroke?: string;
  height?: number;
}) {
  if (points.length < 2) {
    return <div style={{ height }} className={className} />;
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;

  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - ((value - min) / span) * 100;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height }}
      className={`w-full ${className}`}
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
