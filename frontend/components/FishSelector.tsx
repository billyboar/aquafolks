'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export interface FishSpecies {
  id: string;
  common_name: string;
  scientific_name: string;
  category: string;
  type: string;
  min_tank_size_liters: number;
  max_size_cm: number;
  temperament: string;
  care_level: string;
  diet: string;
}

export interface SelectedFish {
  fish_species_id?: string;
  common_name: string;
  scientific_name: string;
  quantity: number;
  type: string;
}

interface FishSelectorProps {
  onAdd: (fish: SelectedFish) => void;
  tankType?: string;
}

export default function FishSelector({ onAdd, tankType }: FishSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FishSpecies[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchFish = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get('/api/v1/fish-species/search', {
          params: { q: searchQuery, limit: 10 }
        });
        setSearchResults(response.data.species || []);
        setShowResults(true);
      } catch (err) {
        console.error('Failed to search fish:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchFish, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectFish = (fish: FishSpecies) => {
    onAdd({
      fish_species_id: fish.id,
      common_name: fish.common_name,
      scientific_name: fish.scientific_name,
      quantity: quantity,
      type: fish.category,
    });

    // Reset form
    setSearchQuery('');
    setQuantity(1);
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative" ref={searchRef}>
          <label htmlFor="fish-search" className="block text-sm font-medium mb-2">
            Search Fish/Invertebrates
          </label>
          <input
            id="fish-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search by common or scientific name..."
            className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
          />

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-[hsl(var(--surface))] border border-[hsl(var(--outline))] rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((fish) => (
                <button
                  key={fish.id}
                  type="button"
                  onClick={() => handleSelectFish(fish)}
                  className="w-full px-4 py-3 text-left hover:bg-[hsl(var(--surface-container))] transition-colors border-b border-[hsl(var(--outline-variant))] last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{fish.common_name}</div>
                      <div className="text-sm text-[hsl(var(--on-surface-variant))] italic">
                        {fish.scientific_name}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--secondary-container))] text-[hsl(var(--on-secondary-container))]">
                          {fish.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]">
                          {fish.care_level}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[hsl(var(--on-surface-variant))] text-right ml-4">
                      <div>Max: {fish.max_size_cm}cm</div>
                      <div>Min: {fish.min_tank_size_liters}L</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="absolute right-3 top-11 text-[hsl(var(--on-surface-variant))]">
              Searching...
            </div>
          )}
        </div>

        <div className="w-24">
          <label htmlFor="quantity" className="block text-sm font-medium mb-2">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
          />
        </div>
      </div>

      <p className="text-xs text-[hsl(var(--on-surface-variant))]">
        Type at least 2 characters to search for fish species. You can search by common name (e.g., "Neon Tetra") or scientific name (e.g., "Paracheirodon").
      </p>
    </div>
  );
}
