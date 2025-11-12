'use client';

import { globalShortcuts } from '@/lib/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && /Mac/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-black border-2 border-[#DC2626] max-w-2xl w-full mx-4 p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">KEYBOARD SHORTCUTS</h2>
          <button onClick={onClose} className="text-[#737373] hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#DC2626] mb-3">GLOBAL</h3>
            <div className="space-y-2">
              <ShortcutRow shortcut={`${modKey} + K`} description="Open quick scan modal" />
              <ShortcutRow shortcut={`${modKey} + Enter`} description="Submit current form" />
              <ShortcutRow shortcut={`${modKey} + C`} description="Copy generated content" />
              <ShortcutRow shortcut={`${modKey} + M`} description="Mark opportunity as used" />
              <ShortcutRow shortcut="Esc" description="Close any modal" />
              <ShortcutRow shortcut="?" description="Show this help" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#DC2626] mb-3">FORMAT SELECTION</h3>
            <div className="space-y-2">
              <ShortcutRow shortcut="1" description="Tweet format" />
              <ShortcutRow shortcut="2" description="Thread format" />
              <ShortcutRow shortcut="3" description="Article format" />
              <ShortcutRow shortcut="4" description="Email format" />
              <ShortcutRow shortcut="5" description="Landing page" />
              <ShortcutRow shortcut="6" description="Sales page" />
              <ShortcutRow shortcut="7" description="Long tweet" />
              <ShortcutRow shortcut="8" description="Thread 10x" />
              <ShortcutRow shortcut="9" description="Ben Settle email" />
            </div>
          </div>

          <div className="border-t border-[#262626] pt-4 mt-4">
            <p className="text-sm text-[#737373]">
              Press <span className="text-white font-mono">Esc</span> to close this modal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#262626]">
      <span className="text-[#737373]">{description}</span>
      <kbd className="bg-[#262626] px-3 py-1 font-mono text-sm text-white border border-[#404040]">
        {shortcut}
      </kbd>
    </div>
  );
}
