import React from 'react';

export default function PrismaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/* Minimal elegant prism: three thin facets, white fills with subtle opacity for depth */}
      <g fill="#FFFFFF" fillRule="evenodd">
        <path d="M8 12 L24 6 L40 12 L32 24 L24 30 L16 24 Z" opacity="1" />
        <path d="M8 12 L16 24 L24 30 L24 6 Z" opacity="0.95" />
        <path d="M24 6 L40 12 L32 24 L24 30 Z" opacity="0.82" />
      </g>

      {/* Thin outline for crispness */}
      <path d="M8 12 L24 6 L40 12 L32 24 L24 30 L16 24 Z" stroke="#FFFFFF" strokeWidth="0.8" fill="none" opacity="0.9" />

      {/* Subtle cut highlight (small triangle) */}
      <path d="M22 9 L26 11 L22 14 Z" fill="#FFFFFF" opacity="0.18" />

      {/* Tiny sparkle */}
      <circle cx="36" cy="10" r="0.8" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}
