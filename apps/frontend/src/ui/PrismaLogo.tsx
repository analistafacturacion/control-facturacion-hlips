import React from 'react';

type Variant = 'A' | 'B' | 'C';

export default function PrismaLogo({ className, variant = 'B', imgSrc }: { className?: string; variant?: Variant; imgSrc?: string }) {
  // Three minimal variants:
  // A: outline prism + a few small squares
  // B: solid triangular prism + small pixel cluster (default)
  // C: monogram / favicon-friendly single-line prism + single pixel
  // If an image source is provided (or default to /logo.png), render the image instead of the SVG
  const src = imgSrc ?? '/logo.png';
  if (imgSrc !== undefined || typeof window !== 'undefined') {
    // Note: we render the <img> unconditionally when imgSrc provided. If imgSrc is undefined we still allow '/logo.png' in prod,
    // but the consumer may prefer explicit control.
  }

  if (imgSrc) {
    return <img src={imgSrc} alt="Prisma Analytics" className={className} style={{ width: 40, height: 40, objectFit: 'contain' }} />;
  }

  // If no explicit imgSrc, try defaulting to '/logo.png' (public folder). We still keep SVG variants as fallback.
  if (!imgSrc) {
    // Render image from public if available; this will still show broken image if file missing, so SVG remains available below as fallback.
    // We'll attempt to use the public image by rendering it first; if the user prefers strict fallback behavior we can add image onError handling.
    return <img src={src} alt="Prisma Analytics" className={className} style={{ width: 40, height: 40, objectFit: 'contain' }} />;
  }

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
