import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, ChevronDown, X, Check, Loader2 } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
  /** Optional label rendered above the input */
  label?: string;
  /** Optional id (associates the label with the input) */
  id?: string;
  /** Optional className for the outer wrapper */
  className?: string;
  /**
   * Optional server-side search callback. When provided, the component delegates
   * filtering to the parent — it will not do client-side filtering, and calls
   * onSearch(query) (debounced) every time the user types so the parent can
   * fetch fresh options. Use this to scale beyond a fixed in-memory list.
   */
  onSearch?: (query: string) => void;
  /** Debounce delay for onSearch in ms (default 350) */
  searchDebounceMs?: number;
  /** Show a loading spinner inside the dropdown (e.g. while onSearch is in flight) */
  loading?: boolean;
}

/**
 * Combobox: one input that searches and selects. The dropdown re-renders on
 * every keystroke (unlike the native <select>, which only refreshes its option
 * list when closed and reopened).
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search and select…',
  emptyText = 'No matches found',
  disabled = false,
  required = false,
  label,
  id,
  className = '',
  onSearch,
  searchDebounceMs = 350,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Skip the very first onSearch call (query is '' on mount; the parent is
  // expected to load initial data itself, so we avoid duplicating that fetch).
  const skipFirstSearchRef = useRef(true);
  // Hold onSearch in a ref so a parent re-render (which creates a new function
  // reference) doesn't re-fire the debounced search. The effect below depends
  // only on `query`, the real trigger — preventing an infinite loop where each
  // fetch causes a re-render which then schedules another fetch.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);

  // When onSearch is provided, the parent owns filtering — render options as-is.
  // Otherwise filter client-side against the local query.
  const filtered = useMemo(() => {
    if (onSearch) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel ? o.sublabel.toLowerCase().includes(q) : false)
    );
  }, [options, query, onSearch]);

  // Debounced server-side search: call parent's onSearch a bit after the user stops typing.
  // Depends ONLY on `query` — onSearch is read via ref so unstable parent function
  // references don't retrigger the effect.
  useEffect(() => {
    if (!onSearchRef.current) return;
    if (skipFirstSearchRef.current) {
      skipFirstSearchRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchRef.current?.(query.trim());
    }, searchDebounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchDebounceMs]);

  // Clamp the keyboard-highlight index whenever the filtered list shrinks
  useEffect(() => {
    if (highlightIndex >= filtered.length) {
      setHighlightIndex(0);
    }
  }, [filtered.length, highlightIndex]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(''); // reset filter so reopening shows full list
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Keep highlighted option in view when navigating with the keyboard
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${highlightIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, isOpen]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
  }, [disabled]);

  const commitSelection = useCallback((opt: SearchableOption) => {
    onChange(opt.value);
    setQuery('');
    setIsOpen(false);
  }, [onChange]);

  const clearSelection = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && filtered[highlightIndex]) {
        e.preventDefault();
        commitSelection(filtered[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  // Show search query while user is typing, otherwise show the selected label.
  // We can't bind `value` to two things at once, so flip based on isOpen + query.
  const displayValue = isOpen ? query : (selected?.label || '');

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`relative flex items-center border rounded-md focus-within:ring-2 focus-within:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300'
        }`}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={selected ? selected.label : placeholder}
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="w-full pl-9 pr-16 py-2 text-sm bg-transparent rounded-md focus:outline-none disabled:cursor-not-allowed"
        />

        {/* Clear button — only shown when something is selected and not disabled */}
        {selected && !disabled && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          aria-label={isOpen ? 'Close dropdown' : 'Open dropdown'}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Hidden input so this works in native HTML forms with `required` validation */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => { /* controlled by SearchableSelect */ }}
          className="sr-only absolute pointer-events-none"
        />
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          {loading && filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">{emptyText}</div>
          ) : (
            <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto py-1">
              {filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightIndex;
                return (
                  <li
                    key={opt.value}
                    data-idx={idx}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    // Use onMouseDown so the click fires before the input's blur (which would close the dropdown)
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commitSelection(opt);
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer ${
                      isHighlighted ? 'bg-blue-50' : ''
                    } ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-xs text-gray-500 truncate">{opt.sublabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
