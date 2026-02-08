import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CALCULATORS } from '../../config/calculators';
import { listCases, listCasesForAssignee, listCasesForClient } from '../../services/caseService';
import { getToolPreferences, ToolCategoryId, ToolKey } from '../../services/toolPreferencesService';
import { User } from '../../types';

type NavItem = { label: string; path: string };

interface CommandPaletteProps {
  user: User | null;
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

type ActionResult = {
  key: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onSelect: () => void;
};

type HeaderItem = {
  key: `hdr:${string}`;
  title: string;
};

type PaletteItem = HeaderItem | ActionResult;

const isHeaderItem = (item: PaletteItem): item is HeaderItem => item.key.startsWith('hdr:');

const isTypingTarget = (target: EventTarget | null) => {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || Boolean(target.isContentEditable);
};

const toolByKey = (key: ToolKey) => {
  const [category, toolId] = key.split(':') as [ToolCategoryId, string];
  const tool = CALCULATORS[category]?.find((t) => t.id === toolId);
  return tool ? { category, toolId, label: tool.label } : null;
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ user, navItems, isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const recentToolResults = useMemo(() => {
    if (!isOpen) return [] as ActionResult[];
    const prefs = getToolPreferences();
    const items = (prefs.recents || [])
      .map(toolByKey)
      .filter(Boolean)
      .slice(0, 6) as Array<{ category: ToolCategoryId; toolId: string; label: string }>;

    return items.map((t) => ({
      key: `recent:${t.category}:${t.toolId}`,
      title: t.label,
      subtitle: 'Calculator',
      badge: t.category,
      onSelect: () => {
        navigate(`/calculators?cat=${encodeURIComponent(t.category)}&tool=${encodeURIComponent(t.toolId)}`);
        onClose();
      },
    }));
  }, [isOpen, navigate, onClose]);

  const pageResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = navItems.map((n) => ({
      key: `page:${n.path}`,
      title: n.label,
      subtitle: n.path,
      badge: 'Page',
      onSelect: () => {
        navigate(n.path);
        onClose();
      },
    })) satisfies ActionResult[];

    if (!q) return pages;
    return pages.filter((p) => p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q));
  }, [navItems, navigate, onClose, query]);

  const calculatorResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = (Object.keys(CALCULATORS) as ToolCategoryId[]).flatMap((category) =>
      CALCULATORS[category].map((t) => ({
        key: `calc:${category}:${t.id}`,
        title: t.label,
        subtitle: 'Calculator',
        badge: category,
        onSelect: () => {
          navigate(`/calculators?cat=${encodeURIComponent(category)}&tool=${encodeURIComponent(t.id)}`);
          onClose();
        },
      }))
    ) satisfies ActionResult[];

    if (!q) return all.slice(0, 12);
    return all
      .filter((r) => r.title.toLowerCase().includes(q) || r.key.toLowerCase().includes(q))
      .slice(0, 16);
  }, [navigate, onClose, query]);

  const caseResults = useMemo(() => {
    if (!user) return [] as ActionResult[];
    const q = query.trim().toLowerCase();

    const cases =
      user.role === 'admin'
        ? listCases()
        : user.role === 'employee'
          ? listCasesForAssignee(user.email)
          : listCasesForClient(user.email);

    const filtered = !q
      ? cases.slice(0, 8)
      : cases
          .filter((c) => {
            const hay = [
              c.title,
              c.service,
              c.status,
              c.clientName,
              c.clientEmail,
              c.assignedToEmail,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return hay.includes(q);
          })
          .slice(0, 12);

    return filtered.map((c) => ({
      key: `case:${c.id}`,
      title: c.title,
      subtitle: `${c.service} • ${c.status.replace(/_/g, ' ')}`,
      badge: 'Case',
      onSelect: () => {
        navigate(`/cases/${c.id}`);
        onClose();
      },
    }));
  }, [navigate, onClose, query, user]);

  const results = useMemo((): PaletteItem[] => {
    const q = query.trim();
    if (!q) {
      return [
        ...(recentToolResults.length ? [{ key: 'hdr:recent', title: 'Recent Tools' } as const] : []),
        ...recentToolResults,
        { key: 'hdr:nav', title: 'Navigation' } as const,
        ...pageResults.slice(0, 8),
        ...(user ? [{ key: 'hdr:cases', title: 'My Cases' } as const] : []),
        ...caseResults,
      ];
    }

    return [
      ...(pageResults.length ? [{ key: 'hdr:nav', title: 'Navigation' } as const] : []),
      ...pageResults,
      ...(calculatorResults.length ? [{ key: 'hdr:calc', title: 'Calculators' } as const] : []),
      ...calculatorResults,
      ...(caseResults.length ? [{ key: 'hdr:cases', title: 'Cases' } as const] : []),
      ...caseResults,
    ];
  }, [calculatorResults, caseResults, pageResults, query, recentToolResults, user]);

  const actionableResults = useMemo(
    () => results.filter((r): r is ActionResult => !isHeaderItem(r)),
    [results]
  );

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(0);
  }, [isOpen, query]);

  useEffect(() => {
    if (activeIndex >= actionableResults.length) setActiveIndex(0);
  }, [actionableResults.length, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (isTypingTarget(e.target)) return;
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, actionableResults.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = actionableResults[activeIndex];
      item?.onSelect();
      return;
    }
  };

  const activeKey = actionableResults[activeIndex]?.key;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onMouseDown={onClose} />
      <div className="relative max-w-2xl mx-auto px-4 pt-24" onMouseDown={(e) => e.stopPropagation()}>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-2xl overflow-hidden animate-scale-in">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search pages, calculators, cases..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Enter to open</span>
              <span>Esc to close</span>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-2">
            {actionableResults.length === 0 && (
              <div className="p-10 text-center text-slate-400 font-bold">No results.</div>
            )}

            <div className="space-y-1">
              {results.map((r) => {
                if (isHeaderItem(r)) {
                  return (
                    <div
                      key={r.key}
                      className="px-3 pt-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      {r.title}
                    </div>
                  );
                }

                const isActive = r.key === activeKey;

                return (
                  <button
                    key={r.key}
                    type="button"
                    onMouseEnter={() => {
                      const idx = actionableResults.findIndex((x) => x.key === r.key);
                      if (idx >= 0) setActiveIndex(idx);
                    }}
                    onClick={r.onSelect}
                    className={`w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-900/40 dark:text-indigo-200'
                        : 'bg-white border-transparent hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-black truncate">{r.title}</div>
                        {r.subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.subtitle}</div>}
                      </div>
                      {r.badge && (
                        <div className="shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                          {r.badge}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
