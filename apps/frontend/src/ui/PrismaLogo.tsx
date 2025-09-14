import React from 'react';

export default function PrismaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/* Outer triangular prism outline */}
      <g transform="translate(10,10) scale(0.8)">
        <path d="M8 20 L60 4 L112 20 L92 86 L60 100 L28 86 Z" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />

        {/* Inner structural lines */}
        <path d="M60 8 L60 72" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.95" />
        <path d="M32 28 L60 44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.95" />

        {/* Right-side fragmentation: a cluster of squares and small triangles */}
        <g fill="#ffffff" transform="translate(74,18)">
          {/* larger square fragments */}
          <rect x="0" y="0" width="10" height="10" />
          <rect x="16" y="-4" width="8" height="8" />
          <rect x="30" y="6" width="6" height="6" />
          <rect x="44" y="18" width="6" height="6" />
          <rect x="56" y="30" width="8" height="8" />

          {/* medium fragments */}
          <rect x="-6" y="18" width="5" height="5" />
          <rect x="12" y="12" width="4" height="4" />
          <rect x="22" y="-8" width="6" height="6" />

          {/* small pixel bits */}
          <rect x="8" y="24" width="3" height="3" />
          <rect x="36" y="-2" width="3" height="3" />
          <rect x="48" y="8" width="2" height="2" />

          {/* triangle shards */}
          <path d="M70 4 L76 10 L70 10 Z" transform="translate(-12,6)" />
          <path d="M70 4 L76 10 L70 10 Z" transform="translate(4,22) rotate(20 74 14)" />
        </g>

        {/* Subtle interior stroke for prism depth */}
        <path d="M26 72 L60 56 L94 72" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </g>
    </svg>
  );
}
