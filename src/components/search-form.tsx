'use client';

import { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Search, X } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

type SearchFormProps = {
  variant?: 'default' | 'hero';
  className?: string;
};

export const SearchForm = ({ variant = 'default', className }: SearchFormProps) => {
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

  const isHero = variant === 'hero';

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn('relative', isHero ? 'w-full' : 'hidden w-72 md:block', className)}
      >
        <Search
          className={cn(
            'text-muted-foreground absolute left-3',
            isHero ? 'top-1/2 h-5 w-5 -translate-y-1/2' : 'top-2.5 h-4 w-4',
          )}
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className={cn('w-full', isHero ? 'rounded-md py-6 pr-20 pl-10 text-base' : 'pl-8')}
        />
        {isHero && (
          <Button
            type="submit"
            className="absolute top-1/2 right-1 -translate-y-1/2 rounded-md px-4 py-1.5"
          >
            Search
          </Button>
        )}
      </form>

      {!isHero && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      )}

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
