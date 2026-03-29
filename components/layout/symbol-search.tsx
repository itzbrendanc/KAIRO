import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

type SearchResult = {
  symbol: string;
  company: string;
  sector: string;
};

export function SymbolSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { results?: SearchResult[] };
        setResults(payload.results ?? []);
        setOpen(true);
      } catch {
        // ignore typeahead failures
      }
    }, 160);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  function openSymbol(symbol: string) {
    setQuery("");
    setOpen(false);
    void router.push(`/stocks/${encodeURIComponent(symbol)}`);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    const exact = results.find((item) => item.symbol.toLowerCase() === query.trim().toLowerCase());
    const target = exact?.symbol ?? query.trim().toUpperCase();
    openSymbol(target);
  }

  return (
    <div className="symbol-search" ref={rootRef}>
      <form onSubmit={submitSearch}>
        <input
          className="symbol-search-input"
          placeholder="Search symbols or companies"
          value={query}
          onFocus={() => setOpen(results.length > 0)}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>
      {open && results.length > 0 ? (
        <div className="symbol-search-results">
          {results.map((result) => (
            <button
              key={result.symbol}
              className="symbol-search-result"
              onClick={() => openSymbol(result.symbol)}
            >
              <strong>{result.symbol}</strong>
              <span>{result.company}</span>
              <small>{result.sector}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
