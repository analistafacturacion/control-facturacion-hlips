import React from 'react';

type Variant = 'A' | 'B' | 'C';

export default function PrismaLogo({ className, variant = 'B' }: { className?: string; variant?: Variant }) {
  // Three minimal variants:
  // A: outline prism + a few small squares
  // B: solid triangular prism + small pixel cluster (default)
  // C: monogram / favicon-friendly single-line prism + single pixel
  if (variant === 'A') {
    return (
      <svg className={className} width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
        <g stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M50 100 L100 50 L150 100 L100 150 Z" />
          <path d="M100 50 L100 150 M50 100 L150 100" strokeOpacity="0.7" />
        </g>
        <g fill="#ffffff">
          <rect x="152" y="86" width="6" height="6" />
          <rect x="162" y="74" width="5" height="5" />
          <rect x="170" y="96" width="4" height="4" />
        </g>
      </svg>
    );
  }

  if (variant === 'C') {
    return (
      <svg className={className} width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
        <g stroke="#ffffff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M60 110 L100 70 L140 110" />
        </g>
        <rect x="152" y="86" width="6" height="6" fill="#ffffff" />
      </svg>
    );
  }

  // Default variant B
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
      <g>
        <path d="M50 100 L100 50 L150 100 L100 150 Z" fill="#ffffff" opacity={0.06} />
        <path d="M50 100 L100 50 L150 100 L100 150 Z" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <g fill="#ffffff">
        <rect x="152" y="86" width="6" height="6" />
        <rect x="162" y="74" width="5" height="5" />
        <rect x="170" y="96" width="4" height="4" />
        <circle cx="180" cy="88" r="2" />
      </g>
    </svg>
  );
}
