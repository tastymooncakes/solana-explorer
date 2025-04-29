'use client';

import { ChangeEvent, FormEvent, useRef, useEffect, useState } from "react";

interface SearchInputProps {
    query: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClear: () => void;
    onFocus: () => void;
}

export default function SearchInput({
    query,
    onChange,
    onSubmit,
    onClear,
    onFocus
} : SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    
    // Setup keyboard shortcut directly in the component
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only trigger if the key is "/" and not already in an input/textarea
            if (
                event.key === "/" && 
                document.activeElement?.tagName !== "INPUT" && 
                document.activeElement?.tagName !== "TEXTAREA"
            ) {
                event.preventDefault();
                
                // Focus the search input
                if (inputRef.current) {
                    inputRef.current.focus();
                    setIsFocused(true);
                }
                
                // Call the onFocus handler
                onFocus();
            }
        };

        // Add event listener
        document.addEventListener("keydown", handleKeyDown);

        // Clean up on unmount
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onFocus]);

    const handleFocus = () => {
        setIsFocused(true);
        onFocus();
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    return (
        <form
            onSubmit={onSubmit}
            className="w-full relative"
        >
            <input 
                ref={inputRef}
                type="text"
                placeholder="Search by transaction or block"
                value={query}
                onChange={onChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 pr-16 focus:outline-none focus:border-blue-500 text-gray-100"
            />
            {query && (
                <button
                    type="button"
                    aria-label="Clear Search"
                    onClick={onClear}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            )}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                {!isFocused && !query && (
                    <span className="border border-gray-600 rounded px-1 text-xs text-gray-400">/</span>
                )}
            </div>
        </form>
    )
}