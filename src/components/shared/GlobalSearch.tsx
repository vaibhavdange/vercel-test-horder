"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { useGlobalSearch, SearchResult } from "@/hooks/use-global-search";

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export default function GlobalSearch({ 
  className = "", 
  placeholder = "Search everything..." 
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the search hook
  const { data: searchResults = [], isLoading, error } = useGlobalSearch({
    query: searchInput,
    limit: 8,
  });

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setQuery(value);
    setSearchInput(value);
    
    if (value.length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      setSearchInput(query);
      setShowResults(true);
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    const url = result.highlightId ? `${result.url}#${result.highlightId}` : result.url;
    router.push(url);
    setQuery("");
    setSearchInput("");
    setShowResults(false);
    setIsSearching(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get type-specific styling
  const getTypeStyles = (type: SearchResult['type']) => {
    switch (type) {
      case 'product':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'order':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'customer':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'staff':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'table':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'recipe':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'ingredient':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'category':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'reservation':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'transaction':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'setting':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'billing-setting':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'tax-category':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'area':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'floor':
        return 'bg-lime-50 text-lime-700 border-lime-200';
      case 'attendance':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-8 pr-8 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSearchInput("");
                setShowResults(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (query.length >= 2 || searchInput.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
              <p className="text-xs text-gray-500 mt-1">Searching...</p>
            </div>
          ) : error ? (
            <div className="p-3 text-center text-red-500">
              <p className="text-xs">Search failed. Please try again.</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultSelect(result)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-2">
                    <div className="text-lg">{result.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h4>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getTypeStyles(result.type)}`}>
                          {result.type}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-gray-600 truncate mt-0.5">
                          {result.subtitle}
                        </p>
                      )}
                      {result.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500">
              <Search className="h-6 w-6 mx-auto text-gray-300 mb-1" />
              <p className="text-xs">No results found</p>
              <p className="text-xs text-gray-400 mt-0.5">Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
