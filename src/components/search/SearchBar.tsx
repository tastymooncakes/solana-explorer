'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult } from '@/lib/types';
import { searchService } from '@/services/searchService';
import SearchInput from './SearchInput';
import SearchResultList from './SearchResultList';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Handle clicking outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }
    
    setIsLoading(true);
    const result = await searchService.search(searchQuery);
    setResults(result);
    setIsLoading(false);
  };
  
  // Handle search input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 3) {
      // Only search if we have at least 3 characters
      performSearch(value);
      setShowResults(true);
    } else {
      setResults(null);
      setShowResults(false);
    }
  };
  
  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      // If we have a direct match already, navigate directly
      if (results?.type === 'block' && results.data) {
        const blockData = results.data as import('@/lib/types').BlockData;
        router.push(`/block/${blockData.slot}`);
        // Clear the search input after navigation
        setQuery('');
      } else if (results?.type === 'transaction' && results.data) {
        const txData = results.data as import('@/lib/types').TransactionData;
        router.push(`/tx/${txData.signature}`);
        // Clear the search input after navigation
        setQuery('');
      } else if (results?.type === 'address' && results.data) {
        router.push(`/address/${results.data}`);
        // Clear the search input after navigation
        setQuery('');
      } else {
        // Otherwise go to search results page
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        // Clear the search input after navigation
        setQuery('');
      }
      
      // Clear results after navigation
      setShowResults(false);
    }
  };
  
  // Clear search input
  const handleClearSearch = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (query.length >= 3) {
      setShowResults(true);
    }
  };
  
  // Hide results when clicking a result and clear input
  const handleResultClick = () => {
    setShowResults(false);
    setQuery(''); // Clear the query when a result is clicked
  };
  
  return (
    <div ref={searchRef} className="w-full relative">
      <SearchInput 
        query={query}
        onChange={handleInputChange}
        onSubmit={handleSearch}
        onClear={handleClearSearch}
        onFocus={handleInputFocus}
      />
      
      {/* Search Results Dropdown */}
      {showResults && query.length > 2 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <SearchResultList 
            results={results}
            isLoading={isLoading}
            onResultClick={handleResultClick}
          />
        </div>
      )}
    </div>
  );
}