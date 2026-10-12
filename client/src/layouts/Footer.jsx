import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-[#1C1C1C] py-16 sm:py-20 md:py-24 px-4 flex items-center justify-center">
      <Link
        to="/"
        className="inline-flex flex-col items-center justify-center select-none group transition-transform duration-300 hover:scale-105 active:scale-95"
        aria-label="BroCode Home"
      >
        {/* Large Iconic Crown Doodles */}
        <div className="flex items-center space-x-2 -mb-2 sm:-mb-3 relative z-10">
          <svg
            className="w-8 h-6 sm:w-11 sm:h-8 md:w-14 md:h-10 text-[#FFB800] fill-current drop-shadow-[0_2px_12px_rgba(255,184,0,0.45)]"
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
            className="w-6 h-5 sm:w-9 sm:h-6 md:w-11 md:h-8 text-[#FFB800] fill-current opacity-90 -rotate-6 drop-shadow-[0_2px_10px_rgba(255,184,0,0.35)]"
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

        {/* Large Bold BroCode Wordmark */}
        <div className="flex items-baseline font-black tracking-tight text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-none">
          <span className="text-white font-extrabold italic drop-shadow-md">
            Bro
          </span>
          <span className="text-[#FFB800] font-black italic drop-shadow-md tracking-tight ml-1 sm:ml-2">
            Code
          </span>
        </div>
      </Link>
    </footer>
  );
};
