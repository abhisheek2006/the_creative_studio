export function Squiggle({ className = 'squiggle', color = 'currentColor' }) {
  return (
    <svg className={className} viewBox="0 0 210 16" fill="none" aria-hidden="true">
      <path
        d="M3 8c14-6 22 6 36 0s22-6 36 0 22 6 36 0 22-6 36 0 22 6 36 0 20-5 24 3"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeartDoodle({ size = 26, color = 'currentColor', ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden="true" {...props}>
      <path d="M12 20s-7-4.5-9-9c-1.3-3.1 1-6.5 4.4-6.5 2 0 3.5 1 4.6 2.6 1.1-1.6 2.6-2.6 4.6-2.6 3.4 0 5.7 3.4 4.4 6.5-2 4.5-9 9-9 9z" transform="rotate(-6 12 12)" />
    </svg>
  );
}

export function StarDoodle({ size = 22, color = 'currentColor', ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden="true" {...props}>
      <path d="M12 2l2.2 6 6 2-6 2-2.2 6-2.2-6-6-2 6-2L12 2z" />
    </svg>
  );
}

export function FlowerDoodle({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...props}>
      <g fill={color}>
        <circle cx="12" cy="12" r="2.4" />
        <circle cx="12" cy="4.8" r="2" />
        <circle cx="19.2" cy="8.4" r="2" />
        <circle cx="19.2" cy="15.6" r="2" />
        <circle cx="12" cy="19.2" r="2" />
        <circle cx="4.8" cy="15.6" r="2" />
        <circle cx="4.8" cy="8.4" r="2" />
      </g>
    </svg>
  );
}

export function Logo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#F4A6C1" />
      <path
        d="M32 48C20 39 14 32 14 25.5 14 20 17.5 16 22 16c3.2 0 6.3 1.7 10 5.5 3.7-3.8 6.8-5.5 10-5.5 4.5 0 8 4 8 9.5 0 6.5-6 13.5-18 22.5z"
        fill="#fff"
      />
      <circle cx="20.5" cy="24.5" r="1.5" fill="#F6C75B" />
      <circle cx="43.5" cy="24.5" r="1.5" fill="#C6A0F5" />
    </svg>
  );
}