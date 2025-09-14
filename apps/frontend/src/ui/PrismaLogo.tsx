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
      {/* Outer prism shape */}
      <path d="M6 9 L18 4 L30 9 L30 27 L18 32 L6 27 Z" fill="#FFFFFF" opacity="0.95" />
      {/* Inner triangular cut to give prism look */}
      <path d="M10.5 11.5 L18 8.2 L25.5 11.5 L25.5 24.5 L18 27.8 L10.5 24.5 Z" fill="#002c50" opacity="0.0" />
      {/* Light facet (slightly transparent white) */}
      <path d="M18 8.2 L25.5 11.5 L18 15 L10.5 11.5 Z" fill="#FFFFFF" opacity="0.12" />
      {/* Small shine */}
      <ellipse cx="7" cy="10" rx="1.2" ry="1.2" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}
