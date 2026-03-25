import React from 'react';
import { X, Type, Search, Activity } from 'lucide-react';
import { useA11yStore } from '../../store/useA11yStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const A11yControlPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { dyslexicFont, reducedMotion, readingRuler, updateSettings } = useA11yStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right-8 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Universal Access</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Accessibility Controls</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Toggle 1: Dyslexic Font */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                <Type size={16} className="text-emerald-600" />
                <span>OpenDyslexic Font</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Changes the global font to improve readability for users with Dyslexia.</p>
            </div>
            <button 
              onClick={() => updateSettings({ dyslexicFont: !dyslexicFont })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dyslexicFont ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dyslexicFont ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Toggle 2: Reading Ruler */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                <Search size={16} className="text-emerald-600" />
                <span>Reading Focus Ruler</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Adds a horizontal highlight bar that follows your cursor to help track long rows of data.</p>
            </div>
            <button 
              onClick={() => updateSettings({ readingRuler: !readingRuler })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${readingRuler ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${readingRuler ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Toggle 3: Reduced Motion */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                <Activity size={16} className="text-emerald-600" />
                <span>Reduce Motion</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Disables slide and bounce animations for a calmer, snap-action interface.</p>
            </div>
            <button 
              onClick={() => updateSettings({ reducedMotion: !reducedMotion })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reducedMotion ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reducedMotion ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
