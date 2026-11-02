// Simple abstract line icons. No people, no animals.
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export const IconHome = () => (
  <svg {...base}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
);
export const IconBook = () => (
  <svg {...base}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 21V5" />
  </svg>
);
export const IconChart = () => (
  <svg {...base}>
    <path d="M4 20h16" />
    <path d="M7 16v-5M12 16V7M17 16v-8" />
  </svg>
);
export const IconPencil = () => (
  <svg {...base}>
    <path d="M4 20l4-1L19 8l-3-3L5 16z" />
    <path d="M14 7l3 3" />
  </svg>
);
export const IconGear = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
  </svg>
);
export const IconCheck = () => (
  <svg {...base}>
    <path d="M5 12l5 5L19 7" />
  </svg>
);
export const IconCross = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
