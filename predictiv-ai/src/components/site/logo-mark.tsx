/**
 * Diamond logo mark — matches the CSS `.logo-mark` from the design reference.
 * A square rotated 45° (diamond silhouette) with a gold centre dot.
 */
export function LogoMark({
  size = 40,
  inkColor = "#14181D",
  goldColor = "#E2812C",
  className = "",
}: {
  size?: number;
  inkColor?: string;
  goldColor?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Rotated square → diamond silhouette */}
      <rect
        x="17"
        y="17"
        width="66"
        height="66"
        stroke={inkColor}
        strokeWidth="5"
        fill="none"
        transform="rotate(45 50 50)"
      />
      {/* Gold centre dot */}
      <circle cx="50" cy="50" r="10" fill={goldColor} />
    </svg>
  );
}
