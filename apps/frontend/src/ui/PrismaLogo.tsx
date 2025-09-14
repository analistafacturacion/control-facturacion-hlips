import React from 'react';

export default function PrismaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/* Base prism silhouette */}
      <path d="M6 9 L18 4 L30 9 L30 27 L18 32 L6 27 Z" fill="#FFFFFF" />

      {/* Left facet (slightly darker white) */}
      <path d="M6 9 L18 14 L18 32 L6 27 Z" fill="#FFFFFF" opacity="0.92" />

      {/* Right facet (subtle highlight) */}
      <path d="M18 14 L30 9 L30 27 L18 32 Z" fill="#FFFFFF" opacity="0.8" />

      {/* Top shine */}
      <path d="M9 12 L18 8 L27 12 L18 15 Z" fill="#FFFFFF" opacity="0.14" />

      {/* Small crystal sparkle */}
      <circle cx="24" cy="10" r="0.9" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}
