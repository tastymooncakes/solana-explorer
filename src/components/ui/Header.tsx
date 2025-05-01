'use client';

import Link from 'next/link';
import SearchBar from '../search/SearchBar';

export default function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800 py-4 px-4 md:px-6">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo/Home Link */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-blue-500 hover:text-blue-400 transition-colors">
            {/* Solana Icon SVG */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 397.7 311.7" 
              className="h-8 w-8"
              fill="currentColor"
            >
              <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8zM333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-xl hidden md:block">Solana Explorer</span>
        </Link>
        
        {/* Search bar - wrapped in div to control width */}
        <div className="w-full max-w-xl ml-4">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}