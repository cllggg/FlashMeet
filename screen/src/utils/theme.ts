/**
 * 大屏主题系统
 *
 * 主题通过设置 <html> 上的 data-theme 属性切换，对应 CSS 变量
 * 持久化在 localStorage['screen_theme']，默认 'cyber'
 *
 * 三个主题：
 *  - cyber  赛博风（深紫蓝底 + 青紫高亮，默认）
 *  - dark   暗夜风（纯黑底 + 冷灰高亮，省眼）
 *  - light  明亮风（浅灰底 + 蓝色高亮，会议室投影更清晰）
 *
 * 用法：
 *   import { applyTheme, getCurrentTheme, cycleTheme } from '@/utils/theme';
 *   applyTheme('light');
 *   cycleTheme(); // → 'dark'
 */
export type ThemeName = 'cyber' | 'dark' | 'light';

const STORAGE_KEY = 'screen_theme';
const THEME_ORDER: ThemeName[] = ['cyber', 'dark', 'light'];

export const THEME_LABELS: Record<ThemeName, string> = {
  cyber: '赛博',
  dark: '暗夜',
  light: '明亮',
};

export function getCurrentTheme(): ThemeName {
  const saved = (typeof localStorage !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY)
    : null) as ThemeName | null;
  if (saved && THEME_ORDER.includes(saved)) return saved;
  return 'cyber';
}

export function applyTheme(name: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', name);
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // 隐私模式可能抛错，吞掉
  }
}

export function cycleTheme(): ThemeName {
  const cur = getCurrentTheme();
  const idx = THEME_ORDER.indexOf(cur);
  const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
  applyTheme(next);
  return next;
}

/** 暴露给主入口，页面加载时主动调一次，避免 FOUC */
export function initTheme(): void {
  applyTheme(getCurrentTheme());
}
