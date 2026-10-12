import React from 'react';
import { Link } from 'react-router-dom';

export const Logo = ({ theme = 'dark', className = '' }) => {
  return (
    <Link to="/" className={`inline-flex flex-col items-center justify-center select-none group ${className}`}>
      {/* Crown Doodles above BroCode matching Image 2 */}
      <div className="flex items-center space-x-1 -mb-1 relative z-10">
        <svg
          className="w-4 h-3 text-[#FFB800] fill-current"
          viewBox="0 0 24 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 14L4 4L9 9L12 2L15 9L20 4L22 14H2Z"
            stroke="#FFB800"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="4" cy="3" r="1.5" fill="#FFB800" />
          <circle cx="12" cy="1.5" r="1.5" fill="#FFB800" />
          <circle cx="20" cy="3" r="1.5" fill="#FFB800" />
        </svg>
        <svg
          className="w-3.5 h-2.5 text-[#FFB800] fill-current opacity-90 -rotate-6"
          viewBox="0 0 24 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 14L5 5L9 9L12 3L15 9L19 5L21 14H3Z"
            stroke="#FFB800"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Styled Wordmark: White 'Bro' + Golden Yellow 'Code' with playful cursive curve */}
      <div className="flex items-baseline font-black tracking-tight text-xl sm:text-2xl leading-none">
        <span className="text-white font-extrabold italic drop-shadow-sm font-sans">
          Bro
        </span>
        <span
          className="text-[#FFB800] font-black italic drop-shadow-sm tracking-tight ml-0.5"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Code
        </span>
      </div>
    </Link>
  );
};
