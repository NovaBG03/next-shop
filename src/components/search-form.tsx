'use client';

import { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Search, X } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

export const SearchForm = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      {/* Desktop search form */}
      <form onSubmit={handleSubmit} className="relative hidden w-72 md:block">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-8"
        />
      </form>

      {/* Mobile search button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsMobileSearchOpen(true)}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>

      {/* Mobile search overlay */}
      {isMobileSearchOpen && (
        <div className="bg-background fixed inset-0 z-50 flex flex-col p-4 md:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Search</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8"
                autoFocus
              />
            </div>
            <Button type="submit" className="mt-4 w-full">
              Search
            </Button>
          </form>
        </div>
      )}
    </>
  );
};
