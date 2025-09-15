import React from 'react';

export default function PrismaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      <g id="PrismaLogoMinimalista" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {/* Contorno del prisma */}
        <path d="M50 100 L100 50 L150 100 L100 150 Z M100 50 L100 150 M50 100 L150 100" fill="none" />

        {/* Fragmentos dispersos a la derecha */}
        <rect x="155" y="90" width="5" height="5" fill="#ffffff" stroke="none" />
        <rect x="160" y="80" width="8" height="8" fill="#ffffff" stroke="none" />
        <rect x="165" y="100" width="4" height="4" fill="#ffffff" stroke="none" />
        <circle cx="170" cy="85" r="2" fill="#ffffff" stroke="none" />
        <rect x="175" y="110" width="6" height="6" fill="#ffffff" stroke="none" />
        <rect x="180" y="95" width="3" height="3" fill="#ffffff" stroke="none" />
        <circle cx="185" cy="105" r="1.5" fill="#ffffff" stroke="none" />

        {/* Más fragmentos para dar sensación de dispersión */}
        <rect x="142" y="70" width="4" height="4" fill="#ffffff" stroke="none" />
        <rect x="150" y="60" width="6" height="6" fill="#ffffff" stroke="none" />
        <rect x="132" y="82" width="3" height="3" fill="#ffffff" stroke="none" />
        <circle cx="158" cy="100" r="2" fill="#ffffff" stroke="none" />
      </g>
    </svg>
  );
}
