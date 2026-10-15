import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC<{ minimal?: boolean }> = ({ minimal = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone app, hide the install button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop standalone flow
  if (isInstallable) {
    if (minimal) {
      return (
        <button
          onClick={install}
          className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 text-xs transition-all active:scale-95"
          title="Install MarinerAI as Native App"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline font-medium">Install</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 text-xs transition-all active:scale-95"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline font-medium">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 shadow-2xl space-y-4">
              <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-2 sm:hidden" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 grid place-items-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-main)]">Install on iOS</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Run full-screen without Safari browser bars</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] grid place-items-center shrink-0 font-bold">1</span>
                  <span>Tap the <strong>Share</strong> icon in the bottom Safari toolbar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] grid place-items-center shrink-0 font-bold">2</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] grid place-items-center shrink-0 font-bold">3</span>
                  <span>Open <strong>MarinerAI</strong> from your home screen for full native immersion.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
