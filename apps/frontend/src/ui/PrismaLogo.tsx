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
      {/* Fragmented prism (option B) - white */}
      <g fill="#FFFFFF">
        <path d="M8 14 L24 6 L40 14 L34 28 L24 32 L14 28 Z" />
        <path d="M14 16 L24 22 L34 16 L24 12 Z" opacity="0.14" />
        <path d="M24 22 L34 16 L34 28 L24 32 Z" opacity="0.18" />
      </g>
      <path d="M8 14 L24 6 L40 14 L34 28 L24 32 L14 28 Z" stroke="#FFFFFF" strokeWidth="0.6" fill="none" opacity="0.9" />
    </svg>
  );
}
