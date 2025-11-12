import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const metaMatch = shortcut.meta === undefined || shortcut.meta === (e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === e.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === e.altKey;
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Global shortcuts that should work everywhere
export const globalShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
  { key: 'k', meta: true, description: 'Quick scan modal' },
  { key: 'Enter', meta: true, description: 'Submit current form' },
  { key: 'c', meta: true, description: 'Copy generated content' },
  { key: 'm', meta: true, description: 'Mark opportunity as used' },
  { key: 'Escape', description: 'Close modal' },
  { key: '1', description: 'Select tweet format' },
  { key: '2', description: 'Select thread format' },
  { key: '3', description: 'Select article format' },
  { key: '4', description: 'Select email format' },
  { key: '5', description: 'Select landing page format' },
  { key: '6', description: 'Select sales page format' },
  { key: '7', description: 'Select long tweet format' },
  { key: '8', description: 'Select thread 10x format' },
  { key: '9', description: 'Select Ben Settle email format' },
  { key: '?', description: 'Show keyboard shortcuts' },
];
