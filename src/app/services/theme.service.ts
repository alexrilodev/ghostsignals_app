import { Injectable, OnDestroy } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const DARK_VARS: Record<string, string> = {
  '--ion-background-color': '#121212',
  '--ion-background-color-rgb': '18, 18, 18',
  '--ion-text-color': '#ffffff',
  '--ion-text-color-rgb': '255, 255, 255',
  '--ion-color-primary': '#4d8dff',
  '--ion-color-primary-rgb': '77, 141, 255',
  '--ion-color-primary-contrast': '#000',
  '--ion-color-primary-contrast-rgb': '0, 0, 0',
  '--ion-color-primary-shade': '#447ce0',
  '--ion-color-primary-tint': '#5f98ff',
  '--ion-color-secondary': '#46b1ff',
  '--ion-color-secondary-rgb': '70, 177, 255',
  '--ion-color-secondary-contrast': '#000',
  '--ion-color-secondary-contrast-rgb': '0, 0, 0',
  '--ion-color-secondary-shade': '#3e9ce0',
  '--ion-color-secondary-tint': '#59b9ff',
  '--ion-color-tertiary': '#8482fb',
  '--ion-color-tertiary-rgb': '132, 130, 251',
  '--ion-color-tertiary-contrast': '#000',
  '--ion-color-tertiary-contrast-rgb': '0, 0, 0',
  '--ion-color-tertiary-shade': '#7472dd',
  '--ion-color-tertiary-tint': '#908ffb',
  '--ion-color-success': '#2dd55b',
  '--ion-color-success-rgb': '45, 213, 91',
  '--ion-color-success-contrast': '#000',
  '--ion-color-success-contrast-rgb': '0, 0, 0',
  '--ion-color-success-shade': '#28bb50',
  '--ion-color-success-tint': '#42d96b',
  '--ion-color-warning': '#ffce31',
  '--ion-color-warning-rgb': '255, 206, 49',
  '--ion-color-warning-contrast': '#000',
  '--ion-color-warning-contrast-rgb': '0, 0, 0',
  '--ion-color-warning-shade': '#e0b52b',
  '--ion-color-warning-tint': '#ffd346',
  '--ion-color-danger': '#f24c58',
  '--ion-color-danger-rgb': '242, 76, 88',
  '--ion-color-danger-contrast': '#000',
  '--ion-color-danger-contrast-rgb': '0, 0, 0',
  '--ion-color-danger-shade': '#d5434d',
  '--ion-color-danger-tint': '#f35e69',
  '--ion-color-light': '#222428',
  '--ion-color-light-rgb': '34, 36, 40',
  '--ion-color-light-contrast': '#fff',
  '--ion-color-light-contrast-rgb': '255, 255, 255',
  '--ion-color-light-shade': '#1e2023',
  '--ion-color-light-tint': '#383a3e',
  '--ion-color-medium': '#989aa2',
  '--ion-color-medium-rgb': '152, 154, 162',
  '--ion-color-medium-contrast': '#000',
  '--ion-color-medium-contrast-rgb': '0, 0, 0',
  '--ion-color-medium-shade': '#86888f',
  '--ion-color-medium-tint': '#a2a4ab',
  '--ion-color-dark': '#f4f5f8',
  '--ion-color-dark-rgb': '244, 245, 248',
  '--ion-color-dark-contrast': '#000',
  '--ion-color-dark-contrast-rgb': '0, 0, 0',
  '--ion-color-dark-shade': '#d7d8da',
  '--ion-color-dark-tint': '#f5f6f9',
  '--ion-item-background': '#1e1e1e',
  '--ion-tab-bar-background': '#1f1f1f',
  '--ion-tab-bar-background-focused': '#353535',
  '--ion-card-background': '#1e1e1e',
  '--ion-toolbar-background': '#1f1f1f',
  '--ion-toolbar-border-color': '#363636',
};

@Injectable({
  providedIn: 'root',
})
export class ThemeService implements OnDestroy {
  private readonly STORAGE_KEY = 'ghostsignals_theme';
  private mediaQuery: MediaQueryList | null = null;
  private mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

  get currentMode(): ThemeMode {
    return (localStorage.getItem(this.STORAGE_KEY) as ThemeMode) || 'system';
  }

  get isDark(): boolean {
    if (this.currentMode === 'dark') return true;
    if (this.currentMode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  init() {
    this.applyTheme();
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaHandler = () => {
      if (this.currentMode === 'system') {
        this.applyTheme();
      }
    };
    this.mediaQuery.addEventListener('change', this.mediaHandler);
  }

  setMode(mode: ThemeMode) {
    localStorage.setItem(this.STORAGE_KEY, mode);
    this.applyTheme();
  }

  private applyTheme() {
    const root = document.documentElement;
    if (this.isDark) {
      for (const [prop, value] of Object.entries(DARK_VARS)) {
        root.style.setProperty(prop, value);
      }
      document.body.classList.add('ion-palette-dark');
    } else {
      for (const prop of Object.keys(DARK_VARS)) {
        root.style.removeProperty(prop);
      }
      document.body.classList.remove('ion-palette-dark');
    }
  }

  ngOnDestroy() {
    if (this.mediaQuery && this.mediaHandler) {
      this.mediaQuery.removeEventListener('change', this.mediaHandler);
    }
  }
}
