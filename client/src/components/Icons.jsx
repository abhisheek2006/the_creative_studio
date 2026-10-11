// Lightweight inline SVG icon set — no extra dependencies.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
};

export const IconHeart = ({ filled, ...props }) => (
  <svg {...base} {...props}>
    <path
      d="M12 20s-7-4.5-9-9c-1.3-3.1 1-6.5 4.4-6.5 2 0 3.5 1 4.6 2.6 1.1-1.6 2.6-2.6 4.6-2.6 3.4 0 5.7 3.4 4.4 6.5-2 4.5-9 9-9 9z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </svg>
);

export const IconStar = ({ filled = true, ...props }) => (
  <svg {...base} {...props}>
    <path
      d="M12 3l2.7 5.9 6.3.8-4.6 4.4 1.2 6.3L12 17.4 6.4 20.4l1.2-6.3L3 9.7l6.3-.8L12 3z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </svg>
);

export const IconCart = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="18" cy="20" r="1.6" />
    <path d="M2.5 3h2l2.6 12.5a1.5 1.5 0 001.5 1.2h8.7a1.5 1.5 0 001.5-1.2L20.5 7H5.1" />
  </svg>
);

export const IconSearch = (props) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const IconMenu = (props) => (
  <svg {...base} {...props}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const IconClose = (props) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.4 14.2c-.24.68-1.4 1.3-1.9 1.34-.5.05-.96.24-3.24-.67-2.74-1.1-4.49-3.96-4.63-4.15-.14-.18-1.1-1.47-1.1-2.8 0-1.34.7-2 .95-2.27.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17.01.4-.07.63.48.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.1.19-.15.3-.3.47-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.08.17-.2.72-.84.92-1.13.19-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.7-.17 1.38z" />
  </svg>
);

export const IconInstagram = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconEye = (props) => (
  <svg {...base} {...props}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconTrash = (props) => (
  <svg {...base} {...props}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
);

export const IconEdit = (props) => (
  <svg {...base} {...props}>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 00-3-3L5 17v3z" />
    <path d="M13.5 6.5l3 3" />
  </svg>
);

export const IconPlus = (props) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMinus = (props) => (
  <svg {...base} {...props}>
    <path d="M5 12h14" />
  </svg>
);

export const IconArrowLeft = (props) => (
  <svg {...base} {...props}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export const IconCheck = (props) => (
  <svg {...base} {...props}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const IconGrid = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconPackage = (props) => (
  <svg {...base} {...props}>
    <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
    <path d="M12 11l8-4.5M12 11v9M4 6.5L12 11" />
  </svg>
);

export const IconClipboard = (props) => (
  <svg {...base} {...props}>
    <rect x="5" y="4" width="14" height="18" rx="2" />
    <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4" />
  </svg>
);

export const IconUsers = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M16.5 14.6c2.2 0 3.8 1.2 4.3 3.4" />
  </svg>
);

export const IconSettings = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
  </svg>
);

export const IconLogout = (props) => (
  <svg {...base} {...props}>
    <path d="M14 4h5v16h-5M10 12h9M16 8l4 4-4 4" />
  </svg>
);

export const IconMail = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export const IconPhone = (props) => (
  <svg {...base} {...props}>
    <path d="M5 4h4l2 5-2.5 1.5a12 12 0 006 6L16 14l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
  </svg>
);

export const IconSparkle = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2l1.9 5.9L19.8 10l-5.9 1.9L12 18l-1.9-6.1L4.2 10l5.9-2.1L12 2zM19 15l.8 2.4 2.4.8-2.4.8L19 21.4l-.8-2.4-2.4-.8 2.4-.8L19 15z" />
  </svg>
);

export const IconFlower = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="5.5" r="2" />
    <circle cx="18.2" cy="8.5" r="2" />
    <circle cx="18.2" cy="15.5" r="2" />
    <circle cx="12" cy="18.5" r="2" />
    <circle cx="5.8" cy="15.5" r="2" />
    <circle cx="5.8" cy="8.5" r="2" />
  </svg>
);

export const IconTruck = (props) => (
  <svg {...base} {...props}>
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </svg>
);

export const IconUpload = (props) => (
  <svg {...base} {...props}>
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
  </svg>
);

export const IconDownload = (props) => (
  <svg {...base} {...props}>
    <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
  </svg>
);
export const IconUser = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);
