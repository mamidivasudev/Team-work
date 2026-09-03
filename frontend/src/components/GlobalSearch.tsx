import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, CheckSquare, User } from 'lucide-react';
import { globalSearch } from '../services/api';
import type { SearchResults } from '../types';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ tasks: [], projects: [], team: [] });
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults({ tasks: [], projects: [], team: [] });
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      globalSearch(query.trim()).then(res => {
        setResults(res);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const closeAndReset = () => {
    setOpen(false);
    setQuery('');
    setResults({ tasks: [], projects: [], team: [] });
  };

  const hasResults = results.tasks.length > 0 || results.projects.length > 0 || results.team.length > 0;
  const hasQuery = query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors"
          title="Search"
        >
          <Search size={19} />
        </button>
      ) : (
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-64">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, projects, people..."
            className="bg-transparent outline-none border-0 text-sm px-2 flex-1 min-w-0"
          />
          <button onClick={closeAndReset} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {open && hasQuery && (
        <div className="absolute top-11 right-0 w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-6">Searching...</p>
          ) : !hasResults ? (
            <p className="text-sm text-slate-400 text-center py-6">No results for "{query}"</p>
          ) : (
            <>
              {results.tasks.length > 0 && (
                <div className="py-2">
                  <p className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tasks</p>
                  {results.tasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => { navigate(`/tasks?taskId=${t.id}`); closeAndReset(); }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <CheckSquare size={14} className="text-indigo-400 shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.projects.length > 0 && (
                <div className="py-2 border-t border-slate-100">
                  <p className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Projects</p>
                  {results.projects.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { navigate('/projects'); closeAndReset(); }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <FolderKanban size={14} className="text-indigo-400 shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.team.length > 0 && (
                <div className="py-2 border-t border-slate-100">
                  <p className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Team</p>
                  {results.team.map(m => (
                    <div
                      key={m.id}
                      onClick={() => { navigate('/team-work'); closeAndReset(); }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <User size={14} className="text-indigo-400 shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{m.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
