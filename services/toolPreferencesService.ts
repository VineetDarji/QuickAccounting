import { loadJson, saveJson } from './storageService';

export type ToolCategoryId = 'TAX' | 'INVEST' | 'LOAN';

export type ToolKey = `${ToolCategoryId}:${string}`;

export interface ToolPreferences {
  favorites: ToolKey[];
  recents: ToolKey[];
  lastSelection?: {
    category: ToolCategoryId;
    toolId: string;
  };
}

const STORAGE_KEY = 'tax_tool_prefs';
const MAX_RECENTS = 12;

const uniq = <T,>(items: T[]) => Array.from(new Set(items));

const normalize = (prefs: ToolPreferences): ToolPreferences => {
  const favorites = uniq((prefs.favorites || []).filter(Boolean)).slice(0, 200) as ToolKey[];
  const recents = uniq((prefs.recents || []).filter(Boolean)).slice(0, MAX_RECENTS) as ToolKey[];
  const lastSelection = prefs.lastSelection;
  return { favorites, recents, lastSelection };
};

export const makeToolKey = (category: ToolCategoryId, toolId: string): ToolKey => `${category}:${toolId}`;

export const getToolPreferences = (): ToolPreferences => {
  return normalize(loadJson<ToolPreferences>(STORAGE_KEY, { favorites: [], recents: [] }));
};

export const setToolPreferences = (prefs: ToolPreferences) => {
  saveJson(STORAGE_KEY, normalize(prefs));
};

const updateToolPreferences = (updater: (current: ToolPreferences) => ToolPreferences) => {
  const current = getToolPreferences();
  const next = normalize(updater(current));
  setToolPreferences(next);
  return next;
};

export const toggleFavoriteTool = (toolKey: ToolKey) => {
  return updateToolPreferences((p) => {
    const exists = p.favorites.includes(toolKey);
    return { ...p, favorites: exists ? p.favorites.filter((k) => k !== toolKey) : [toolKey, ...p.favorites] };
  });
};

export const addRecentTool = (toolKey: ToolKey) => {
  return updateToolPreferences((p) => ({ ...p, recents: [toolKey, ...p.recents.filter((k) => k !== toolKey)] }));
};

export const clearRecentTools = () => {
  return updateToolPreferences((p) => ({ ...p, recents: [] }));
};

export const setLastToolSelection = (selection: ToolPreferences['lastSelection']) => {
  return updateToolPreferences((p) => ({ ...p, lastSelection: selection }));
};

export const recordToolUsage = (selection: NonNullable<ToolPreferences['lastSelection']>) => {
  const key = makeToolKey(selection.category, selection.toolId);
  return updateToolPreferences((p) => ({
    ...p,
    lastSelection: selection,
    recents: [key, ...p.recents.filter((k) => k !== key)],
  }));
};
